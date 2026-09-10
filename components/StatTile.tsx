type Accent = "default" | "accent" | 0 | 1 | 2;

interface StatTileProps {
  value: string;
  label: string;
  accent?: Accent;
  size?: "sm" | "lg";
  bordered?: boolean;
}

function accentColor(accent: Accent): string | undefined {
  if (accent === "accent") return "var(--accent)";
  if (accent === 0 || accent === 1 || accent === 2) return `var(--tier-${accent})`;
  return undefined;
}

export function StatTile({ value, label, accent = "default", size = "sm", bordered = true }: StatTileProps) {
  const color = accentColor(accent);
  return (
    <div className={`flex flex-col gap-1 px-4 py-3 ${bordered ? "border border-[var(--border-strong)]" : ""}`}>
      <span
        className={`font-mono tabular-nums ${size === "lg" ? "text-4xl md:text-5xl" : "text-xl"}`}
        style={color ? { color } : undefined}
      >
        {value}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">{label}</span>
    </div>
  );
}
