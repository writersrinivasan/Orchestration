"use client";

import { useState, useCallback, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Link from "next/link";
import { Play, RotateCcw, Plus, Brain, Wrench, GitBranch, User, Database, ArrowRight, ArrowDown } from "lucide-react";
import { NODE_TYPES } from "@/components/nodes/WorkflowNodes";
import { executeWorkflow, type WorkflowNode, type WorkflowEdge, type ExecutionStep } from "@/lib/workflow-engine";
import { PRESETS } from "@/lib/presets";
import { cn } from "@/lib/utils";

const NODE_PALETTE = [
  { type: "input", label: "Input", icon: ArrowDown, color: "text-slate-400", desc: "Workflow entry point" },
  { type: "llm", label: "LLM Node", icon: Brain, color: "text-violet-400", desc: "Call an LLM model" },
  { type: "tool", label: "Tool Node", icon: Wrench, color: "text-amber-400", desc: "Execute an external tool" },
  { type: "router", label: "Router", icon: GitBranch, color: "text-sky-400", desc: "Conditional branching" },
  { type: "human", label: "Human Gate", icon: User, color: "text-rose-400", desc: "Human-in-the-loop" },
  { type: "memory", label: "Memory", icon: Database, color: "text-teal-400", desc: "Read/write memory" },
  { type: "output", label: "Output", icon: ArrowRight, color: "text-emerald-400", desc: "Workflow exit" },
];

function toFlowNodes(wfNodes: WorkflowNode[], steps: Map<string, ExecutionStep>): Node[] {
  return wfNodes.map((n) => {
    const step = steps.get(n.id);
    return {
      id: n.id,
      type: n.type,
      position: n.position,
      data: {
        label: n.label,
        config: n.config,
        status: step?.status ?? "idle",
        tokensIn: step?.tokensIn,
        tokensOut: step?.tokensOut,
        latencyMs: step?.latencyMs,
        costUsd: step?.costUsd,
      },
    };
  });
}

function toFlowEdges(wfEdges: WorkflowEdge[]): Edge[] {
  return wfEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    style: { stroke: "#475569", strokeWidth: 2 },
    labelStyle: { fill: "#64748b", fontSize: 10 },
    labelBgStyle: { fill: "#0f172a" },
  }));
}

let nodeCounter = 100;

export default function PlaygroundClient() {
  const [preset, setPreset] = useState(PRESETS[0]);
  const [steps, setSteps] = useState<Map<string, ExecutionStep>>(new Map());
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [totalMs, setTotalMs] = useState(0);
  const [input, setInput] = useState(preset.sampleInput);
  const logRef = useRef<HTMLDivElement>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(toFlowNodes(preset.nodes, new Map()));
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(toFlowEdges(preset.edges));

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, style: { stroke: "#475569", strokeWidth: 2 } }, eds)),
    [setEdges]
  );

  const loadPreset = (p: typeof PRESETS[0]) => {
    setPreset(p);
    setInput(p.sampleInput);
    setSteps(new Map());
    setLogs([]);
    setTotalTokens(0);
    setTotalCost(0);
    setTotalMs(0);
    setNodes(toFlowNodes(p.nodes, new Map()));
    setEdges(toFlowEdges(p.edges));
  };

  const addNode = (type: string) => {
    const id = `n${nodeCounter++}`;
    const labelMap: Record<string, string> = {
      input: "Input", llm: "LLM Node", tool: "Tool", router: "Router",
      human: "Human Gate", memory: "Memory", output: "Output"
    };
    const newNode: Node = {
      id,
      type,
      position: { x: 200 + Math.random() * 200, y: 200 + Math.random() * 100 },
      data: { label: labelMap[type] ?? type, config: {}, status: "idle" },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const runWorkflow = async () => {
    if (running) return;
    setRunning(true);
    setSteps(new Map());
    setLogs([]);
    setTotalTokens(0);
    setTotalCost(0);
    setTotalMs(0);

    // Reset node statuses
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, status: "idle", tokensIn: undefined, tokensOut: undefined, latencyMs: undefined, costUsd: undefined } })));

    const stepsMap = new Map<string, ExecutionStep>();

    const onStepUpdate = (step: ExecutionStep) => {
      stepsMap.set(step.nodeId, { ...step });
      setSteps(new Map(stepsMap));
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== step.nodeId) return n;
          return {
            ...n,
            data: {
              ...n.data,
              status: step.status,
              tokensIn: step.tokensIn,
              tokensOut: step.tokensOut,
              latencyMs: step.latencyMs,
              costUsd: step.costUsd,
            },
          };
        })
      );
    };

    const onLog = (log: string) => {
      setLogs((prev) => {
        const next = [...prev, log];
        setTimeout(() => {
          if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
        }, 10);
        return next;
      });
    };

    const wfNodes: WorkflowNode[] = nodes.map((n) => ({
      id: n.id,
      type: (n.type as WorkflowNode["type"]) ?? "input",
      label: (n.data.label as string) ?? "Node",
      config: (n.data.config as Record<string, unknown>) ?? {},
      position: n.position,
    }));

    const wfEdges: WorkflowEdge[] = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label as string | undefined,
    }));

    try {
      const result = await executeWorkflow(
        wfNodes, wfEdges, input, preset.orchestrationModel, onStepUpdate, onLog
      );
      setTotalTokens(result.totalTokens);
      setTotalCost(result.totalCost);
      setTotalMs(result.totalLatencyMs);
    } finally {
      setRunning(false);
    }
  };

  const reset = () => {
    setSteps(new Map());
    setLogs([]);
    setTotalTokens(0);
    setTotalCost(0);
    setTotalMs(0);
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, status: "idle", tokensIn: undefined, tokensOut: undefined, latencyMs: undefined, costUsd: undefined } })));
  };

  return (
    <div className="h-screen flex flex-col bg-[#0a0f1a]">
      {/* Top bar */}
      <div className="border-b border-slate-800 bg-[#0a0f1a] px-4 h-12 flex items-center gap-3 shrink-0">
        <Link href="/" className="text-slate-500 hover:text-slate-300 transition-colors text-sm">← Home</Link>
        <span className="text-slate-700">/</span>
        <span className="text-slate-300 text-sm font-medium">Playground</span>
        <div className="flex items-center gap-1 ml-4 flex-1 overflow-x-auto">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => loadPreset(p)}
              className={cn(
                "px-3 py-1 text-xs rounded-md whitespace-nowrap transition-colors border",
                preset.id === p.id
                  ? "bg-violet-600/20 text-violet-300 border-violet-600/40"
                  : "text-slate-500 border-slate-800 hover:text-slate-300 hover:border-slate-600"
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <button onClick={reset} className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors" title="Reset">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={runWorkflow}
            disabled={running}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
              running
                ? "bg-violet-800/50 text-violet-400 cursor-not-allowed"
                : "bg-violet-600 hover:bg-violet-500 text-white"
            )}
          >
            <Play className="w-3.5 h-3.5" />
            {running ? "Running..." : "Run"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 border-r border-slate-800 flex flex-col overflow-y-auto shrink-0">
          <div className="p-3 border-b border-slate-800">
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Add Nodes</div>
            <div className="space-y-1">
              {NODE_PALETTE.map(({ type, label, icon: Icon, color, desc }) => (
                <button
                  key={type}
                  onClick={() => addNode(type)}
                  title={desc}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors text-left"
                >
                  <Icon className={cn("w-3.5 h-3.5 shrink-0", color)} />
                  <span>{label}</span>
                  <Plus className="w-3 h-3 ml-auto text-slate-600" />
                </button>
              ))}
            </div>
          </div>

          <div className="p-3">
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Input</div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-xs text-slate-300 resize-none focus:outline-none focus:border-violet-600 h-24"
              placeholder="Enter workflow input..."
            />
          </div>

          <div className="p-3 border-t border-slate-800 mt-auto">
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Metrics</div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Tokens</span>
                <span className={cn("font-mono", totalTokens > 0 ? "text-slate-200" : "text-slate-700")}>
                  {totalTokens > 0 ? totalTokens.toLocaleString() : "—"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Cost</span>
                <span className={cn("font-mono", totalCost > 0 ? "text-emerald-400" : "text-slate-700")}>
                  {totalCost > 0 ? `$${totalCost.toFixed(4)}` : "—"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Latency</span>
                <span className={cn("font-mono", totalMs > 0 ? "text-slate-200" : "text-slate-700")}>
                  {totalMs > 0 ? `${totalMs}ms` : "—"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Model</span>
                <span className="font-mono text-violet-400 capitalize text-[10px]">
                  {preset.orchestrationModel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={NODE_TYPES}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              deleteKeyCode="Backspace"
            >
              <Background variant={BackgroundVariant.Dots} color="#1e293b" gap={20} size={1} />
              <Controls className="!bottom-4 !left-4" />
              <MiniMap
                nodeColor={(n) => {
                  const t = n.type;
                  if (t === "llm") return "#7c3aed";
                  if (t === "tool") return "#d97706";
                  if (t === "router") return "#0ea5e9";
                  if (t === "human") return "#e11d48";
                  if (t === "memory") return "#0d9488";
                  if (t === "output") return "#10b981";
                  return "#475569";
                }}
                maskColor="rgba(10,15,26,0.7)"
                className="!bottom-4 !right-4"
              />
            </ReactFlow>
          </div>

          {/* Execution Log */}
          <div className="h-40 border-t border-slate-800 bg-slate-950/50 flex flex-col">
            <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 uppercase tracking-widest">Execution Log</span>
              {running && <span className="text-xs text-blue-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> Running
              </span>}
              {!running && logs.length > 0 && <span className="text-xs text-emerald-400">Complete</span>}
            </div>
            <div ref={logRef} className="flex-1 overflow-y-auto px-4 py-2 font-mono">
              {logs.length === 0 ? (
                <p className="text-xs text-slate-700 italic">Press Run to execute the workflow...</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="text-xs text-slate-400 py-0.5">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
