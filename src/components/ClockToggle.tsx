// The clock the times are written on: 24-hour, or 12-hour with AM and PM.
// By default the calendar follows the device's clock, as it follows its zone.
// One button that names the clock in use and flips to the other, next to the
// timezone, so the two settings that shape a time sit together.
import { ClockIcon } from "lucide-react";
import type { Clock } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LABEL: Record<Clock, string> = { "24h": "24h", "12h": "AM/PM" };
const OTHER: Record<Clock, Clock> = { "24h": "12h", "12h": "24h" };

export function ClockToggle({ clock, onChange, className }: { clock: Clock; onChange: (clock: Clock) => void; className?: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("text-xs", className)}
      onClick={() => onChange(OTHER[clock])}
      aria-label={`Write times on the ${OTHER[clock] === "24h" ? "24-hour" : "12-hour"} clock`}
      title={`Switch to ${LABEL[OTHER[clock]]}`}
    >
      <ClockIcon className="text-muted-foreground" /> {LABEL[clock]}
    </Button>
  );
}
