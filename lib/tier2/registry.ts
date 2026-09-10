import { callFireworks } from "./providers/fireworks";
import { callGroq } from "./providers/groq";
import type { ProviderFn } from "./types";

export type ProviderId = "groq" | "fireworks";

export const PROVIDERS: Record<ProviderId, ProviderFn> = {
  groq: callGroq,
  fireworks: callFireworks,
};

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  groq: "Groq",
  fireworks: "Fireworks AI",
};

export const PROVIDER_MODEL_CHAIN: Record<ProviderId, string[]> = {
  groq: ["openai/gpt-oss-20b", "openai/gpt-oss-120b"],
  fireworks: [
    "accounts/fireworks/models/llama-v3p1-8b-instruct",
    "accounts/fireworks/models/llama-v3p1-70b-instruct",
  ],
};

export interface ModelPricing {
  inputPerMTok: number;
  outputPerMTok: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  "groq:openai/gpt-oss-20b": { inputPerMTok: 0.075, outputPerMTok: 0.3 },
  "groq:openai/gpt-oss-120b": { inputPerMTok: 0.15, outputPerMTok: 0.6 },
  "fireworks:accounts/fireworks/models/llama-v3p1-8b-instruct": {
    inputPerMTok: 0.2,
    outputPerMTok: 0.2,
  },
  "fireworks:accounts/fireworks/models/llama-v3p1-70b-instruct": {
    inputPerMTok: 0.9,
    outputPerMTok: 0.9,
  },
};

export const BASELINE_MODEL_PRICING: ModelPricing = {
  inputPerMTok: 2.5,
  outputPerMTok: 10,
};
export const BASELINE_MODEL_LABEL = "gpt-4o (naive all-remote baseline)";

export function estimateCostUsd(pricing: ModelPricing, inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * pricing.inputPerMTok + (outputTokens / 1_000_000) * pricing.outputPerMTok;
}

export function getPricingFor(provider: ProviderId, model: string): ModelPricing {
  return MODEL_PRICING[`${provider}:${model}`] ?? BASELINE_MODEL_PRICING;
}

export function isProviderId(value: unknown): value is ProviderId {
  return value === "groq" || value === "fireworks";
}
