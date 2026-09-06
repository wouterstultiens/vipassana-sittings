// The five filters: three option lists and two toggles. On a laptop each list
// is a popover menu in the toolbar; on a phone the same lists open as
// checkbox groups in a bottom sheet. The calendar answers "which day" and
// "which hour" on its own, so the filters ask only what a row cannot show.
import * as React from "react";
import { ChevronDownIcon, FilterXIcon } from "lucide-react";
import type { Listing } from "@/schema/listing";
import { activeCount, DURATION_LABEL, EMPTY_FILTERS, toggle, type Filters } from "@/lib/filters";
import { languageName, MEDIUM_LABEL, sortLanguages } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// The filters that hold a list of chosen options, as opposed to the two toggles.
type ChoiceKey = "durations" | "languages" | "medium";
type Choice<K extends ChoiceKey> = { key: K; label: string; options: { value: Filters[K][number]; label: string }[] };
type SetFilters = (update: (f: Filters) => Filters) => void;

const keysOf = <T extends string>(record: Record<T, string>) => Object.keys(record) as T[];

/** The language of the browser, first in the language list when the data has it. */
const browserLanguage = () => (typeof navigator === "undefined" ? "en" : navigator.language.split("-")[0]);

function useChoices(listings: Listing[]) {
  return React.useMemo(() => {
    const languages = sortLanguages([...new Set(listings.flatMap((l) => l.languages))], browserLanguage());
    const durations: Choice<"durations"> = {
      key: "durations",
      label: "Length",
      options: keysOf(DURATION_LABEL).map((k) => ({ value: k, label: DURATION_LABEL[k] })),
    };
    const language: Choice<"languages"> = {
      key: "languages",
      label: "Language",
      options: languages.map((code) => ({ value: code, label: languageName(code) })),
    };
    const medium: Choice<"medium"> = {
      key: "medium",
      label: "Video or audio",
      options: keysOf(MEDIUM_LABEL).map((k) => ({ value: k, label: MEDIUM_LABEL[k] })),
    };
    return [durations, language, medium] as const;
  }, [listings]);
}

const onToggle =
  <K extends ChoiceKey>(setFilters: SetFilters, key: K) =>
  (value: Filters[K][number]) =>
    setFilters((prev) => ({ ...prev, [key]: toggle<Filters[K][number]>(prev[key], value) }));

const flip = (setFilters: SetFilters, key: "teacherLed" | "questionsAndAnswers") => () =>
  setFilters((prev) => ({ ...prev, [key]: prev[key] ? null : true }));

function Options<K extends ChoiceKey>({ choice, selected, onToggle }: { choice: Choice<K>; selected: Filters[K]; onToggle: (value: Filters[K][number]) => void }) {
  return (
    <ul className="space-y-1">
      {choice.options.map((option) => (
        <li key={option.value}>
          <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-accent md:py-0.5">
            <input type="checkbox" checked={(selected as Filters[K][number][]).includes(option.value)} onChange={() => onToggle(option.value)} />
            {option.label}
          </label>
        </li>
      ))}
    </ul>
  );
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button variant={on ? "default" : "outline"} size="sm" aria-pressed={on} onClick={onClick}>
      {children}
    </Button>
  );
}

function Toggles({ filters, setFilters }: { filters: Filters; setFilters: SetFilters }) {
  return (
    <>
      <Toggle on={filters.teacherLed === true} onClick={flip(setFilters, "teacherLed")}>
        Teacher led
      </Toggle>
      <Toggle on={filters.questionsAndAnswers === true} onClick={flip(setFilters, "questionsAndAnswers")}>
        With Q&amp;A
      </Toggle>
    </>
  );
}

/** The laptop toolbar: one popover menu per option list, the two toggles, and Clear. */
export function FilterToolbar({ listings, filters, setFilters }: { listings: Listing[]; filters: Filters; setFilters: SetFilters }) {
  const choices = useChoices(listings);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {choices.map((choice) => (
        <Popover key={choice.key}>
          <PopoverTrigger asChild>
            <Button variant={filters[choice.key].length ? "default" : "outline"} size="sm">
              {choice.label}
              {filters[choice.key].length > 0 && <span className="rounded-full bg-white/30 px-1.5">{filters[choice.key].length}</span>}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="max-h-80 overflow-y-auto">
            <Options choice={choice} selected={filters[choice.key]} onToggle={onToggle(setFilters, choice.key)} />
          </PopoverContent>
        </Popover>
      ))}
      <Toggles filters={filters} setFilters={setFilters} />
      {activeCount(filters) > 0 && (
        <Button variant="ghost" size="sm" onClick={() => setFilters(() => EMPTY_FILTERS)}>
          <FilterXIcon /> Clear
        </Button>
      )}
    </div>
  );
}

/** The same filters laid out for a bottom sheet: every option list open, the toggles under them. */
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
      <div className="flex flex-wrap gap-2">
        <Toggles filters={filters} setFilters={setFilters} />
      </div>
    </div>
  );
}
