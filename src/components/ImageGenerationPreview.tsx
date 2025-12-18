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
  const duration = 15000; // 15 seconds max

  React.useEffect(() => {
    if (isComplete) {
      setLoadingState("completed");
      setProgress(100);
      return;
    }

    const startingTimeout = setTimeout(() => {
      setLoadingState("generating");

      const startTime = Date.now();

      const interval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const progressPercentage = Math.min(95, (elapsedTime / duration) * 100);

        setProgress(progressPercentage);

        if (isComplete) {
          clearInterval(interval);
          setLoadingState("completed");
          setProgress(100);
        }
      }, 16);

      return () => clearInterval(interval);
    }, 1000);

    return () => clearTimeout(startingTimeout);
  }, [duration, isComplete]);

  React.useEffect(() => {
    if (isComplete) {
      setLoadingState("completed");
      setProgress(100);
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
        {/* Progress bar */}
        {loadingState !== "completed" && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-muted/30">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-secondary to-primary"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        {/* Content area */}
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
