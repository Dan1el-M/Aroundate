export const PURPOSES = [
  "analytics",
  "marketing_email",
  "google_maps",
  "instagram_embeds",
  "tiktok_embeds",
  "saved_location",
] as const;
export type Purpose = (typeof PURPOSES)[number];
export type Decision = "grant" | "reject" | "withdraw";
export interface ConsentEvent {
  purpose: Purpose;
  decision: Decision;
  version: string;
  at: number;
}
export interface ConsentContext {
  version: string;
  now: number;
  maxAgeMs: number;
  gpc: boolean;
  dnt: boolean;
}
export function isAllowed(
  purpose: Purpose,
  events: readonly ConsentEvent[],
  context: ConsentContext,
): boolean {
  if (
    (purpose === "analytics" || purpose === "marketing_email") &&
    (context.gpc || context.dnt)
  )
    return false;
  const latest = events.filter((event) => event.purpose === purpose).at(-1);
  if (!latest) return false;
  return (
    latest.decision === "grant" &&
    latest.version === context.version &&
    latest.at <= context.now &&
    context.now - latest.at < context.maxAgeMs
  );
}
export function recordChoices(
  events: readonly ConsentEvent[],
  choices: readonly { purpose: Purpose; decision: Decision }[],
  version: string,
  now: number,
): ConsentEvent[] {
  if (!Number.isFinite(now) || now < 0 || !version || choices.length === 0)
    throw new Error("Invalid consent event");
  if (new Set(choices.map((choice) => choice.purpose)).size !== choices.length)
    throw new Error("Duplicate consent purpose");
  return [
    ...events,
    ...choices.map((choice) => ({ ...choice, version, at: now })),
  ];
}
