"use client";

import { Button } from "@/components/Button";

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-8">
      <h2 className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">{title}</h2>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </div>
  );
}

export default function ButtonShowcase() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">Component review</p>
        <h1 className="text-2xl font-semibold tracking-tight">Button</h1>
        <p className="text-sm text-[var(--muted)] max-w-lg leading-relaxed">
          One component, four variants. Hover inverts fill/text instead of fading a color; click and
          hold to see the border thicken and the button drop 1px, like it&apos;s being pressed into the
          surface.
        </p>
      </div>

      <Row title="Accent — the one brand action, used for Run Query">
        <Button variant="accent">Run query</Button>
        <Button variant="accent" disabled>
          Disabled
        </Button>
      </Row>

      <Row title="Primary — neutral filled, for non-brand-critical actions">
        <Button variant="primary">Submit</Button>
        <Button variant="primary" disabled>
          Disabled
        </Button>
      </Row>

      <Row title="Secondary — outline, used for lower-emphasis actions">
        <Button variant="secondary">Reset</Button>
        <Button variant="secondary" disabled>
          Disabled
        </Button>
      </Row>

      <Row title="Tier — borrows a tier's accent, for tier-scoped actions">
        <Button variant="tier" tier={0}>
          Tier 0
        </Button>
        <Button variant="tier" tier={1}>
          Tier 1
        </Button>
        <Button variant="tier" tier={2}>
          Tier 2
        </Button>
      </Row>

      <Row title="Size in context">
        <Button variant="accent">Run query</Button>
        <span className="text-sm text-[var(--muted)]">← same button used on the query page</span>
      </Row>
    </div>
  );
}
