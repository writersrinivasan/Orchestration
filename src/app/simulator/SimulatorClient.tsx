"use client";

import { useState, useRef } from "react";
import {
  ReactFlow, Background, Controls, BackgroundVariant,
  useNodesState, useEdgesState, type Node, type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Link from "next/link";
import { Play, ChevronRight } from "lucide-react";
import { NODE_TYPES } from "@/components/nodes/WorkflowNodes";
import { executeWorkflow, type WorkflowNode, type WorkflowEdge, type ExecutionStep } from "@/lib/workflow-engine";
import { PRESETS, type WorkflowPreset } from "@/lib/presets";
import { cn } from "@/lib/utils";

function presetToFlow(p: WorkflowPreset, steps: Map<string, ExecutionStep>) {
  const nodes: Node[] = p.nodes.map((n) => {
    const s = steps.get(n.id);
    return {
      id: n.id, type: n.type, position: n.position,
      data: { label: n.label, config: n.config, status: s?.status ?? "idle", tokensIn: s?.tokensIn, tokensOut: s?.tokensOut, latencyMs: s?.latencyMs, costUsd: s?.costUsd },
    };
  });
  const edges: Edge[] = p.edges.map((e) => ({
    id: e.id, source: e.source, target: e.target, label: e.label,
    style: { stroke: "#475569", strokeWidth: 2 },
    labelStyle: { fill: "#64748b", fontSize: 10 },
    labelBgStyle: { fill: "#0f172a" },
  }));
  return { nodes, edges };
}

const MODEL_LABELS: Record<string, string> = {
  "in-llm": "In-LLM",
  "out-of-llm": "Out-of-LLM",
  hybrid: "Hybrid",
};
const MODEL_COLORS: Record<string, string> = {
  "in-llm": "text-violet-400 bg-violet-400/10 border-violet-400/20",
  "out-of-llm": "text-sky-400 bg-sky-400/10 border-sky-400/20",
  hybrid: "text-teal-400 bg-teal-400/10 border-teal-400/20",
};

export default function SimulatorClient() {
  const [selected, setSelected] = useState<WorkflowPreset>(PRESETS[0]);
  const [steps, setSteps] = useState<Map<string, ExecutionStep>>(new Map());
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [totalMs, setTotalMs] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);

  const { nodes: initNodes, edges: initEdges } = presetToFlow(selected, new Map());
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initNodes);
  const [edges, , onEdgesChange] = useEdgesState<Edge>(initEdges);

  const selectPreset = (p: WorkflowPreset) => {
    setSelected(p);
    setSteps(new Map());
    setLogs([]);
    setDone(false);
    setTotalTokens(0); setTotalCost(0); setTotalMs(0);
    const { nodes: n, edges: e } = presetToFlow(p, new Map());
    setNodes(n);
    // re-init edges by key trick — just reset
    window.location.hash = "";
  };

  const run = async () => {
    if (running) return;
    setRunning(true);
    setDone(false);
    setSteps(new Map());
    setLogs([]);
    setTotalTokens(0); setTotalCost(0); setTotalMs(0);
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, status: "idle", tokensIn: undefined, tokensOut: undefined, latencyMs: undefined, costUsd: undefined } })));

    const stepsMap = new Map<string, ExecutionStep>();

    const onStepUpdate = (step: ExecutionStep) => {
      stepsMap.set(step.nodeId, { ...step });
      setSteps(new Map(stepsMap));
      setNodes((nds) => nds.map((n) => n.id !== step.nodeId ? n : {
        ...n, data: { ...n.data, status: step.status, tokensIn: step.tokensIn, tokensOut: step.tokensOut, latencyMs: step.latencyMs, costUsd: step.costUsd }
      }));
    };

    const onLog = (log: string) => {
      setLogs((prev) => {
        const next = [...prev, log];
        setTimeout(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, 10);
        return next;
      });
    };

    const wfNodes: WorkflowNode[] = selected.nodes.map((n) => ({ ...n, type: n.type }));
    const wfEdges: WorkflowEdge[] = selected.edges;

    try {
      const result = await executeWorkflow(wfNodes, wfEdges, selected.sampleInput, selected.orchestrationModel, onStepUpdate, onLog);
      setTotalTokens(result.totalTokens);
      setTotalCost(result.totalCost);
      setTotalMs(result.totalLatencyMs);
      setDone(true);
    } finally {
      setRunning(false);
    }
  };

  const completedSteps = [...steps.values()].filter((s) => s.status === "complete");
  const llmSteps = completedSteps.filter((s) => s.nodeType === "llm");

  return (
    <div className="h-screen flex flex-col bg-[#0a0f1a]">
      {/* Nav */}
      <div className="border-b border-slate-800 bg-[#0a0f1a] px-4 h-12 flex items-center gap-3 shrink-0">
        <Link href="/" className="text-slate-500 hover:text-slate-300 transition-colors text-sm">← Home</Link>
        <span className="text-slate-700">/</span>
        <span className="text-slate-300 text-sm font-medium">Agent Simulator</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Scenario Sidebar */}
        <div className="w-56 border-r border-slate-800 flex flex-col overflow-y-auto shrink-0">
          <div className="p-3 border-b border-slate-800">
            <div className="text-xs text-slate-500 uppercase tracking-widest">Scenarios</div>
          </div>
          <div className="p-2 space-y-1 flex-1">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => selectPreset(p)}
                className={cn(
                  "w-full text-left p-3 rounded-xl transition-colors border",
                  selected.id === p.id
                    ? "bg-slate-800 border-slate-600 text-slate-100"
                    : "border-transparent hover:bg-slate-900 text-slate-400 hover:text-slate-200"
                )}
              >
                <div className="text-xs font-medium mb-0.5">{p.name}</div>
                <div className="text-[10px] text-slate-500 leading-relaxed">{p.description}</div>
                <div className={cn("mt-2 text-[10px] px-1.5 py-0.5 rounded-full border inline-block", MODEL_COLORS[p.orchestrationModel])}>
                  {MODEL_LABELS[p.orchestrationModel]}
                </div>
              </button>
            ))}
          </div>
          <div className="p-3 border-t border-slate-800">
            <button
              onClick={run}
              disabled={running}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors",
                running ? "bg-violet-800/50 text-violet-400" : "bg-violet-600 hover:bg-violet-500 text-white"
              )}
            >
              <Play className="w-4 h-4" />
              {running ? "Running..." : "Run Scenario"}
            </button>
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Scenario header */}
          <div className="border-b border-slate-800 px-5 py-3 flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-100">{selected.name}</h2>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full border", MODEL_COLORS[selected.orchestrationModel])}>
                  {MODEL_LABELS[selected.orchestrationModel]}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{selected.description}</p>
            </div>
            {done && (
              <div className="flex items-center gap-4 text-xs">
                <div className="text-center">
                  <div className="text-slate-100 font-mono font-bold">{totalTokens.toLocaleString()}</div>
                  <div className="text-slate-500">tokens</div>
                </div>
                <div className="text-center">
                  <div className="text-emerald-400 font-mono font-bold">${totalCost.toFixed(4)}</div>
                  <div className="text-slate-500">cost</div>
                </div>
                <div className="text-center">
                  <div className="text-slate-100 font-mono font-bold">{totalMs}ms</div>
                  <div className="text-slate-500">latency</div>
                </div>
                <div className="text-center">
                  <div className="text-slate-100 font-mono font-bold">{llmSteps.length}</div>
                  <div className="text-slate-500">LLM calls</div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Flow diagram */}
            <div className="flex-1">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={NODE_TYPES}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                nodesConnectable={false}
                elementsSelectable={true}
              >
                <Background variant={BackgroundVariant.Dots} color="#1e293b" gap={20} size={1} />
                <Controls />
              </ReactFlow>
            </div>

            {/* Right panel: trace + steps */}
            <div className="w-72 border-l border-slate-800 flex flex-col overflow-hidden shrink-0">
              {/* Execution trace */}
              <div className="p-3 border-b border-slate-800">
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Input</div>
                <div className="bg-slate-900 rounded-lg p-2 text-xs text-slate-300 font-mono leading-relaxed">
                  {selected.sampleInput}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Step Trace</div>
                {completedSteps.length === 0 && !running && (
                  <p className="text-xs text-slate-700 italic">Press Run to start the scenario</p>
                )}
                {completedSteps.map((step) => (
                  <div key={step.nodeId} className="bg-slate-900 rounded-xl p-3 border border-slate-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-slate-200">{step.nodeLabel}</span>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded",
                        step.nodeType === "llm" ? "bg-violet-900/50 text-violet-300" :
                        step.nodeType === "tool" ? "bg-amber-900/50 text-amber-300" :
                        "bg-slate-800 text-slate-400"
                      )}>
                        {step.nodeType}
                      </span>
                    </div>
                    <div className="flex gap-2 text-[10px] text-slate-500">
                      {step.latencyMs && <span>{step.latencyMs}ms</span>}
                      {(step.tokensIn || step.tokensOut) && (
                        <span>{(step.tokensIn ?? 0) + (step.tokensOut ?? 0)} tok</span>
                      )}
                      {step.costUsd && <span className="text-emerald-500">${step.costUsd.toFixed(4)}</span>}
                    </div>
                    {step.output != null && (
                      <div className="mt-2 text-[10px] text-slate-500 bg-slate-950 rounded p-1.5 font-mono overflow-hidden max-h-16">
                        {typeof step.output === "string"
                          ? step.output.substring(0, 120) + (step.output.length > 120 ? "..." : "")
                          : JSON.stringify(step.output).substring(0, 120) + "..."}
                      </div>
                    )}
                  </div>
                ))}
                {running && (
                  <div className="bg-slate-900 rounded-xl p-3 border border-slate-700 border-dashed">
                    <div className="flex items-center gap-2 text-xs text-blue-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      Executing...
                    </div>
                  </div>
                )}
              </div>

              {/* Log */}
              <div ref={logRef} className="h-36 border-t border-slate-800 overflow-y-auto p-3 font-mono">
                <div className="text-xs text-slate-600 uppercase tracking-widest mb-1">Log</div>
                {logs.map((l, i) => (
                  <div key={i} className="text-[10px] text-slate-500 py-0.5 flex items-start gap-1">
                    <ChevronRight className="w-2.5 h-2.5 mt-0.5 shrink-0 text-slate-700" />
                    <span>{l.replace(/^\[.*?\] /, "")}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
