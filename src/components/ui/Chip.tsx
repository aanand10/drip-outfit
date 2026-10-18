import type { ButtonHTMLAttributes } from "react";

// Selectable pill, e.g. a size.
export function Chip({
  selected = false,
  unavailable = false,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean; unavailable?: boolean }) {
  return (
    <button
      type="button"
      disabled={unavailable || props.disabled}
      className={`relative inline-flex h-10 min-w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-full border px-4 text-[14px] font-medium tabular-nums transition duration-150 active:scale-95 ${
        selected
          ? "border-fg bg-fg text-bg"
          : unavailable
            ? "chip-soldout cursor-not-allowed border-line text-muted/45"
            : "border-line bg-bg text-fg hover:border-fg/50"
      } ${className}`}
      {...props}
    />
  );
}
