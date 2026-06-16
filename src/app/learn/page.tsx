import Link from "next/link";

const concepts = [
  {
    id: 1,
    emoji: "🪟",
    title: "The Context Window",
    tagline: "An LLM's working memory",
    color: "violet",
    body: "Every time you call an LLM, it processes a context window — all the text passed in. This is where the model 'sees' everything: your instructions, the conversation history, tool results, and documents. The model cannot remember anything outside its current context window.",
    analogy: "Think of it like a whiteboard: the model can only use what's written on the board right now.",
    keyFact: "Claude's context window holds up to 200,000 tokens — roughly 150,000 words.",
  },
  {
    id: 2,
    emoji: "🔧",
    title: "Tool Calls",
    tagline: "How an LLM reaches outside itself",
    color: "amber",
    body: "A tool call is when an LLM decides to invoke an external function — like searching the web, running code, or querying a database. The LLM outputs a structured call, your system executes it, returns the result, and the LLM continues with that result in its context.",
    analogy: "Like a lawyer who can ask their paralegal to go look something up, then continues once the answer comes back.",
    keyFact: "Tool calls happen outside the LLM — the model only sees the input and output, not the execution.",
  },
  {
    id: 3,
    emoji: "🔄",
    title: "The Agent Loop",
    tagline: "In-LLM orchestration in action",
    color: "indigo",
    body: "An agent loop is when an LLM repeatedly: (1) thinks about what to do, (2) calls a tool, (3) receives the result, (4) decides if the task is done. This entire loop happens inside a single conversation with the model. The LLM is the orchestrator.",
    analogy: "A chef who plans the meal, cooks each dish in sequence, tastes and adjusts, then plates everything — all independently.",
    keyFact: "In-LLM orchestration is powerful but expensive: every loop iteration consumes tokens.",
  },
  {
    id: 4,
    emoji: "🗺️",
    title: "DAGs & Pipelines",
    tagline: "Out-of-LLM orchestration in action",
    color: "sky",
    body: "A DAG (Directed Acyclic Graph) is a workflow where each step is a node and arrows show what runs after what. In out-of-LLM orchestration, your code defines this graph — LLMs are just nodes in it, called as pure functions with no knowledge of the broader plan.",
    analogy: "Like a factory assembly line: each station does one job, the conveyor belt controls the flow, and no station knows what happens next.",
    keyFact: "DAG orchestrators like LangGraph and Temporal give you retries, checkpoints, and parallel execution for free.",
  },
  {
    id: 5,
    emoji: "🧩",
    title: "Hybrid Orchestration",
    tagline: "External structure, agent intelligence",
    color: "teal",
    body: "Hybrid systems combine both: an external orchestrator manages the high-level flow (routing, parallelism, error handling), while individual steps delegate to in-LLM agents when open-ended reasoning is needed. You get the reliability of pipelines and the flexibility of agents.",
    analogy: "A project manager who sets deadlines and coordinates the team, while each team member has autonomy to figure out their own work.",
    keyFact: "Most production AI systems are hybrid. Pure in-LLM is great for demos; pure out-of-LLM misses edge cases.",
  },
  {
    id: 6,
    emoji: "🧠",
    title: "Memory Patterns",
    tagline: "Where state lives matters",
    color: "rose",
    body: "AI systems need memory to maintain context across steps. Three patterns: (1) In-context: append all history to each call — simple but grows expensive. (2) External KV: store key facts in a database, retrieve by key. (3) Vector memory: embed text semantically, retrieve the most relevant chunks by similarity.",
    analogy: "In-context = writing everything on your whiteboard. External = filing cabinet. Vector = a smart search index over your notes.",
    keyFact: "Vector memory keeps cost flat as history grows — the right choice for long-running agents.",
  },
];

const comparison = [
  { dimension: "Who controls the flow?", inLLM: "The model decides", outLLM: "Your code decides", hybrid: "Both, by layer" },
  { dimension: "Where does state live?", inLLM: "Context window", outLLM: "External DB / cache", hybrid: "Split by concern" },
  { dimension: "Cost profile", inLLM: "High, variable", outLLM: "Predictable, lower", hybrid: "Optimized" },
  { dimension: "Reliability", inLLM: "Probabilistic", outLLM: "Deterministic", hybrid: "Tunable" },
  { dimension: "Flexibility", inLLM: "Very high", outLLM: "Lower (rigid graph)", hybrid: "High" },
  { dimension: "Observability", inLLM: "Hard (inside model)", outLLM: "Easy (each step logged)", hybrid: "Moderate" },
  { dimension: "Failure recovery", inLLM: "Model-dependent", outLLM: "Explicit retries", hybrid: "Layered" },
  { dimension: "Best for", inLLM: "Open-ended tasks", outLLM: "Known, repetitive pipelines", hybrid: "Production AI systems" },
];

const colorMap: Record<string, { badge: string; card: string; border: string }> = {
  violet: { badge: "bg-violet-400/10 text-violet-300 border-violet-400/20", card: "from-violet-950/30", border: "border-violet-800/30" },
  amber: { badge: "bg-amber-400/10 text-amber-300 border-amber-400/20", card: "from-amber-950/30", border: "border-amber-800/30" },
  indigo: { badge: "bg-indigo-400/10 text-indigo-300 border-indigo-400/20", card: "from-indigo-950/30", border: "border-indigo-800/30" },
  sky: { badge: "bg-sky-400/10 text-sky-300 border-sky-400/20", card: "from-sky-950/30", border: "border-sky-800/30" },
  teal: { badge: "bg-teal-400/10 text-teal-300 border-teal-400/20", card: "from-teal-950/30", border: "border-teal-800/30" },
  rose: { badge: "bg-rose-400/10 text-rose-300 border-rose-400/20", card: "from-rose-950/30", border: "border-rose-800/30" },
};

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* Nav */}
      <nav className="border-b border-slate-800 bg-[#0a0f1a]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm">
            ← Home
          </Link>
          <span className="text-slate-700">/</span>
          <span className="text-slate-300 text-sm font-medium">Learning Center</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">AI Orchestration Fundamentals</h1>
          <p className="text-slate-400">Six concepts that explain how AI systems actually work in production.</p>
        </div>

        {/* Concept Cards */}
        <div className="grid grid-cols-2 gap-5 mb-16">
          {concepts.map((c) => {
            const colors = colorMap[c.color];
            return (
              <div key={c.id} className={`bg-gradient-to-br ${colors.card} to-slate-900/50 border ${colors.border} rounded-2xl p-6`}>
                <div className="flex items-start gap-4">
                  <div className="text-3xl mt-0.5">{c.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full border">{`Concept ${c.id}`}</span>
                    </div>
                    <h2 className="text-lg font-semibold text-slate-100 mb-0.5">{c.title}</h2>
                    <p className="text-sm text-slate-400 italic mb-3">{c.tagline}</p>
                    <p className="text-sm text-slate-300 leading-relaxed mb-4">{c.body}</p>
                    <div className="bg-slate-800/60 rounded-lg p-3 mb-3">
                      <span className="text-xs text-slate-500 uppercase tracking-wide">Analogy</span>
                      <p className="text-sm text-slate-300 mt-1 italic">{c.analogy}</p>
                    </div>
                    <div className={`rounded-lg p-3 border ${colors.border} bg-black/20`}>
                      <span className="text-xs uppercase tracking-wide text-slate-500">Key Fact</span>
                      <p className="text-sm text-slate-200 mt-1">{c.keyFact}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison Matrix */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-slate-100 mb-2">Comparison Matrix</h2>
          <p className="text-sm text-slate-400 mb-6">Use this to make architectural decisions.</p>
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-5 py-4 text-slate-500 font-medium w-1/4">Dimension</th>
                  <th className="text-left px-5 py-4 font-medium">
                    <span className="text-violet-400">In-LLM</span>
                  </th>
                  <th className="text-left px-5 py-4 font-medium">
                    <span className="text-sky-400">Out-of-LLM</span>
                  </th>
                  <th className="text-left px-5 py-4 font-medium">
                    <span className="text-teal-400">Hybrid</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-slate-900/30" : ""}>
                    <td className="px-5 py-3 text-slate-400 font-medium">{row.dimension}</td>
                    <td className="px-5 py-3 text-slate-300">{row.inLLM}</td>
                    <td className="px-5 py-3 text-slate-300">{row.outLLM}</td>
                    <td className="px-5 py-3 text-slate-300">{row.hybrid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-violet-950/50 to-indigo-950/50 border border-violet-800/30 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-semibold text-slate-100 mb-2">Ready to see it in action?</h3>
          <p className="text-slate-400 text-sm mb-6">Run a pre-built scenario and watch orchestration patterns execute live.</p>
          <div className="flex justify-center gap-4">
            <Link
              href="/simulator"
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Open Simulator →
            </Link>
            <Link
              href="/playground"
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors border border-slate-700"
            >
              Build Your Own
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
