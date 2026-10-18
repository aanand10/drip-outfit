import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "inverse";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-fg text-bg hover:bg-black disabled:bg-disabled",
  secondary: "border border-fg/15 bg-bg text-fg hover:border-fg",
  inverse: "bg-bg text-fg hover:bg-white/90",
};

export const buttonClass = (variant: Variant = "primary", className = "") =>
  `inline-flex min-h-14 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold tracking-[-0.01em] transition duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANTS[variant]} ${className}`;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export function Spinner() {
  return (
    <span
      aria-hidden
      className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
  );
}
