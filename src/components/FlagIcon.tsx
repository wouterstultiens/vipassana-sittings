// The flag of a language tag, drawn from country-flag-icons. Every flag the
// language map names is here; the type keeps the two maps in step.
import {
  BG,
  BR,
  CN,
  DK,
  ES,
  FI,
  FR,
  GB,
  HU,
  IL,
  IN,
  IR,
  IT,
  JP,
  KR,
  MM,
  NL,
  NO,
  RU,
  SA,
  SE,
  TH,
} from "country-flag-icons/react/3x2";
import type { LanguageFlag } from "@/lib/labels";
import { cn } from "@/lib/utils";

const FLAG: Record<LanguageFlag, typeof ES> = { BG, BR, CN, DK, ES, FI, FR, GB, HU, IL, IN, IR, IT, JP, KR, MM, NL, NO, RU, SA, SE, TH };

export function FlagIcon({ flag, className }: { flag: LanguageFlag; className?: string }) {
  const Flag = FLAG[flag];
  return <Flag aria-hidden className={cn("h-3.5 w-[21px] shrink-0 rounded-[2px] ring-1 ring-black/10 dark:ring-white/15", className)} />;
}
