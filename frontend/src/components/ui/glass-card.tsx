import * as React from "react";
import { cn } from "../../lib/utils";
import { motion, type HTMLMotionProps } from "motion/react";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  variant?: "light" | "dark" | "gradient" | "frost";
  blur?: "sm" | "md" | "lg" | "xl";
  border?: boolean;
  glow?: boolean;
  glowColor?: string;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className,
      variant = "light",
      blur = "lg",
      border = true,
      glow = false,
      glowColor = "rgba(99, 102, 241, 0.4)",
      children,
      ...props
    },
    ref
  ) => {
    const blurMap = {
      sm: "backdrop-blur-sm",
      md: "backdrop-blur-md",
      lg: "backdrop-blur-lg",
      xl: "backdrop-blur-xl",
    };

    const variantStyles = {
      light: "bg-white/70 dark:bg-gray-900/70",
      dark: "bg-gray-900/80 dark:bg-black/80",
      gradient:
        "bg-gradient-to-br from-white/80 via-white/60 to-white/40 dark:from-gray-900/80 dark:via-gray-900/60 dark:to-gray-900/40",
      frost: "bg-white/30 dark:bg-gray-900/30",
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "relative rounded-3xl p-6",
          blurMap[blur],
          variantStyles[variant],
          border && "border border-white/20 dark:border-gray-700/30",
          glow && "shadow-2xl",
          className
        )}
        style={
          glow
            ? {
                boxShadow: `0 25px 50px -12px ${glowColor}, 0 0 0 1px rgba(255,255,255,0.1)`,
              }
            : undefined
        }
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard };