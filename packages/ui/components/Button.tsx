import { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

const SIZE = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
} as const;

const VARIANT = {
  primary:
    "bg-gold text-bg hover:bg-cream focus-visible:ring-gold/40",
  ghost:
    "bg-transparent text-cream border border-card-border hover:border-gold hover:text-gold focus-visible:ring-gold/40",
} as const;

export function Button({ variant = "primary", size = "md", className, children, ...rest }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center font-medium uppercase tracking-wider transition-colors",
        "focus:outline-none focus-visible:ring-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        SIZE[size],
        VARIANT[variant],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
