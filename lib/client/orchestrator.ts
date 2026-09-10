import { tier1SystemPromptFor, tier2SystemPromptFor } from "@/lib/prompts";
import { estimateCostUsd, BASELINE_MODEL_PRICING, type ProviderId } from "@/lib/tier2/registry";
import { tryEvaluateArithmetic } from "@/lib/tier0/evaluator";
import { callOllama, shouldEscalate } from "@/lib/tier1/ollama";
import { estimateTokens } from "@/lib/tokens";
import { decomposeQuery } from "@/lib/decompose";
import type { QueryRecord, Subtask, SubtaskResult, Tier } from "@/lib/types";

export const MAX_QUERY_LENGTH = 2000;

export interface RunCredentials {
  ollamaHost: string | null;
  ollamaModel: string;
  provider: ProviderId;
  apiKey: string;
}

interface Tier2ProxyResult {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

const TIER2_PROXY_TIMEOUT_MS = 25_000;

async function callTier2Proxy(
  prompt: string,
  systemPrompt: string,
  provider: ProviderId,
  apiKey: string,
): Promise<Tier2ProxyResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIER2_PROXY_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch("/api/tier2", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ prompt, systemPrompt, provider }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Tier 2 request timed out after ${TIER2_PROXY_TIMEOUT_MS}ms`);
    }
    throw new Error(`Tier 2 request failed: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    clearTimeout(timeout);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error ?? `Tier 2 request failed with status ${res.status}`);
  }
  return data as Tier2ProxyResult;
}

async function runSubtask(
  subtask: Subtask,
  parentQueryId: string,
  creds: RunCredentials,
): Promise<SubtaskResult> {
  const timestamp = new Date().toISOString();
  const base = {
    id: subtask.id,
    parentQueryId,
    text: subtask.text,
    category: subtask.category,
    timestamp,
  };

  const t0Start = Date.now();
  const arithmetic = tryEvaluateArithmetic(subtask.text);
  if (arithmetic.ok) {
    return {
      ...base,
      tier: 0 as Tier,
      model: null,
      answer: String(arithmetic.value),
      tokensIn: 0,
      tokensOut: 0,
      costUsd: 0,
      latencyMs: Date.now() - t0Start,
    };
  }

  if (creds.ollamaHost) {
    try {
      const tier1Prompt = tier1SystemPromptFor(subtask.category);
      const tier1Result = await callOllama(subtask.text, tier1Prompt, creds.ollamaHost, creds.ollamaModel);
      if (!shouldEscalate(subtask.category, tier1Result)) {
        return {
          ...base,
          tier: 1 as Tier,
          model: creds.ollamaModel,
          answer: tier1Result.text,
          tokensIn: tier1Result.inputTokens,
          tokensOut: tier1Result.outputTokens,
          costUsd: 0,
          latencyMs: tier1Result.latencyMs,
        };
      }
    } catch {}
  }

  if (!creds.apiKey) {
    return {
      ...base,
      tier: 2 as Tier,
      model: null,
      answer: "_Needs a Tier 2 API key. Add one in Settings to answer this part._",
      tokensIn: 0,
      tokensOut: 0,
      costUsd: 0,
      latencyMs: 0,
      blocked: true,
    };
  }

  const tier2Prompt = tier2SystemPromptFor(subtask.category);
  const tier2Start = Date.now();
  try {
    const tier2Result = await callTier2Proxy(subtask.text, tier2Prompt, creds.provider, creds.apiKey);
    return {
      ...base,
      tier: 2 as Tier,
      model: tier2Result.model,
      answer: tier2Result.text,
      tokensIn: tier2Result.inputTokens,
      tokensOut: tier2Result.outputTokens,
      costUsd: tier2Result.costUsd,
      latencyMs: Date.now() - tier2Start,
    };
  } catch (err) {
    return {
      ...base,
      tier: 2 as Tier,
      model: null,
      answer: `_Tier 2 call failed: ${err instanceof Error ? err.message : "unknown error"}_`,
      tokensIn: 0,
      tokensOut: 0,
      costUsd: 0,
      latencyMs: Date.now() - tier2Start,
      blocked: true,
    };
  }
}

function combineAnswers(subtasks: SubtaskResult[]): string {
  if (subtasks.length === 1) return subtasks[0].answer;
  return subtasks.map((st) => `**${st.text}**\n\n${st.answer}`).join("\n\n---\n\n");
}

function baselineCostFor(st: SubtaskResult): number {
  const inputTokens = st.tier === 2 ? st.tokensIn : estimateTokens(st.text);
  const outputTokens = st.tier === 2 ? st.tokensOut : estimateTokens(st.answer);
  return estimateCostUsd(BASELINE_MODEL_PRICING, inputTokens, outputTokens);
}

export async function processQueryClient(query: string, creds: RunCredentials): Promise<QueryRecord> {
  if (query.length > MAX_QUERY_LENGTH) {
    throw new Error(`Query is too long (max ${MAX_QUERY_LENGTH} characters)`);
  }

  const queryId = crypto.randomUUID();
  const subtasks = await decomposeQuery(query, creds.ollamaHost, creds.ollamaModel);

  const results: SubtaskResult[] = [];
  for (const subtask of subtasks) {
    results.push(await runSubtask(subtask, queryId, creds));
  }

  const totalCostUsd = results.reduce((sum, r) => sum + r.costUsd, 0);
  const baselineCostUsd = results.reduce((sum, r) => sum + baselineCostFor(r), 0);
  const percentSaved = baselineCostUsd > 0 ? ((baselineCostUsd - totalCostUsd) / baselineCostUsd) * 100 : 0;

  return {
    queryId,
    query,
    timestamp: new Date().toISOString(),
    subtasks: results,
    combinedAnswer: combineAnswers(results),
    metrics: { totalCostUsd, baselineCostUsd, percentSaved },
  };
}
