"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type HTMLMotionProps,
} from "framer-motion";

import { cn } from "@/lib/utils";

interface TiltCardProps extends HTMLMotionProps<"div"> {
  /** Max tilt rotation in degrees. */
  maxTilt?: number;
  /** Slight upward lift + shadow growth on hover, on top of the tilt. */
  lift?: boolean;
}

/**
 * Mouse-position-driven 3D tilt for cards (services, practitioners, ...).
 * Pointer-only — no-ops on touch devices — and fully inert under
 * prefers-reduced-motion, where it behaves like a plain <div>.
 */
export function TiltCard({
  children,
  className,
  maxTilt = 10,
  lift = true,
  ...props
}: TiltCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { stiffness: 220, damping: 22, mass: 0.6 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(springY, [0, 1], [maxTilt, -maxTilt]);
  const rotateY = useTransform(springX, [0, 1], [-maxTilt, maxTilt]);
  const scale = useSpring(1, springConfig);

  if (shouldReduceMotion) {
    return (
      <motion.div className={cn(className)} {...props}>
        {children}
      </motion.div>
    );
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  }

  function handlePointerLeave() {
    mouseX.set(0.5);
    mouseY.set(0.5);
    scale.set(1);
  }

  function handlePointerEnter(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    if (lift) scale.set(1.02);
  }

  return (
    <motion.div
      ref={ref}
      className={cn("[transform-style:preserve-3d]", className)}
      style={{ rotateX, rotateY, scale }}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      {...props}
    >
      {children}
    </motion.div>
  );
}
