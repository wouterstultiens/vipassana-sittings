import type { Listing } from "@/schema/listing";
import { languageName, MEDIUM_LABEL, PLATFORM_LABEL } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";

export function ListingBadges({ listing }: { listing: Listing }) {
  return (
    <div className="flex flex-wrap gap-1">
      <Badge variant="secondary" className="px-1 py-0 text-[10px]">{PLATFORM_LABEL[listing.platform]}</Badge>
      <Badge variant="outline" className="px-1 py-0 text-[10px]">{MEDIUM_LABEL[listing.medium]}</Badge>
      {listing.teacherLed && <Badge className="px-1 py-0 text-[10px]">Teacher led</Badge>}
      {listing.questionsAndAnswers && <Badge variant="outline" className="px-1 py-0 text-[10px]">Q&amp;A</Badge>}
      {listing.languages.map((code) => (
        <Badge key={code} variant="ghost" className="px-1 py-0 text-[10px]">{languageName(code)}</Badge>
      ))}
    </div>
  );
}
