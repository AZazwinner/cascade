export interface ProviderCallResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

export type ProviderFn = (
  prompt: string,
  systemPrompt: string,
  model: string,
  apiKey: string,
) => Promise<ProviderCallResult>;

export class ProviderCallError extends Error {}
