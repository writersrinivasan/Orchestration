import Link from "next/link";

const cards = [
  {
    href: "/learn",
    tag: "Start Here",
    tagColor: "text-violet-400 bg-violet-400/10 border-violet-400/20",
    title: "Learn the Concepts",
    description:
      "Understand what orchestration is, why it matters, and when to use each pattern — with interactive concept cards and a visual comparison matrix.",
    icon: "🧠",
    gradient: "from-violet-950/60 to-slate-900",
    border: "border-violet-800/40",
  },
  {
    href: "/playground",
    tag: "Build",
    tagColor: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    title: "Workflow Playground",
    description:
      "Drag-and-drop a workflow using LLM nodes, tool nodes, routers, and more. Run it live and watch tokens, cost, and latency appear in real time.",
    icon: "⚙️",
    gradient: "from-amber-950/60 to-slate-900",
    border: "border-amber-800/40",
  },
  {
    href: "/simulator",
    tag: "Explore",
    tagColor: "text-sky-400 bg-sky-400/10 border-sky-400/20",
    title: "Agent Simulator",
    description:
      "Run pre-built scenarios — Research Assistant, Code Review, Customer Support — and observe multi-agent coordination, routing, and tool calls.",
    icon: "🤖",
    gradient: "from-sky-950/60 to-slate-900",
    border: "border-sky-800/40",
  },
  {
    href: "/lab",
    tag: "Compare",
    tagColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    title: "Comparison Lab",
    description:
      "Run the exact same task using In-LLM, Out-of-LLM, and Hybrid orchestration side by side. See which wins on cost, speed, and reliability.",
    icon: "🔬",
    gradient: "from-emerald-950/60 to-slate-900",
    border: "border-emerald-800/40",
  },
];

const stats = [
  { label: "Orchestration Patterns", value: "3" },
  { label: "Interactive Scenarios", value: "4" },
  { label: "Node Types", value: "7" },
  { label: "Concept Cards", value: "12+" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* Nav */}
      <nav className="border-b border-slate-800 bg-[#0a0f1a]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm">
              ◈
            </div>
            <span className="font-semibold text-slate-100 tracking-tight">OrchestrationOS</span>
          </div>
          <div className="flex items-center gap-1">
            {[
              { href: "/learn", label: "Learn" },
              { href: "/playground", label: "Playground" },
              { href: "/simulator", label: "Simulator" },
              { href: "/lab", label: "Lab" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-sm text-violet-300 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Interactive AI Orchestration Platform
        </div>
        <h1 className="text-5xl font-bold text-slate-50 tracking-tight leading-tight mb-6">
          What decides what an AI{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
            does next?
          </span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
          Inside the model, or outside? The answer changes cost, reliability, speed, and control.
          <br />
          Learn the patterns. Build them. Compare them live.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/simulator"
            className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-violet-900/50"
          >
            Run a Demo →
          </Link>
          <Link
            href="/learn"
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors border border-slate-700"
          >
            Learn the Basics
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-4 gap-6 max-w-2xl mx-auto">
          {stats.map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-bold text-slate-100">{value}</div>
              <div className="text-xs text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture preview */}
      <div className="max-w-6xl mx-auto px-6 mb-16">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-x-auto">
          <div className="text-xs text-slate-500 mb-4 font-mono uppercase tracking-widest">Orchestration Spectrum</div>
          <div className="flex items-stretch gap-1 min-w-[600px]">
            {[
              { label: "In-LLM", desc: "Model decides everything", color: "bg-violet-900/50 border-violet-700", tag: "Flexible · Expensive" },
              { label: "◄──────────────────────────────────────────►", desc: "", color: "bg-transparent border-0 flex-1", tag: "", isArrow: true },
              { label: "Hybrid", desc: "External + agent loops", color: "bg-indigo-900/50 border-indigo-700", tag: "Balanced · Practical" },
              { label: "◄──────────────────────────────────────────►", desc: "", color: "bg-transparent border-0 flex-1", tag: "", isArrow: true },
              { label: "Out-of-LLM", desc: "Code controls the flow", color: "bg-slate-800 border-slate-600", tag: "Reliable · Cheap" },
            ].map((item, i) =>
              item.isArrow ? (
                <div key={i} className="flex-1 flex items-center justify-center text-slate-600 text-xs font-mono">
                  ──────────────
                </div>
              ) : (
                <div key={i} className={`border rounded-xl px-4 py-3 ${item.color} min-w-[140px]`}>
                  <div className="text-sm font-semibold text-slate-200">{item.label}</div>
                  <div className="text-xs text-slate-400 mt-1">{item.desc}</div>
                  <div className="text-xs text-slate-500 mt-2 font-mono">{item.tag}</div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-2 gap-6">
          {cards.map(({ href, tag, tagColor, title, description, icon, gradient, border }) => (
            <Link
              key={href}
              href={href}
              className={`group relative bg-gradient-to-br ${gradient} border ${border} rounded-2xl p-6 hover:border-opacity-80 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40`}
            >
              <div className="flex items-start justify-between mb-4">
                <span className={`text-xs font-medium px-2 py-1 rounded-full border ${tagColor}`}>{tag}</span>
                <span className="text-2xl">{icon}</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-100 mb-2 group-hover:text-white transition-colors">
                {title}
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
              <div className="mt-4 text-xs text-slate-500 group-hover:text-slate-400 transition-colors flex items-center gap-1">
                Open →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
