import type { Host } from "@/schema/host";
import { TOGGLE_LABEL } from "@/lib/filters";
import { countryName, MEDIUM_LABEL } from "@/lib/labels";
import { languageTagsOf } from "@/lib/slots";
import { Badge } from "@/components/ui/badge";
import { LanguageTagView } from "@/components/LanguageTag";

/**
 * What sets a host apart, at a glance: the country and a flag per language
 * then what the filters ask about: a medium other than video, a teacher, and
 * Q&A. "xs" is the size the pick list uses.
 */
export function HostBadges({ host, size = "sm" }: { host: Host; size?: "sm" | "xs" }) {
  const xs = size === "xs";
  const small = xs ? "px-1 py-0 text-[10px]" : "";
  const badges = [
    host.medium !== "video" && <Badge key="medium" variant="outline" className={small}>{MEDIUM_LABEL[host.medium]}</Badge>,
    host.teacherLed && <Badge key="teacher" className={small}>{TOGGLE_LABEL.teacherLed.short}</Badge>,
    host.questionsAndAnswers && <Badge key="qa" variant="outline" className={small}>{TOGGLE_LABEL.questionsAndAnswers.short}</Badge>,
  ].filter(Boolean);
  return (
    <div className={`flex flex-wrap items-center gap-1 ${xs ? "text-xs" : "text-sm"}`}>
      <span className="mr-1 text-muted-foreground">{countryName(host.country)}</span>
      {languageTagsOf(host.languages).map((tag) => (
        <LanguageTagView key={tag.codes[0]} tag={tag} className={xs ? "" : "h-4 w-6"} />
      ))}
      {badges.length > 0 && <span aria-hidden className="mx-1.5 h-4 w-px bg-border" />}
      {badges}
    </div>
  );
}
