# Cascade Router

A tiered, cost-aware query router — **bring your own credentials**. Type a
query and it's decomposed into independent sub-tasks, each routed through
the cheapest tool capable of answering it: a free deterministic evaluator,
then *your own* local Ollama, escalating to *your own* paid API key only
for the pieces that actually need it.

This is a public, stateless deployment. There is no login, no shared
account, and no bill that lands on the person running this site — every
visitor supplies their own credentials, used only for their own queries, in
their own browser tab.

## The bring-your-own-credentials model, in plain terms

- **Free arithmetic always works, with zero setup.** `47 * 82` costs
  nothing and needs no configuration at all.
- **Everything else needs your own key or your own local Ollama.** Open the
  **Credentials** panel and add one or both:
  - An **Ollama endpoint** (default `http://localhost:11434`) if you have
    [Ollama](https://ollama.com) running on your own machine. This tier is
    always free, but only reachable if you're actually running it locally —
    most visitors won't be, and that's fine, the app just skips it silently.
  - A **Groq or Fireworks API key** for the paid tier. You pay your own
    provider directly, at their published rates — we never see a bill for
    your usage.
- **Your credentials never persist on our side.** The Ollama endpoint is
  called *directly from your browser* — our server has no route to your
  machine and never sees that traffic. Your API key lives only in this
  browser tab's `sessionStorage` and is sent to our server *only* as a
  per-request header at the moment a sub-task needs the paid tier; it is
  never written to a database and never logged. Close the tab and it's
  gone.
- **Nothing is shared between visitors.** The session log, tier breakdown,
  and savings chart are all local component state in your browser — there
  is no server-side database and no cross-visitor log to leak into.

## Architecture

```
Browser
  -> Credentials panel (sessionStorage only: Ollama URL, provider, API key)
  -> Decomposer + Tier 0 + Tier 1     all run client-side (lib/decompose.ts, lib/tier0/, lib/tier1/)
       Tier 0  ->  hand-rolled arithmetic evaluator, $0, no network call at all
       Tier 1  ->  fetch() straight from the browser to YOUR OWN Ollama endpoint, $0
  -> Tier 2 (only reachable pieces)
       POST /api/tier2  { prompt, systemPrompt, provider }  +  header x-api-key: <your key>
       -> our server calls Groq/Fireworks with YOUR key for that one request, never stores it
  -> Aggregator (client-side)          combines answers, computes cost/savings for this session only
```

- **Tier 0 (deterministic, free, client-side):** a hand-written tokenizer ->
  recursive-descent parser -> AST -> evaluator for `+ - * / ^ ()`. No
  `eval()`. Runs entirely in the browser; the server is never involved.
- **Tier 1 (your local model, free, client-side):** `lib/tier1/ollama.ts` is
  called directly from the browser against whatever endpoint you configured.
  A visitor with no reachable Ollama triggers no error — a short reachability
  ping (`lib/client/ollamaStatus.ts`) resolves once per session and the app
  just treats Tier 1 as unavailable and falls through, rather than letting
  every sub-task's real call time out one by one.
- **Tier 2 (your paid key, last resort, server-proxied):** `app/api/tier2`
  is the *only* server involvement in the whole flow. It's a thin proxy: it
  validates the request, applies a light per-IP rate limit, and calls
  Groq/Fireworks with the API key from your `x-api-key` header — never a
  key from our own environment. See `lib/tier2/`.

## Tech stack

- Next.js (App Router) + TypeScript — a single static/serverless app, no persistent server
- Ollama, called client-side, for local inference
- Groq / Fireworks, called server-side with your key, for remote inference
- Chart.js (via `react-chartjs-2`) for the savings-over-time chart
- No database, anywhere — session state is browser-local; credentials are `sessionStorage`-only
- Vitest for the Tier 0 unit tests

## Running it locally

There's no `.env` setup — local dev uses the same Credentials panel a real
visitor would:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Try `47 * 82` first —
it works immediately. For the rest, open **Credentials** and:

1. Optionally install [Ollama](https://ollama.com) and pull a model:
   ```bash
   ollama pull llama3.1:8b
   ```
   The default endpoint (`http://localhost:11434`) will show **REACHABLE**
   automatically once it's running.
2. Paste your own Groq or Fireworks API key into the **API key** field.

That's it — the same flow works identically in production, because it *is*
the production flow.

## Testing

```bash
npm test        # Tier 0 evaluator unit tests (precedence, div-by-zero, malformed input, nesting, ...)
npm run lint
npm run build   # also type-checks
```

For manual testing, try a compound query with your own Ollama running and a
real key configured, e.g.:

```
Explain recursion and write a Python function to calculate the factorial of n
```

The explanation should land on Tier 1 (your local model) and the code
sub-task should escalate to Tier 2 (code generation is on the "needs a
strong model" list) — confirm both show up correctly in the sub-task ledger
with real token counts and a non-zero cost only on the Tier 2 row.

To see the degraded path, clear the API key and point the Ollama endpoint at
something unreachable, then run a non-math query — it should resolve
instantly with a clear "needs a Tier 2 API key" message per sub-task, never
an unhandled error.

## API

```
POST /api/tier2
  headers: x-api-key: <visitor's provider API key>
  request:  { prompt: string, systemPrompt: string, provider: "groq" | "fireworks" }
  response: { text, model, inputTokens, outputTokens, costUsd }
```

That's the entire server-side API surface. There is no `/api/query` and no
`/api/metrics` — decomposition, Tier 0, and Tier 1 all happen client-side,
and session metrics are computed from local state, never fetched from a
server log.

## Hardening

- **Input caps:** the query textarea is capped at `MAX_QUERY_LENGTH`
  (`lib/client/orchestrator.ts`); `/api/tier2` independently caps
  `prompt`/`systemPrompt` length server-side so a bypassed client can't send
  an oversized payload.
- **Rate limiting:** `/api/tier2` applies a light, best-effort per-IP limit
  (`lib/rateLimit.ts`, in-memory, 20 requests/minute by default). This
  protects our own serverless function's execution budget from abuse — it
  is not a cost-control measure for AI usage, since that cost lands on each
  visitor's own provider account, not ours. Being in-memory, it resets on
  cold start and isn't a strict cross-instance guarantee; that's an accepted
  trade-off for a "light" limiter with no external store.
- **Security headers** (`next.config.ts`): CSP, `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, HSTS. One thing to know before
  "fixing" it: `connect-src` allows any `http:`/`https:` origin rather than
  a fixed allowlist. That's deliberate, not an oversight — Tier 1 fetches
  whatever Ollama endpoint a visitor types into Settings, which can't be
  known ahead of time, so locking `connect-src` down would silently break
  the app's core feature. `script-src` includes `'unsafe-inline'` for the
  same kind of reason: Next.js's nonce-based CSP support requires opting
  the page into per-request dynamic rendering, which would cost this app
  its static generation (and the CDN-friendly, serverless-first deployment
  story that comes with it) just to avoid a directive that isn't this
  app's actual XSS barrier anyway — there's no `dangerouslySetInnerHTML`
  anywhere and model output is rendered through `react-markdown` with no
  raw-HTML plugin, so React's own JSX escaping is what actually stops
  script injection here.

## Deployment

Targets simple serverless hosting (e.g. [Vercel](https://vercel.com)) with
no persistent server and no database:

```bash
vercel deploy
```

There are no required environment variables to set on the platform — the
BYOK model means production visitor traffic never touches a server-side
secret. If you want a convenience default for your *own* testing, it must
go in the browser's Credentials panel, not an env var, since the whole
point is that no server-side credential path exists for visitors to reach.

## Scope

Single global rate limit aside, this is intentionally a thin, stateless
app: no auth, no accounts, no per-visitor quotas, no persistence. See the
original project spec for stretch goals (NPU inference, SQLite persistence
for a *non-public* deployment, letting a self-hosting operator supply their
own default keys for a closed/internal deployment instead of BYOK).
