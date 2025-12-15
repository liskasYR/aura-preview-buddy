import { Check } from "lucide-react";

interface VerifiedBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const VerifiedBadge = ({ className = "", size = "md" }: VerifiedBadgeProps) => {
  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const checkSizeClasses = {
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-purple-400 ${sizeClasses[size]} ${className}`}
      title="Verified"
    >
      <Check className={`${checkSizeClasses[size]} text-white stroke-[3]`} />
    </span>
  );
};
