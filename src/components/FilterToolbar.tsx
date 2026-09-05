// The filter toolbar: one popover dropdown per field, two toggles, a Clear
// button, and the count of what is shown.
import * as React from "react";
import { ChevronDownIcon, FilterXIcon } from "lucide-react";
import type { Listing } from "@/schema/listing";
import {
  activeCount,
  DURATION_LABEL,
  EMPTY_FILTERS,
  TIME_OF_DAY_LABEL,
  toggle,
  type Filters,
} from "@/lib/filters";
import { languageName, MEDIUM_LABEL, PLATFORM_LABEL, WEEKDAY_SHORT } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Monday first, the same order as the week grid.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const keysOf = <T extends string>(record: Record<T, string>) => Object.keys(record) as T[];

function FilterMenu<T extends string | number>({
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
            <li key={String(option.value)}>
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
  shown,
  total,
}: {
  listings: Listing[];
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  shown: number;
  total: number;
}) {
  const languages = React.useMemo(
    () =>
      [...new Set(listings.flatMap((l) => l.languages))].sort((a, b) =>
        languageName(a).localeCompare(languageName(b)),
      ),
    [listings],
  );
  const platforms = React.useMemo(
    () =>
      [...new Set(listings.map((l) => l.platform))].sort((a, b) =>
        PLATFORM_LABEL[a].localeCompare(PLATFORM_LABEL[b]),
      ),
    [listings],
  );

  const onToggle =
    <K extends keyof Filters>(key: K) =>
    (value: Filters[K] extends (infer U)[] ? U : never) =>
      setFilters((prev) => ({ ...prev, [key]: toggle(prev[key] as unknown[], value) }));

  const flip = (key: "teacherLed" | "questionsAndAnswers") => () =>
    setFilters((prev) => ({ ...prev, [key]: prev[key] ? null : true }));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterMenu
        label="Weekday"
        options={DAY_ORDER.map((d) => ({ value: d, label: WEEKDAY_SHORT[d] }))}
        selected={filters.weekdays}
        onToggle={onToggle("weekdays")}
      />
      <FilterMenu
        label="Time of day"
        options={keysOf(TIME_OF_DAY_LABEL).map((k) => ({ value: k, label: TIME_OF_DAY_LABEL[k] }))}
        selected={filters.timesOfDay}
        onToggle={onToggle("timesOfDay")}
      />
      <FilterMenu
        label="Duration"
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
        label="Medium"
        options={keysOf(MEDIUM_LABEL).map((k) => ({ value: k, label: MEDIUM_LABEL[k] }))}
        selected={filters.medium}
        onToggle={onToggle("medium")}
      />
      <FilterMenu
        label="Platform"
        options={platforms.map((p) => ({ value: p, label: PLATFORM_LABEL[p] }))}
        selected={filters.platforms}
        onToggle={onToggle("platforms")}
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
      <span className="ml-auto text-xs text-muted-foreground">
        {shown} of {total} sittings this week
      </span>
    </div>
  );
}
