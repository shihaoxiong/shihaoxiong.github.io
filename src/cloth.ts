import {
  AmbientLight,
  type BufferAttribute,
  DirectionalLight,
  DoubleSide,
  Mesh,
  MeshPhongMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";

/**
 * A sheet of cloth hung over the landscape: pinned along the top and down most
 * of both sides, free along the bottom hem. Verlet integration with constraint
 * relaxation, the same approach as three.js's own cloth example.
 *
 * At rest the hem hangs OVERHANG px below the visible area, so the panel reads
 * as a solid sheet. Gusts arrive every ten-ish seconds and lift it into view.
 */

const SEG_X = 34;
const SEG_Y = 28;
const MASS = 0.11;
const DRAG = 1 - 0.035;
const TIMESTEP_SQ = (16 / 1000) ** 2;
const RELAX_PASSES = 2;

/** How far the free hem hangs below the visible bottom edge when calm. */
const OVERHANG = 18;
/** Fraction of the sides that stays pinned; below this the hem can lift. */
const SIDE_PIN = 0.84;

const GRAVITY = 430;
/** Steady breeze, always on. Kept low so the sheet reads as flat when calm. */
const BREEZE = 0.05;
/** How hard a gust hits on top of the breeze. */
const GUST = 1;
/**
 * Wind, in force units — small numbers, because each particle collects force
 * from the four quads around it and force is then divided by MASS. PUSH is the
 * one to watch: shoving an inextensible sheet toward the viewer is what drags
 * the free hem upward, and it lifts far harder than LIFT does.
 */
const SWAY = 14;
const LIFT = 60;
const PUSH = 34;

const diff = new Vector3();
const normal = new Vector3();
const edgeA = new Vector3();
const edgeB = new Vector3();
const force = new Vector3();
const scratch = new Vector3();
const wind = new Vector3();
const gravityForce = new Vector3(0, -GRAVITY * MASS, 0);

class Particle {
  position: Vector3;
  previous: Vector3;
  original: Vector3;
  acceleration = new Vector3();
  pinned = false;

  constructor(x: number, y: number) {
    this.position = new Vector3(x, y, 0);
    this.previous = new Vector3(x, y, 0);
    this.original = new Vector3(x, y, 0);
  }

  addForce(f: Vector3) {
    this.acceleration.addScaledVector(f, 1 / MASS);
  }

  integrate() {
    if (this.pinned) {
      this.position.copy(this.original);
      this.previous.copy(this.original);
      this.acceleration.set(0, 0, 0);
      return;
    }
    scratch
      .subVectors(this.position, this.previous)
      .multiplyScalar(DRAG)
      .add(this.position)
      .addScaledVector(this.acceleration, TIMESTEP_SQ);
    this.previous.copy(this.position);
    this.position.copy(scratch);
    this.acceleration.set(0, 0, 0);
  }
}

type Constraint = [Particle, Particle, number];

function satisfy([p1, p2, rest]: Constraint) {
  diff.subVectors(p2.position, p1.position);
  const current = diff.length();
  if (current === 0) return;
  diff.multiplyScalar((1 - rest / current) * 0.5);
  if (!p1.pinned) p1.position.add(diff);
  if (!p2.pinned) p2.position.sub(diff);
}

/**
 * Two overlapping gust trains at different rates and weights: light puffs every
 * few seconds, a heavier one every fifteen or so, and occasionally both at once.
 * Each train is a pair of sines whose periods do not divide each other, so the
 * sequence never repeats on a timescale anyone would notice. Rectifying and
 * squaring keeps it near zero between gusts instead of oscillating.
 */
function gustAt(t: number) {
  const heavy = Math.max(0, Math.sin(t * 0.37) * 0.62 + Math.sin(t * 0.23 + 2.1) * 0.42 - 0.26);
  const light = Math.max(0, Math.sin(t * 1.07 + 0.7) * 0.5 + Math.sin(t * 0.79 + 3.3) * 0.38 - 0.28);
  return heavy * heavy * 0.95 + light * light * 1.8;
}

export type ClothHandle = {
  setTheme(dark: boolean): void;
  dispose(): void;
  /** Advance the simulation by hand. Only used to inspect it when rAF is throttled. */
  debugStep(frames: number): void;
  debugState(): { t: number; gust: number; liftPx: number; maxZ: number };
};

export function createCloth(canvas: HTMLCanvasElement): ClothHandle | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch {
    return null;
  }
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 1, 4000);
  camera.position.z = 2000;

  const ambient = new AmbientLight(0xffffff, 2.4);
  const key = new DirectionalLight(0xffffff, 2.6);
  key.position.set(-0.45, 0.7, 1);
  scene.add(ambient, key);

  const material = new MeshPhongMaterial({
    transparent: true,
    side: DoubleSide,
    depthWrite: false,
    shininess: 5,
    specular: 0x0a0a0a,
  });

  let particles: Particle[] = [];
  let constraints: Constraint[] = [];
  let mesh: Mesh | null = null;
  let panelW = 0;
  let panelH = 0;

  const at = (u: number, v: number) => particles[v * (SEG_X + 1) + u];

  function build() {
    const top = 6;
    // clientWidth, not innerWidth: on scrolling pages innerWidth includes the
    // scrollbar and the canvas would overhang, adding a horizontal scrollbar.
    panelW = document.documentElement.clientWidth;
    panelH = window.innerHeight - top;
    const clothH = panelH + OVERHANG;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(panelW, panelH, false);
    canvas.style.width = `${panelW}px`;
    canvas.style.height = `${panelH}px`;

    camera.left = -panelW / 2;
    camera.right = panelW / 2;
    camera.top = panelH / 2;
    camera.bottom = -panelH / 2;
    camera.updateProjectionMatrix();

    if (mesh) {
      scene.remove(mesh);
      mesh.geometry.dispose();
    }

    particles = [];
    for (let v = 0; v <= SEG_Y; v++) {
      for (let u = 0; u <= SEG_X; u++) {
        const p = new Particle(
          (u / SEG_X - 0.5) * panelW,
          panelH / 2 - (v / SEG_Y) * clothH,
        );
        // Pinned: the whole top edge, plus both sides down to SIDE_PIN.
        p.pinned = v === 0 || ((u === 0 || u === SEG_X) && v / SEG_Y <= SIDE_PIN);
        particles.push(p);
      }
    }

    const dx = panelW / SEG_X;
    const dy = clothH / SEG_Y;
    const dDiag = Math.hypot(dx, dy);
    constraints = [];
    for (let v = 0; v <= SEG_Y; v++) {
      for (let u = 0; u <= SEG_X; u++) {
        if (u < SEG_X) constraints.push([at(u, v), at(u + 1, v), dx]);
        if (v < SEG_Y) constraints.push([at(u, v), at(u, v + 1), dy]);
        // Shear constraints stop the grid folding flat onto itself.
        if (u < SEG_X && v < SEG_Y) {
          constraints.push([at(u, v), at(u + 1, v + 1), dDiag]);
          constraints.push([at(u + 1, v), at(u, v + 1), dDiag]);
        }
      }
    }

    const geometry = new PlaneGeometry(panelW, clothH, SEG_X, SEG_Y);
    mesh = new Mesh(geometry, material);
    scene.add(mesh);
    writePositions();
  }

  function writePositions() {
    if (!mesh) return;
    const attr = mesh.geometry.attributes.position as BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i].position;
      arr[i * 3] = p.x;
      arr[i * 3 + 1] = p.y;
      arr[i * 3 + 2] = p.z;
    }
    attr.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
  }

  function step(t: number) {
    const gust = gustAt(t);
    const strength = BREEZE + GUST * gust;
    wind.set(Math.sin(t * 0.9) * SWAY * strength, LIFT * strength, PUSH * strength);

    for (let v = 0; v < SEG_Y; v++) {
      for (let u = 0; u < SEG_X; u++) {
        const a = at(u, v);
        const b = at(u + 1, v);
        const c = at(u, v + 1);
        const d = at(u + 1, v + 1);
        edgeA.subVectors(b.position, a.position);
        edgeB.subVectors(c.position, a.position);
        normal.crossVectors(edgeA, edgeB);
        if (normal.lengthSq() === 0) continue;
        normal.normalize();
        force.copy(normal).multiplyScalar(normal.dot(wind));
        a.addForce(force);
        b.addForce(force);
        c.addForce(force);
        d.addForce(force);
      }
    }

    for (const p of particles) {
      p.addForce(gravityForce);
      p.integrate();
    }
    for (let i = 0; i < RELAX_PASSES; i++) constraints.forEach(satisfy);
    writePositions();
  }

  function render() {
    renderer.render(scene, camera);
  }

  let raf = 0;
  let simTime = 0;
  let last = 0;

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
    last = now;
    simTime += dt;
    step(simTime);
    render();
  }

  let resizeTimer = 0;
  function onResize() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      build();
      render();
    }, 180);
  }

  setTheme(document.documentElement.dataset.theme === "dark");
  build();
  render();

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!reduced.matches) raf = requestAnimationFrame(frame);
  window.addEventListener("resize", onResize);

  function setTheme(dark: boolean) {
    material.color.set(dark ? 0x1d1710 : 0xf8efe0);
    material.opacity = dark ? 0.66 : 0.6;
    ambient.intensity = dark ? 1.5 : 2.4;
    key.intensity = dark ? 2.2 : 2.6;
  }

  return {
    setTheme,
    debugStep(frames: number) {
      for (let i = 0; i < frames; i++) {
        simTime += 1 / 60;
        step(simTime);
      }
      render();
    },
    debugState() {
      let hem = Infinity;
      let maxZ = 0;
      for (let u = 0; u <= SEG_X; u++) {
        const p = at(u, SEG_Y).position;
        hem = Math.min(hem, p.y);
      }
      for (const p of particles) maxZ = Math.max(maxZ, p.position.z);
      // Positive = hem is above the visible bottom edge, i.e. lifted into view.
      return { t: +simTime.toFixed(1), gust: +gustAt(simTime).toFixed(3), liftPx: Math.round(hem + panelH / 2), maxZ: Math.round(maxZ) };
    },
    dispose() {
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      mesh?.geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
