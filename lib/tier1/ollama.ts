export const DEFAULT_OLLAMA_HOST = "http://localhost:11434";
export const DEFAULT_OLLAMA_MODEL = "llama3.1:8b";

export interface OllamaCallResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

export class OllamaUnavailableError extends Error {}

export async function callOllama(
  prompt: string,
  systemPrompt: string,
  host: string,
  model: string,
  timeoutMs = 30_000,
): Promise<OllamaCallResult> {
  const start = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${host.replace(/\/$/, "")}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        system: systemPrompt,
        stream: false,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    throw new OllamaUnavailableError(
      `Could not reach Ollama at ${host}. (${err instanceof Error ? err.message : String(err)})`,
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new OllamaUnavailableError(`Ollama returned ${response.status}: ${body}`);
  }

  const data = (await response.json()) as {
    response?: string;
    prompt_eval_count?: number;
    eval_count?: number;
  };

  return {
    text: (data.response ?? "").trim(),
    inputTokens: data.prompt_eval_count ?? 0,
    outputTokens: data.eval_count ?? 0,
    latencyMs: Date.now() - start,
  };
}

export async function pingOllama(host: string, timeoutMs = 1500): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${host.replace(/\/$/, "")}/api/tags`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

const REFUSAL_PATTERNS = [
  /i (can'?t|cannot|am unable to)/i,
  /i'?m (not able|unable) to/i,
  /as an ai( language model)?,? i/i,
  /i don'?t (know|have enough information)/i,
];

const NEEDS_STRONG_MODEL = new Set(["code"]);

export function shouldEscalate(category: string, result: OllamaCallResult): boolean {
  if (NEEDS_STRONG_MODEL.has(category)) return true;
  if (result.text.length === 0) return true;
  if (REFUSAL_PATTERNS.some((pattern) => pattern.test(result.text))) return true;
  return false;
}
