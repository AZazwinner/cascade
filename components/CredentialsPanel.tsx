"use client";

import { useState } from "react";
import type { Credentials } from "@/lib/client/credentials";
import type { OllamaStatus } from "@/lib/client/ollamaStatus";
import { PROVIDER_LABELS, type ProviderId } from "@/lib/tier2/registry";

interface CredentialsPanelProps {
  credentials: Credentials;
  onChange: (patch: Partial<Credentials>) => void;
  ollamaStatus: OllamaStatus;
  highlight?: boolean;
}

const OLLAMA_STATUS_COPY: Record<OllamaStatus, { label: string; className: string }> = {
  unknown: { label: "NOT CHECKED", className: "bg-[var(--muted)]" },
  checking: { label: "CHECKING…", className: "bg-[var(--accent)] motion-safe:animate-pulse" },
  reachable: { label: "REACHABLE", className: "bg-[var(--tier-0)]" },
  unreachable: { label: "UNREACHABLE. WILL SKIP TIER 1", className: "bg-[var(--muted)]" },
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full border border-[var(--border-strong)] bg-[var(--background)] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1";

export function CredentialsPanel({ credentials, onChange, ollamaStatus, highlight }: CredentialsPanelProps) {
  const [showKey, setShowKey] = useState(false);
  const statusCopy = OLLAMA_STATUS_COPY[ollamaStatus];

  return (
    <div
      className={`border border-[var(--border-strong)] p-6 flex flex-col gap-6 ${highlight ? "credentials-flash" : ""}`}
    >
      <div className="flex flex-col gap-1">
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Credentials</span>
        <p className="text-sm text-[var(--muted)] leading-relaxed max-w-2xl">
          Bring your own. Your Ollama endpoint is called directly from this browser tab and never touches
          our servers. Your API key is kept only in this tab&apos;s session storage and sent to our server
          only as a per-request header when a sub-task needs Tier 2. We never store it in a database or
          log it. Closing this tab clears everything.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Ollama endpoint (Tier 1, runs in your browser)">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={credentials.ollamaHost}
              onChange={(e) => onChange({ ollamaHost: e.target.value })}
              placeholder="http://localhost:11434"
              className={inputClass}
            />
          </div>
          <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--muted)] mt-1">
            <span className={`w-1.5 h-1.5 ${statusCopy.className}`} aria-hidden="true" />
            {statusCopy.label}
          </span>
        </Field>

        <Field label="Ollama model">
          <input
            type="text"
            value={credentials.ollamaModel}
            onChange={(e) => onChange({ ollamaModel: e.target.value })}
            placeholder="llama3.1:8b"
            className={inputClass}
          />
        </Field>

        <Field label="Tier 2 provider">
          <select
            value={credentials.provider}
            onChange={(e) => onChange({ provider: e.target.value as ProviderId })}
            className={inputClass}
          >
            {(Object.keys(PROVIDER_LABELS) as ProviderId[]).map((id) => (
              <option key={id} value={id}>
                {PROVIDER_LABELS[id]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="API key">
          <div className="flex items-stretch gap-2">
            <input
              type={showKey ? "text" : "password"}
              value={credentials.apiKey}
              onChange={(e) => onChange({ apiKey: e.target.value })}
              placeholder={`Your ${PROVIDER_LABELS[credentials.provider]} API key`}
              autoComplete="off"
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="chip shrink-0"
              aria-pressed={showKey}
            >
              {showKey ? "Hide" : "Show"}
            </button>
          </div>
        </Field>
      </div>
    </div>
  );
}
