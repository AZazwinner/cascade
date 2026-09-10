import { DECOMPOSITION_SYSTEM_PROMPT } from "./prompts";
import { callOllama } from "./tier1/ollama";
import type { Category, Subtask } from "./types";

const VALID_CATEGORIES = new Set<Category>(["math", "explanation", "code", "ner", "sentiment", "other"]);

function extractJsonArray(text: string): string | null {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) return null;
  return text.slice(start, end + 1);
}

function coerceCategory(value: unknown): Category {
  return typeof value === "string" && VALID_CATEGORIES.has(value as Category) ? (value as Category) : "other";
}

function fallbackSubtask(query: string): Subtask[] {
  return [{ id: "1", text: query, category: "other" }];
}

export async function decomposeQuery(
  query: string,
  ollamaHost: string | null,
  ollamaModel: string,
): Promise<Subtask[]> {
  if (!ollamaHost) return fallbackSubtask(query);

  let raw: string;
  try {
    const result = await callOllama(query, DECOMPOSITION_SYSTEM_PROMPT, ollamaHost, ollamaModel);
    raw = result.text;
  } catch {
    return fallbackSubtask(query);
  }

  const jsonSlice = extractJsonArray(raw);
  if (!jsonSlice) return fallbackSubtask(query);

  try {
    const parsed = JSON.parse(jsonSlice);
    if (!Array.isArray(parsed) || parsed.length === 0) return fallbackSubtask(query);

    const subtasks: Subtask[] = parsed
      .filter((item) => item && typeof item === "object" && typeof item.text === "string" && item.text.trim())
      .map((item, index) => ({
        id: typeof item.id === "string" && item.id ? item.id : String(index + 1),
        text: item.text.trim(),
        category: coerceCategory(item.category),
      }));

    return subtasks.length > 0 ? subtasks : fallbackSubtask(query);
  } catch {
    return fallbackSubtask(query);
  }
}
