// Folds the sittings of one day into slots, the rows of a day list, works out
// which language tags a row carries, and how many of them fit.
import type { Sitting } from "@/lib/expand";
import { type Clock, languageFlag, type LanguageFlag } from "@/lib/labels";

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

const englishFirst = (a: string, b: string) => (a === "en" ? -1 : b === "en" ? 1 : a.localeCompare(b));

/** The tags for a set of language codes, English first, one tag per flag. */
export function languageTagsOf(languages: string[]): LanguageTag[] {
  const codes = [...new Set(languages)].sort(englishFirst);
  const byFlag = new Map<string, LanguageTag>();
  for (const code of codes) {
    const flag = languageFlag(code);
    const tag = byFlag.get(flag ?? code);
    if (tag) tag.codes.push(code);
    else byFlag.set(flag ?? code, { flag, codes: [code] });
  }
  return [...byFlag.values()];
}

/**
 * Every language on offer in the slot. So a row with only a Spanish flag has
 * no English, and a row with both flags has both.
 */
export const languageTags = (slot: Slot): LanguageTag[] => languageTagsOf(slot.sittings.flatMap((s) => s.host.languages));

/** True when a sitting in the slot asks the old student to sign up first, so the row says so before they plan it. */
export const asksToApply = (slot: Slot): boolean => slot.sittings.some((s) => s.rule.applyFirst);

// Widths in px of what a row holds, near enough to decide how many tags fit.
const TAG_WIDTH = 25; // a 21 px flag and its 4 px gap
const MORE_WIDTH = 20; // "+N"
const LENGTH_WIDTH = 34; // "2½ h"
const APPLY_WIDTH = 44; // "apply"
const FIXED_WIDTH = 78; // padding, gaps, the time, and a one-digit count
const DIGIT_WIDTH = 8;
const MERIDIEM_WIDTH = 18; // what " PM" adds to the time on a 12-hour clock

/**
 * How many language tags a row of the given width shows: all of them when
 * they fit, else as many as fit next to a "+N". The length and the apply tag
 * come first, because they say what the flags cannot. Before the row is
 * measured (width 0) it shows up to three.
 */
export function tagsThatFit(row: {
  count: number;
  rowWidth: number;
  digits: number;
  hasLength: boolean;
  asksToApply: boolean;
  clock: Clock;
}): number {
  const { count, rowWidth, digits, hasLength, clock } = row;
  if (rowWidth <= 0) return Math.min(count, 3);
  const room =
    rowWidth -
    FIXED_WIDTH -
    DIGIT_WIDTH * (digits - 1) -
    (hasLength ? LENGTH_WIDTH : 0) -
    (row.asksToApply ? APPLY_WIDTH : 0) -
    (clock === "12h" ? MERIDIEM_WIDTH : 0) +
    4; // the last tag has no gap
  if (count * TAG_WIDTH <= room) return count;
  return Math.max(1, Math.floor((room - MORE_WIDTH) / TAG_WIDTH));
}
