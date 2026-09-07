// The detail panel body: everything an old student needs to attend the one
// sitting they clicked. The calendar already shows every other time this host
// offers, so the panel never names the schedule. Each fact is shown once: the
// button names the platform, the time range shows the length.
import * as React from "react";
import { CalendarPlusIcon, CheckIcon, CopyIcon, ExternalLinkIcon, PhoneIcon, VideoIcon } from "lucide-react";
import type { Listing } from "@/schema/listing";
import type { Sitting } from "@/lib/expand";
import { downloadIcs } from "@/lib/ics";
import { joinFor, passwordNote } from "@/lib/join";
import { fmtDate, fmtDuration, fmtTime, PLATFORM_LABEL, zoneAbbr } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { ListingBadges } from "@/components/ListingBadges";

/** A sitting this long or longer names its length next to the time range. */
const LONG_SITTING_MINUTES = 180;

function Copy({ text }: { text: string }) {
  const [done, setDone] = React.useState(false);
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label="Copy"
      title="Copy"
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1200);
      }}
    >
      {done ? <CheckIcon /> : <CopyIcon />}
    </Button>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6rem_1fr] items-center gap-2 text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className="flex min-w-0 items-center gap-1 break-words">{children}</div>
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
  const hostClock = fmtTime(sitting.start, sitting.rule.timeZone);
  const sameClock = hostClock === fmtTime(sitting.start, zone);

  return (
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
      <header className="space-y-2 pr-8">
        <h2 className="text-lg leading-snug font-semibold">{listing.name}</h2>
        <ListingBadges listing={listing} />
      </header>

      <section className="rounded-lg border bg-card p-4">
        <div className="text-sm text-muted-foreground">{fmtDate(sitting.start, zone)}</div>
        <div className="text-2xl font-semibold tabular-nums">
          {fmtTime(sitting.start, zone)} – {fmtTime(sitting.end, zone)}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {zoneAbbr(sitting.start, zone)}
            {sitting.rule.durationMinutes >= LONG_SITTING_MINUTES && ` · ${fmtDuration(sitting.rule.durationMinutes)}`}
          </span>
        </div>
        {!sameClock && (
          <div className="mt-1 text-xs text-muted-foreground">
            {hostClock} for the host, in {sitting.rule.timeZone.replace(/_/g, " ")}
          </div>
        )}
        {sitting.crossesMidnight && (
          <div className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">
            Ends after midnight your time.
          </div>
        )}
        <div className="mt-3">
          <Button size="sm" variant="outline" onClick={() => downloadIcs(sitting)}>
            <CalendarPlusIcon /> Add to my calendar
          </Button>
        </div>
      </section>

      <section className="space-y-2">
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
            <div>
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
            </div>
          </Row>
        )}
        {!join.url && !join.dialIn && (
          <p className="text-sm text-muted-foreground">No direct link in the listing. Use the host page.</p>
        )}
        {hostPage && (
          <Row label="Host page">
            <a className="inline-flex items-center gap-1 underline" href={hostPage} target="_blank" rel="noopener">
              {new URL(hostPage).hostname} <ExternalLinkIcon className="size-3" />
            </a>
          </Row>
        )}
      </section>

      <details className="rounded-md border">
        <summary className="cursor-pointer px-3 py-2 text-sm font-semibold">What the host wrote</summary>
        {/* Host HTML holds long links, tables, and images, so everything is made to fit the width. */}
        <div
          className="overflow-hidden border-t px-3 py-2 text-sm [overflow-wrap:anywhere] [&_a]:underline [&_img]:h-auto [&_img]:max-w-full [&_p]:my-1 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: listing.description }}
        />
      </details>

      <footer className="space-y-1 text-xs text-muted-foreground">
        {listing.host.email && (
          <p>
            Questions? Write to{" "}
            <a className="underline" href={`mailto:${listing.host.email}`}>
              {listing.host.email}
            </a>
          </p>
        )}
        <p>Times come from dhamma.org and the host page. Check the host page before you join.</p>
      </footer>
    </div>
  );
}
