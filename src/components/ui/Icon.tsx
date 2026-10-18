import type { SVGProps } from "react";

const base = (props: SVGProps<SVGSVGElement>) => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...props,
});

export const Icon = {
  Back: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  ),
  Bag: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8z" />
      <path d="M9 10V7a3 3 0 0 1 6 0v3" />
    </svg>
  ),
  Swap: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M7 4L3.5 7.5 7 11" />
      <path d="M3.5 7.5H17" />
      <path d="M17 13l3.5 3.5L17 20" />
      <path d="M20.5 16.5H7" />
    </svg>
  ),
  Check: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  ),
  Close: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  Arrow: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Reset: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M4 12a8 8 0 1 0 2.4-5.7" />
      <path d="M4 4.5v4h4" />
    </svg>
  ),
  Minus: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M6 12h12" />
    </svg>
  ),
  Plus: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M12 6v12M6 12h12" />
    </svg>
  ),
  Expand: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
    </svg>
  ),
  Spark: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.5 2.5M15.2 15.2l2.5 2.5M6.3 17.7l2.5-2.5M15.2 8.8l2.5-2.5" />
    </svg>
  ),
};
