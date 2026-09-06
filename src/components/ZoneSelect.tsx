// The timezone picker. By default the calendar follows the device's zone, so
// a traveller sees local times without doing anything. An old student whose
// device is set wrong searches a zone by city, region or offset and that
// choice then sticks.
import * as React from "react";
import { CheckIcon, ChevronDownIcon, SmartphoneIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** The zone the old student's device is in. */
export const oldStudentZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

type ZoneEntry = { id: string; city: string; region: string; offset: string; text: string };

const cityOf = (id: string) => id.split("/").pop()!.replace(/_/g, " ");
const regionOf = (id: string) => (id.includes("/") ? id.split("/")[0].replace(/_/g, " ") : "");

/** "GMT+2", "GMT-5:30", or "GMT", for the zone right now. */
export function zoneOffset(id: string, at = new Date()): string {
  const parts = new Intl.DateTimeFormat("en", { timeZone: id, timeZoneName: "shortOffset" }).formatToParts(at);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
}

const entryOf = (id: string): ZoneEntry => {
  const city = cityOf(id);
  const region = regionOf(id);
  const offset = zoneOffset(id);
  return { id, city, region, offset, text: `${city} ${region} ${offset} ${id}`.toLowerCase() };
};

/** Every IANA zone the runtime knows, as searchable entries. */
const ZONES: ZoneEntry[] = Intl.supportedValuesOf("timeZone").map(entryOf);

/** The entries that hold every word of the query, so "amst", "europe +2" and "+5:30" all work. */
export function searchZones(query: string, zones: ZoneEntry[] = ZONES): ZoneEntry[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return zones.filter((z) => terms.every((t) => z.text.includes(t)));
}

function ZoneRow({ entry, selected, onPick }: { entry: ZoneEntry; selected: boolean; onPick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        aria-selected={selected}
        className={cn("flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent md:py-1", selected && "bg-accent")}
      >
        <span className="truncate">{entry.city}</span>
        <span className="truncate text-xs text-muted-foreground">{entry.region}</span>
        <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">{entry.offset}</span>
        {selected && <CheckIcon className="size-4 shrink-0" />}
      </button>
    </li>
  );
}

export function ZoneSelect({
  value,
  onChange,
  className,
}: {
  value: string | null; // null follows the device
  onChange: (zone: string | null) => void;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const device = oldStudentZone();
  const zone = value ?? device;
  const found = searchZones(query);
  const pick = (z: string | null) => {
    onChange(z);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("max-w-56 text-xs", className)} aria-label="Your timezone" title={zone}>
          {value === null && <SmartphoneIcon className="text-muted-foreground" />}
          <span className="truncate">{cityOf(zone)}</span>
          <span className="text-muted-foreground tabular-nums">{zoneOffset(zone)}</span>
          <ChevronDownIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex max-h-96 w-80 flex-col gap-2 p-2">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && found[0]) pick(found[0].id);
          }}
          placeholder="City, region or GMT offset"
          aria-label="Search timezones"
          className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {!query && (
            <li>
              <button
                type="button"
                onClick={() => pick(null)}
                aria-selected={value === null}
                className={cn(
                  "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent md:py-1",
                  value === null && "bg-accent",
                )}
              >
                <SmartphoneIcon className="size-4 shrink-0 text-muted-foreground" />
                <span>Follow my device</span>
                <span className="truncate text-xs text-muted-foreground">{cityOf(device)}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">{zoneOffset(device)}</span>
                {value === null && <CheckIcon className="size-4 shrink-0" />}
              </button>
            </li>
          )}
          {found.map((entry) => (
            <ZoneRow key={entry.id} entry={entry} selected={value === entry.id} onPick={() => pick(entry.id)} />
          ))}
          {found.length === 0 && <li className="px-2 py-2 text-sm text-muted-foreground">No zone matches.</li>}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
