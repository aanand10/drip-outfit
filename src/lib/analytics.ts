// Product analytics. Every event gets the same context (session, page, device), and one sink
// decides where events go. Today that's the console; GA4 or Clarity would plug into `send` only.
import type { ScenarioId } from "@/domain/scenarios";
import type { OccasionId, Slot } from "@/domain/types";
import { newId } from "./id";

/** Every event and its properties. Names are `object_action`, past tense for things that happened. */
export type AnalyticsEvents = {
  // Lifecycle
  session_started: { entry_path: string; referrer: string | null };
  page_viewed: { path: string; query: string };

  // What the user did
  occasion_selected: { occasion: OccasionId; source: "tile" | "intro" };
  budget_changed: { budget: number };
  look_requested: { occasion: OccasionId; budget: number };
  swap_opened: { slot: Slot; product_id: string };
  swap_option_picked: { slot: Slot; from_product_id: string; to_product_id: string; price_delta: number; new_total: number };
  size_selected: { slot: Slot; product_id: string; size: string; stock_left: number };
  add_to_bag_clicked: { total: number; missing_sizes: number };
  add_to_bag_repeat_tap_ignored: { total: number };
  cart_item_removed: { variant_id: string };
  cart_cleared: { item_count: number };
  no_fit_next_step_clicked: { action: "raise_budget" | "other_occasion" | "change_inputs"; occasion: OccasionId; budget: number };
  scenario_opened: { scenario: ScenarioId };
  scenario_reset: Record<string, never>;

  // What the user saw
  look_shown: { occasion: OccasionId; budget: number; total: number; remaining: number; product_ids: string[] };
  no_fit_shown: { occasion: OccasionId; budget: number; cheapest_total: number; short_by: number };
  add_to_bag_succeeded: { total: number; item_count: number };
  add_to_bag_failed: { reason: "out_of_stock" | "error"; sold_out_variant_ids: string[] };

  // System
  api_call_completed: { endpoint: string; outcome: "success" | "failure"; duration_ms: number; error?: string };
};

export type AnalyticsEvent = keyof AnalyticsEvents;

type Context = {
  event_id: string;
  session_id: string;
  seq: number;
  ts: string;
  path: string;
  viewport: string;
  user_agent: string;
  locale: string;
  app_version: string;
};

const SESSION_KEY = "drip.analytics.session";
let session: string | null = null;
let seq = 0;

// One session per tab: survives reloads and route changes, ends when the tab closes.
function sessionId(): string {
  if (session) return session;
  let stored: string | null = null;
  try {
    stored = sessionStorage.getItem(SESSION_KEY);
  } catch {
    // Storage can be blocked (private mode, embedded views); fall back to an in-memory session.
  }
  session = stored ?? newId();
  if (!stored) {
    try {
      sessionStorage.setItem(SESSION_KEY, session);
    } catch {}
    emit("session_started", { entry_path: location.pathname, referrer: document.referrer || null });
  }
  return session;
}

function context(): Context {
  return {
    event_id: newId(),
    session_id: sessionId(),
    seq: ++seq,
    ts: new Date().toISOString(),
    path: location.pathname,
    viewport: `${innerWidth}x${innerHeight}`,
    user_agent: navigator.userAgent,
    locale: navigator.language,
    app_version: process.env.NEXT_PUBLIC_APP_VERSION ?? "dev",
  };
}

// The only place that knows where events go.
function send(name: AnalyticsEvent, payload: Record<string, unknown>) {
  console.info(`%c[track]%c ${name}`, "color:#c8312b;font-weight:600", "font-weight:600", payload);
}

function emit<E extends AnalyticsEvent>(name: E, props: AnalyticsEvents[E]) {
  send(name, { event: name, ...context(), properties: props });
}

/** Records a product event. Safe to call anywhere: it does nothing during server rendering. */
export function track<E extends AnalyticsEvent>(name: E, props: AnalyticsEvents[E]) {
  if (typeof window === "undefined") return;
  sessionId(); // starts the session first, so session_started always comes before the event
  emit(name, props);
}
