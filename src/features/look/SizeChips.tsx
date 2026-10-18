import { Chip } from "@/components/ui/Chip";
import type { Variant } from "@/domain/types";

export function SizeChips({
  name,
  variants,
  value,
  onChange,
}: {
  name: string;
  variants: Variant[];
  value: string | null;
  onChange: (variantId: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label={`Size for ${name}`} className="no-scrollbar flex gap-1.5 overflow-x-auto">
      {variants.map((v) => (
        <Chip
          key={v.variantId}
          role="radio"
          aria-checked={v.variantId === value}
          aria-label={v.stock <= 0 ? `${v.size}, sold out` : v.size}
          selected={v.variantId === value}
          unavailable={v.stock <= 0}
          onClick={() => onChange(v.variantId)}
        >
          {v.size}
        </Chip>
      ))}
    </div>
  );
}
