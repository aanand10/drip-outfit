"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";

/** Sends page_viewed on first load and on every client-side navigation. */
export function PageViewTracker() {
  const path = usePathname();
  const query = useSearchParams().toString();
  // React runs effects twice in development; one view per URL.
  const last = useRef("");
  useEffect(() => {
    if (last.current === `${path}?${query}`) return;
    last.current = `${path}?${query}`;
    track("page_viewed", { path, query });
  }, [path, query]);
  return null;
}
