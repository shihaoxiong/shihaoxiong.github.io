import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

type Language = "zh" | "en";
type Localized = Record<Language, string>;
type Post = { id: string; date: string; title: Localized; excerpt: Localized; tag: Localized; minutes: string; featured?: boolean; published?: boolean };

const posts: Post[] = [
  {
    id: "agent-infra",
    date: "2026.07.28",
    title: { zh: "为什么 Agent Infra 越来越重要", en: "Why Agent Infra Matters More Than Ever" },
    excerpt: { zh: "当 Runtime 逐步标准化，企业真正的难题转向安全、权限、状态、知识与治理。", en: "As runtimes standardize, the harder enterprise problems become safety, permissions, state, knowledge, and governance." },
    tag: { zh: "Agent Infra", en: "Agent Infra" },
    minutes: "8 min",
    featured: true,
    published: true,
  },
];

const copy = {
  zh: { articles: "文章", about: "关于", search: "搜索文章", all: "全部", latest: "最新文章", selected: "精选文章", read: "阅读文章", comingSoon: "即将上线", back: "返回文章列表", contact: "和我聊聊", top: "回到顶部 ↑", aboutLead: "你好，我是 Shihao，一个 INFJ。习惯先把世界安静地看一会儿，再决定留下些什么。", aboutBody: "我相信细微的感受值得被认真对待，也愿意把那些尚未成形的思考，慢慢整理成清晰的文字。", noResults: "没有找到匹配的文章。", essay: "文章" },
  en: { articles: "Writing", about: "About", search: "Search writing", all: "All", latest: "Latest writing", selected: "Selected writing", read: "Read essay", comingSoon: "Coming soon", back: "Back to writing", contact: "Say hello", top: "Back to top ↑", aboutLead: "Hi, I’m Shihao, an INFJ. I tend to sit quietly with the world for a while before deciding what to leave behind.", aboutBody: "I believe subtle feelings deserve attention, and I like turning half-formed thoughts into words with a little more clarity.", noResults: "No matching essays yet.", essay: "Essay" },
} satisfies Record<Language, Record<string, string>>;

const article = {
  subtitle: { zh: "从“能跑起来”到“能在企业里长期、可靠地完成工作”", en: "From an agent that runs to one that reliably works inside an enterprise" },
  intro: { zh: "Agent 的能力正在迅速商品化：规划、工具调用、上下文管理甚至人工审批，都已经有成熟的 Runtime 与 Harness 可以复用。但企业的难题没有消失，它们只是从“如何让模型思考”转向“如何让系统安全、稳定、可治理地完成真实工作”。这也是 Agent Infra 越来越重要的原因。", en: "Agent capabilities are rapidly becoming reusable: planning, tool use, context management, and even human approval now have mature runtimes and harnesses. Yet the enterprise problem has not disappeared. It has shifted from making a model reason to making a system complete real work safely, reliably, and governably. That is why Agent Infra matters more than ever." },
  sections: [
    {
      heading: { zh: "1. Agent 是什么：不是更会聊天的模型，而是能完成闭环的系统", en: "1. What an agent is: not a better chatbot, but a system that closes the loop" },
      body: { zh: ["聊天机器人负责回答问题；RAG 助手在企业知识中找依据；工作流按预先定义的步骤执行。Agent 的不同之处在于，它接到目标后会理解任务、寻找信息、决定下一步、调用工具、观察结果，并在必要时请求人工确认。它并不等于“把所有决策交给模型”——确定的业务规则仍应留在代码和工作流中，模型承担理解、判断、生成与有限规划。", "要称得上企业 Agent，至少要具备三件事：能长期运行并处理异步、多步骤任务；能调用知识、API、数据库、浏览器或代码等受控工具；能形成闭环，留下目标、状态、结果、失败处理与人工接管点。企业真正购买的不是一次漂亮回答，而是一个能在边界内被托付的执行者。"], en: ["A chatbot answers questions. A RAG assistant finds evidence in enterprise knowledge. A workflow follows a predefined path. An agent differs because it accepts a goal, interprets it, finds information, selects the next step, invokes tools, observes results, and asks for human confirmation when necessary. This does not mean handing every decision to a model: deterministic business rules should remain in code and workflows, while the model handles understanding, judgment, generation, and limited planning.", "An enterprise agent needs at least three properties: it can run over time and handle asynchronous, multi-step work; it can call controlled tools such as knowledge, APIs, databases, browsers, or code; and it closes the loop with a goal, state, result, failure handling, and a human handoff point. What an enterprise buys is not one elegant answer, but an executor it can trust within clear boundaries."] },
      bullets: { zh: ["Agent Runtime：承载 LLM 推理、规划、任务编排、上下文与状态管理。", "Session & Memory、企业知识库与 Sandbox：让任务能延续、能获得事实、也能安全执行。", "权限控制、MCP / Tools 与集成网关：把企业系统变成受控、可审计的动作。", "管理面板与可观测性：贯穿全链路，帮助运营、评测和持续优化。"], en: ["Agent Runtime: hosts LLM reasoning, planning, orchestration, context, and task state.", "Session & Memory, enterprise knowledge, and Sandbox: let work persist, access facts, and execute safely.", "Permission control, MCP / Tools, and an integration gateway: turn enterprise systems into controlled, auditable actions.", "A management console and observability: span the whole path for operations, evaluation, and continuous improvement."] },
      figure: { src: "/images/agent-architecture-components.png", caption: { zh: "Agent 组件分层：Runtime 是核心，但它依赖并连接企业能力、治理能力与企业系统。", en: "Agent component layers: the runtime is core, but it depends on—and connects to—enterprise capabilities, governance, and business systems." } },
    },
    {
      heading: { zh: "2. 当前 Agent 的产品形态：先看谁拥有状态与治理", en: "2. Today’s agent product shapes: start with who owns state and governance" },
      body: { zh: ["“客户端 Agent、服务端 Agent、Agent PaaS”容易把运行位置与交付方式混在一起。更有用的第一层分类是：Session、Environment、权限与运行治理由谁负责。随着责任从个人上移到应用、再上移到平台，产品的能力边界和商业价值也随之改变。", "第一类是本地自主使用：CLI、IDE 或单机 Agent 在个人工作区中运行，适合编码、文档、分析等个人提效。第二类是应用内嵌与自管：企业技术团队把 Runtime、StateStore、Sandbox 接入自己的应用，适合 CRM、客服、ITSM、ERP 中的业务 Agent 与事件驱动自动化。第三类是平台托管运行：平台统一管理 Agent、Environment、Session、权限与调度，适合多团队、多租户、异步委托与企业 Agent Hub。"], en: ["Labels such as client agent, server agent, and agent PaaS often mix runtime location with delivery model. A more useful first classification is who owns sessions, environments, permissions, and runtime governance. As responsibility moves from an individual to an application and then to a platform, the product boundary and business value change with it.", "The first shape is local autonomous use: CLI, IDE, or single-machine agents run in a personal workspace for coding, documents, and analysis. The second is embedded and self-managed: enterprise teams connect runtime, state store, and sandbox into their own applications for CRM, customer service, ITSM, ERP, and event-driven automation. The third is managed platform operation: a platform governs agents, environments, sessions, permissions, and scheduling for multiple teams, tenants, asynchronous delegation, and enterprise agent hubs."] },
      bullets: { zh: ["本地 Agent 帮个人干活；嵌入式 Agent 帮业务系统完成任务。", "托管 Agent 帮企业规模化、持续地运行数字员工。", "三类形态不是互斥的技术路线；它们共享同一套安全与治理底座。"], en: ["Local agents help an individual get work done; embedded agents help a business system complete work.", "Managed agents help an enterprise run digital workers at scale and over time.", "These are not mutually exclusive technical paths; they share the same safety and governance foundation."] },
    },
    {
      heading: { zh: "3. Agent Infra 的作用：把“能运行”变成“可在企业里使用”", en: "3. What Agent Infra does: turn ‘it runs’ into ‘it works in an enterprise’" },
      body: { zh: ["Runtime 已经能解决 Agent 的主循环：推理、规划、上下文与工具调用。企业却仍要面对更棘手的问题：怎样安全调用企业系统？怎样在不暴露宿主机和生产权限的前提下运行代码与浏览器？怎样让 Agent 得到权限正确、可追溯、会更新的企业事实？怎样让一次任务可暂停、恢复、审计、回放和优化？", "这些问题无法靠在 Prompt 里多写几条规则解决。它们需要稳定的基础设施能力：把身份、凭据、网络、数据、状态、策略与证据变成系统级边界。换句话说，Agent Infra 不是 Runtime 外围的“附加功能”，而是决定 Agent 能否从演示走向生产的控制平面。"], en: ["Runtimes solve the agent loop: reasoning, planning, context, and tool use. Enterprises still face harder questions: how do we call business systems safely? How do we run code and browsers without exposing a host or production privileges? How do we give an agent permission-correct, traceable, updateable enterprise facts? How can work pause, resume, audit, replay, and improve?", "These problems cannot be solved by adding more rules to a prompt. They require durable infrastructure that makes identity, credentials, network, data, state, policy, and evidence into system-level boundaries. Agent Infra is not an add-on around the runtime; it is the control plane that lets an agent move from demo to production."] },
      bullets: { zh: ["Sandbox Service：隔离计算、文件、网络与短期凭据；限制资源，记录高风险操作，支持暂停恢复。", "MCP Gateway：统一身份、最小权限、凭据托管、参数校验、审批、限流、幂等、重试与审计。", "企业知识平台：继承源系统 ACL，做版本与失效管理、混合检索、引用与增量同步。", "Memory Platform：区分会话、任务、用户、业务与组织记忆，提供隔离、TTL、纠错、删除与来源解释。", "AgentOps & Governance：记录 Trace、证据、工具参数、审批、成本与业务结果，并支持回放、评测、灰度与告警。"], en: ["Sandbox Service: isolates compute, files, network, and short-lived credentials; bounds resources, records high-risk actions, and supports pause and resume.", "MCP Gateway: centralizes identity, least privilege, credential management, parameter validation, approval, rate limits, idempotency, retries, and audit.", "Enterprise Knowledge Platform: inherits source ACLs and manages versions, expiry, hybrid retrieval, citations, and incremental sync.", "Memory Platform: separates session, task, user, business, and organizational memory with isolation, TTL, correction, deletion, and provenance.", "AgentOps & Governance: records traces, evidence, tool arguments, approvals, cost, and business outcomes, with replay, evaluation, staged rollout, and alerts."] },
    },
    {
      heading: { zh: "4. 如何构建好 Agent Infra：以场景验证为起点，按风险与复用能力生长", en: "4. How to build good Agent Infra: start with scenarios, grow by risk and reuse" },
      body: { zh: ["最常见的误区，是一开始就试图建设一个无所不包的 Agent 平台。更可行的路径是先从一个低到中风险、能衡量业务价值的场景出发，例如知识助手、IT 工单、文档审核或运营分析。交付目标不是“上线一个 Agent”，而是缩短处理时间、提高自助解决率、减少人工工作量，或提升审核一致性。", "当第二、第三个场景出现相同的连接器、审批、检索、审计或执行诉求时，再把它们抽象成共享服务。这样做既能避免过早平台化，也能确保每一层 Infra 都有明确的使用者、SLA 和验收指标。成熟后再开放 Agent Studio、模板、工具目录、评测与发布能力，让业务团队在统一边界内自助扩展。"], en: ["The most common mistake is trying to build an all-encompassing agent platform on day one. A more viable path begins with a low- to medium-risk scenario with measurable value: knowledge assistance, IT tickets, document review, or operational analysis. The goal is not merely to launch an agent, but to reduce handling time, improve self-service resolution, lower manual effort, or make review more consistent.", "When a second and third scenario need the same connectors, approvals, retrieval, audit, or execution controls, abstract them into shared services. This avoids premature platformization while ensuring every layer of infra has a clear user, SLA, and acceptance measure. Only once these capabilities mature should you open an Agent Studio, templates, a tool catalog, evaluation, and release workflows for self-service expansion within a common boundary."] },
      bullets: { zh: ["第一阶段：用具体业务场景验证 ROI，并默认采用“固定工作流 + 有限自主决策 + 人工审批”。", "第二阶段：优先沉淀 MCP Gateway 与权限治理，其次是企业知识平台、AgentOps、Sandbox，最后逐步建设跨任务 Memory。", "第三阶段：再建设统一控制面，提供版本、灰度、成本、告警、模板、发布与多租户运营。", "每一层都要定义验收：任务完成率与质量、审批命中率、工具成功率、检索可引用率、恢复成功率、成本与业务指标。"], en: ["Stage 1: validate ROI with a specific business scenario and default to ‘fixed workflow + bounded autonomy + human approval.’", "Stage 2: consolidate an MCP Gateway and permission governance first, then enterprise knowledge, AgentOps, and Sandbox, while building cross-task memory gradually.", "Stage 3: build the common control plane for versions, staged rollout, cost, alerts, templates, releases, and multi-tenant operations.", "Define acceptance at every layer: task completion and quality, approval hit rate, tool success rate, citeable retrieval rate, recovery success rate, cost, and business metrics."] },
    },
  ],
  closing: { zh: "Agent Runtime 决定系统能否开始思考；Agent Infra 决定它能否被企业放心地长期使用。未来真正稀缺的能力，不只是把一个 Agent 跑起来，而是让许多个 Agent 在同一套安全、状态与治理边界里稳定地完成工作。", en: "Agent runtimes decide whether a system can begin to reason. Agent Infra decides whether an enterprise can rely on it over time. The scarce capability ahead is not merely starting one agent, but enabling many agents to finish work reliably within one shared boundary for safety, state, and governance." },
} satisfies { subtitle: Localized; intro: Localized; sections: { heading: Localized; body: Record<Language, string[]>; bullets?: Record<Language, string[]>; figure?: { src: string; caption: Localized } }[]; closing: Localized };

function App() {
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState<Language>("zh");
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("全部");
  const [page, setPage] = useState<"home" | "article" | "about">("home");
  const [progress, setProgress] = useState(0);
  const t = copy[lang];

  useEffect(() => { const savedTheme = window.localStorage.getItem("shihao-theme"); setDark(savedTheme === "dark"); const savedLang = window.localStorage.getItem("shihao-language"); if (savedLang === "en" || savedLang === "zh") setLang(savedLang); }, []);
  useEffect(() => { document.documentElement.dataset.theme = dark ? "dark" : "light"; window.localStorage.setItem("shihao-theme", dark ? "dark" : "light"); }, [dark]);
  useEffect(() => { window.localStorage.setItem("shihao-language", lang); }, [lang]);
  useEffect(() => {
    if (page !== "article") return;
    const updateProgress = () => {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(available > 0 ? Math.min(100, (window.scrollY / available) * 100) : 0);
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    return () => window.removeEventListener("scroll", updateProgress);
  }, [page]);

  const tags = [t.all, ...Array.from(new Set(posts.map((post) => post.tag[lang])))];
  const filtered = useMemo(() => posts.filter((post) => (activeTag === t.all || post.tag[lang] === activeTag) && `${post.title[lang]}${post.excerpt[lang]}`.toLowerCase().includes(query.toLowerCase())), [activeTag, lang, query, t.all]);
  const featured = posts.find((post) => post.featured)!;
  const showPage = (next: "home" | "article" | "about") => { setPage(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const changeLanguage = () => { setLang(lang === "zh" ? "en" : "zh"); setActiveTag(lang === "zh" ? "All" : "全部"); };
  const navToWriting = () => {
    if (page !== "home") {
      setPage("home");
      window.setTimeout(() => document.querySelector("#writing")?.scrollIntoView({ behavior: "smooth" }), 0);
    }
  };

  const Header = () => <header className="wrap"><nav className="nav site-nav" aria-label="Main navigation">
    <button className="nav-brand" onClick={() => showPage("home")}>Shihao Xiong</button>
    <button className={page === "home" ? "nav-link active" : "nav-link"} onClick={navToWriting}>{t.articles}</button>
    <button className={page === "about" ? "nav-link active" : "nav-link"} onClick={() => showPage("about")}>{t.about}</button>
    <button className="nav-link language" onClick={changeLanguage}>{lang === "zh" ? "EN" : "中文"}</button>
    <button className="btn btn-secondary theme-btn" onClick={() => setDark((value) => !value)} aria-label="Toggle color theme">{dark ? "☾ 夜" : "☀ 日"}</button>
  </nav></header>;

  const Timeline = () => <section className="timeline stack" aria-label="Timeline">
    <h6 className="section-label">{lang === "zh" ? "正在思考 / Now" : "Currently thinking"}</h6>
    <div className="tl-row"><div className="tl-rail"><i /><u /></div><div className="card tl-card"><small>NOW</small><h4>{lang === "zh" ? "Agent Infra 与企业运行边界" : "Agent infrastructure and enterprise boundaries"}</h4><p>{lang === "zh" ? "持续记录 Agent 如何安全、稳定、可治理地完成真实工作。" : "Notes on helping agents complete real work safely, reliably, and governably."}</p></div></div>
    <div className="tl-row"><div className="tl-rail"><i className="olive" /><u /></div><div className="card tl-card"><small>WRITING</small><h4>{lang === "zh" ? "把尚未成形的思考写清楚" : "Making half-formed thoughts clear"}</h4><p>{lang === "zh" ? "技术笔记与工作方法，慢慢整理，持续更新。" : "Technical notes and ways of working, gathered gradually."}</p></div></div>
  </section>;

  const Footer = () => <footer className="wrap site-footer"><span>© 2026 Shihao Xiong</span><span>{lang === "zh" ? "慢慢写，也认真写。" : "Written slowly, with care."}</span><button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>{t.top}</button></footer>;

  const Home = () => <main className="wrap stack home-page">
    <section className="hero" id="top"><div className="hero-copy"><h6>SHIHAO XIONG · FIELD NOTES</h6><h1>{lang === "zh" ? "构建 Agent 基础设施，也把过程写下来。" : "Building agent infrastructure, and writing it down."}</h1><p>{lang === "zh" ? "关于企业 Agent、工程实践与慢慢形成的想法。这里记录问题如何被拆开、验证，最后变成可靠的系统。" : "Notes on enterprise agents, engineering practice, and ideas taking shape—how problems are unpacked, tested, and turned into reliable systems."}</p><div className="hero-actions"><a className="btn btn-primary" href="#writing">{lang === "zh" ? "阅读文章" : "Read notes"}</a><button className="btn btn-secondary" onClick={() => showPage("about")}>{t.about}</button></div></div><div className="portrait-ring"><img className="portrait washed" src="/images/shihao-sunset.png" alt={lang === "zh" ? "日落海面" : "Sunset over the sea"} /></div></section>
    <section className="now-bar" aria-label="Now"><h6>{lang === "zh" ? "现在" : "Now"}</h6><div className="now-item"><span className="dot" /><div><b>{lang === "zh" ? "整理 Agent Infra 的实践" : "Mapping agent infrastructure"}</b><span>{lang === "zh" ? "写作 · 进行中" : "Writing · in progress"}</span></div></div><div className="now-item"><span className="dot dot-2" /><div><b>{lang === "zh" ? "阅读与构建" : "Reading and building"}</b><span>{lang === "zh" ? "工程 · 持续进行" : "Engineering · ongoing"}</span></div></div><div className="now-item"><span className="dot dot-idle" /><div><b>{lang === "zh" ? "更新这个小站" : "Tending this small site"}</b><span>{lang === "zh" ? "博客 · 缓慢更新" : "Blog · slowly updated"}</span></div></div></section>
    <article className="card elev-sm featured"><span className="card-kicker">{lang === "zh" ? "最新一篇" : "Latest note"} · {featured.date} · {featured.minutes}</span><h2>{featured.title[lang]}</h2><p>{featured.excerpt[lang]}</p><button className="btn btn-primary" onClick={() => showPage("article")}>{lang === "zh" ? "继续读 →" : "Continue reading →"}</button></article>
    <section className="cols" id="writing"><div className="col"><div className="row-between"><h6>{lang === "zh" ? "技术笔记" : "Technical notes"}</h6><span className="quiet-count">{posts.length} {lang === "zh" ? "篇" : "note"}</span></div><label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} aria-label={t.search} /></label><div className="filters" aria-label="Article tags">{tags.map((tag) => <button className={activeTag === tag ? "active" : ""} key={tag} onClick={() => setActiveTag(tag)}>{tag}</button>)}</div><div className="note-list">{filtered.map((post) => <button className="note" key={post.id} onClick={() => showPage("article")}><span className="dot" /><span><h4>{post.title[lang]}</h4><small>{post.date} · {post.minutes}</small></span></button>)}{filtered.length === 0 && <p className="empty">{t.noResults}</p>}</div></div><div className="col"><div className="row-between"><h6 className="olive-label">{lang === "zh" ? "写作方向" : "Writing directions"}</h6></div><div className="card career-card"><h4>{lang === "zh" ? "让系统在企业里长期工作" : "Making systems work over time"}</h4><small>{lang === "zh" ? "Agent Infra · 安全与治理" : "Agent infra · safety and governance"}</small></div><div className="card career-card"><h4>{lang === "zh" ? "把复杂的工程问题说明白" : "Explaining complex engineering"}</h4><small>{lang === "zh" ? "工作方法 · 技术笔记" : "Ways of working · technical notes"}</small></div><div className="card career-card"><h4>{lang === "zh" ? "持续学习，持续校正" : "Learn, then recalibrate"}</h4><small>{lang === "zh" ? "阅读 · 观察 · 实践" : "Reading · observation · practice"}</small></div></div></section>
    <Timeline />
    <section className="band"><div><h4>{lang === "zh" ? "想聊聊，或者订阅更新" : "Say hello or follow along"}</h4><p>{lang === "zh" ? "有想法、问题或一起在做的事，欢迎来信。" : "Ideas, questions, or work in progress are always welcome."}</p></div><div className="band-actions"><a className="btn btn-primary" href="mailto:xiongshihao97@gmail.com">Email</a><button className="btn btn-secondary" onClick={() => showPage("about")}>{t.about}</button></div></section>
  </main>;

  const About = () => <main className="wrap"><div className="about-page"><aside className="about-side"><img className="portrait-lg washed" src="/images/shihao-sunset.png" alt={lang === "zh" ? "日落海面" : "Sunset over the sea"} /><a className="btn btn-secondary btn-block" href="mailto:xiongshihao97@gmail.com">Email <span>↗</span></a><button className="btn btn-secondary btn-block" onClick={() => showPage("home")}>{t.articles} <span>→</span></button></aside><div className="about-body"><section><h6>{lang === "zh" ? "关于 / About" : "About"}</h6><h1>{lang === "zh" ? "你好，我是 Shihao。" : "Hi, I’m Shihao."}</h1><p>{t.aboutLead}</p><p>{t.aboutBody}</p></section><Timeline /><section><h6 className="section-label">{lang === "zh" ? "关注" : "Focus"}</h6><div className="tag-row"><span className="tag tag-outline">Agent Infra</span><span className="tag tag-outline">Systems</span><span className="tag tag-outline">AgentOps</span><span className="tag tag-outline">Writing</span><span className="tag tag-outline">AI</span></div></section><section className="cta"><h4>{lang === "zh" ? "聊聊？" : "Let’s talk."}</h4><p>{lang === "zh" ? "关于基础设施、团队，或者一个尚未想清楚的工程问题，都欢迎写信。" : "Infrastructure, teams, or an engineering problem that is not clear yet—all welcome."}</p><a className="btn btn-primary" href="mailto:xiongshihao97@gmail.com">{lang === "zh" ? "写信给我" : "Email me"}</a></section></div></div></main>;

  const Article = () => <><div className="progress-track"><div className="progress-bar" style={{ width: `${progress}%` }} /></div><main className="wrap"><div className="article"><aside className="aside"><button className="btn btn-secondary back-button" onClick={() => showPage("home")}>← {t.back}</button><nav className="card toc" aria-label="Table of contents"><span className="card-kicker">{lang === "zh" ? "目录" : "Contents"}</span>{article.sections.map((section, index) => <a href={`#section-${index + 1}`} key={section.heading.zh}><i>{String(index + 1).padStart(2, "0")}</i><span>{section.heading[lang]}</span></a>)}</nav><div className="card author-card"><div className="author-head"><img className="washed" src="/images/shihao-sunset.png" alt="" /><div><b>Shihao Xiong</b><span>Agent Infrastructure</span></div></div><small>{featured.date} · {featured.minutes}</small></div></aside><article className="prose"><span className="tag tag-accent">{featured.tag[lang]}</span><h1>{featured.title[lang]}</h1><p className="dek">{article.subtitle[lang]}</p><p className="lead">{article.intro[lang]}</p>{article.sections.map((section, index) => <section id={`section-${index + 1}`} key={section.heading.zh}><div className="h-num"><i>{String(index + 1).padStart(2, "0")}</i><h3>{section.heading[lang].replace(/^\d+\.\s*/, "")}</h3></div>{section.body[lang].map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.bullets && <ul>{section.bullets[lang].map((item) => <li key={item}>{item}</li>)}</ul>}{section.figure && <figure><img src={section.figure.src} alt={section.figure.caption[lang]} /><figcaption>{section.figure.caption[lang]}</figcaption></figure>}</section>)}<p className="closing">{article.closing[lang]}</p><div className="tag-row"><span className="tag tag-outline">agent-infra</span><span className="tag tag-outline">systems</span><span className="tag tag-outline">governance</span></div></article></div></main></>;

  return <div className="site-shell"><Header />{page === "home" ? <Home /> : page === "about" ? <About /> : <Article />}<Footer /></div>;
}

createRoot(document.getElementById("root")!).render(<App />);
