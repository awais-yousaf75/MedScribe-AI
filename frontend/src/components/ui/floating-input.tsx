import * as React from "react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, Check, X } from "lucide-react";

interface FloatingInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  success?: boolean;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  (
    {
      className,
      type,
      label,
      error,
      success,
      icon,
      showPasswordToggle,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => inputRef.current!);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0);
      props.onChange?.(e);
    };

    const isFloating = isFocused || hasValue || props.value;
    const inputType =
      type === "password" ? (showPassword ? "text" : "password") : type;

    return (
      <div className="relative w-full">
        <div
          className={cn(
            "relative flex items-center rounded-2xl border-2 bg-white transition-all duration-300",
            isFocused
              ? "border-indigo-500 shadow-lg shadow-indigo-500/10"
              : error
                ? "border-red-300 bg-red-50/50"
                : success
                  ? "border-emerald-300 bg-emerald-50/50"
                  : "border-gray-200 hover:border-gray-300",
            className
          )}
        >
          {/* Icon */}
          {icon && (
            <div
              className={cn(
                "flex items-center justify-center pl-4 transition-colors duration-300",
                isFocused
                  ? "text-indigo-500"
                  : error
                    ? "text-red-400"
                    : success
                      ? "text-emerald-500"
                      : "text-gray-400"
              )}
            >
              {icon}
            </div>
          )}

          {/* Input */}
          <input
            ref={inputRef}
            type={inputType}
            className={cn(
              "h-14 w-full bg-transparent px-4 pt-4 pb-2 text-gray-900 outline-none placeholder:text-transparent",
              icon && "pl-2"
            )}
            placeholder={label}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          />

          {/* Floating Label */}
          <motion.label
            initial={false}
            animate={{
              y: isFloating ? -10 : 0,
              scale: isFloating ? 0.8 : 1,
              x: isFloating ? (icon ? -8 : -4) : 0,
            }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={cn(
              "pointer-events-none absolute left-4 origin-left text-gray-500 transition-colors duration-300",
              icon && "left-12",
              isFocused
                ? "text-indigo-500"
                : error
                  ? "text-red-400"
                  : success
                    ? "text-emerald-500"
                    : "text-gray-400"
            )}
          >
            {label}
          </motion.label>

          {/* Status Icon / Password Toggle */}
          <div className="flex items-center gap-2 pr-4">
            {showPasswordToggle && type === "password" && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 transition-colors hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            )}
            {success && !error && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-emerald-500"
              >
                <Check className="h-5 w-5" />
              </motion.div>
            )}
            {error && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-red-400"
              >
                <X className="h-5 w-5" />
              </motion.div>
            )}
          </div>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 text-sm text-red-500"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

FloatingInput.displayName = "FloatingInput";

export { FloatingInput };