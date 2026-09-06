// The detail panel body: everything an old student needs to attend the one
// sitting they clicked. The calendar already shows every other time this host
// offers, so the panel never repeats the schedule.
import * as React from "react";
import { CalendarPlusIcon, CopyIcon, ExternalLinkIcon, MailIcon, PhoneIcon, VideoIcon } from "lucide-react";
import type { Listing } from "@/schema/listing";
import type { Sitting } from "@/lib/expand";
import { downloadIcs } from "@/lib/ics";
import { joinFor, passwordNote } from "@/lib/join";
import {
  countryName,
  displayHost,
  fmtDate,
  fmtDuration,
  fmtTime,
  PLATFORM_LABEL,
  zoneAbbr,
} from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { ListingBadges } from "@/components/ListingBadges";
import { Notice } from "@/components/Notice";

function Copy({ text }: { text: string }) {
  const [done, setDone] = React.useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 px-1.5"
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1200);
      }}
    >
      <CopyIcon /> {done ? "Copied" : "Copy"}
    </Button>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] items-start gap-2 text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className="min-w-0 break-words">{children}</div>
    </div>
  );
}

export function SittingDetails({
  sitting,
  listing,
  zone,
}: {
  sitting: Sitting;
  listing: Listing;
  zone: string;
}) {
  // A rule can carry its own room, so the join details follow the sitting.
  const join = joinFor(listing, sitting.rule);
  const password = join.password;
  const hostPage = listing.hostPageUrl ?? listing.host.url;
  // The listing name usually repeats the host name. Name the host only when it
  // says something the title does not.
  const host = displayHost(listing);
  const extraHost = listing.name.toLowerCase().includes(host.toLowerCase()) ? null : host;

  return (
    <div className="space-y-5 overflow-y-auto p-5">
      <header className="space-y-2 pr-8">
        <h2 className="text-lg leading-snug font-semibold">{listing.name}</h2>
        <div className="text-xs text-muted-foreground">
          {extraHost ? `${extraHost} · ` : ""}
          {countryName(listing.country)}
        </div>
        <ListingBadges listing={listing} />
      </header>

      <section className="rounded-lg border bg-card p-4">
        <div className="text-sm text-muted-foreground">{fmtDate(sitting.start, zone)}</div>
        <div className="text-2xl font-semibold tabular-nums">
          {fmtTime(sitting.start, zone)} – {fmtTime(sitting.end, zone)}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {zoneAbbr(sitting.start, zone)} · {fmtDuration(sitting.rule.durationMinutes)}
          </span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {fmtTime(sitting.start, sitting.rule.timeZone)} for the host, in{" "}
          {sitting.rule.timeZone.replace(/_/g, " ")}
        </div>
        {sitting.crossesMidnight && (
          <div className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">
            Ends after midnight your time.
          </div>
        )}
        <div className="mt-3">
          <Button size="sm" variant="outline" onClick={() => downloadIcs(sitting)}>
            <CalendarPlusIcon /> Add this one time to my calendar
          </Button>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">How to join</h3>
        {join.url && (
          <Button className="w-full" onClick={() => window.open(join.url!, "_blank", "noopener")}>
            <VideoIcon /> Open in {PLATFORM_LABEL[listing.platform]} <ExternalLinkIcon />
          </Button>
        )}
        {join.meetingId && (
          <Row label="Meeting id">
            <span className="font-mono">{join.meetingId}</span> <Copy text={join.meetingId} />
          </Row>
        )}
        {password.kind !== "none" && (
          <Row label="Password">
            {password.kind === "given" ? (
              <>
                <span className="font-mono">{password.value}</span> <Copy text={password.value} />
              </>
            ) : (
              <span>{passwordNote(password)}</span>
            )}
          </Row>
        )}
        {join.dialIn && (
          <Row label="Dial in">
            <ul className="space-y-0.5">
              {join.dialIn.numbers.map((number) => (
                <li key={number} className="flex items-center gap-1 font-mono text-xs">
                  <PhoneIcon className="size-3" /> {number}
                </li>
              ))}
            </ul>
            {join.dialIn.accessCode && (
              <div className="mt-1 text-xs">
                Access code: <span className="font-mono">{join.dialIn.accessCode}</span>
              </div>
            )}
          </Row>
        )}
        {!join.url && !join.dialIn && (
          <p className="text-sm text-muted-foreground">
            No direct link in the listing. Use the host page below.
          </p>
        )}
        {listing.host.email && (
          <Row label="Contact">
            <a className="inline-flex items-center gap-1 underline" href={`mailto:${listing.host.email}`}>
              <MailIcon className="size-3" /> {listing.host.email}
            </a>
          </Row>
        )}
        {hostPage && (
          <Row label="Host page">
            <a className="inline-flex items-center gap-1 underline" href={hostPage} target="_blank" rel="noopener">
              Open <ExternalLinkIcon className="size-3" />
            </a>
          </Row>
        )}
      </section>

      <details className="rounded-md border">
        <summary className="cursor-pointer px-3 py-2 text-sm font-semibold">
          Original listing text
        </summary>
        <div
          className="max-w-none border-t px-3 py-2 text-sm [&_a]:underline [&_p]:my-1"
          dangerouslySetInnerHTML={{ __html: listing.description }}
        />
      </details>

      <Notice />
    </div>
  );
}
