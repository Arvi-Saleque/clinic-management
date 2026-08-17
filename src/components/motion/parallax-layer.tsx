"use client";

import * as React from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type HTMLMotionProps,
} from "framer-motion";

import { cn } from "@/lib/utils";

interface ParallaxLayerProps extends HTMLMotionProps<"div"> {
  /** Positive = moves slower than scroll (background feel); negative = faster. */
  speed?: number;
}

/**
 * Scroll-linked vertical offset for background/decorative layers (hero
 * gradients, blobs). Wrap the layer's containing section in a ref via
 * `containerRef` when the layer isn't the section itself (defaults to
 * tracking the layer's own scroll progress against the viewport).
 */
export function ParallaxLayer({
  children,
  className,
  speed = 0.3,
  ...props
}: ParallaxLayerProps) {
  const shouldReduceMotion = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [`${-speed * 100}px`, `${speed * 100}px`]);

  if (shouldReduceMotion) {
    return (
      <motion.div className={cn(className)} {...props}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div ref={ref} className={cn(className)} style={{ y }} {...props}>
      {children}
    </motion.div>
  );
}
