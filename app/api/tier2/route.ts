import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { callTier2 } from "@/lib/tier2";
import { isProviderId } from "@/lib/tier2/registry";
import { ProviderCallError } from "@/lib/tier2/types";

const MAX_PROMPT_LENGTH = 4000;
const MAX_SYSTEM_PROMPT_LENGTH = 2000;

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(clientIp(request));
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing "x-api-key" header' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON" }, { status: 400 });
  }

  const { prompt, systemPrompt, provider } = (body ?? {}) as Record<string, unknown>;

  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    return NextResponse.json({ error: '"prompt" must be a non-empty string' }, { status: 400 });
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return NextResponse.json({ error: `"prompt" exceeds ${MAX_PROMPT_LENGTH} characters` }, { status: 400 });
  }
  if (typeof systemPrompt !== "string") {
    return NextResponse.json({ error: '"systemPrompt" must be a string' }, { status: 400 });
  }
  if (systemPrompt.length > MAX_SYSTEM_PROMPT_LENGTH) {
    return NextResponse.json(
      { error: `"systemPrompt" exceeds ${MAX_SYSTEM_PROMPT_LENGTH} characters` },
      { status: 400 },
    );
  }
  if (!isProviderId(provider)) {
    return NextResponse.json({ error: '"provider" must be "groq" or "fireworks"' }, { status: 400 });
  }

  try {
    const result = await callTier2(prompt, systemPrompt, provider, apiKey);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof ProviderCallError ? err.message : "Tier 2 request failed unexpectedly.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
