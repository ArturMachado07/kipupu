import { type ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ variant = "primary", className, ...props }: Props) {
  return (
    <button
      {...props}
      className={clsx(
        "px-5 py-3 rounded-md font-heading font-bold text-sm transition-transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
        variant === "primary" && "bg-kipupu-navy text-white hover:bg-kipupu-navy/90",
        variant === "secondary" && "bg-kipupu-cyan text-kipupu-navy hover:brightness-95",
        variant === "ghost" && "bg-transparent text-kipupu-navy border border-kipupu-navy hover:bg-kipupu-gray100",
        className
      )}
    />
  );
}
