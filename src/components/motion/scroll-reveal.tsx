"use client";

import * as React from "react";
import { motion, useReducedMotion, type HTMLMotionProps, type Variants } from "framer-motion";

import { cn } from "@/lib/utils";

type Direction = "up" | "down" | "left" | "right" | "none";

const OFFSET = 28;

function getInitialOffset(direction: Direction) {
  switch (direction) {
    case "up":
      return { y: OFFSET };
    case "down":
      return { y: -OFFSET };
    case "left":
      return { x: OFFSET };
    case "right":
      return { x: -OFFSET };
    default:
      return {};
  }
}

interface ScrollRevealProps extends HTMLMotionProps<"div"> {
  direction?: Direction;
  delay?: number;
  /** Fraction of the element that must be visible before it animates in. */
  amount?: number;
}

/** Fades/slides an element in once it scrolls into view. Reusable across every marketing section. */
export function ScrollReveal({
  children,
  className,
  direction = "up",
  delay = 0,
  amount = 0.3,
  ...props
}: ScrollRevealProps) {
  const shouldReduceMotion = useReducedMotion();

  const variants: Variants = shouldReduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, ...getInitialOffset(direction) },
        visible: { opacity: 1, x: 0, y: 0 },
      };

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={variants}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
