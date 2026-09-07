// Where the calendar is open: which week from today, and on a phone which
// day of that week fills the screen. Turning past the last day of a week
// lands on the first day of the next, and back again, within the weeks the
// sittings are expanded for.
import { WEEKS_AHEAD } from "@/lib/expand";

export type Page = { weeks: number; day: number };

export const FIRST_PAGE: Page = { weeks: 0, day: 0 };

/** The page one day on (+1) or back (-1), or the same page at the edge of the range. */
export function turnDay(page: Page, dir: 1 | -1): Page {
  const day = page.day + dir;
  if (day >= 0 && day <= 6) return { ...page, day };
  const weeks = page.weeks + dir;
  if (weeks < 0 || weeks > WEEKS_AHEAD) return page;
  return { weeks, day: dir === 1 ? 0 : 6 };
}
