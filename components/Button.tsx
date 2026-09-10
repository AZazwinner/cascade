import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "accent" | "tier";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  tier?: 0 | 1 | 2;
}

export function Button({ variant = "primary", tier, className = "", ...props }: ButtonProps) {
  const variantClass = variant === "tier" ? `btn-tier-${tier ?? 0}` : `btn-${variant}`;
  return <button className={`btn ${variantClass} ${className}`.trim()} {...props} />;
}
