// PROTOTYPE: three variants of the calendar, switchable via ?variant=, on the
// route the real calendar will use. Throwaway; see README.md in this folder.
import * as React from "react";
import type { Listing } from "../schema/listing";
import { visitorZone } from "./lib/expand";
import { EMPTY_FILTERS, type Filters } from "./lib/filters";
import { PrototypeSwitcher, useVariant } from "./PrototypeSwitcher";
import { VariantA } from "./variants/VariantA";
import { VariantB } from "./variants/VariantB";
import { VariantC } from "./variants/VariantC";

export type VariantProps = {
  listings: Listing[];
  zone: string;
  setZone: (z: string) => void;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  now: Date;
};

const KEYS = ["A", "B", "C"];
const NAMES: Record<string, string> = { A: "Week grid", B: "Agenda", C: "Timetable" };

export function Prototype({ listings }: { listings: Listing[] }) {
  const { variant, step } = useVariant(KEYS);
  const [zone, setZone] = React.useState(visitorZone);
  const [filters, setFilters] = React.useState<Filters>(EMPTY_FILTERS);
  const [now] = React.useState(() => new Date());
  const props: VariantProps = { listings, zone, setZone, filters, setFilters, now };
  return (
    <>
      {variant === "A" && <VariantA {...props} />}
      {variant === "B" && <VariantB {...props} />}
      {variant === "C" && <VariantC {...props} />}
      <PrototypeSwitcher keys={KEYS} names={NAMES} current={variant} step={step} />
    </>
  );
}
