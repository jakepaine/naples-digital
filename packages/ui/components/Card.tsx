import { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Show the red top "live" rule. Defaults to true. Legacy prop name kept for compat. */
  goldRule?: boolean;
}

export function Card({ children, goldRule = true, className, ...rest }: CardProps) {
  return (
    <div
      className={clsx(
        "relative bg-card",
        // Red top rule = the broadcast "live" indicator on every surface
        goldRule && "border-t-2 border-live",
        "border-x border-b border-card-border",
        "p-6",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
