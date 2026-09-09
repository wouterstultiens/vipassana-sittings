// One row on a day list: the start time, how many sittings start then, and
// at the right the tags for what varies: a flag per language on offer, as
// many as the row's width allows, the length when it is not one hour, and
// "apply" when a sitting here asks the old student to sign up first.
import * as React from "react";
import { type Clock, fmtLength, fmtTime } from "@/lib/labels";
import { asksToApply, languageTags, tagsThatFit, type Slot } from "@/lib/slots";
import { LanguageTagView, tagTitle } from "@/components/LanguageTag";
import { cn } from "@/lib/utils";

export type SlotState = "ahead" | "now" | "ended";

export const SlotRow = React.memo(function SlotRow({
  slot,
  zone,
  clock,
  state,
  width,
  onOpen,
}: {
  slot: Slot;
  zone: string;
  clock: Clock;
  state: SlotState;
  width: number; // of the row, in px, 0 before the grid is measured
  onOpen: (slot: Slot) => void;
}) {
  const count = slot.sittings.length;
  const languages = languageTags(slot);
  const length = slot.durationMinutes === 60 ? null : fmtLength(slot.durationMinutes);
  const apply = asksToApply(slot);
  const shown = languages.slice(
    0,
    tagsThatFit({
      count: languages.length,
      rowWidth: width,
      digits: String(count).length,
      hasLength: length !== null,
      asksToApply: apply,
      clock,
    }),
  );
  const more = languages.length - shown.length;
  const label = [
    fmtTime(slot.start, zone, clock),
    `${count} ${count === 1 ? "sitting" : "sittings"}`,
    ...languages.map(tagTitle),
    length ?? "",
    apply ? "sign up first" : "",
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
        "flex h-7 w-full items-center gap-2 overflow-hidden rounded-md border bg-card px-2 text-left text-sm hover:bg-accent active:bg-accent md:h-6",
        state === "now" && "border-primary bg-primary/10 hover:bg-primary/15 active:bg-primary/15",
        state === "ended" && "opacity-50",
      )}
    >
      <span className="shrink-0 font-semibold tabular-nums">{fmtTime(slot.start, zone, clock)}</span>
      <span className="text-muted-foreground tabular-nums">{count}</span>
      <span className="ml-auto flex shrink-0 items-center gap-1">
        {shown.map((t) => (
          <LanguageTagView key={t.codes[0]} tag={t} />
        ))}
        {more > 0 && <span className="text-[10px] text-muted-foreground">+{more}</span>}
        {length && <span className="rounded-sm border px-1 text-[10px] leading-4 whitespace-nowrap text-muted-foreground">{length}</span>}
        {apply && (
          <span
            title="Sign up first"
            className="rounded-sm border border-amber-500/50 px-1 text-[10px] leading-4 whitespace-nowrap text-amber-700 dark:text-amber-400"
          >
            apply
          </span>
        )}
      </span>
    </button>
  );
});
