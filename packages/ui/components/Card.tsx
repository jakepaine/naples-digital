import { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  goldRule?: boolean;
}

export function Card({ children, goldRule = true, className, ...rest }: CardProps) {
  return (
    <div
      className={clsx(
        "relative bg-card",
        goldRule && "border-t border-gold",
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
