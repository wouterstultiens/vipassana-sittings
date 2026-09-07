// The detail panel body: everything an old student needs to attend the one
// sitting they clicked. The calendar already shows every other time this host
// offers, so the panel never names the schedule. Each fact is shown once: the
// button names the platform, the time range shows the length, and the host's
// city and country under the time say where the host's clock is. The join link
// and the host page are the two buttons; the rest of the join details and the
// contact are rows an old student reads when the link alone is not enough.
import * as React from "react";
import {
  CalendarPlusIcon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  ExternalLinkIcon,
  GlobeIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  RepeatIcon,
  VideoIcon,
} from "lucide-react";
import type { Listing } from "@/schema/listing";
import type { Sitting } from "@/lib/expand";
import { downloadIcs, hostWeekday } from "@/lib/ics";
import { joinFor, passwordNote } from "@/lib/join";
import { countryName, fmtDate, fmtDuration, fmtRepeat, fmtTime, PLATFORM_LABEL, zoneAbbr } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

/** The calendar file, as a choice: the one sitting, or its repeats on this weekday, which is what most old students want. */
function AddToCalendar({ sitting }: { sitting: Sitting }) {
  const repeat = fmtRepeat(sitting.rule, hostWeekday(sitting));
  const item = "w-full justify-start font-normal";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline">
          <CalendarPlusIcon /> Add to my calendar <ChevronDownIcon className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1">
        <PopoverClose asChild>
          <Button variant="ghost" size="sm" className={item} onClick={() => downloadIcs(sitting, true)}>
            <RepeatIcon className="text-muted-foreground" /> {repeat}
          </Button>
        </PopoverClose>
        <PopoverClose asChild>
          <Button variant="ghost" size="sm" className={item} onClick={() => downloadIcs(sitting)}>
            <CalendarPlusIcon className="text-muted-foreground" /> This sitting only
          </Button>
        </PopoverClose>
      </PopoverContent>
    </Popover>
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
  // Where the host's clock is: the city and the country. The API's host names
  // are often internal ("Virtual-Audio-Only-Sublocation-..."), so they stay out.
  // Without a city the line only says what the badges say, so it shows only
  // when the host's clock differs.
  const where = [listing.host.city, countryName(listing.country)].filter(Boolean).join(", ");

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
        {(listing.host.city || !sameClock) && (
          <div className="mt-1.5 flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPinIcon className="mt-0.5 size-3.5 shrink-0" />
            <span>
              {where}
              {!sameClock && <span className="tabular-nums"> · {hostClock} for the host</span>}
            </span>
          </div>
        )}
        {sitting.crossesMidnight && (
          <div className="mt-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
            Ends after midnight your time.
          </div>
        )}
        <div className="mt-3">
          <AddToCalendar sitting={sitting} />
        </div>
      </section>

      <section className="space-y-3">
        <div className="grid gap-2">
          {join.url && (
            <Button asChild className="w-full">
              <a href={join.url} target="_blank" rel="noopener">
                <VideoIcon /> Open in {PLATFORM_LABEL[listing.platform]} <ExternalLinkIcon />
              </a>
            </Button>
          )}
          {hostPage && (
            <Button asChild variant="outline" className="w-full">
              <a href={hostPage} target="_blank" rel="noopener">
                <GlobeIcon /> Host page <ExternalLinkIcon />
              </a>
            </Button>
          )}
        </div>
        {!join.url && !join.dialIn && (
          <p className="text-sm text-muted-foreground">No direct link in the listing. Use the host page.</p>
        )}
        <div className="space-y-2">
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
          {listing.host.email && (
            <Row label="Contact">
              <a className="inline-flex min-w-0 items-center gap-1 underline" href={`mailto:${listing.host.email}`}>
                <MailIcon className="size-3 shrink-0" /> <span className="truncate">{listing.host.email}</span>
              </a>
            </Row>
          )}
        </div>
      </section>

      <details className="rounded-md border">
        <summary className="cursor-pointer px-3 py-2 text-sm font-semibold">Listing details</summary>
        {/* Host HTML holds long links, tables, and images, so everything is made to fit the width. */}
        <div
          className="overflow-hidden border-t px-3 py-2 text-sm [overflow-wrap:anywhere] [&_a]:underline [&_img]:h-auto [&_img]:max-w-full [&_p]:my-1 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: listing.description }}
        />
      </details>

      <footer className="text-xs text-muted-foreground">
        <p>Times come from dhamma.org and the host page. Check the host page before you join.</p>
      </footer>
    </div>
  );
}
