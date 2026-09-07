// The five filters: three option lists and two yes-or-no boxes. On a laptop
// each list is a popover menu in the toolbar; on a phone the same lists open
// as checkbox groups in a bottom sheet. The calendar answers "which day" and
// "which hour" on its own, so the filters ask only what a row cannot show.
// Until the old student touches a filter, a pulsing ring points at them.
import * as React from "react";
import { ChevronDownIcon, FilterXIcon } from "lucide-react";
import type { Listing } from "@/schema/listing";
import { activeCount, DURATION_LABEL, EMPTY_FILTERS, toggle, TOGGLE_LABEL, type Filters, type SetFilters, type ToggleKey } from "@/lib/filters";
import { languageFlag, languageName, MEDIUM_LABEL, sortLanguages, type LanguageFlag } from "@/lib/labels";
import { FlagIcon } from "@/components/FlagIcon";
import { Nudge } from "@/components/Nudge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// The filters that hold a list of chosen options, as opposed to the two yes-or-no boxes.
type ChoiceKey = "durations" | "languages" | "medium";
type Choice = { key: ChoiceKey; label: string; options: { value: string; label: string; flag?: LanguageFlag | null }[] };

const keysOf = <T extends string>(record: Record<T, string>) => Object.keys(record) as T[];

function useChoices(listings: Listing[]) {
  return React.useMemo(() => {
    const languages = sortLanguages([...new Set(listings.flatMap((l) => l.languages))]);
    const durations: Choice = {
      key: "durations",
      label: "Length",
      options: keysOf(DURATION_LABEL).map((k) => ({ value: k, label: DURATION_LABEL[k] })),
    };
    const language: Choice = {
      key: "languages",
      label: "Language",
      options: languages.map((code) => ({ value: code, label: languageName(code), flag: languageFlag(code) })),
    };
    const medium: Choice = {
      key: "medium",
      label: "Medium",
      options: keysOf(MEDIUM_LABEL).map((k) => ({ value: k, label: MEDIUM_LABEL[k] })),
    };
    return [language, durations, medium];
  }, [listings]);
}

// The option lists are typed by their key; the menus only see strings.
const onToggle = (setFilters: SetFilters, key: ChoiceKey) => (value: string) =>
  setFilters((prev) => ({ ...prev, [key]: toggle<string>(prev[key], value) }));

const flip = (setFilters: SetFilters, key: ToggleKey) => () =>
  setFilters((prev) => ({ ...prev, [key]: prev[key] ? null : true }));

const TOGGLE_KEYS: ToggleKey[] = ["teacherLed", "questionsAndAnswers"];

/** Past this many options the list runs in two columns, read down then across, so the languages fit in one screen. */
const ONE_COLUMN_MAX = 8;

const OPTION = "flex cursor-pointer items-center gap-2 rounded px-1 text-sm hover:bg-accent";

function Options({ choice, selected, onToggle }: { choice: Choice; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <ul className={cn("space-y-1", choice.options.length > ONE_COLUMN_MAX && "columns-2 gap-x-2 [&>li]:break-inside-avoid")}>
      {choice.options.map((option) => (
        <li key={option.value}>
          <label className={cn(OPTION, "py-1 md:py-0.5")}>
            <input type="checkbox" checked={selected.includes(option.value)} onChange={() => onToggle(option.value)} />
            {option.flag && <FlagIcon flag={option.flag} />}
            <span className="truncate">{option.label}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}

/** The two yes-or-no filters as checkboxes, so they look like the options and read as something to tick. */
function Toggles({
  filters,
  setFilters,
  wording,
  className,
}: {
  filters: Filters;
  setFilters: SetFilters;
  wording: "long" | "toolbar"; // the toolbar has no room for the full name, so it goes on hover
  className?: string;
}) {
  return (
    <>
      {TOGGLE_KEYS.map((key) => (
        <label key={key} title={wording === "toolbar" ? TOGGLE_LABEL[key].long : undefined} className={cn(OPTION, className)}>
          <input type="checkbox" checked={filters[key] === true} onChange={flip(setFilters, key)} />
          {TOGGLE_LABEL[key][wording]}
        </label>
      ))}
    </>
  );
}

/** The laptop toolbar: one popover menu per option list, the two checkboxes, and Clear. */
export function FilterToolbar({
  listings,
  filters,
  setFilters,
  nudge,
}: {
  listings: Listing[];
  filters: Filters;
  setFilters: SetFilters;
  nudge: boolean; // ring the filters until one is chosen or a menu is opened
}) {
  const choices = useChoices(listings);
  const [noticed, setNoticed] = React.useState(false);
  return (
    <Nudge on={nudge && !noticed} className="flex flex-wrap items-center gap-2">
      {choices.map((choice) => (
        <Popover key={choice.key} onOpenChange={() => setNoticed(true)}>
          <PopoverTrigger asChild>
            <Button variant={filters[choice.key].length ? "default" : "outline"} size="sm">
              {choice.label}
              {filters[choice.key].length > 0 && <span className="rounded-full bg-white/30 px-1.5">{filters[choice.key].length}</span>}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className={cn("max-h-[80vh] overflow-y-auto", choice.options.length > ONE_COLUMN_MAX && "w-96")}>
            <Options choice={choice} selected={filters[choice.key]} onToggle={onToggle(setFilters, choice.key)} />
          </PopoverContent>
        </Popover>
      ))}
      <Toggles filters={filters} setFilters={setFilters} wording="toolbar" className="h-8" />
      {activeCount(filters) > 0 && (
        <Button variant="ghost" size="sm" onClick={() => setFilters(() => EMPTY_FILTERS)}>
          <FilterXIcon /> Clear
        </Button>
      )}
    </Nudge>
  );
}

/** The same filters laid out for a bottom sheet: every option list open, the two checkboxes as a last group. */
export function FilterFields({ listings, filters, setFilters }: { listings: Listing[]; filters: Filters; setFilters: SetFilters }) {
  const choices = useChoices(listings);
  return (
    <div className="space-y-5">
      {choices.map((choice) => (
        <fieldset key={choice.key}>
          <legend className="mb-1 text-sm font-semibold">{choice.label}</legend>
          <Options choice={choice} selected={filters[choice.key]} onToggle={onToggle(setFilters, choice.key)} />
        </fieldset>
      ))}
      <fieldset>
        <legend className="mb-1 text-sm font-semibold">Also</legend>
        <div className="space-y-1">
          <Toggles filters={filters} setFilters={setFilters} wording="long" className="py-1" />
        </div>
      </fieldset>
    </div>
  );
}
