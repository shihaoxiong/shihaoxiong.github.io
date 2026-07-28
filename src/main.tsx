import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

type Post = { date: string; title: string; excerpt: string; tag: string; minutes: string; featured?: boolean };

const posts: Post[] = [
  { date: "2026.07.28", title: "把想法交给 Agent：从一次任务到长期运行的系统", excerpt: "真正有用的 Agent，不只是一次问答，而是能在边界清晰的环境里持续推进工作、留下证据并可恢复。", tag: "Agent", minutes: "6 min", featured: true },
  { date: "2026.07.20", title: "做一个让人愿意读完的工作复盘", excerpt: "复盘的重点不是罗列完成项，而是把判断、证据、尚待验证的部分和下一步说清楚。", tag: "Writing", minutes: "4 min" },
  { date: "2026.07.12", title: "长期主义不是慢，而是建立反馈回路", excerpt: "把目标拆得足够小，让每一周都有可以校准方向的真实信号。", tag: "Thinking", minutes: "5 min" },
  { date: "2026.06.29", title: "从一份 PPT 开始：让信息有自己的结构", excerpt: "先确定读者要做的决策，再让数据、故事和视觉服务于同一个结论。", tag: "Design", minutes: "7 min" },
];

function App() {
  const [dark, setDark] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("全部");
  useEffect(() => { const saved = window.localStorage.getItem("xiaodan-theme"); setDark(saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)); }, []);
  useEffect(() => { document.documentElement.dataset.theme = dark ? "dark" : "light"; window.localStorage.setItem("xiaodan-theme", dark ? "dark" : "light"); }, [dark]);
  const tags = ["全部", ...Array.from(new Set(posts.map((post) => post.tag)))];
  const filtered = useMemo(() => posts.filter((post) => (activeTag === "全部" || post.tag === activeTag) && `${post.title}${post.excerpt}`.toLowerCase().includes(query.toLowerCase())), [activeTag, query]);
  const featured = posts.find((post) => post.featured)!;
  return <main>
    <nav className="nav" aria-label="主导航"><a className="brand" href="#top" aria-label="返回首页">XIAODAN<span>•</span>NOTES</a><div className="nav-links"><a href="#writing">文章</a><a href="#about">关于</a><button className="theme-toggle" onClick={() => setDark((value) => !value)} aria-label="切换深色模式">{dark ? "☀" : "◐"}</button></div></nav>
    <section className="hero" id="top"><p className="eyebrow">FIELD NOTES / 2026</p><h1>构建、思考，<br /><em>慢慢成为。</em></h1><p className="intro">这里记录我在技术、产品与生活里持续做实验的过程。<br />愿每一次书写，都让问题更清楚一点。</p><a className="text-link" href="#writing">开始阅读 <span>↓</span></a><div className="hero-mark" aria-hidden="true"><i></i><i></i><i></i></div></section>
    <section className="featured" aria-label="置顶文章"><div className="featured-label"><span></span> LATEST ESSAY</div><article className="featured-card"><div className="article-meta">{featured.date} &nbsp;·&nbsp; {featured.tag.toUpperCase()} &nbsp;·&nbsp; {featured.minutes}</div><h2>{featured.title}</h2><p>{featured.excerpt}</p><button className="read-button" onClick={() => document.querySelector("#writing")?.scrollIntoView({ behavior: "smooth" })}>阅读文章 <b>↗</b></button><div className="orbit" aria-hidden="true">01</div></article></section>
    <section className="writing" id="writing"><div className="section-head"><div><p className="eyebrow">SELECTED WRITING</p><h2>最近文章</h2></div><label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索文章" aria-label="搜索文章" /></label></div><div className="filters" aria-label="文章标签">{tags.map((tag) => <button className={activeTag === tag ? "active" : ""} key={tag} onClick={() => setActiveTag(tag)}>{tag}</button>)}</div><div className="post-list">{filtered.map((post, index) => <article className="post" key={post.title}><span className="post-number">0{index + 1}</span><div><div className="article-meta">{post.date} &nbsp;·&nbsp; {post.tag.toUpperCase()} &nbsp;·&nbsp; {post.minutes}</div><h3>{post.title}</h3><p>{post.excerpt}</p></div><button className="round-link" aria-label={`阅读：${post.title}`}>↗</button></article>)}{filtered.length === 0 && <p className="empty">没有找到匹配的文章。</p>}</div></section>
    <section className="about" id="about"><div><p className="eyebrow">ABOUT ME</p><h2>在复杂世界里，<br />寻找清晰的路径。</h2></div><div className="about-copy"><p>你好，我是 Xiaodan。关注 Agent、产品与值得长期投入的事物。</p><p>这个空间不追求即时结论，更在意诚实地记录问题、判断和变化。</p><a className="text-link" href="mailto:xiongshihao97@gmail.com">和我聊聊 <span>↗</span></a></div></section>
    <footer><span>© 2026 XIAODAN NOTES</span><span>MADE WITH CARE &amp; CURIOSITY</span><a href="#top">回到顶部 ↑</a></footer>
  </main>;
}

createRoot(document.getElementById("root")!).render(<App />);
