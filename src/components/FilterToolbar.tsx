// The filter toolbar: one popover dropdown per field, two toggles, and a Clear
// button. The calendar answers "which day" and "which hour" on its own, so the
// toolbar asks only what the grid cannot show.
import * as React from "react";
import { ChevronDownIcon, FilterXIcon } from "lucide-react";
import type { Listing } from "@/schema/listing";
import { activeCount, DURATION_LABEL, EMPTY_FILTERS, toggle, type Filters } from "@/lib/filters";
import { languageName, MEDIUM_LABEL } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// The filters that hold a list of chosen options, as opposed to the two toggles.
type ChoiceKey = "durations" | "languages" | "medium";

const keysOf = <T extends string>(record: Record<T, string>) => Object.keys(record) as T[];

function FilterMenu<T extends string>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={selected.length ? "default" : "outline"} size="sm">
          {label}
          {selected.length > 0 && (
            <span className="rounded-full bg-white/30 px-1.5">{selected.length}</span>
          )}
          <ChevronDownIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-h-80 overflow-y-auto">
        <ul className="space-y-1">
          {options.map((option) => (
            <li key={option.value}>
              <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-accent">
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => onToggle(option.value)}
                />
                {option.label}
              </label>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function Toggle({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button variant={on ? "default" : "outline"} size="sm" aria-pressed={on} onClick={onClick}>
      {children}
    </Button>
  );
}

export function FilterToolbar({
  listings,
  filters,
  setFilters,
}: {
  listings: Listing[];
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}) {
  const languages = React.useMemo(
    () =>
      [...new Set(listings.flatMap((l) => l.languages))].sort((a, b) =>
        languageName(a).localeCompare(languageName(b)),
      ),
    [listings],
  );

  const onToggle =
    <K extends ChoiceKey>(key: K) =>
    (value: Filters[K][number]) =>
      setFilters((prev) => ({ ...prev, [key]: toggle<Filters[K][number]>(prev[key], value) }));

  const flip = (key: "teacherLed" | "questionsAndAnswers") => () =>
    setFilters((prev) => ({ ...prev, [key]: prev[key] ? null : true }));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterMenu
        label="Length"
        options={keysOf(DURATION_LABEL).map((k) => ({ value: k, label: DURATION_LABEL[k] }))}
        selected={filters.durations}
        onToggle={onToggle("durations")}
      />
      <FilterMenu
        label="Language"
        options={languages.map((code) => ({ value: code, label: languageName(code) }))}
        selected={filters.languages}
        onToggle={onToggle("languages")}
      />
      <FilterMenu
        label="Video or audio"
        options={keysOf(MEDIUM_LABEL).map((k) => ({ value: k, label: MEDIUM_LABEL[k] }))}
        selected={filters.medium}
        onToggle={onToggle("medium")}
      />
      <Toggle on={filters.teacherLed === true} onClick={flip("teacherLed")}>
        Teacher led
      </Toggle>
      <Toggle on={filters.questionsAndAnswers === true} onClick={flip("questionsAndAnswers")}>
        With Q&amp;A
      </Toggle>
      {activeCount(filters) > 0 && (
        <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
          <FilterXIcon /> Clear
        </Button>
      )}
    </div>
  );
}
