import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import type { HostExtraction } from "../src/schema/host.ts";
import type { ApiRow } from "./api.ts";
import { ExtractionError, extractHost, geminiSchema, responseJsonSchema, systemPrompt, userMessage } from "./extract.ts";

const row = JSON.parse(readFileSync(new URL("./fixtures/api-row.json", import.meta.url), "utf8")) as ApiRow;

const valid: HostExtraction = {
  name: "Example",
  timeZone: "Europe/Amsterdam",
  languages: ["en"],
  medium: "video",
  teacherLed: false,
  questionsAndAnswers: false,
  pageUrl: null,
  rules: [],
};

describe("systemPrompt", () => {
  it("is the extraction rules", () => {
    expect(systemPrompt).toContain("Extract the sittings");
  });
});

describe("userMessage", () => {
  it("labels the host fields the model reads", () => {
    const text = userMessage([row], []);
    expect(text).toContain("time zone: Europe/Amsterdam");
    expect(text).toContain("schedule: Mon, Thu");
  });

  it("carries every row of the host under its own id", () => {
    const text = userMessage([row, { ...row, id: 4243, name: "Second row" }], []);
    expect(text).toContain("### Row 4242");
    expect(text).toContain("### Row 4243\nname: Second row");
  });

  it("turns the description into text, keeping its links", () => {
    const text = userMessage([row], []);
    expect(text).not.toContain("<p>");
    expect(text).toContain("https://example.invalid/j/1234");
  });

  it("says where a checked url leads, under the url line", () => {
    const teams = "https://teams.microsoft.com/l/x";
    const links = new Map([
      ["https://a.invalid/sit", { url: "https://a.invalid/sit", status: 200, finalUrl: teams, error: null }],
      ["https://www.dhamma.org/os", { url: "https://www.dhamma.org/os", status: 404, finalUrl: null, error: null }],
    ]);
    const host = { ...row, url: "https://a.invalid/sit", sub_location: { ...row.sub_location, url: "/os" } };
    const text = userMessage([host], [], links);
    expect(text).toContain("url: https://a.invalid/sit\nleads to: status 200, lands on teams.microsoft.com");
    expect(text).toContain("url: /os\nleads to: status 404");
  });

  it("says so when there is no page", () => {
    expect(userMessage([row], [])).toContain("No page");
  });

  it("carries every page in its own block, headed by its url", () => {
    const text = userMessage(
      [row],
      [
        { url: "https://a.invalid/os/", text: "Sittings on Monday" },
        { url: "https://b.invalid/world/", text: "World table" },
      ],
    );
    expect(text).toContain("## Page https://a.invalid/os/\nSittings on Monday");
    expect(text).toContain("## Page https://b.invalid/world/\nWorld table");
    expect(text).not.toContain("No page");
  });
});

describe("extractHost", () => {
  it("gives the extraction on the first answer", async () => {
    const ask = vi.fn().mockResolvedValue(JSON.stringify(valid));
    await expect(extractHost(ask, [row], [])).resolves.toEqual(valid);
    expect(ask).toHaveBeenCalledOnce();
  });

  it("retries once with the validation error appended", async () => {
    const ask = vi
      .fn()
      .mockResolvedValueOnce(JSON.stringify({ ...valid, medium: "hologram" }))
      .mockResolvedValueOnce(JSON.stringify(valid));
    await expect(extractHost(ask, [row], [])).resolves.toEqual(valid);
    const turns = ask.mock.calls[1]![0];
    expect(turns).toHaveLength(3);
    expect(turns[1].role).toBe("assistant");
    expect(turns[2].content).toContain("medium");
  });

  it("retries on an answer that is not JSON", async () => {
    const ask = vi.fn().mockResolvedValueOnce("sorry, here it is:").mockResolvedValueOnce(JSON.stringify(valid));
    await expect(extractHost(ask, [row], [])).resolves.toEqual(valid);
    expect(ask.mock.calls[1]![0][2].content).toContain("not valid JSON");
  });

  it("fails after a second bad answer, naming the problem", async () => {
    const ask = vi.fn().mockResolvedValue(JSON.stringify({ ...valid, languages: [] }));
    await expect(extractHost(ask, [row], [])).rejects.toThrow(ExtractionError);
    expect(ask).toHaveBeenCalledTimes(2);
  });
});

describe("geminiSchema", () => {
  it("rewrites the schema into the subset Gemini enforces", () => {
    const schema = geminiSchema({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: { kind: { oneOf: [{ type: "string", const: "none" }, { type: "string", const: "given" }] } },
    });
    expect(schema).toEqual({
      type: "object",
      properties: { kind: { anyOf: [{ type: "string", enum: ["none"] }, { type: "string", enum: ["given"] }] } },
    });
  });

  it("is what the pipeline sends for a host", () => {
    expect(JSON.stringify(responseJsonSchema)).not.toMatch(/"oneOf"|"const"|"\$schema"/);
  });
});
