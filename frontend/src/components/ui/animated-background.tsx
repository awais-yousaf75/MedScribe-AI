import * as React from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

interface AnimatedBackgroundProps {
  variant?: "aurora" | "mesh" | "waves" | "particles" | "gradient";
  className?: string;
  children?: React.ReactNode;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  variant = "aurora",
  className,
  children,
}) => {
  return (
    <div className={cn("relative min-h-screen overflow-hidden", className)}>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-indigo-50" />

      {variant === "aurora" && (
        <>
          {/* Aurora blobs */}
          <motion.div
            animate={{
              x: [0, 100, 50, 0],
              y: [0, 50, 100, 0],
              scale: [1, 1.2, 1.1, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-purple-400/40 via-violet-400/30 to-indigo-400/40 blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -100, -50, 0],
              y: [0, 100, 50, 0],
              scale: [1, 1.1, 1.2, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -right-40 top-20 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-pink-400/30 via-rose-400/20 to-orange-400/30 blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, 50, -50, 0],
              y: [0, -50, 50, 0],
              scale: [1, 1.15, 1.05, 1],
            }}
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -bottom-40 left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-cyan-400/30 via-teal-400/20 to-emerald-400/30 blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -30, 60, 0],
              y: [0, 60, -30, 0],
              scale: [1, 1.1, 0.95, 1],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-amber-400/20 via-yellow-400/10 to-lime-400/20 blur-3xl"
          />
        </>
      )}

      {variant === "mesh" && (
        <div className="absolute inset-0">
          <svg className="absolute h-full w-full">
            <defs>
              <pattern
                id="mesh"
                x="0"
                y="0"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="1" cy="1" r="1" fill="rgba(99,102,241,0.15)" />
              </pattern>
            </defs>
            <rect fill="url(#mesh)" width="100%" height="100%" />
          </svg>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2"
          >
            <div className="absolute left-0 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-gradient-to-r from-indigo-500/20 to-transparent blur-3xl" />
            <div className="absolute right-0 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-gradient-to-l from-pink-500/20 to-transparent blur-3xl" />
          </motion.div>
        </div>
      )}

      {variant === "waves" && (
        <div className="absolute inset-0">
          <svg
            className="absolute bottom-0 w-full"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <motion.path
              animate={{
                d: [
                  "M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                  "M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,149.3C672,149,768,203,864,213.3C960,224,1056,192,1152,176C1248,160,1344,160,1392,160L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                ],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              fill="url(#wave-gradient)"
              fillOpacity="0.3"
            />
            <defs>
              <linearGradient id="wave-gradient" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}

      {variant === "particles" && (
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
              initial={{
                x: Math.random() * 1000,
                y: Math.random() * 800,
                scale: Math.random() * 0.5 + 0.5,
                opacity: Math.random() * 0.5 + 0.3,
              }}
              animate={{
                y: [null, Math.random() * -200 - 100],
                opacity: [null, 0],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
        </div>
      )}

      {variant === "gradient" && (
        <motion.div
          animate={{
            background: [
              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            ],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 opacity-10"
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export { AnimatedBackground };