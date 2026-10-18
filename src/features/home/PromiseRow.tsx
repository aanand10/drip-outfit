"use client";

import { Icon } from "@/components/ui/Icon";
import { useInView } from "@/lib/useInView";

const PROMISES = [
  { icon: <span className="text-[16px] font-semibold">₹</span>, title: "Never over budget", body: "Every look stays within what you set." },
  { icon: <Icon.Check width={17} height={17} strokeWidth={2.2} />, title: "Pieces that match", body: "Same dressiness, colours that sit together." },
  { icon: <Icon.Swap width={17} height={17} strokeWidth={2} />, title: "Swap any piece", body: "Only that piece changes. The rest stays." },
  { icon: <Icon.Bag width={17} height={17} />, title: "Real brands", body: "Real pieces from Indian labels, linked to the source." },
];

export function PromiseRow() {
  const [ref, seen] = useInView<HTMLDivElement>(0.25);
  return (
    <section className="px-4 pt-12">
      <p className="font-mono text-[10.5px] tracking-[0.14em] text-muted uppercase">The DRIP promise</p>
      <div ref={ref} className="mt-4 grid grid-cols-2 gap-px border border-line bg-line">
        {PROMISES.map((p, i) => (
          <div
            key={p.title}
            className="bg-bg p-4"
            style={seen ? { animation: `fade-up 600ms ${i * 90}ms cubic-bezier(0.2,0.7,0.2,1) both` } : { opacity: 0 }}
          >
            <span className="grid size-10 place-items-center rounded-full bg-fg text-bg">{p.icon}</span>
            <p className="mt-3 text-[15px] leading-tight font-semibold tracking-[-0.01em]">{p.title}</p>
            <p className="mt-1 text-[12.5px] leading-snug text-muted">{p.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
