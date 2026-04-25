import * as React from "react";
import { cn } from "../../lib/utils";

interface DividerProps {
  text?: string;
  className?: string;
  lineClassName?: string;
}

const Divider: React.FC<DividerProps> = ({ text, className, lineClassName }) => {
  if (!text) {
    return (
      <div
        className={cn(
          "h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent",
          className
        )}
      />
    );
  }

  return (
    <div className={cn("relative flex items-center py-4", className)}>
      <div
        className={cn(
          "flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-gray-300",
          lineClassName
        )}
      />
      <span className="px-4 text-sm text-gray-500 bg-white">{text}</span>
      <div
        className={cn(
          "flex-1 h-px bg-gradient-to-r from-gray-300 via-gray-300 to-transparent",
          lineClassName
        )}
      />
    </div>
  );
};

export { Divider };