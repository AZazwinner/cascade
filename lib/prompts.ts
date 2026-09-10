import type { Category } from "./types";

export const DECOMPOSITION_SYSTEM_PROMPT = `You split a user's request into independent sub-tasks so each piece can be routed to the cheapest tool that can handle it.

Respond with ONLY a JSON array, no prose, no markdown fences. Each element must be:
{ "id": string, "text": string, "category": "math" | "explanation" | "code" | "ner" | "sentiment" | "other" }

Rules:
- "math": a pure arithmetic expression to compute (e.g. "47 * 82").
- "explanation": a request to explain, define, or describe a concept.
- "code": a request to write, fix, or review code.
- "ner": ONLY use this when the user supplies a passage of text and asks you to pull entities out of it. A question that merely mentions or names an entity (e.g. "what is the capital of France?") is NOT ner -- classify it as "explanation" or "other" and answer it in prose.
- "sentiment": a request to classify sentiment/tone.
- "other": anything that doesn't fit the above.
- If the request is a single atomic task, return a single-element array. Do not split one factual question into multiple sub-tasks that each re-ask the same thing.
- Do not merge unrelated tasks into one sub-task.
- ids should be short strings like "1", "2", "3".

Example input: "What is 47 * 82, and explain what a transformer is?"
Example output: [{"id":"1","text":"47 * 82","category":"math"},{"id":"2","text":"explain what a transformer is","category":"explanation"}]

Example input: "What's the capital of France?"
Example output: [{"id":"1","text":"What's the capital of France?","category":"other"}]`;

const TIER1_PROMPTS: Record<Category, string> = {
  math: "Compute the result of the given expression. Reply with only the numeric answer.",
  explanation: "Explain the concept clearly and concisely in a few sentences.",
  code: "Write correct, working code for the request. Include brief comments only where non-obvious.",
  ner: "Extract named entities from the text. Reply with only a JSON array of entity strings.",
  sentiment: "Classify the sentiment of the text. Reply with only one word: positive, negative, or neutral.",
  other: "Answer the request as helpfully and concisely as possible.",
};

const TIER2_PROMPTS: Record<Category, string> = {
  math: "Compute the result of the given expression. Reply with ONLY the numeric answer, nothing else.",
  explanation: "Explain the concept clearly and concisely. Prose is fine, but do not pad the answer.",
  code: "Write correct, working code for the request. A full response is fine -- code needs the space.",
  ner: 'Extract named entities from the text. Reply with ONLY a JSON array of strings, e.g. ["Paris","NASA"]. No prose.',
  sentiment: "Classify the sentiment of the text. Reply with ONLY one word: positive, negative, or neutral.",
  other: "Answer the request as helpfully and concisely as possible. Do not pad the response.",
};

export function tier1SystemPromptFor(category: Category): string {
  return TIER1_PROMPTS[category];
}

export function tier2SystemPromptFor(category: Category): string {
  return TIER2_PROMPTS[category];
}
