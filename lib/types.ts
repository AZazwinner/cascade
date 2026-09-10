export type Category = "math" | "explanation" | "code" | "ner" | "sentiment" | "other";

export type Tier = 0 | 1 | 2;

export interface Subtask {
  id: string;
  text: string;
  category: Category;
}

export interface SubtaskResult {
  id: string;
  parentQueryId: string;
  text: string;
  category: Category;
  tier: Tier;
  model: string | null;
  answer: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  latencyMs: number;
  timestamp: string;
  blocked?: boolean;
}

export interface QueryMetrics {
  totalCostUsd: number;
  baselineCostUsd: number;
  percentSaved: number;
}

export interface QueryRecord {
  queryId: string;
  query: string;
  timestamp: string;
  subtasks: SubtaskResult[];
  combinedAnswer: string;
  metrics: QueryMetrics;
}
