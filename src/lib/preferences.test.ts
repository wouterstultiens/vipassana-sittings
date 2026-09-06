import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS } from "@/lib/filters";
import { readPreferences, writePreferences } from "@/lib/preferences";

const memory = (): Storage => {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: () => null,
    length: 0,
  };
};

describe("preferences", () => {
  it("reads back what it wrote", () => {
    const storage = memory();
    const prefs = { zone: "Asia/Kolkata", filters: { ...EMPTY_FILTERS, languages: ["hi"], teacherLed: true } };
    writePreferences(storage, prefs);
    expect(readPreferences(storage)).toEqual(prefs);
  });

  it("keeps a null zone, which means follow the device", () => {
    const storage = memory();
    writePreferences(storage, { zone: null, filters: EMPTY_FILTERS });
    expect(readPreferences(storage)).toEqual({ zone: null, filters: EMPTY_FILTERS });
  });

  it("gives nothing when the store is empty or broken", () => {
    const storage = memory();
    expect(readPreferences(storage)).toBeNull();
    storage.setItem("vipassana-sittings", "{not json");
    expect(readPreferences(storage)).toBeNull();
    storage.setItem("vipassana-sittings", JSON.stringify({ zone: "Mars/Olympus", filters: EMPTY_FILTERS }));
    expect(readPreferences(storage)).toBeNull();
    storage.setItem("vipassana-sittings", JSON.stringify({ zone: "UTC", filters: { durations: ["week"] } }));
    expect(readPreferences(storage)).toBeNull();
  });
});
