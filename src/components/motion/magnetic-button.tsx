"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type HTMLMotionProps,
} from "framer-motion";

import { cn } from "@/lib/utils";

interface MagneticButtonProps extends HTMLMotionProps<"div"> {
  /** How strongly the content follows the cursor (px at full offset). */
  strength?: number;
}

/**
 * Wrap a CTA button in this to give it a subtle "pull toward the cursor"
 * feel on hover. Pointer-only, inert on touch and under reduced-motion.
 */
export function MagneticButton({
  children,
  className,
  strength = 14,
  ...props
}: MagneticButtonProps) {
  const shouldReduceMotion = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 15, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 200, damping: 15, mass: 0.4 });

  if (shouldReduceMotion) {
    return (
      <motion.div className={cn("inline-block", className)} {...props}>
        {children}
      </motion.div>
    );
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(relX * strength);
    y.set(relY * strength);
  }

  function handlePointerLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={cn("inline-block", className)}
      style={{ x: springX, y: springY }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...props}
    >
      {children}
    </motion.div>
  );
}
