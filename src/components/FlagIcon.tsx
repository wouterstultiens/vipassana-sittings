// The flag of a country code, drawn from country-flag-icons: the flag that
// stands for a language, or the country of a host. A code without a flag
// draws nothing.
import type { ComponentType, SVGProps } from "react";
import * as Flags from "country-flag-icons/react/3x2";
import { cn } from "@/lib/utils";

const FLAG = Flags as Record<string, ComponentType<SVGProps<SVGSVGElement>> | undefined>;

export function FlagIcon({ flag, className }: { flag: string; className?: string }) {
  const Flag = FLAG[flag];
  if (!Flag) return null;
  return <Flag aria-hidden className={cn("h-3.5 w-[21px] shrink-0 rounded-[2px] ring-1 ring-black/10 dark:ring-white/15", className)} />;
}
