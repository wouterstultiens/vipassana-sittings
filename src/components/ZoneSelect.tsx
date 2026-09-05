import { cn } from "@/lib/utils";

export function ZoneSelect({
  value,
  onChange,
  zones,
  className,
}: {
  value: string;
  onChange: (z: string) => void;
  zones: string[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn("h-8 max-w-56 rounded-md border bg-background px-2 text-xs", className)}
      aria-label="Your timezone"
    >
      {!zones.includes(value) && <option value={value}>{value}</option>}
      {zones.map((z) => (
        <option key={z} value={z}>
          {z.replace(/_/g, " ")}
        </option>
      ))}
    </select>
  );
}
