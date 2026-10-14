import { describe, it, expect } from "vitest";
import {
  isAllowed,
  recordChoices,
  PURPOSES,
  type ConsentContext,
  type ConsentEvent,
} from "./consent.js";
const context: ConsentContext = {
  version: "v1",
  now: 100,
  maxAgeMs: 50,
  gpc: false,
  dnt: false,
};
const event = (patch: Partial<ConsentEvent> = {}): ConsentEvent => ({
  purpose: "analytics",
  decision: "grant",
  version: "v1",
  at: 90,
  ...patch,
});
describe("Purpose-specific fail-closed consent", () => {
  it("requires a current affirmative event", () => {
    expect(isAllowed("analytics", [], context)).toBe(false);
    expect(isAllowed("analytics", [event()], context)).toBe(true);
    expect(isAllowed("google_maps", [event()], context)).toBe(false);
  });
  it.each(["reject", "withdraw"] as const)(
    "blocks %s and selects latest decision",
    (decision) => {
      expect(
        isAllowed("analytics", [event(), event({ decision })], context),
      ).toBe(false);
    },
  );
  it.each([{ version: "old" }, { at: 50 }, { at: 101 }])(
    "blocks obsolete expired or future proof",
    (patch) => {
      expect(isAllowed("analytics", [event(patch)], context)).toBe(false);
    },
  );
  it.each(["analytics", "marketing_email"] as const)(
    "honors GPC and DNT for %s",
    (purpose) => {
      expect(
        isAllowed(purpose, [event({ purpose })], { ...context, gpc: true }),
      ).toBe(false);
      expect(
        isAllowed(purpose, [event({ purpose })], { ...context, dnt: true }),
      ).toBe(false);
    },
  );
  it("does not conflate maps/social or saved location with tracking", () => {
    for (const purpose of PURPOSES.filter(
      (p) => !["analytics", "marketing_email"].includes(p),
    ))
      expect(
        isAllowed(purpose, [event({ purpose })], {
          ...context,
          gpc: true,
          dnt: true,
        }),
      ).toBe(true);
  });
  it("records immutable versioned independent choices", () => {
    const previous = [event()];
    const next = recordChoices(
      previous,
      [{ purpose: "google_maps", decision: "grant" }],
      "v1",
      100,
    );
    expect(next).toHaveLength(2);
    expect(previous).toHaveLength(1);
    expect(next[1]).toEqual({
      purpose: "google_maps",
      decision: "grant",
      version: "v1",
      at: 100,
    });
  });
  it.each([NaN, -1])("rejects invalid time %s", (now) => {
    expect(() =>
      recordChoices(
        [],
        [{ purpose: "analytics", decision: "grant" }],
        "v1",
        now,
      ),
    ).toThrow();
  });
  it("rejects blank version no choices and duplicate purposes", () => {
    expect(() =>
      recordChoices([], [{ purpose: "analytics", decision: "grant" }], "", 100),
    ).toThrow();
    expect(() => recordChoices([], [], "v1", 100)).toThrow();
    expect(() =>
      recordChoices(
        [],
        [
          { purpose: "analytics", decision: "grant" },
          { purpose: "analytics", decision: "withdraw" },
        ],
        "v1",
        100,
      ),
    ).toThrow("Duplicate");
  });
});
