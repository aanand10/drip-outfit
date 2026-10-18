// crypto.randomUUID only exists in secure contexts, so it's missing when the dev
// server is opened over plain http on the LAN; getRandomValues works everywhere.
export function newId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
