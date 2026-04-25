import * as React from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";
import type { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient?: "purple" | "blue" | "pink" | "teal" | "orange";
  delay?: number;
  className?: string;
}

const gradientMap = {
  purple: {
    bg: "from-purple-500/10 to-violet-500/10",
    icon: "from-purple-500 to-violet-600",
    border: "border-purple-200/50",
  },
  blue: {
    bg: "from-blue-500/10 to-indigo-500/10",
    icon: "from-blue-500 to-indigo-600",
    border: "border-blue-200/50",
  },
  pink: {
    bg: "from-pink-500/10 to-rose-500/10",
    icon: "from-pink-500 to-rose-600",
    border: "border-pink-200/50",
  },
  teal: {
    bg: "from-teal-500/10 to-cyan-500/10",
    icon: "from-teal-500 to-cyan-600",
    border: "border-teal-200/50",
  },
  orange: {
    bg: "from-orange-500/10 to-amber-500/10",
    icon: "from-orange-500 to-amber-600",
    border: "border-orange-200/50",
  },
};

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  gradient = "purple",
  delay = 0,
  className,
}) => {
  const colors = gradientMap[gradient];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      whileHover={{ scale: 1.02, y: -5 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 backdrop-blur-sm transition-all duration-300 hover:shadow-xl",
        colors.bg,
        colors.border,
        className
      )}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div
          className={cn(
            "absolute -inset-1 bg-gradient-to-r blur-xl",
            colors.icon
          )}
          style={{ opacity: 0.1 }}
        />
      </div>

      <div className="relative flex items-start gap-4">
        <div
          className={cn(
            "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg",
            colors.icon
          )}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm leading-relaxed text-gray-600">{description}</p>
        </div>
      </div>
    </motion.div>
  );
};

export { FeatureCard };