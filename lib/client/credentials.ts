"use client";

import { useEffect, useState } from "react";
import { DEFAULT_OLLAMA_HOST, DEFAULT_OLLAMA_MODEL } from "@/lib/tier1/ollama";
import type { ProviderId } from "@/lib/tier2/registry";
import { isProviderId } from "@/lib/tier2/registry";

export interface Credentials {
  ollamaHost: string;
  ollamaModel: string;
  provider: ProviderId;
  apiKey: string;
}

export const DEFAULT_CREDENTIALS: Credentials = {
  ollamaHost: DEFAULT_OLLAMA_HOST,
  ollamaModel: DEFAULT_OLLAMA_MODEL,
  provider: "groq",
  apiKey: "",
};

const STORAGE_KEY = "cascade:credentials";

function loadCredentials(): Credentials {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CREDENTIALS;
    const parsed = JSON.parse(raw);
    return {
      ollamaHost: typeof parsed.ollamaHost === "string" ? parsed.ollamaHost : DEFAULT_CREDENTIALS.ollamaHost,
      ollamaModel: typeof parsed.ollamaModel === "string" ? parsed.ollamaModel : DEFAULT_CREDENTIALS.ollamaModel,
      provider: isProviderId(parsed.provider) ? parsed.provider : DEFAULT_CREDENTIALS.provider,
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "",
    };
  } catch {
    return DEFAULT_CREDENTIALS;
  }
}

function saveCredentials(creds: Credentials): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
  } catch {
    return;
  }
}

export function useCredentials() {
  const [credentials, setCredentialsState] = useState<Credentials>(DEFAULT_CREDENTIALS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCredentialsState(loadCredentials());
    setLoaded(true);
  }, []);

  function updateCredentials(patch: Partial<Credentials>) {
    setCredentialsState((prev) => {
      const next = { ...prev, ...patch };
      saveCredentials(next);
      return next;
    });
  }

  return { credentials, updateCredentials, loaded };
}
