"use client";

import * as React from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type HTMLMotionProps,
} from "framer-motion";

import { cn } from "@/lib/utils";

interface AnimatedCounterProps extends Omit<HTMLMotionProps<"span">, "children"> {
  value: number;
  prefix?: string;
  suffix?: string;
  /** Decimal places to display. */
  decimals?: number;
  duration?: number;
}

/** Counts up from 0 to `value` once it scrolls into view — used for trust stats/KPIs. */
export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1.4,
  className,
  ...props
}: AnimatedCounterProps) {
  const shouldReduceMotion = useReducedMotion();
  const ref = React.useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.6 });
  const [display, setDisplay] = React.useState("0");

  const motionValue = useMotionValue(0);
  // Reduced motion: duration 0 makes the spring jump straight to the
  // target instead of tweening, so the same "set and let onChange render
  // it" path below handles both cases with no branch.
  const spring = useSpring(motionValue, { duration: shouldReduceMotion ? 0 : duration * 1000, bounce: 0 });

  React.useEffect(() => {
    if (!isInView) return;
    motionValue.set(value);
  }, [isInView, motionValue, value]);

  React.useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      setDisplay(latest.toFixed(decimals));
    });
    return unsubscribe;
  }, [spring, decimals]);

  return (
    <motion.span ref={ref} className={cn("tabular-nums", className)} {...props}>
      {prefix}
      {display}
      {suffix}
    </motion.span>
  );
}
