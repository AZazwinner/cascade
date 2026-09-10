"use client";

import { useEffect, useRef, useState } from "react";
import { pingOllama } from "@/lib/tier1/ollama";

export type OllamaStatus = "unknown" | "checking" | "reachable" | "unreachable";

export function useOllamaStatus(host: string, enabled: boolean): OllamaStatus {
  const [status, setStatus] = useState<OllamaStatus>("unknown");
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!enabled || !host.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("unknown");
      return;
    }

    const id = ++requestIdRef.current;
    setStatus("checking");

    const timer = setTimeout(() => {
      pingOllama(host).then((ok) => {
        if (requestIdRef.current === id) setStatus(ok ? "reachable" : "unreachable");
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [host, enabled]);

  return status;
}
