import { forwardRef } from "react";
import { cn } from "../../utils/cn";
import { motion } from "framer-motion";

const Button = forwardRef(({ className, variant = "default", size = "default", children, loading = false, disabled, ...props }, ref) => {
  const variants = {
    default: "bg-brandNavy text-white hover:bg-slate-800 shadow-sm",
    destructive: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
    outline: "border border-slate-200 bg-transparent hover:bg-slate-100 text-brandNavy",
    secondary: "bg-slate-100 text-brandNavy hover:bg-slate-200",
    ghost: "hover:bg-slate-100 text-brandNavy",
  };

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandNavy disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
});
Button.displayName = "Button";

export { Button };
