"use client";

import * as React from "react";
import { motion } from "framer-motion";

interface ShiningTextProps {
  text: string;
  className?: string;
}

export const ShiningText = ({ text, className = "" }: ShiningTextProps) => {
  return (
    <motion.span
      className={`bg-[linear-gradient(110deg,hsl(var(--muted-foreground)),35%,hsl(var(--foreground)),50%,hsl(var(--muted-foreground)),75%,hsl(var(--muted-foreground)))] bg-[length:200%_100%] bg-clip-text text-base font-medium text-transparent ${className}`}
      initial={{ backgroundPosition: "200% 0" }}
      animate={{ backgroundPosition: "-200% 0" }}
      transition={{
        repeat: Infinity,
        duration: 1.5,
        ease: "linear",
      }}
    >
      {text}
    </motion.span>
  );
};
