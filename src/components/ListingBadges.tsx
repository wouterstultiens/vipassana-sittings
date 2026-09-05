import type { Listing } from "@/schema/listing";
import { languageName, MEDIUM_LABEL, PLATFORM_LABEL } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";

/** What a listing offers, at a glance. "xs" is the size the grid's card list uses. */
export function ListingBadges({ listing, size = "sm" }: { listing: Listing; size?: "sm" | "xs" }) {
  const small = size === "xs" ? "px-1 py-0 text-[10px]" : "";
  return (
    <div className="flex flex-wrap gap-1">
      <Badge variant="secondary" className={small}>{PLATFORM_LABEL[listing.platform]}</Badge>
      <Badge variant="outline" className={small}>{MEDIUM_LABEL[listing.medium]}</Badge>
      {listing.teacherLed && <Badge className={small}>Teacher led</Badge>}
      {listing.questionsAndAnswers && <Badge variant="outline" className={small}>Q&amp;A</Badge>}
      {listing.languages.map((code) => (
        <Badge key={code} variant="secondary" className={small}>{languageName(code)}</Badge>
      ))}
    </div>
  );
}
