import type { WorkflowNode, WorkflowEdge } from "./workflow-engine";

export interface WorkflowPreset {
  id: string;
  name: string;
  description: string;
  orchestrationModel: "in-llm" | "out-of-llm" | "hybrid";
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  sampleInput: string;
}

export const PRESETS: WorkflowPreset[] = [
  {
    id: "research-in-llm",
    name: "Research Assistant (In-LLM)",
    description: "Single agent loop handles the entire research task — search, synthesize, respond",
    orchestrationModel: "in-llm",
    sampleInput: "Summarize the latest breakthroughs in quantum computing",
    nodes: [
      { id: "n1", type: "input", label: "User Query", config: {}, position: { x: 50, y: 150 } },
      { id: "n2", type: "llm", label: "Research Agent", config: { model: "claude-sonnet-4-6", tools: ["web_search"] }, position: { x: 250, y: 150 } },
      { id: "n3", type: "tool", label: "Web Search", config: { tool: "web_search" }, position: { x: 450, y: 80 } },
      { id: "n4", type: "output", label: "Final Answer", config: {}, position: { x: 650, y: 150 } },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" },
      { id: "e2", source: "n2", target: "n3", label: "tool call" },
      { id: "e3", source: "n3", target: "n2", label: "result" },
      { id: "e4", source: "n2", target: "n4" },
    ],
  },
  {
    id: "research-out-of-llm",
    name: "Research Pipeline (Out-of-LLM)",
    description: "External orchestrator controls each step — cheaper, faster, more reliable",
    orchestrationModel: "out-of-llm",
    sampleInput: "Summarize the latest breakthroughs in quantum computing",
    nodes: [
      { id: "n1", type: "input", label: "User Query", config: {}, position: { x: 50, y: 200 } },
      { id: "n2", type: "llm", label: "Generate Queries", config: { model: "claude-haiku-4-5", focused: true }, position: { x: 220, y: 200 } },
      { id: "n3", type: "tool", label: "Web Search ×3", config: { tool: "web_search" }, position: { x: 400, y: 120 } },
      { id: "n4", type: "llm", label: "Extract Facts", config: { model: "claude-haiku-4-5" }, position: { x: 400, y: 280 } },
      { id: "n5", type: "llm", label: "Write Summary", config: { model: "claude-haiku-4-5" }, position: { x: 580, y: 200 } },
      { id: "n6", type: "output", label: "Final Summary", config: {}, position: { x: 760, y: 200 } },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" },
      { id: "e2", source: "n2", target: "n3" },
      { id: "e3", source: "n2", target: "n4" },
      { id: "e4", source: "n3", target: "n5" },
      { id: "e5", source: "n4", target: "n5" },
      { id: "e6", source: "n5", target: "n6" },
    ],
  },
  {
    id: "code-review-hybrid",
    name: "Code Review (Hybrid)",
    description: "External orchestrator manages the pipeline; specialist agents handle deep review",
    orchestrationModel: "hybrid",
    sampleInput: "Review the following PR diff for security issues and code quality",
    nodes: [
      { id: "n1", type: "input", label: "PR Diff", config: {}, position: { x: 50, y: 200 } },
      { id: "n2", type: "tool", label: "Static Analysis", config: { tool: "code_executor" }, position: { x: 220, y: 200 } },
      { id: "n3", type: "llm", label: "Security Review Agent", config: { model: "claude-sonnet-4-6" }, position: { x: 420, y: 100 } },
      { id: "n4", type: "llm", label: "Quality Review Agent", config: { model: "claude-sonnet-4-6" }, position: { x: 420, y: 300 } },
      { id: "n5", type: "llm", label: "Synthesize Findings", config: { model: "claude-haiku-4-5" }, position: { x: 620, y: 200 } },
      { id: "n6", type: "router", label: "Critical Issues?", config: { condition: "findings.critical > 0" }, position: { x: 800, y: 200 } },
      { id: "n7", type: "human", label: "Block PR", config: {}, position: { x: 980, y: 100 } },
      { id: "n8", type: "output", label: "Approve + Comment", config: {}, position: { x: 980, y: 300 } },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" },
      { id: "e2", source: "n2", target: "n3" },
      { id: "e3", source: "n2", target: "n4" },
      { id: "e4", source: "n3", target: "n5" },
      { id: "e5", source: "n4", target: "n5" },
      { id: "e6", source: "n5", target: "n6" },
      { id: "e7", source: "n6", target: "n7", label: "critical" },
      { id: "e8", source: "n6", target: "n8", label: "style only" },
    ],
  },
  {
    id: "support-triage",
    name: "Customer Support Triage",
    description: "AI triages support tickets, routes by urgency, and drafts responses",
    orchestrationModel: "hybrid",
    sampleInput: "My order #12345 hasn't arrived and I need it urgently for tomorrow",
    nodes: [
      { id: "n1", type: "input", label: "Customer Message", config: {}, position: { x: 50, y: 200 } },
      { id: "n2", type: "llm", label: "Intent Classifier", config: { model: "claude-haiku-4-5" }, position: { x: 230, y: 200 } },
      { id: "n3", type: "router", label: "Route by Intent", config: { condition: "intent.urgency === 'high'" }, position: { x: 420, y: 200 } },
      { id: "n4", type: "tool", label: "Order Lookup", config: { tool: "sql_query" }, position: { x: 600, y: 100 } },
      { id: "n5", type: "llm", label: "Draft Response", config: { model: "claude-sonnet-4-6" }, position: { x: 600, y: 300 } },
      { id: "n6", type: "tool", label: "FAQ Search", config: { tool: "vector_store_query" }, position: { x: 600, y: 200 } },
      { id: "n7", type: "llm", label: "Sentiment Check", config: { model: "claude-haiku-4-5" }, position: { x: 800, y: 200 } },
      { id: "n8", type: "human", label: "Human Review", config: {}, position: { x: 980, y: 200 } },
      { id: "n9", type: "output", label: "Send Response", config: {}, position: { x: 1160, y: 200 } },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" },
      { id: "e2", source: "n2", target: "n3" },
      { id: "e3", source: "n3", target: "n4", label: "urgent" },
      { id: "e4", source: "n3", target: "n6", label: "standard" },
      { id: "e5", source: "n4", target: "n5" },
      { id: "e6", source: "n6", target: "n5" },
      { id: "e7", source: "n5", target: "n7" },
      { id: "e8", source: "n7", target: "n8" },
      { id: "e9", source: "n8", target: "n9" },
    ],
  },
];
