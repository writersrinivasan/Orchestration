"use client";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Brain, Wrench, GitBranch, User, Database, ArrowRight, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

type NodeStatus = "idle" | "running" | "complete" | "error";

interface NodeData {
  label: string;
  status?: NodeStatus;
  tokensIn?: number;
  tokensOut?: number;
  latencyMs?: number;
  costUsd?: number;
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

function statusRing(status?: NodeStatus) {
  switch (status) {
    case "running": return "ring-2 ring-blue-400 shadow-blue-400/40 shadow-lg animate-pulse";
    case "complete": return "ring-2 ring-emerald-400 shadow-emerald-400/30 shadow-md";
    case "error": return "ring-2 ring-red-400 shadow-red-400/30 shadow-md";
    default: return "ring-1 ring-white/10";
  }
}

function MetricsBadge({ tokensIn, tokensOut, latencyMs, costUsd }: Partial<NodeData>) {
  if (!tokensIn && !latencyMs) return null;
  return (
    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-1 text-[10px] whitespace-nowrap">
      {(tokensIn || tokensOut) && (
        <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
          {(tokensIn ?? 0) + (tokensOut ?? 0)}tok
        </span>
      )}
      {latencyMs && (
        <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">{latencyMs}ms</span>
      )}
      {costUsd && (
        <span className="bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded">${costUsd.toFixed(4)}</span>
      )}
    </div>
  );
}

function RunningDots() {
  return (
    <span className="flex gap-0.5 items-center">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1 h-1 rounded-full bg-blue-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

export function InputNode({ data }: NodeProps) {
  const d = data as NodeData;
  return (
    <div className={cn("relative bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 min-w-[130px] text-center", statusRing(d.status))}>
      <div className="flex items-center gap-2 justify-center">
        <ArrowDown className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-200">{d.label}</span>
        {d.status === "running" && <RunningDots />}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-slate-500 !w-2 !h-2" />
      <MetricsBadge {...d} />
    </div>
  );
}

export function LLMNode({ data }: NodeProps) {
  const d = data as NodeData;
  const model = (d.config?.model as string) ?? "claude-sonnet-4-6";
  const isHaiku = model.includes("haiku");
  return (
    <div className={cn("relative bg-violet-950 border border-violet-700 rounded-xl px-4 py-3 min-w-[160px]", statusRing(d.status))}>
      <Handle type="target" position={Position.Left} className="!bg-violet-500 !w-2 !h-2" />
      <div className="flex items-center gap-2">
        <div className={cn("p-1.5 rounded-lg", isHaiku ? "bg-violet-800" : "bg-violet-700")}>
          <Brain className="w-3.5 h-3.5 text-violet-200" />
        </div>
        <div>
          <div className="text-sm font-medium text-violet-100 flex items-center gap-1.5">
            {d.label}
            {d.status === "running" && <RunningDots />}
            {d.status === "complete" && <span className="text-emerald-400 text-xs">✓</span>}
          </div>
          <div className="text-[10px] text-violet-400 mt-0.5">{isHaiku ? "Haiku · fast" : "Sonnet · powerful"}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-violet-500 !w-2 !h-2" />
      <MetricsBadge {...d} />
    </div>
  );
}

export function ToolNode({ data }: NodeProps) {
  const d = data as NodeData;
  const tool = (d.config?.tool as string) ?? "web_search";
  const toolLabels: Record<string, string> = {
    web_search: "Web Search",
    calculator: "Calculator",
    sql_query: "SQL Query",
    vector_store_query: "Vector Search",
    code_executor: "Code Runner",
  };
  return (
    <div className={cn("relative bg-amber-950 border border-amber-700 rounded-xl px-4 py-3 min-w-[150px]", statusRing(d.status))}>
      <Handle type="target" position={Position.Left} className="!bg-amber-500 !w-2 !h-2" />
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-amber-800">
          <Wrench className="w-3.5 h-3.5 text-amber-200" />
        </div>
        <div>
          <div className="text-sm font-medium text-amber-100 flex items-center gap-1.5">
            {d.label}
            {d.status === "running" && <RunningDots />}
            {d.status === "complete" && <span className="text-emerald-400 text-xs">✓</span>}
          </div>
          <div className="text-[10px] text-amber-400 mt-0.5">{toolLabels[tool] ?? tool}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-amber-500 !w-2 !h-2" />
      <MetricsBadge {...d} />
    </div>
  );
}

export function RouterNode({ data }: NodeProps) {
  const d = data as NodeData;
  return (
    <div className={cn("relative bg-sky-950 border border-sky-700 rounded-xl px-4 py-3 min-w-[150px]", statusRing(d.status))}>
      <Handle type="target" position={Position.Left} className="!bg-sky-500 !w-2 !h-2" />
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-sky-800">
          <GitBranch className="w-3.5 h-3.5 text-sky-200" />
        </div>
        <div>
          <div className="text-sm font-medium text-sky-100 flex items-center gap-1.5">
            {d.label}
            {d.status === "running" && <RunningDots />}
            {d.status === "complete" && <span className="text-emerald-400 text-xs">✓</span>}
          </div>
          <div className="text-[10px] text-sky-400 mt-0.5">conditional branch</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="a" className="!bg-sky-500 !w-2 !h-2 !top-1/3" />
      <Handle type="source" position={Position.Right} id="b" className="!bg-sky-500 !w-2 !h-2 !top-2/3" />
      <MetricsBadge {...d} />
    </div>
  );
}

export function HumanNode({ data }: NodeProps) {
  const d = data as NodeData;
  return (
    <div className={cn("relative bg-rose-950 border border-rose-700 rounded-xl px-4 py-3 min-w-[140px]", statusRing(d.status))}>
      <Handle type="target" position={Position.Left} className="!bg-rose-500 !w-2 !h-2" />
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-rose-800">
          <User className="w-3.5 h-3.5 text-rose-200" />
        </div>
        <div>
          <div className="text-sm font-medium text-rose-100 flex items-center gap-1.5">
            {d.label}
            {d.status === "running" && <RunningDots />}
            {d.status === "complete" && <span className="text-emerald-400 text-xs">✓</span>}
          </div>
          <div className="text-[10px] text-rose-400 mt-0.5">human in the loop</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-rose-500 !w-2 !h-2" />
      <MetricsBadge {...d} />
    </div>
  );
}

export function MemoryNode({ data }: NodeProps) {
  const d = data as NodeData;
  return (
    <div className={cn("relative bg-teal-950 border border-teal-700 rounded-xl px-4 py-3 min-w-[140px]", statusRing(d.status))}>
      <Handle type="target" position={Position.Left} className="!bg-teal-500 !w-2 !h-2" />
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-teal-800">
          <Database className="w-3.5 h-3.5 text-teal-200" />
        </div>
        <div>
          <div className="text-sm font-medium text-teal-100 flex items-center gap-1.5">
            {d.label}
            {d.status === "running" && <RunningDots />}
            {d.status === "complete" && <span className="text-emerald-400 text-xs">✓</span>}
          </div>
          <div className="text-[10px] text-teal-400 mt-0.5">vector memory</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-teal-500 !w-2 !h-2" />
      <MetricsBadge {...d} />
    </div>
  );
}

export function OutputNode({ data }: NodeProps) {
  const d = data as NodeData;
  return (
    <div className={cn("relative bg-slate-900 border border-emerald-700 rounded-xl px-4 py-3 min-w-[130px] text-center", statusRing(d.status))}>
      <Handle type="target" position={Position.Left} className="!bg-emerald-500 !w-2 !h-2" />
      <div className="flex items-center gap-2 justify-center">
        <span className="text-sm font-medium text-emerald-200">{d.label}</span>
        {d.status === "running" && <RunningDots />}
        {d.status === "complete" && <span className="text-emerald-400 text-xs">✓</span>}
        <ArrowRight className="w-4 h-4 text-emerald-400" />
      </div>
      <MetricsBadge {...d} />
    </div>
  );
}

export const NODE_TYPES = {
  input: InputNode,
  llm: LLMNode,
  tool: ToolNode,
  router: RouterNode,
  human: HumanNode,
  memory: MemoryNode,
  output: OutputNode,
};
