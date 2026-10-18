"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { api, queryKeys } from "@/lib/api";
import { Icon } from "./Icon";
import { IconLink } from "./IconButton";
import { ScenarioSwitcher } from "./ScenarioSwitcher";

export function AppHeader() {
  const pathname = usePathname();
  const params = useSearchParams();
  const back = backHref(pathname, params);
  // Pages that open on a full-bleed photo get a floating header.
  const overlay = pathname === "/" || pathname === "/look";

  return (
    <header
      className={
        overlay
          ? "absolute inset-x-0 top-0 z-40 flex h-16 items-center gap-2 px-4"
          : "sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-line/70 bg-bg/90 px-3 backdrop-blur-xl"
      }
    >
      {back ? (
        <IconLink href={back} tone={overlay ? "glass" : "light"} label="Back">
          <Icon.Back />
        </IconLink>
      ) : null}
      <Link
        href="/"
        aria-label="DRIP home"
        className={`bg-accent px-1.5 pt-[3px] pb-[2px] font-mono text-[12px] font-semibold tracking-[0.12em] text-white ${back ? "" : "ml-1"}`}
      >
        DRIP
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <ScenarioSwitcher tone={overlay ? "glass" : "light"} />
        <BagLink tone={overlay ? "glass" : "light"} />
      </div>
    </header>
  );
}

function backHref(pathname: string, params: URLSearchParams): string | null {
  if (pathname === "/look") {
    const qs = new URLSearchParams(params);
    return `/?${qs}`;
  }
  if (pathname === "/cart") return "/";
  return null;
}

function BagLink({ tone }: { tone: "glass" | "light" }) {
  const { data: cart } = useQuery({ queryKey: queryKeys.cart, queryFn: api.getCart });
  const count = cart?.itemCount ?? 0;
  return (
    <IconLink href="/cart" tone={tone} label={`Bag, ${count} items`}>
      <Icon.Bag />
      {count > 0 && (
        <span
          key={count}
          className="absolute -top-0.5 -right-0.5 grid size-5 animate-pop place-items-center rounded-full bg-accent text-[10px] font-semibold text-white"
        >
          {count}
        </span>
      )}
    </IconLink>
  );
}
