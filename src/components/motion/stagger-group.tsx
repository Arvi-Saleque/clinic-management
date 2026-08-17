"use client";

import * as React from "react";
import { motion, useReducedMotion, type HTMLMotionProps, type Variants } from "framer-motion";

import { cn } from "@/lib/utils";

interface StaggerGroupProps extends HTMLMotionProps<"div"> {
  /** Seconds between each child's entrance. */
  staggerDelay?: number;
  amount?: number;
}

/** Wrap a grid/list of cards in this; wrap each card in <StaggerItem> for a cascading reveal. */
export function StaggerGroup({
  children,
  className,
  staggerDelay = 0.08,
  amount = 0.2,
  ...props
}: StaggerGroupProps) {
  const shouldReduceMotion = useReducedMotion();

  const container: Variants = {
    hidden: {},
    visible: {
      transition: shouldReduceMotion
        ? {}
        : { staggerChildren: staggerDelay, delayChildren: 0.05 },
    },
  };

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={container}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, ...props }: HTMLMotionProps<"div">) {
  const shouldReduceMotion = useReducedMotion();

  const item: Variants = shouldReduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 24 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
        },
      };

  return (
    <motion.div className={cn(className)} variants={item} {...props}>
      {children}
    </motion.div>
  );
}
