"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ImageGenerationPreviewProps {
  children?: React.ReactNode;
  isComplete?: boolean;
}

export const ImageGenerationPreview = ({
  children,
  isComplete = false,
}: ImageGenerationPreviewProps) => {
  const [progress, setProgress] = React.useState(0);
  const [loadingState, setLoadingState] = React.useState<
    "starting" | "generating" | "completed"
  >("starting");

  const intervalRef = React.useRef<number | null>(null);
  const timeoutRef = React.useRef<number | null>(null);

  const duration = 15000;

  React.useEffect(() => {
    // reset when restarting
    setProgress(0);
    setLoadingState("starting");

    if (isComplete) {
      setProgress(100);
      setLoadingState("completed");
      return;
    }

    timeoutRef.current = window.setTimeout(() => {
      setLoadingState("generating");
      const startTime = Date.now();

      intervalRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const percent = Math.min(95, (elapsed / duration) * 100);
        setProgress(percent);
      }, 16);
    }, 1000);

    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isComplete, duration]);

  React.useEffect(() => {
    if (isComplete) {
      setProgress(100);
      setLoadingState("completed");

      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isComplete]);

  return (
    <div className="flex flex-col gap-3 w-full max-w-md">
      <motion.p
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm text-muted-foreground"
      >
        {loadingState === "starting" && "✨ Getting started..."}
        {loadingState === "generating" && "🎨 Creating image..."}
        {loadingState === "completed" && "✅ Image created!"}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "relative overflow-hidden rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm",
          loadingState === "completed" && "border-primary/30"
        )}
      >
        {loadingState !== "completed" && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-muted/30">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-secondary to-primary"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            />
          </div>
        )}

        <div className="p-4">
          {children ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {children}
            </motion.div>
          ) : (
            <div className="aspect-square w-full max-w-[300px] mx-auto flex items-center justify-center">
              <motion.div
                className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
