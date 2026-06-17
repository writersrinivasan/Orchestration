export type NodeType = "input" | "llm" | "tool" | "router" | "human" | "memory" | "output";

export interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface ExecutionStep {
  nodeId: string;
  nodeLabel: string;
  nodeType: NodeType;
  status: "pending" | "running" | "complete" | "error";
  input?: unknown;
  output?: unknown;
  tokensIn?: number;
  tokensOut?: number;
  costUsd?: number;
  latencyMs?: number;
  error?: string;
  toolCalls?: { name: string; input: unknown; output: unknown }[];
  startedAt?: number;
  completedAt?: number;
}

export interface WorkflowRun {
  id: string;
  steps: ExecutionStep[];
  status: "idle" | "running" | "complete" | "error";
  totalTokens: number;
  totalCost: number;
  totalLatencyMs: number;
  orchestrationModel: "in-llm" | "out-of-llm" | "hybrid";
  logs: string[];
}

// Mock responses for demo scenarios
const MOCK_LLM_RESPONSES: Record<string, { output: string; tokensIn: number; tokensOut: number; latencyMs: number }> = {
  classify: {
    output: '{"intent": "research", "complexity": "medium", "category": "information_retrieval"}',
    tokensIn: 180,
    tokensOut: 35,
    latencyMs: 320,
  },
  summarize: {
    output:
      "Quantum computing has seen major breakthroughs in 2025, with IBM achieving 1000+ qubit processors and Google demonstrating error correction at scale. The field is moving from NISQ devices toward fault-tolerant systems, with commercial applications emerging in drug discovery and financial optimization.",
    tokensIn: 850,
    tokensOut: 65,
    latencyMs: 980,
  },
  review: {
    output:
      '{"findings": [{"severity": "medium", "type": "security", "line": 42, "message": "Unvalidated user input passed to SQL query"}, {"severity": "low", "type": "style", "line": 18, "message": "Variable name is not descriptive"}], "approved": false, "summary": "2 issues found, 1 requires attention before merge"}',
    tokensIn: 620,
    tokensOut: 95,
    latencyMs: 740,
  },
  support: {
    output:
      '{"intent": "billing_inquiry", "urgency": "medium", "sentiment": "frustrated", "suggested_action": "escalate_to_billing_team"}',
    tokensIn: 210,
    tokensOut: 42,
    latencyMs: 410,
  },
  plan: {
    output:
      '{"steps": ["search_recent_news", "extract_key_facts", "identify_main_themes", "write_summary"], "estimated_tokens": 1200, "complexity": "medium"}',
    tokensIn: 145,
    tokensOut: 55,
    latencyMs: 280,
  },
  synthesize: {
    output:
      "Based on research from multiple sources: The topic shows significant recent developments with broad industry impact. Key trends indicate accelerating adoption and emerging best practices. Three primary factors are driving change: improved tooling, reduced costs, and demonstrated ROI in production deployments.",
    tokensIn: 1100,
    tokensOut: 78,
    latencyMs: 1240,
  },
  default: {
    output: "Task completed successfully. The analysis indicates strong results across all evaluated dimensions.",
    tokensIn: 320,
    tokensOut: 48,
    latencyMs: 560,
  },
};

const MOCK_TOOL_RESPONSES: Record<string, unknown> = {
  web_search: {
    results: [
      { title: "IBM Quantum Eagle Processor Hits 1,000 Qubits", url: "https://example.com/1", snippet: "IBM announced..." },
      { title: "Google Achieves Quantum Error Correction Milestone", url: "https://example.com/2", snippet: "Google researchers..." },
      { title: "Quantum Computing Market to Hit $450B by 2030", url: "https://example.com/3", snippet: "Market analysis shows..." },
    ],
  },
  calculator: { result: 42.0, expression: "6 * 7" },
  sql_query: { rows: [{ id: 1, name: "Example Record", value: 99.5 }], rowCount: 1 },
  vector_store_query: {
    matches: [
      { content: "Relevant document excerpt about the topic...", score: 0.94 },
      { content: "Another relevant passage from the knowledge base...", score: 0.87 },
    ],
  },
  code_executor: { output: "Hello, World!\n42", exitCode: 0, runtime: "python3.11" },
};

function getMockLLMResponse(nodeLabel: string) {
  const label = nodeLabel.toLowerCase();
  if (label.includes("classif") || label.includes("intent") || label.includes("route")) return MOCK_LLM_RESPONSES.classify;
  if (label.includes("summar")) return MOCK_LLM_RESPONSES.summarize;
  if (label.includes("synth")) return MOCK_LLM_RESPONSES.synthesize;
  if (label.includes("review") || label.includes("audit")) return MOCK_LLM_RESPONSES.review;
  if (label.includes("support") || label.includes("triage")) return MOCK_LLM_RESPONSES.support;
  if (label.includes("plan")) return MOCK_LLM_RESPONSES.plan;
  return MOCK_LLM_RESPONSES.default;
}

function getMockToolResponse(toolName: string) {
  return MOCK_TOOL_RESPONSES[toolName] ?? { result: "Tool executed successfully", status: "ok" };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function executeWorkflow(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  input: string,
  orchestrationModel: "in-llm" | "out-of-llm" | "hybrid",
  onStepUpdate: (step: ExecutionStep) => void,
  onLog: (log: string) => void
): Promise<WorkflowRun> {
  const run: WorkflowRun = {
    id: `run_${Date.now()}`,
    steps: [],
    status: "running",
    totalTokens: 0,
    totalCost: 0,
    totalLatencyMs: 0,
    orchestrationModel,
    logs: [],
  };

  // Build adjacency list
  const adjacency: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};
  nodes.forEach((n) => { adjacency[n.id] = []; inDegree[n.id] = 0; });
  edges.forEach((e) => {
    adjacency[e.source].push(e.target);
    inDegree[e.target] = (inDegree[e.target] ?? 0) + 1;
  });

  // Topological order (BFS / Kahn's algorithm)
  const queue: string[] = nodes.filter((n) => inDegree[n.id] === 0).map((n) => n.id);
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const outputs: Record<string, unknown> = { __input: input };

  const log = (msg: string) => {
    onLog(`[${new Date().toLocaleTimeString()}] ${msg}`);
  };

  log(`Starting ${orchestrationModel} workflow with ${nodes.length} nodes`);

  try {
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const node = nodeMap[currentId];
      if (!node) continue;

      const step: ExecutionStep = {
        nodeId: node.id,
        nodeLabel: node.label,
        nodeType: node.type,
        status: "running",
        startedAt: Date.now(),
      };

      onStepUpdate({ ...step });
      log(`Executing: ${node.label} (${node.type})`);

      if (node.type === "input") {
        await sleep(100);
        step.output = input;
        step.latencyMs = 100;
        log(`Input received: "${input.substring(0, 50)}${input.length > 50 ? "..." : ""}"`);
      } else if (node.type === "llm") {
        const mock = getMockLLMResponse(node.label);
        const speedMultiplier = orchestrationModel === "out-of-llm" ? 0.6 : 1.0;
        await sleep(mock.latencyMs * speedMultiplier);
        step.tokensIn = mock.tokensIn;
        step.tokensOut = mock.tokensOut;
        step.costUsd = (mock.tokensIn * 0.000003) + (mock.tokensOut * 0.000015);
        step.latencyMs = Math.round(mock.latencyMs * speedMultiplier);
        step.output = mock.output;
        const inboundSources = edges.filter((e) => e.target === node.id).map((e) => e.source);
        const resolvedSource = inboundSources.find((s) => outputs[s] !== undefined) ?? inboundSources[0] ?? "__input";
        step.input = outputs[resolvedSource] ?? input;
        run.totalTokens += (mock.tokensIn + mock.tokensOut);
        run.totalCost += step.costUsd;
        log(`LLM call complete: ${mock.tokensIn + mock.tokensOut} tokens, $${step.costUsd.toFixed(4)}`);
      } else if (node.type === "tool") {
        const toolName = (node.config?.tool as string) ?? "web_search";
        const toolLatency = 400 + Math.round(Math.random() * 300);
        await sleep(toolLatency);
        step.latencyMs = toolLatency;
        step.output = getMockToolResponse(toolName);
        step.toolCalls = [{ name: toolName, input: { query: input }, output: step.output }];
        log(`Tool "${toolName}" executed successfully`);
      } else if (node.type === "router") {
        await sleep(50);
        const routerSources = edges.filter((e) => e.target === node.id).map((e) => e.source);
        const routerSource = routerSources.find((s) => outputs[s] !== undefined) ?? routerSources[0] ?? "__input";
        const prevOutput = outputs[routerSource];
        const prevStr = JSON.stringify(prevOutput ?? "");
        const route = prevStr.includes("urgent") || prevStr.includes("critical") ? "branch_a" : "branch_b";
        step.output = { route, decision: route === "branch_a" ? "Escalate" : "Standard flow" };
        step.latencyMs = 50;
        log(`Router decision: ${route}`);
      } else if (node.type === "human") {
        await sleep(500);
        step.output = { approved: true, reviewer: "Demo User", comment: "Looks good to proceed" };
        step.latencyMs = 500;
        log(`Human-in-loop gate: approved`);
      } else if (node.type === "memory") {
        await sleep(80);
        step.output = { retrieved: "Relevant context from memory store", vectorMatches: 3, latencyMs: 80 };
        step.latencyMs = 80;
        log(`Memory retrieved: 3 relevant matches`);
      } else if (node.type === "output") {
        await sleep(50);
        const outputSources = edges.filter((e) => e.target === node.id).map((e) => e.source);
        const outputSource = outputSources.find((s) => outputs[s] !== undefined) ?? outputSources[0] ?? "__input";
        step.output = outputs[outputSource] ?? "Workflow complete";
        step.latencyMs = 50;
        log(`Output produced`);
      }

      step.status = "complete";
      step.completedAt = Date.now();
      run.steps.push({ ...step });
      run.totalLatencyMs += step.latencyMs ?? 0;
      outputs[node.id] = step.output;
      onStepUpdate({ ...step });

      adjacency[node.id].forEach((nextId) => {
        inDegree[nextId]--;
        if (inDegree[nextId] === 0) queue.push(nextId);
      });
    }

    run.status = "complete";
    log(`Workflow complete. Total: ${run.totalTokens} tokens, $${run.totalCost.toFixed(4)}, ${run.totalLatencyMs}ms`);
  } catch (err) {
    run.status = "error";
    const msg = err instanceof Error ? err.message : String(err);
    log(`Workflow error: ${msg}`);
  }

  return run;
}
