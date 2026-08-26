"use client";

import * as React from "react";
import { HomepageMotion } from "./homepage-motion";

type MotionMode = "desktop" | "mobile";

/**
 * Remounts the homepage motion orchestrator only when the layout crosses the
 * desktop/mobile breakpoint. This keeps GSAP pinning and mobile flow in sync
 * after orientation changes or responsive-browser resizing.
 */
export function ResponsiveHomepageMotion() {
  const [mode, setMode] = React.useState<MotionMode | null>(null);

  React.useEffect(() => {
    const query = window.matchMedia("(min-width: 1025px)");
    const syncMode = () => setMode(query.matches ? "desktop" : "mobile");

    syncMode();
    query.addEventListener("change", syncMode);
    return () => query.removeEventListener("change", syncMode);
  }, []);

  if (!mode) return null;
  return <HomepageMotion key={mode} />;
}
