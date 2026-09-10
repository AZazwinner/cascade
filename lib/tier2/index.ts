import { estimateCostUsd, getPricingFor, PROVIDER_MODEL_CHAIN, PROVIDERS, type ProviderId } from "./registry";
import { ProviderCallError } from "./types";

export interface Tier2Result {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export async function callTier2(
  prompt: string,
  systemPrompt: string,
  provider: ProviderId,
  apiKey: string,
): Promise<Tier2Result> {
  const chain = PROVIDER_MODEL_CHAIN[provider];
  const fn = PROVIDERS[provider];
  const failures: string[] = [];

  for (const model of chain) {
    try {
      const result = await fn(prompt, systemPrompt, model, apiKey);
      const pricing = getPricingFor(provider, model);
      const costUsd = estimateCostUsd(pricing, result.inputTokens, result.outputTokens);

      return {
        text: result.text,
        model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        costUsd,
      };
    } catch (err) {
      failures.push(`${model}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  throw new ProviderCallError(`All ${provider} models failed:\n${failures.join("\n")}`);
}
