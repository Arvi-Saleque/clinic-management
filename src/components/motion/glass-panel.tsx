import * as React from "react";

import { cn } from "@/lib/utils";

interface GlassPanelProps extends React.ComponentProps<"div"> {
  /** Use on dark/photo backgrounds (hero) vs. light card contexts (grids). */
  tone?: "on-dark" | "on-light";
}

/**
 * Frosted-glass depth surface: translucent background + blur + soft border.
 * Static (no motion deps) so it composes cleanly inside TiltCard/ScrollReveal.
 */
export function GlassPanel({ className, tone = "on-light", children, ...props }: GlassPanelProps) {
  return (
    <div
      data-slot="glass-panel"
      className={cn(
        "rounded-2xl border backdrop-blur-md",
        tone === "on-dark"
          ? "border-white/15 bg-white/10 text-white shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
          : "border-border/60 bg-card/70 shadow-[0_8px_32px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
