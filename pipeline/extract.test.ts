import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import type { ListingExtraction } from "../src/schema/listing.ts";
import type { ApiListing } from "./api.ts";
import { ExtractionError, extractListing, systemPrompt, userMessage } from "./extract.ts";

const api = JSON.parse(
  readFileSync(new URL("./fixtures/api-listing.json", import.meta.url), "utf8"),
) as ApiListing;

const valid: ListingExtraction = {
  languages: ["en"],
  medium: "video",
  teacherLed: false,
  questionsAndAnswers: false,
  platform: "zoom",
  join: { url: null, meetingId: null, password: { kind: "old-student" }, dialIn: null },
  scheduleRules: [],
};

describe("systemPrompt", () => {
  it("is the extraction rules", () => {
    expect(systemPrompt).toContain("# Extraction rules");
  });
});

describe("userMessage", () => {
  it("labels the api fields the model reads", () => {
    const text = userMessage(api, null);
    expect(text).toContain("host time zone: Europe/Amsterdam");
    expect(text).toContain("schedule: Mon, Thu");
  });

  it("turns the description into text, keeping its links", () => {
    const text = userMessage(api, null);
    expect(text).not.toContain("<p>");
    expect(text).toContain("https://example.invalid/j/1234");
  });

  it("says so when there is no host page", () => {
    expect(userMessage(api, null)).toContain("No host page");
  });

  it("carries the host page text in its own block", () => {
    expect(userMessage(api, "Sittings on Monday")).toContain("## Host page\nSittings on Monday");
  });
});

describe("extractListing", () => {
  it("gives the extraction on the first answer", async () => {
    const ask = vi.fn().mockResolvedValue(JSON.stringify(valid));
    await expect(extractListing(ask, api, null)).resolves.toEqual(valid);
    expect(ask).toHaveBeenCalledOnce();
  });

  it("retries once with the validation error appended", async () => {
    const ask = vi
      .fn()
      .mockResolvedValueOnce(JSON.stringify({ ...valid, medium: "hologram" }))
      .mockResolvedValueOnce(JSON.stringify(valid));
    await expect(extractListing(ask, api, null)).resolves.toEqual(valid);
    const turns = ask.mock.calls[1]![0];
    expect(turns).toHaveLength(3);
    expect(turns[1].role).toBe("assistant");
    expect(turns[2].content).toContain("medium");
  });

  it("retries on an answer that is not JSON", async () => {
    const ask = vi.fn().mockResolvedValueOnce("sorry, here it is:").mockResolvedValueOnce(
      JSON.stringify(valid),
    );
    await expect(extractListing(ask, api, null)).resolves.toEqual(valid);
    expect(ask.mock.calls[1]![0][2].content).toContain("not valid JSON");
  });

  it("fails after a second bad answer, naming the problem", async () => {
    const ask = vi.fn().mockResolvedValue(JSON.stringify({ ...valid, languages: [] }));
    await expect(extractListing(ask, api, null)).rejects.toThrow(ExtractionError);
    expect(ask).toHaveBeenCalledTimes(2);
  });
});
