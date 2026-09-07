// One language tag: the flag, or the code when no flag is mapped. The hover
// text names every language behind the tag.
import { languageTitle } from "@/lib/labels";
import type { LanguageTag } from "@/lib/slots";
import { FlagIcon } from "@/components/FlagIcon";

export const tagTitle = (tag: LanguageTag) => tag.codes.map(languageTitle).join(", ");

export function LanguageTagView({ tag, className }: { tag: LanguageTag; className?: string }) {
  const title = tagTitle(tag);
  if (tag.flag) {
    return (
      <span role="img" title={title} aria-label={title} className="inline-flex">
        <FlagIcon flag={tag.flag} className={className} />
      </span>
    );
  }
  return (
    <span title={title} aria-label={title} className="rounded-sm border px-1 font-mono text-[10px] leading-4 lowercase">
      {tag.codes[0]}
    </span>
  );
}
