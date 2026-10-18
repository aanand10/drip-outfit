import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

type Tone = "glass" | "light";

// "glass" for use over photography, "light" over white.
const TONE: Record<Tone, string> = {
  glass: "border border-white/25 bg-black/25 text-white backdrop-blur-md hover:bg-black/35",
  light: "bg-subtle text-fg hover:bg-line",
};

const shape =
  "relative grid size-11 shrink-0 place-items-center rounded-full transition active:scale-90";

export function IconButton({
  tone = "light",
  label,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; label: string }) {
  return (
    <button type="button" aria-label={label} className={`${shape} ${TONE[tone]} ${className}`} {...props} />
  );
}

export function IconLink({
  href,
  tone = "light",
  label,
  children,
}: {
  href: string;
  tone?: Tone;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} aria-label={label} className={`${shape} ${TONE[tone]}`}>
      {children}
    </Link>
  );
}
