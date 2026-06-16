"use client";

import { useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { executeWorkflow, type WorkflowNode, type WorkflowEdge } from "@/lib/workflow-engine";
import { PRESETS } from "@/lib/presets";
import { cn } from "@/lib/utils";

const RESEARCH_PRESETS = PRESETS.filter((p) => p.id.startsWith("research"));

interface RunResult {
  totalTokens: number;
  totalCost: number;
  totalLatencyMs: number;
  llmCalls: number;
  toolCalls: number;
  stepCount: number;
}

function MetricBar({
  label, values, maxValue, unit, color
}: {
  label: string;
  values: (number | null)[];
  maxValue: number;
  unit: string;
  color: string[];
}) {
  return (
    <div className="mb-4">
      <div className="text-xs text-slate-500 mb-2">{label}</div>
      <div className="flex gap-3 items-end">
        {values.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="text-xs font-mono text-slate-200">
              {v !== null ? `${unit === "$" ? unit : ""}${v}${unit !== "$" ? unit : ""}` : "—"}
            </div>
            <div className="w-full bg-slate-800 rounded-sm overflow-hidden h-20 flex items-end">
              <div
                className={`w-full rounded-sm transition-all duration-700 ${color[i]}`}
                style={{ height: v !== null ? `${Math.max(4, (v / maxValue) * 100)}%` : "0%" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const INSIGHTS = [
  {
    condition: (a: RunResult, b: RunResult) => a.totalCost > b.totalCost * 1.5,
    text: (a: RunResult, b: RunResult) =>
      `In-LLM is ${((a.totalCost / b.totalCost - 1) * 100).toFixed(0)}% more expensive than Out-of-LLM for this task — the agent loop accumulates tokens on every reasoning step.`,
  },
  {
    condition: (a: RunResult, b: RunResult) => a.totalLatencyMs > b.totalLatencyMs * 1.2,
    text: (a: RunResult, b: RunResult) =>
      `Out-of-LLM is ${(a.totalLatencyMs - b.totalLatencyMs)}ms faster because focused, smaller prompts complete quicker than a single large agent loop.`,
  },
  {
    condition: (a: RunResult, b: RunResult) => a.llmCalls > b.llmCalls,
    text: (a: RunResult, b: RunResult) =>
      `In-LLM used ${a.llmCalls} LLM reasoning steps vs. ${b.llmCalls} focused LLM calls. Fewer calls ≠ better — In-LLM trades call count for token depth.`,
  },
];

export default function LabClient() {
  const [results, setResults] = useState<(RunResult | null)[]>([null, null]);
  const [running, setRunning] = useState<boolean[]>([false, false]);
  const [logs, setLogs] = useState<string[][]>([[], []]);

  const runBoth = async () => {
    const runPreset = async (idx: number, preset: typeof PRESETS[0]) => {
      setRunning((r) => { const n = [...r]; n[idx] = true; return n; });
      setResults((r) => { const n = [...r]; n[idx] = null; return n; });
      setLogs((l) => { const n = [...l]; n[idx] = []; return n; });

      let llmCalls = 0, toolCalls = 0, stepCount = 0;

      const result = await executeWorkflow(
        preset.nodes as WorkflowNode[],
        preset.edges as WorkflowEdge[],
        preset.sampleInput,
        preset.orchestrationModel,
        (step) => {
          if (step.status === "complete") {
            stepCount++;
            if (step.nodeType === "llm") llmCalls++;
            if (step.nodeType === "tool") toolCalls++;
          }
        },
        (log) => {
          setLogs((l) => { const n = [...l]; n[idx] = [...n[idx], log]; return n; });
        }
      );

      setResults((r) => {
        const n = [...r];
        n[idx] = {
          totalTokens: result.totalTokens,
          totalCost: result.totalCost,
          totalLatencyMs: result.totalLatencyMs,
          llmCalls,
          toolCalls,
          stepCount,
        };
        return n;
      });
      setRunning((r) => { const n = [...r]; n[idx] = false; return n; });
    };

    await Promise.all(RESEARCH_PRESETS.map((p, i) => runPreset(i, p)));
  };

  const bothDone = results[0] !== null && results[1] !== null;

  const maxTokens = Math.max(results[0]?.totalTokens ?? 0, results[1]?.totalTokens ?? 1);
  const maxCost = Math.max(results[0]?.totalCost ?? 0, results[1]?.totalCost ?? 0.001);
  const maxMs = Math.max(results[0]?.totalLatencyMs ?? 0, results[1]?.totalLatencyMs ?? 1);

  const insights = bothDone
    ? INSIGHTS.filter((ins) => ins.condition(results[0]!, results[1]!)).map((ins) =>
        ins.text(results[0]!, results[1]!)
      )
    : [];

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <nav className="border-b border-slate-800 bg-[#0a0f1a]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-slate-200 transition-colors text-sm">← Home</Link>
          <span className="text-slate-700">/</span>
          <span className="text-slate-300 text-sm font-medium">Comparison Lab</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 mb-1">Comparison Lab</h1>
            <p className="text-slate-400 text-sm">
              Same task. Different orchestration. Watch what changes.
            </p>
          </div>
          <button
            onClick={runBoth}
            disabled={running[0] || running[1]}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors text-sm",
              running[0] || running[1]
                ? "bg-violet-800/50 text-violet-400 cursor-not-allowed"
                : "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/40"
            )}
          >
            <Play className="w-4 h-4" />
            {running[0] || running[1] ? "Running..." : "Run Both Side by Side →"}
          </button>
        </div>

        {/* Task card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8">
          <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Task</div>
          <p className="text-slate-200 text-sm font-medium">{RESEARCH_PRESETS[0]?.sampleInput}</p>
        </div>

        {/* Side-by-side */}
        <div className="grid grid-cols-2 gap-5 mb-8">
          {RESEARCH_PRESETS.map((preset, idx) => {
            const result = results[idx];
            const isRunning = running[idx];
            return (
              <div key={preset.id} className={cn(
                "bg-slate-900 border rounded-2xl overflow-hidden",
                idx === 0 ? "border-violet-800/40" : "border-sky-800/40"
              )}>
                <div className={cn("px-5 py-4 border-b", idx === 0 ? "border-violet-900/50 bg-violet-950/20" : "border-sky-900/50 bg-sky-950/20")}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-100">{preset.name}</h3>
                    {isRunning && (
                      <span className="text-xs text-blue-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> Running
                      </span>
                    )}
                    {result && !isRunning && (
                      <span className="text-xs text-emerald-400">✓ Complete</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{preset.description}</p>
                </div>

                <div className="p-5">
                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {[
                      { label: "Total Tokens", value: result ? result.totalTokens.toLocaleString() : "—", sub: "input + output", color: "text-slate-200" },
                      { label: "Cost", value: result ? `$${result.totalCost.toFixed(4)}` : "—", sub: "USD", color: "text-emerald-400" },
                      { label: "Latency", value: result ? `${result.totalLatencyMs}ms` : "—", sub: "total", color: "text-slate-200" },
                      { label: "LLM Calls", value: result ? String(result.llmCalls) : "—", sub: "inference calls", color: idx === 0 ? "text-violet-400" : "text-sky-400" },
                    ].map(({ label, value, sub, color }) => (
                      <div key={label} className="bg-slate-950/50 rounded-xl p-3">
                        <div className="text-xs text-slate-500 mb-1">{label}</div>
                        <div className={cn("text-xl font-bold font-mono", color)}>{value}</div>
                        <div className="text-[10px] text-slate-600 mt-0.5">{sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Characteristics */}
                  <div className="space-y-1.5">
                    {(idx === 0
                      ? [
                          ["Flexibility", "Very High — model decides dynamically", "text-emerald-400"],
                          ["Cost", "Higher — every reasoning step = tokens", "text-amber-400"],
                          ["Reliability", "Probabilistic — model may vary", "text-amber-400"],
                          ["Observability", "Harder — logic is inside the model", "text-rose-400"],
                        ]
                      : [
                          ["Flexibility", "Lower — fixed graph structure", "text-amber-400"],
                          ["Cost", "Lower — focused, minimal prompts", "text-emerald-400"],
                          ["Reliability", "High — deterministic routing", "text-emerald-400"],
                          ["Observability", "Easy — every step is logged", "text-emerald-400"],
                        ]
                    ).map(([dim, val, c]) => (
                      <div key={dim} className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">{dim}</span>
                        <span className={cn("font-medium", c)}>{val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Log */}
                  <div className="mt-4 bg-slate-950 rounded-lg p-3 max-h-28 overflow-y-auto font-mono">
                    {logs[idx].length === 0 ? (
                      <p className="text-[10px] text-slate-700">Log will appear here...</p>
                    ) : (
                      logs[idx].map((l, i) => (
                        <div key={i} className="text-[10px] text-slate-500 py-0.5">{l.replace(/^\[.*?\] /, "")}</div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Visual metric comparison */}
        {bothDone && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
            <h3 className="text-sm font-semibold text-slate-200 mb-5">Side-by-Side Metrics</h3>
            <div className="flex gap-4 mb-4">
              <div className="flex items-center gap-1.5 text-xs text-violet-400">
                <span className="w-3 h-3 rounded-sm bg-violet-600" /> In-LLM
              </div>
              <div className="flex items-center gap-1.5 text-xs text-sky-400">
                <span className="w-3 h-3 rounded-sm bg-sky-600" /> Out-of-LLM
              </div>
            </div>
            <div className="grid grid-cols-3 gap-8">
              <MetricBar
                label="Total Tokens"
                values={[results[0]?.totalTokens ?? null, results[1]?.totalTokens ?? null]}
                maxValue={maxTokens}
                unit=" tok"
                color={["bg-violet-600", "bg-sky-600"]}
              />
              <MetricBar
                label="Cost (USD)"
                values={[
                  results[0] ? parseFloat(results[0].totalCost.toFixed(4)) : null,
                  results[1] ? parseFloat(results[1].totalCost.toFixed(4)) : null,
                ]}
                maxValue={maxCost}
                unit="$"
                color={["bg-violet-600", "bg-sky-600"]}
              />
              <MetricBar
                label="Latency (ms)"
                values={[results[0]?.totalLatencyMs ?? null, results[1]?.totalLatencyMs ?? null]}
                maxValue={maxMs}
                unit="ms"
                color={["bg-violet-600", "bg-sky-600"]}
              />
            </div>
          </div>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">What this tells you</h3>
            {insights.map((insight, i) => (
              <div key={i} className="bg-amber-950/20 border border-amber-800/30 rounded-xl p-4 flex items-start gap-3">
                <span className="text-amber-400 text-sm shrink-0">💡</span>
                <p className="text-sm text-slate-300">{insight}</p>
              </div>
            ))}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-sm text-slate-400">
                <span className="text-slate-200 font-medium">The takeaway:</span> Out-of-LLM is cheaper and faster for tasks with a predictable structure.
                In-LLM wins when the path is unknown upfront and flexibility matters more than cost.
                In production, use <span className="text-teal-400 font-medium">Hybrid</span> — external structure for known parts, agent loops where you need adaptability.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
