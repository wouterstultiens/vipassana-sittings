import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { convert } from "html-to-text";
import { readFileSync } from "node:fs";
import { HostExtraction } from "../src/schema/host.ts";
import type { ApiRow } from "./api.ts";

export const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 8192;

// The extraction rules next to this file are the system prompt.
export const systemPrompt: string = readFileSync(new URL("./prompt.md", import.meta.url), "utf8");

export class ExtractionError extends Error {}

// One turn in the conversation. Only the two roles the pipeline uses.
export type Turn = { role: "user" | "assistant"; content: string };

// The seam between the prompt work and the API. Returns the model's raw text.
export type AskModel = (turns: Turn[]) => Promise<string>;

// One page as the extraction sees it.
export type PageInput = { url: string; text: string };

// One row: the labelled fields, then the description as text so its href
// values stay visible to the model.
function rowBlock(row: ApiRow): string {
  return [
    `### Row ${row.id}`,
    `name: ${row.name}`,
    `short_description: ${row.short_description ?? ""}`,
    `url: ${row.url ?? ""}`,
    `schedule: ${row.schedule ?? ""}`,
    `event_instruction_languages: ${row.event_instruction_languages.join(", ")}`,
    "",
    convert(row.description, { wordwrap: false }).trim(),
  ].join("\n");
}

// The host's own fields once, every row of the host, then every page under
// its own URL.
export function userMessage(rows: ApiRow[], pages: PageInput[]): string {
  const s = rows[0]!.sub_location;
  const host = [
    `id: ${s.id}`,
    `name: ${s.name}`,
    `description: ${s.description ?? ""}`,
    `url: ${s.url ?? ""}`,
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
    ...rows.flatMap((row) => [rowBlock(row), ""]),
    ...(pages.length === 0 ? ["## Pages", "No page"] : pages.flatMap((page) => [`## Page ${page.url}`, page.text, ""])),
  ]
    .join("\n")
    .trimEnd();
}

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

// Asks once, and once more with the validation error appended. The previous
// extraction is never sent, so the model cannot anchor on old data.
export async function extractHost(ask: AskModel, rows: ApiRow[], pages: PageInput[]): Promise<HostExtraction> {
  const turns: Turn[] = [{ role: "user", content: userMessage(rows, pages) }];
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

// The real call. The client is built on the first ask, so a run that extracts
// nothing needs no API key. The SDK keeps its default retries on 429 and 5xx.
//
// `create()` with the same output format, not `parse()`: the retry needs the
// raw text the model wrote, and a schema miss must be a value here, not a
// throw. The API enforces the JSON schema either way.
export function claudeAsk(): AskModel {
  let client: Anthropic | undefined;
  return async (turns) => {
    client ??= new Anthropic();
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0,
      system: systemPrompt,
      messages: turns,
      output_config: { format: zodOutputFormat(HostExtraction) },
    });
    const text = message.content.find((block) => block.type === "text");
    if (!text) throw new ExtractionError(`the model answered with no text (${message.stop_reason})`);
    return text.text;
  };
}
