import { describe, expect, it } from "vitest";
import type { Host } from "../src/schema/host.ts";
import { diffFields } from "./diff.ts";

const host = { id: 1, medium: "video", languages: ["en"] } as unknown as Host;

describe("diffFields", () => {
  it("gives nothing for two equal hosts", () => {
    expect(diffFields(host, { ...host })).toEqual([]);
  });

  it("names the field, the old value and the new one", () => {
    const after = { ...host, medium: "audio" } as Host;
    expect(diffFields(host, after)).toEqual(['medium: "video" -> "audio"']);
  });

  it("cuts a long value", () => {
    const after = { ...host, languages: Array(80).fill("en") } as unknown as Host;
    expect(diffFields(host, after)[0]!.length).toBeLessThan(300);
  });
});
