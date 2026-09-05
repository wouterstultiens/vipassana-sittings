import { cn } from "@/lib/utils";

/** Every IANA zone the runtime knows, in the order it lists them. */
export const ZONES = Intl.supportedValuesOf("timeZone");

/** The zone the old student's browser is in. */
export const oldStudentZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export function ZoneSelect({ value, onChange, className }: { value: string; onChange: (z: string) => void; className?: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn("h-8 max-w-56 rounded-md border bg-background px-2 text-xs", className)}
      aria-label="Your timezone"
    >
      {!ZONES.includes(value) && <option value={value}>{value}</option>}
      {ZONES.map((z) => (
        <option key={z} value={z}>
          {z.replace(/_/g, " ")}
        </option>
      ))}
    </select>
  );
}
