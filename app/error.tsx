"use client";

import { Button } from "@/components/Button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-20">
      <div className="max-w-md w-full flex flex-col gap-4 border border-[var(--border-strong)] p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">Something broke</p>
        <h1 className="text-xl font-semibold tracking-tight">This page hit an unexpected error.</h1>
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Nothing unusual was sent anywhere. Your credentials stay in this browser tab regardless. Try
          again, or reload the page.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Button variant="accent" onClick={() => reset()}>
            Try again
          </Button>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
      </div>
    </div>
  );
}
