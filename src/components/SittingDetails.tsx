// The detail panel body: everything an old student needs to attend the one
// sitting they clicked, in three groups, in the order they are needed. First
// when: the date, the time range with its length, where the host's clock is,
// and the calendar file. Then how to join: the join link is the one filled
// button, and the meeting id, password, and dial-in are rows for when the
// link alone is not enough. Last the host: the host page, the contact, and
// the listing's own text folded away. The join link is the only button:
// every other fact, a link included, is a row of label and value, so the
// panel reads as one list with one thing to do. The calendar already shows
// every other time this host offers, so the panel never names the schedule,
// and each fact is shown once: the button names the platform, the city and
// country under the time say where the host's clock is, and a long name is
// cut to one line with the full name on hover.
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
import { type Clock, countryName, fmtDate, fmtDuration, fmtRepeat, fmtSite, fmtTime, PLATFORM_LABEL, zoneAbbr } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ListingBadges } from "@/components/ListingBadges";

/** The usual length of a sitting. Any other length is named next to the time range. */
const USUAL_MINUTES = 60;

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

/** A link in a row: an icon, the text cut to the row, and for a page an arrow out. */
const LINK = "inline-flex min-w-0 items-center gap-1 underline";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6rem_1fr] items-center gap-2 text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className="flex min-w-0 items-center gap-1 break-words">{children}</div>
    </div>
  );
}

/** A group of the panel, named in small capitals so the name reads as a heading and not as content. */
function Group({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{name}</h3>
      {children}
    </section>
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
  clock,
}: {
  sitting: Sitting;
  listing: Listing;
  zone: string;
  clock: Clock;
}) {
  // A rule can carry its own room, so the join details follow the sitting.
  const join = joinFor(listing, sitting.rule);
  const password = join.password;
  const hostPage = listing.hostPageUrl ?? listing.host.url;
  const hostClock = fmtTime(sitting.start, sitting.rule.timeZone, clock);
  const sameClock = hostClock === fmtTime(sitting.start, zone, clock);
  const minutes = sitting.rule.durationMinutes;
  // Where the host's clock is: the city and the country. The API's host names
  // are often internal ("Virtual-Audio-Only-Sublocation-..."), so they stay out.
  // Without a city the line only says what the badges say, so it shows only
  // when the host's clock differs.
  const where = [listing.host.city, countryName(listing.country)].filter(Boolean).join(", ");

  // The body scrolls up and down on its own; a drag to the right is the page's. Its text can be selected, as the page's cannot.
  return (
    <div className="min-h-0 flex-1 touch-pan-y space-y-6 overflow-y-auto p-5 select-text">
      <header className="space-y-2 pr-8">
        <h2 className="truncate text-lg leading-snug font-semibold" title={listing.name}>
          {listing.name}
        </h2>
        <ListingBadges listing={listing} />
      </header>

      <section className="rounded-lg border bg-card p-4">
        <div className="text-sm text-muted-foreground">{fmtDate(sitting.start, zone)}</div>
        <div className="text-2xl font-semibold tabular-nums">
          {fmtTime(sitting.start, zone, clock)} – {fmtTime(sitting.end, zone, clock)}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {zoneAbbr(sitting.start, zone)}
            {minutes !== USUAL_MINUTES && ` · ${fmtDuration(minutes)}`}
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

      <Group name="Join">
        {join.url ? (
          <Button asChild className="w-full">
            <a href={join.url} target="_blank" rel="noopener">
              <VideoIcon /> Open in {PLATFORM_LABEL[listing.platform]} <ExternalLinkIcon />
            </a>
          </Button>
        ) : (
          !join.dialIn && <p className="text-sm text-muted-foreground">No direct link in the listing. Use the host page.</p>
        )}
        {(join.meetingId || password.kind !== "none" || join.dialIn) && (
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
          </div>
        )}
      </Group>

      <Group name="Host">
        {hostPage && (
          <Row label="Host page">
            <a className={LINK} href={hostPage} target="_blank" rel="noopener">
              <GlobeIcon className="size-3 shrink-0" /> <span className="truncate">{fmtSite(hostPage)}</span>
              <ExternalLinkIcon className="size-3 shrink-0" />
            </a>
          </Row>
        )}
        {listing.host.email && (
          <Row label="Contact">
            <a className={LINK} href={`mailto:${listing.host.email}`}>
              <MailIcon className="size-3 shrink-0" /> <span className="truncate">{listing.host.email}</span>
            </a>
          </Row>
        )}
        <details className="rounded-md border">
          <summary className="cursor-pointer px-3 py-2 text-sm font-semibold">Host page details</summary>
          {/* Host HTML holds long links, tables, and images, so everything is made to fit the width. */}
          <div
            className="overflow-hidden border-t px-3 py-2 text-sm [overflow-wrap:anywhere] [&_a]:underline [&_img]:h-auto [&_img]:max-w-full [&_p]:my-1 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: listing.description }}
          />
        </details>
      </Group>
    </div>
  );
}
