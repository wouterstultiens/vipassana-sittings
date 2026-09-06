// Folds the sittings of one day into slots, the rows of a day list, and
// works out which language tags a row carries and whether it has ended.
import type { Sitting } from "@/lib/expand";
import { languageFlag, type LanguageFlag } from "@/lib/labels";

/** The sittings of one day that share a start instant and a length. One row on the day list. */
export type Slot = {
  key: string;
  start: Date;
  end: Date;
  durationMinutes: number; // rounded to the half hour, so 65 minutes reads as one hour
  sittings: Sitting[];
};

const HALF_HOUR = 30;

export const roundLength = (minutes: number) => Math.max(HALF_HOUR, Math.round(minutes / HALF_HOUR) * HALF_HOUR);

/** Folds sittings into slots, by start and then by length. Sittings inside a slot keep their order. */
export function slotsOf(sittings: Sitting[]): Slot[] {
  const slots = new Map<string, Slot>();
  for (const s of sittings) {
    const durationMinutes = roundLength(s.rule.durationMinutes);
    const key = `${s.start.getTime()}-${durationMinutes}`;
    const slot = slots.get(key);
    if (slot) slot.sittings.push(s);
    else
      slots.set(key, {
        key,
        start: s.start,
        end: new Date(s.start.getTime() + durationMinutes * 60_000),
        durationMinutes,
        sittings: [s],
      });
  }
  return [...slots.values()].sort((a, b) => a.start.getTime() - b.start.getTime() || a.durationMinutes - b.durationMinutes);
}

/** One language tag: a flag, or the code when no flag is mapped. Languages that share a flag share a tag. */
export type LanguageTag = { flag: LanguageFlag | null; codes: string[] };

/** The languages of the sittings that do not offer English, sorted, one tag per flag. */
export function languageTags(slot: Slot): LanguageTag[] {
  const codes = [...new Set(slot.sittings.filter((s) => !s.listing.languages.includes("en")).flatMap((s) => s.listing.languages))].sort();
  const byFlag = new Map<string, LanguageTag>();
  for (const code of codes) {
    const flag = languageFlag(code);
    const tag = byFlag.get(flag ?? code);
    if (tag) tag.codes.push(code);
    else byFlag.set(flag ?? code, { flag, codes: [code] });
  }
  return [...byFlag.values()];
}

/** Splits today's slots into the ones that have ended and the rest, which are in progress or ahead. */
export function endedSlots(slots: Slot[], now: Date): { ended: Slot[]; rest: Slot[] } {
  return {
    ended: slots.filter((s) => s.end <= now),
    rest: slots.filter((s) => s.end > now),
  };
}
