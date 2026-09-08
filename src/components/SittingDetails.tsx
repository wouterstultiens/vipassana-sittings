// The detail panel body: everything an old student needs to attend the one
// sitting they clicked, in three groups, in the order they are needed. First
// when: the date, the time range with its length, where the host's clock is,
// and the calendar file. Then how to join: the join link is the one filled
// button, and the meeting id, password, and dial-in are rows for when the
// link alone is not enough. Last the host: the host page and the contact.
// The join link is the only button: every other fact, a link included, is a row of label and value, so the
// panel reads as one list with one thing to do. The calendar already shows
// every other time this host offers, so the panel never names the schedule,
// and each fact is shown once: the button names the platform, the city and
// country under the time say where the host's clock is, and a long name is
// cut to one line with the full name on hover. A host whose sources moved
// carries a note under its name, to the host page.
import * as React from "react";
import {
  CalendarPlusIcon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  ExternalLinkIcon,
  GlobeIcon,
  TriangleAlertIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  RepeatIcon,
  VideoIcon,
} from "lucide-react";
import type { Sitting } from "@/lib/expand";
import { downloadIcs, hostWeekday } from "@/lib/ics";
import { passwordNote } from "@/lib/join";
import { type Clock, countryName, fmtDate, fmtDuration, fmtRepeat, fmtSite, fmtTime, PLATFORM_LABEL, zoneAbbr } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HostBadges } from "@/components/HostBadges";

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

/**
 * The note on a host whose sources moved. The old student is told nothing
 * about how the site reads its data: only that the details may be old, that
 * the owner is on it, and where the truth is in the meantime.
 */
function OldDetails({ pageUrl }: { pageUrl: string | null }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
      <p>
        The details for this sitting may be out of date, I will try to update it as soon as possible.{" "}
        {pageUrl && (
          <>
            Please check{" "}
            <a className="font-medium underline" href={pageUrl} target="_blank" rel="noopener">
              the host page
            </a>{" "}
            for the latest information.
          </>
        )}
      </p>
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

export function SittingDetails({ sitting, zone, clock }: { sitting: Sitting; zone: string; clock: Clock }) {
  const { host, rule } = sitting;
  // Every rule carries its own room, so the join details follow the sitting.
  const { join } = rule;
  const password = join.password;
  const hostClock = fmtTime(sitting.start, host.timeZone, clock);
  const sameClock = hostClock === fmtTime(sitting.start, zone, clock);
  const minutes = rule.durationMinutes;
  // Where the host's clock is: the city and the country. Without a city the
  // line only says what the badges say, so it shows only when the host's clock
  // differs.
  const where = [host.city, countryName(host.country)].filter(Boolean).join(", ");

  // The body scrolls up and down on its own; a drag to the right is the page's. Its text can be selected, as the page's cannot.
  return (
    <div className="min-h-0 flex-1 touch-pan-y space-y-6 overflow-y-auto p-5 select-text">
      <header className="space-y-2 pr-8">
        <h2 className="truncate text-lg leading-snug font-semibold" title={host.name}>
          {host.name}
        </h2>
        <HostBadges host={host} />
        {rule.label && <p className="text-sm text-muted-foreground">{rule.label}</p>}
      </header>

      {host.sourcesChanged && <OldDetails pageUrl={host.pageUrl} />}

      <section className="rounded-lg border bg-card p-4">
        <div className="text-sm text-muted-foreground">{fmtDate(sitting.start, zone)}</div>
        <div className="text-2xl font-semibold tabular-nums">
          {fmtTime(sitting.start, zone, clock)} – {fmtTime(sitting.end, zone, clock)}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {zoneAbbr(sitting.start, zone)}
            {minutes !== USUAL_MINUTES && ` · ${fmtDuration(minutes)}`}
          </span>
        </div>
        {(host.city || !sameClock) && (
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
              <VideoIcon /> Open in {PLATFORM_LABEL[join.platform]} <ExternalLinkIcon />
            </a>
          </Button>
        ) : (
          !join.dialIn && (
            <p className="text-sm text-muted-foreground">
              No direct link. {host.pageUrl ? "Use the host page." : "Ask the host."}
            </p>
          )
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
        {host.pageUrl && (
          <Row label="Host page">
            <a className={LINK} href={host.pageUrl} target="_blank" rel="noopener">
              <GlobeIcon className="size-3 shrink-0" /> <span className="truncate">{fmtSite(host.pageUrl)}</span>
              <ExternalLinkIcon className="size-3 shrink-0" />
            </a>
          </Row>
        )}
        {host.email && (
          <Row label="Contact">
            <a className={LINK} href={`mailto:${host.email}`}>
              <MailIcon className="size-3 shrink-0" /> <span className="truncate">{host.email}</span>
            </a>
          </Row>
        )}
      </Group>
    </div>
  );
}
