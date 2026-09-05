import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { convert } from "html-to-text";
import { readFileSync } from "node:fs";
import { ListingExtraction } from "../src/schema/listing.ts";
import type { ApiListing } from "./api.ts";

export const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 4096;

// The extraction rules next to this file are the system prompt.
export const systemPrompt: string = readFileSync(new URL("./prompt.md", import.meta.url), "utf8");

export class ExtractionError extends Error {}

// One turn in the conversation. Only the two roles the pipeline uses.
export type Turn = { role: "user" | "assistant"; content: string };

// The seam between the prompt work and the API. Returns the model's raw text.
export type AskModel = (turns: Turn[]) => Promise<string>;

// The labelled API fields, decision 13 of the refresh pipeline. The description
// goes in as text so its href values stay visible to the model.
export function userMessage(api: ApiListing, pageText: string | null): string {
  const s = api.sub_location;
  const block = [
    `id: ${api.id}`,
    `name: ${api.name}`,
    `short_description: ${api.short_description ?? ""}`,
    `url: ${api.url ?? ""}`,
    `schedule: ${api.schedule ?? ""}`,
    `event_instruction_languages: ${api.event_instruction_languages.join(", ")}`,
    `host name: ${s.name}`,
    `host description: ${s.description ?? ""}`,
    `host url: ${s.url ?? ""}`,
    `host contact email: ${s.contact_email ?? ""}`,
    `host city: ${s.city ?? ""}`,
    `host country: ${s.country_iso_code}`,
    `host time zone: ${s.time_zone}`,
  ].join("\n");
  return [
    "## Listing fields",
    block,
    "",
    "## Description",
    convert(api.description, { wordwrap: false }).trim(),
    "",
    "## Host page",
    pageText ?? "No host page",
  ].join("\n");
}

const issuesOf = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

// Asks once, and once more with the validation error appended. The previous
// extraction is never sent, so the model cannot anchor on old data.
export async function extractListing(
  ask: AskModel,
  api: ApiListing,
  pageText: string | null,
): Promise<ListingExtraction> {
  const turns: Turn[] = [{ role: "user", content: userMessage(api, pageText) }];
  let lastProblem = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await ask(turns);
    try {
      const parsed = ListingExtraction.safeParse(JSON.parse(raw));
      if (parsed.success) return parsed.data;
      lastProblem = parsed.error.issues
        .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
        .join("; ");
    } catch (error) {
      lastProblem = `not valid JSON: ${issuesOf(error)}`;
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
      output_config: { format: zodOutputFormat(ListingExtraction) },
    });
    const text = message.content.find((block) => block.type === "text");
    if (!text) throw new ExtractionError(`the model answered with no text (${message.stop_reason})`);
    return text.text;
  };
}
