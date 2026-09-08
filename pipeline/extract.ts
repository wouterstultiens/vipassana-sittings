import { type Content, GoogleGenAI } from "@google/genai";
import { convert } from "html-to-text";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { HostExtraction } from "../src/schema/host.ts";
import type { ApiRow } from "./api.ts";
import { absoluteUrl, describeLink, type LinkCheck } from "./links.ts";

export const MODEL = "gemini-2.5-flash";

// The extraction rules next to this file are the system prompt.
export const systemPrompt: string = readFileSync(new URL("./prompt.md", import.meta.url), "utf8");

export class ExtractionError extends Error {}

// One turn in the conversation. Only the two roles the pipeline uses.
export type Turn = { role: "user" | "assistant"; content: string };

// The seam between the prompt work and the API. Returns the model's raw text.
export type AskModel = (turns: Turn[]) => Promise<string>;

// One page as the extraction sees it.
export type PageInput = { url: string; text: string };

// The link checks the extraction sees, keyed by absolute url.
export type Links = Map<string, LinkCheck>;

// A url line, followed by where the url leads when that was checked.
function urlLines(url: string | null, links: Links): string[] {
  const value = url?.trim() || "";
  const link = value ? links.get(absoluteUrl(value)) : undefined;
  return [`url: ${value}`, ...(link ? [describeLink(link)] : [])];
}

// One row: the labelled fields, then the description as text so its href
// values stay visible to the model.
function rowBlock(row: ApiRow, links: Links): string {
  return [
    `### Row ${row.id}`,
    `name: ${row.name}`,
    `short_description: ${row.short_description ?? ""}`,
    ...urlLines(row.url, links),
    `schedule: ${row.schedule ?? ""}`,
    `event_instruction_languages: ${row.event_instruction_languages.join(", ")}`,
    "",
    convert(row.description, { wordwrap: false }).trim(),
  ].join("\n");
}

// The host's own fields once, every row of the host, then every page under
// its own URL.
export function userMessage(rows: ApiRow[], pages: PageInput[], links: Links = new Map()): string {
  const s = rows[0]!.sub_location;
  const host = [
    `id: ${s.id}`,
    `name: ${s.name}`,
    `description: ${s.description ?? ""}`,
    ...urlLines(s.url, links),
    `contact email: ${s.contact_email ?? ""}`,
    `city: ${s.city ?? ""}`,
    `country: ${s.country_iso_code}`,
    `time zone: ${s.time_zone}`,
  ].join("\n");
  return [
    "## Host",
    host,
    "",
    "## Rows",
    ...rows.flatMap((row) => [rowBlock(row, links), ""]),
    ...(pages.length === 0 ? ["## Pages", "No page"] : pages.flatMap((page) => [`## Page ${page.url}`, page.text, ""])),
  ]
    .join("\n")
    .trimEnd();
}

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

// Asks once, and once more with the validation error appended. The previous
// extraction is never sent, so the model cannot anchor on old data.
export async function extractHost(
  ask: AskModel,
  rows: ApiRow[],
  pages: PageInput[],
  links: Links = new Map(),
): Promise<HostExtraction> {
  const turns: Turn[] = [{ role: "user", content: userMessage(rows, pages, links) }];
  let lastProblem = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await ask(turns);
    try {
      const parsed = HostExtraction.safeParse(JSON.parse(raw));
      if (parsed.success) return parsed.data;
      lastProblem = parsed.error.issues
        .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
        .join("; ");
    } catch (error) {
      lastProblem = `not valid JSON: ${messageOf(error)}`;
    }
    turns.push(
      { role: "assistant", content: raw },
      {
        role: "user",
        content: `That output does not fit the schema: ${lastProblem}. Answer again with the whole extraction, corrected.`,
      },
    );
  }
  throw new ExtractionError(lastProblem);
}

// Gemini enforces a subset of JSON Schema: `anyOf` but not `oneOf`, `enum`
// but not `const`. The zod schema is rewritten into that subset, so the
// password union is enforced by the API and not only by zod afterwards.
export function geminiSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(geminiSchema);
  if (schema === null || typeof schema !== "object") return schema;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key === "$schema") continue;
    if (key === "oneOf") out.anyOf = geminiSchema(value);
    else if (key === "const") out.enum = [value];
    else out[key] = geminiSchema(value);
  }
  return out;
}

export const responseJsonSchema: unknown = geminiSchema(z.toJSONSchema(HostExtraction));

// Prompt and answer tokens over every call of one ask, for the score.
export type Usage = { prompt: number; answer: number; calls: number };

// The real call. The client is built on the first ask, so a run that extracts
// nothing needs no API key. The SDK retries on 429 and 5xx by itself.
export function geminiAsk(options: { model?: string; usage?: Usage } = {}): AskModel {
  const { model = MODEL, usage } = options;
  let client: GoogleGenAI | undefined;
  return async (turns) => {
    client ??= new GoogleGenAI({});
    const contents: Content[] = turns.map((t) => ({
      role: t.role === "assistant" ? "model" : "user",
      parts: [{ text: t.content }],
    }));
    const response = await client.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0,
        responseMimeType: "application/json",
        responseJsonSchema,
      },
    });
    if (usage) {
      usage.calls++;
      usage.prompt += response.usageMetadata?.promptTokenCount ?? 0;
      usage.answer += response.usageMetadata?.candidatesTokenCount ?? 0;
    }
    const text = response.text;
    if (!text) throw new ExtractionError(`the model answered with no text (${response.candidates?.[0]?.finishReason})`);
    return text;
  };
}
