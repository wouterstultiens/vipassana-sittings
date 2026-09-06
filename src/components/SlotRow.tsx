// One row on a day list: the start time, how many sittings start then, and
// at the right the tags for what varies: a flag per language without English,
// and the length when it is not one hour.
import {
  BG,
  BR,
  CN,
  DK,
  ES,
  FI,
  FR,
  HU,
  IL,
  IN,
  IR,
  IT,
  JP,
  KR,
  MM,
  NL,
  NO,
  RU,
  SA,
  SE,
  TH,
} from "country-flag-icons/react/3x2";
import { fmtDuration, fmtTime, languageTitle, type LanguageFlag } from "@/lib/labels";
import { languageTags, type LanguageTag, type Slot } from "@/lib/slots";
import { cn } from "@/lib/utils";

// Every flag the language map names. The type keeps the two maps in step.
const FLAG: Record<LanguageFlag, typeof ES> = { BG, BR, CN, DK, ES, FI, FR, HU, IL, IN, IR, IT, JP, KR, MM, NL, NO, RU, SA, SE, TH };

const MAX_LANGUAGE_TAGS = 3;

const tagTitle = (tag: LanguageTag) => tag.codes.map(languageTitle).join(", ");

function LanguageTagView({ tag }: { tag: LanguageTag }) {
  const title = tagTitle(tag);
  if (tag.flag) {
    const Flag = FLAG[tag.flag];
    return (
      <span role="img" title={title} aria-label={title} className="inline-flex">
        <Flag aria-hidden className="h-3.5 w-[21px] rounded-[2px] ring-1 ring-black/10 dark:ring-white/15" />
      </span>
    );
  }
  return (
    <span title={title} aria-label={title} className="rounded-sm border px-1 font-mono text-[10px] leading-4 lowercase">
      {tag.codes[0]}
    </span>
  );
}

export type SlotState = "ahead" | "now" | "ended";

export function SlotRow({ slot, zone, state, onOpen }: { slot: Slot; zone: string; state: SlotState; onOpen: (slot: Slot) => void }) {
  const count = slot.sittings.length;
  const languages = languageTags(slot);
  const shown = languages.slice(0, MAX_LANGUAGE_TAGS);
  const more = languages.length - shown.length;
  const length = slot.durationMinutes === 60 ? null : fmtDuration(slot.durationMinutes);
  const label = [
    fmtTime(slot.start, zone),
    `${count} ${count === 1 ? "sitting" : "sittings"}`,
    ...languages.map(tagTitle),
    length ?? "",
    state === "now" ? "in progress" : "",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <button
      type="button"
      onClick={() => onOpen(slot)}
      aria-label={label}
      className={cn(
        "flex h-11 w-full items-center gap-2 rounded-md border bg-card px-2.5 text-left text-sm transition-colors hover:bg-accent md:h-9",
        state === "now" && "border-primary bg-primary/10 hover:bg-primary/15",
        state === "ended" && "opacity-50",
      )}
    >
      <span className="font-semibold tabular-nums">{fmtTime(slot.start, zone)}</span>
      <span className="text-muted-foreground tabular-nums">{count}</span>
      <span className="ml-auto flex items-center gap-1">
        {shown.map((t) => (
          <LanguageTagView key={t.codes[0]} tag={t} />
        ))}
        {more > 0 && <span className="text-[10px] text-muted-foreground">+{more}</span>}
        {length && <span className="rounded-sm border px-1 text-[10px] leading-4 whitespace-nowrap text-muted-foreground">{length}</span>}
      </span>
    </button>
  );
}
