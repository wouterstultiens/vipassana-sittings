// The one LLM call: an API listing, plus its host page text when one is
// listed, becomes a validated ListingExtraction. Shared by refresh and eval.
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { readFileSync } from "node:fs";
import { convert } from "html-to-text";
import { ListingExtraction } from "../src/schema/listing.ts";
import type { ApiListing } from "./api.ts";

export const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 4096;

const ROLE = `You read one listing of a virtual group sitting in the Vipassana tradition of
S.N. Goenka and return its structured form. Follow the rules below exactly.
Precedence when the sources disagree: host page, description, listing fields,
host record.`;

const rules = readFileSync(new URL("./prompt.md", import.meta.url), "utf8");
export const systemPrompt = `${ROLE}\n\n${rules}`;

// zodOutputFormat carries both the JSON schema the API enforces and the local
// Zod check. It goes to messages.create() rather than messages.parse() so a
// failed check still leaves the raw answer in hand for the retry turn.
const format = zodOutputFormat(ListingExtraction);

export class ExtractionError extends Error {}

const field = (label: string, value: string | null) =>
  value === null || value.trim() === "" ? `${label}: -` : `${label}: ${value.trim()}`;

// The labelled API fields, then the description as text so hrefs stay visible,
// then the host page text or the line that there is none.
export function buildUserMessage(api: ApiListing, pageText: string | null): string {
  const s = api.sub_location;
  return [
    "# Listing fields",
    field("Name", api.name),
    field("Short description", api.short_description),
    field("Listing URL", api.url),
    field("Schedule field", api.schedule),
    field("Instruction languages", api.event_instruction_languages.join(", ")),
    "",
    "# Host record",
    field("Name", s.name),
    field("Description", s.description),
    field("URL", s.url),
    field("Contact email", s.contact_email),
    field("City", s.city),
    field("Country", s.country_iso_code),
    field("Time zone", s.time_zone),
    "",
    "# Description",
    convert(api.description, { wordwrap: false }).trim() || "-",
    "",
    "# Host page",
    pageText ?? "No host page",
  ].join("\n");
}

let client: Anthropic | undefined;
const anthropic = () => (client ??= new Anthropic());

const answerText = (content: { type: string; text?: string }[]) =>
  content
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("");

// Calls the model once, then once more with the failure appended when the
// answer does not fit the schema. Throws ExtractionError on a second failure.
export async function extract(api: ApiListing, pageText: string | null): Promise<ListingExtraction> {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: buildUserMessage(api, pageText) },
  ];
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const answer = await anthropic().messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0,
      system: systemPrompt,
      messages,
      output_config: { format },
    });
    const text = answerText(answer.content);
    try {
      return format.parse(text);
    } catch (e) {
      lastError = (e as Error).message;
      messages.push(
        { role: "assistant", content: text },
        { role: "user", content: `That answer did not fit the schema:\n${lastError}\nAnswer again.` },
      );
    }
  }
  throw new ExtractionError(lastError);
}
