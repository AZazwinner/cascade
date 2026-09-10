interface MarqueeProps {
  items: string[];
  durationSeconds?: number;
}

function DiamondBullet() {
  return (
    <span
      aria-hidden="true"
      className="inline-block w-1.5 h-1.5 mx-6 shrink-0 rotate-45 bg-[var(--accent)] align-middle"
    />
  );
}

function Track({ items, duplicate }: { items: string[]; duplicate?: boolean }) {
  return (
    <div className={`flex items-center py-3 shrink-0 ${duplicate ? "marquee-dup" : ""}`} aria-hidden={duplicate || undefined}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center whitespace-nowrap">
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--muted)]">{item}</span>
          <DiamondBullet />
        </span>
      ))}
    </div>
  );
}

export function Marquee({ items, durationSeconds = 32 }: MarqueeProps) {
  return (
    <div className="marquee" aria-label="Feature highlights">
      <div className="marquee-track" style={{ "--marquee-duration": `${durationSeconds}s` } as React.CSSProperties}>
        <Track items={items} />
        <Track items={items} duplicate />
      </div>
    </div>
  );
}
