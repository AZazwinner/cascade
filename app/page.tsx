"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { CredentialsPanel } from "@/components/CredentialsPanel";
import { HeroCircuit } from "@/components/HeroCircuit";
import { Marquee } from "@/components/Marquee";
import { StatTile } from "@/components/StatTile";
import { useCredentials } from "@/lib/client/credentials";
import { useOllamaStatus } from "@/lib/client/ollamaStatus";
import { MAX_QUERY_LENGTH, processQueryClient } from "@/lib/client/orchestrator";
import { TIER_COLORS, TIER_LABELS, TIER_NAMES } from "@/lib/ui/tiers";
import type { QueryRecord } from "@/lib/types";

const SavingsChart = dynamic(() => import("@/components/SavingsChart"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center font-mono text-xs text-[var(--muted)]">
      Loading chart…
    </div>
  ),
});
const Markdown = dynamic(() => import("@/components/Markdown").then((mod) => mod.Markdown), {
  ssr: false,
  loading: () => <p className="font-mono text-xs text-[var(--muted)]">Loading…</p>,
});

const FEATURE_ITEMS = [
  "BRING YOUR OWN CREDENTIALS",
  "QUERY DECOMPOSITION",
  "ZERO-COST ARITHMETIC TIER",
  "LOCAL MODEL RUNS IN YOUR BROWSER",
  "PAID API AS LAST RESORT",
  "NOTHING STORED ON OUR SERVERS",
];

const EXAMPLE_QUERIES = [
  "47 * 82",
  "Explain recursion and write a Python factorial function",
  "What's the capital of France?",
  "Summarize the water cycle in two sentences",
];

function formatUsd(n: number): string {
  if (n === 0) return "0.0000";
  if (n < 0.0001) return "<0.0001";
  return n.toFixed(4);
}

function Diamond() {
  return <span aria-hidden="true" className="inline-block w-1.5 h-1.5 rotate-45 bg-[var(--accent)]" />;
}

type Status = "idle" | "routing" | "error";

function StatusIndicator({ status }: { status: Status }) {
  const dotClass =
    status === "error" ? "bg-red-500" : status === "routing" ? "bg-[var(--accent)] motion-safe:animate-pulse" : "bg-[var(--tier-0)]";
  const label = status === "error" ? "ERROR" : status === "routing" ? "ROUTING…" : "READY";
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
      <span className={`w-2 h-2 ${dotClass}`} aria-hidden="true" />
      {label}
    </span>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QueryRecord | null>(null);
  const [log, setLog] = useState<QueryRecord[]>([]);
  const [showCredentials, setShowCredentials] = useState(false);
  const [highlightCredentials, setHighlightCredentials] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const credentialsRef = useRef<HTMLDivElement>(null);

  const { credentials, updateCredentials, loaded } = useCredentials();
  const ollamaStatus = useOllamaStatus(credentials.ollamaHost, loaded);
  const hasKey = credentials.apiKey.trim().length > 0;

  useEffect(() => {
    if (!highlightCredentials) return;
    credentialsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    const timer = setTimeout(() => setHighlightCredentials(false), 2200);
    return () => clearTimeout(timer);
  }, [highlightCredentials]);

  function revealCredentials() {
    setShowCredentials(true);
    setHighlightCredentials(true);
  }

  async function runQuery() {
    if (!query.trim() || loading || !loaded) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setLiveMessage("Routing query…");

    try {
      const record = await processQueryClient(query.trim(), {
        ollamaHost: ollamaStatus === "reachable" ? credentials.ollamaHost : null,
        ollamaModel: credentials.ollamaModel,
        provider: credentials.provider,
        apiKey: credentials.apiKey,
      });
      setResult(record);
      setLog((prev) => [...prev, record]);
      const blockedCount = record.subtasks.filter((st) => st.blocked).length;
      const tierSummary = record.subtasks
        .map((st, i) => `sub-task ${i + 1} on tier ${st.tier}${st.blocked ? " (blocked, needs credentials)" : ""}`)
        .join(", ");
      setLiveMessage(
        `Query complete. ${record.subtasks.length} sub-task${record.subtasks.length === 1 ? "" : "s"}: ${tierSummary}.` +
          (blockedCount > 0 ? ` ${blockedCount} need${blockedCount === 1 ? "s" : ""} credentials to unlock.` : ""),
      );
      if (blockedCount > 0) {
        revealCredentials();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setLiveMessage(`Query failed: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runQuery();
  }

  function handleTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  function handleReset() {
    setQuery("");
    setResult(null);
    setError(null);
    textareaRef.current?.focus();
  }

  function handleExampleClick(example: string) {
    setQuery(example);
    textareaRef.current?.focus();
  }

  const status: Status = error ? "error" : loading ? "routing" : "idle";

  const aggregate = useMemo(() => {
    const tierCounts: [number, number, number] = [0, 0, 0];
    let totalActual = 0;
    let totalBaseline = 0;
    let totalTokens = 0;
    let remoteTokens = 0;
    const cumulativeLabels: string[] = [];
    const cumulativeSaved: number[] = [];
    let runningSaved = 0;

    for (const q of log) {
      for (const st of q.subtasks) {
        tierCounts[st.tier]++;
        totalTokens += st.tokensIn + st.tokensOut;
        if (st.tier === 2) remoteTokens += st.tokensIn + st.tokensOut;
      }
      totalActual += q.metrics.totalCostUsd;
      totalBaseline += q.metrics.baselineCostUsd;
      runningSaved += q.metrics.baselineCostUsd - q.metrics.totalCostUsd;
      cumulativeLabels.push(`#${cumulativeLabels.length + 1}`);
      cumulativeSaved.push(runningSaved);
    }

    const percentSaved = totalBaseline > 0 ? ((totalBaseline - totalActual) / totalBaseline) * 100 : 0;

    return {
      tierCounts,
      totalActual,
      totalBaseline,
      totalTokens,
      remoteTokens,
      percentSaved,
      cumulativeLabels,
      cumulativeSaved,
    };
  }, [log]);

  return (
    <div className="flex flex-col">
      <div aria-live="polite" role="status" className="sr-only">
        {liveMessage}
      </div>

      <header className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 bg-[var(--accent)] shrink-0" aria-hidden="true" />
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold tracking-tight">CASCADE</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                Tiered cost-aware query router
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-8">
              <StatTile
                value={`${aggregate.percentSaved.toFixed(1)}%`}
                label="Token savings"
                bordered={false}
              />
              <StatTile value={String(aggregate.remoteTokens)} label="Remote tokens" bordered={false} />
              <StatTile value={String(log.length)} label="Queries" bordered={false} />
            </div>
            <Button variant="secondary" onClick={() => setShowCredentials((v) => !v)}>
              {showCredentials ? "Hide credentials" : "Credentials"}
            </Button>
          </div>
        </div>
      </header>

      <main>
      {showCredentials && (
        <div ref={credentialsRef} className="border-b border-[var(--border)] px-6 py-6">
          <div className="max-w-6xl mx-auto">
            <CredentialsPanel
              credentials={credentials}
              onChange={updateCredentials}
              ollamaStatus={ollamaStatus}
              highlight={highlightCredentials}
            />
          </div>
        </div>
      )}

      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <HeroCircuit />
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-end">
            <div className="flex flex-col gap-6 max-w-2xl">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                Bring your own credentials &middot; nothing stored on our servers
              </p>
              <h1 className="text-[clamp(2.5rem,6.5vw,4.75rem)] leading-[0.98] font-extrabold uppercase tracking-tight">
                Most queries don&apos;t need
                <br />
                the <em className="italic text-[var(--accent)]">expensive</em> model.
              </h1>
              <p className="text-base text-[var(--muted)] leading-relaxed max-w-xl">
                Every query is split into independent subtasks. Each one routes through the cheapest
                tier that can answer it: a deterministic evaluator, your own local model,
                then escalating to your own API key only for the pieces that actually need it.
              </p>
            </div>

            <div className="grid grid-cols-3 lg:grid-cols-1 gap-3 lg:w-52 w-full">
              <StatTile value={`${aggregate.percentSaved.toFixed(1)}%`} label="Token savings" accent="accent" />
              <StatTile value={String(log.length)} label="Queries run" />
              <StatTile value={String(aggregate.tierCounts[0])} label="Free (tier 0)" accent={0} />
            </div>
          </div>
        </div>
      </section>

      <Marquee items={FEATURE_ITEMS} />

      <div className="max-w-6xl mx-auto px-6 py-16 w-full">
        <div className="grid lg:grid-cols-2 gap-8 items-stretch">
          <div className="flex flex-col gap-5 border border-[var(--border-strong)] p-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                Query input
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wide border border-[var(--border-strong)] px-2 py-1 text-[var(--muted)]">
                Ctrl + Enter to run
              </span>
            </div>

            {!hasKey && ollamaStatus !== "reachable" && (
              <div className="border-l-2 border-[var(--accent)] pl-4 py-2 text-sm text-[var(--muted)]">
                Only free arithmetic (Tier 0) will work right now. Add a Groq or Fireworks API key, or
                point at a running local Ollama, in{" "}
                <button type="button" className="underline text-[var(--foreground)] cursor-pointer" onClick={revealCredentials}>
                  Credentials
                </button>{" "}
                to unlock the rest.
              </div>
            )}

            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
              <textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleTextareaKeyDown}
                placeholder="e.g. What is 47 * 82, and explain what a transformer is?"
                rows={5}
                maxLength={MAX_QUERY_LENGTH}
                className="w-full border border-[var(--border-strong)] bg-[var(--background)] px-4 py-3 text-sm focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1 resize-none"
              />

              <div className="flex items-center gap-3 flex-wrap">
                <Button type="submit" variant="accent" disabled={loading || !query.trim() || !loaded}>
                  {loading ? "Routing…" : "Run query"}
                </Button>
                <Button type="button" variant="secondary" onClick={handleReset} disabled={loading}>
                  Reset
                </Button>
                <StatusIndicator status={status} />
              </div>
            </form>

            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                Try one
              </span>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_QUERIES.map((ex) => (
                  <button key={ex} type="button" className="chip" onClick={() => handleExampleClick(ex)}>
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="border-l-2 border-red-500 pl-4 py-2 text-sm text-red-400">{error}</div>
            )}
          </div>

          <div className="flex flex-col gap-6 border border-[var(--accent)] p-6 bg-[var(--background-raised)]">
            <div>
              <div className="font-mono text-4xl md:text-5xl text-[var(--accent)] tabular-nums">
                {aggregate.percentSaved.toFixed(1)}%
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)] mt-1">
                Est. token savings vs. all-remote
              </div>
            </div>

            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Only the sub-tasks that need real reasoning ever reach the paid tier. Saved{" "}
              <span className="font-mono text-[var(--foreground)]">${formatUsd(aggregate.totalBaseline - aggregate.totalActual)}</span>{" "}
              across {log.length} {log.length === 1 ? "query" : "queries"} this session.
            </p>

            <div className="grid grid-cols-3 gap-3">
              {([0, 1, 2] as const).map((tier) => (
                <StatTile
                  key={tier}
                  value={String(aggregate.tierCounts[tier])}
                  label={TIER_LABELS[tier]}
                  accent={tier}
                />
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                  Savings over time
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wide text-[var(--accent)]">
                  &#9650; vs. naive baseline
                </span>
              </div>
              <div className="h-40">
                {aggregate.cumulativeLabels.length > 0 ? (
                  <SavingsChart labels={aggregate.cumulativeLabels} data={aggregate.cumulativeSaved} />
                ) : (
                  <div className="h-full flex items-center justify-center font-mono text-xs text-[var(--muted)]">
                    No queries yet this session
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {result && (
          <div className="flex flex-col gap-8 mt-16">
            <div className="flex items-center gap-3 border-b border-[var(--border)] pb-3">
              <Diamond />
              <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                Latest query
              </h2>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                Answer
              </span>
              <div className="border border-[var(--border)] px-4 py-3 text-[15px]">
                <Markdown>{result.combinedAnswer}</Markdown>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                Sub-task ledger
              </span>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] border-collapse min-w-[640px]">
                  <thead>
                    <tr className="border-b border-[var(--border-strong)] text-left font-mono text-[11px] uppercase tracking-wide text-[var(--muted)]">
                      <th className="py-2 pr-3 font-medium">Tier</th>
                      <th className="py-2 pr-3 font-medium">Sub-task</th>
                      <th className="py-2 pr-3 font-medium">Category</th>
                      <th className="py-2 pr-3 font-medium">Model</th>
                      <th className="py-2 pr-3 font-medium text-right">In</th>
                      <th className="py-2 pr-3 font-medium text-right">Out</th>
                      <th className="py-2 pl-3 font-medium text-right">Cost (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.subtasks.map((st) => (
                      <tr key={st.id} className={`border-b border-[var(--border)] ${st.blocked ? "opacity-50" : ""}`}>
                        <td className="py-2.5 pr-3 align-top whitespace-nowrap">
                          <span
                            className="font-mono text-xs underline decoration-2 underline-offset-4"
                            style={{ color: TIER_COLORS[st.tier], textDecorationColor: TIER_COLORS[st.tier] }}
                          >
                            {TIER_LABELS[st.tier]}
                          </span>
                          <span className="block text-[10px] text-[var(--muted)] mt-0.5">
                            {st.blocked ? "needs credentials" : TIER_NAMES[st.tier]}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 align-top text-[var(--foreground)]/90">{st.text}</td>
                        <td className="py-2.5 pr-3 align-top text-[var(--muted)] whitespace-nowrap">
                          {st.category}
                        </td>
                        <td className="py-2.5 pr-3 align-top font-mono text-xs text-[var(--muted)] whitespace-nowrap">
                          {st.model ?? "—"}
                        </td>
                        <td className="py-2.5 pr-3 align-top font-mono text-xs text-right whitespace-nowrap">
                          {st.tokensIn}
                        </td>
                        <td className="py-2.5 pr-3 align-top font-mono text-xs text-right whitespace-nowrap">
                          {st.tokensOut}
                        </td>
                        <td className="py-2.5 pl-3 align-top font-mono text-xs text-right whitespace-nowrap">
                          {formatUsd(st.costUsd)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-3 border border-[var(--border-strong)] divide-x divide-[var(--border-strong)]">
              <StatTile value={`$${formatUsd(result.metrics.totalCostUsd)}`} label="Actual cost" bordered={false} />
              <StatTile value={`$${formatUsd(result.metrics.baselineCostUsd)}`} label="Naive baseline" bordered={false} />
              <StatTile value={`${result.metrics.percentSaved.toFixed(1)}%`} label="Saved" accent="accent" bordered={false} />
            </div>
          </div>
        )}
      </div>
      </main>

      <footer className="border-t border-[var(--border)] px-6 py-6">
        <p className="max-w-6xl mx-auto font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted)] leading-relaxed">
          Independent personal project. Not affiliated with, endorsed by, or sponsored by Groq, Fireworks
          AI, Ollama, or Meta.
        </p>
      </footer>
    </div>
  );
}
