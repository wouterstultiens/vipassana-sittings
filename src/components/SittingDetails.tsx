// The detail panel body: everything an old student needs to attend one
// sitting, plus the listing's regular schedule and the outbound links.
import * as React from "react";
import {
  CalendarPlusIcon,
  CopyIcon,
  ExternalLinkIcon,
  MailIcon,
  PhoneIcon,
  TriangleAlertIcon,
  VideoIcon,
} from "lucide-react";
import type { Listing } from "@/schema/listing";
import type { Sitting } from "@/lib/expand";
import { downloadIcs } from "@/lib/ics";
import { joinFor, passwordNote } from "@/lib/join";
import {
  countryName,
  displayHost,
  flag,
  fmtDate,
  fmtDuration,
  fmtTime,
  languageName,
  MEDIUM_LABEL,
  PLATFORM_LABEL,
  ruleDays,
  zoneAbbr,
} from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const DHAMMA_VIRTUAL_URL = "https://www.dhamma.org/en/os/schedules/schgroupsits";

export function ListingBadges({ listing, size = "sm" }: { listing: Listing; size?: "sm" | "xs" }) {
  const small = size === "xs" ? "text-[10px] px-1 py-0" : "";
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

export function Notice({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? "flex items-start gap-2 text-xs text-muted-foreground"
          : "flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
      }
    >
      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
      <span>
        Times come from the dhamma.org listing and the host page and may not be up to date. Check
        the host page before you join.
      </span>
    </div>
  );
}

export function SittingDetails({
  sitting,
  listing,
  zone,
  referenceDate,
}: {
  sitting?: Sitting;
  listing: Listing;
  zone: string;
  referenceDate: Date;
}) {
  // A rule can carry its own room, so the join details follow the sitting.
  const join = joinFor(listing, sitting?.rule);
  const hostZone = listing.scheduleRules[0]?.timeZone;
  const hostPage = listing.hostPageUrl ?? listing.host.url;
  const password = join.password;

  return (
    <div className="space-y-5 overflow-y-auto p-5">
      <header className="space-y-2 pr-8">
        <div className="text-xs text-muted-foreground">
          {flag(listing.country)} {displayHost(listing)} · {countryName(listing.country)}
        </div>
        <h2 className="text-lg leading-snug font-semibold">{listing.name}</h2>
        <ListingBadges listing={listing} />
      </header>

      {sitting ? (
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
            {sitting.rule.label ? ` · ${sitting.rule.label}` : ""}
          </div>
          {sitting.crossesMidnight && (
            <div className="mt-1 text-xs font-medium text-amber-700">
              Ends after midnight your time.
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => downloadIcs(sitting)}>
              <CalendarPlusIcon /> Add to calendar
            </Button>
          </div>
        </section>
      ) : (
        <section className="rounded-lg border bg-muted/40 p-4 text-sm">
          {listing.scheduleRules.length
            ? "Pick a time on the calendar to add it to your own calendar."
            : "This listing gives no fixed time. Read the listing text below for how to attend."}
        </section>
      )}

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
        <Row label="Password">
          {password.kind === "given" ? (
            <>
              <span className="font-mono">{password.value}</span> <Copy text={password.value} />
            </>
          ) : (
            <span className={password.kind === "none" ? "text-muted-foreground" : undefined}>
              {passwordNote(password)}
            </span>
          )}
        </Row>
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
      </section>

      {listing.scheduleRules.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Regular schedule</h3>
          <ul className="divide-y rounded-md border text-sm">
            {listing.scheduleRules.map((rule, i) => (
              <li key={i} className="flex items-center justify-between gap-2 px-3 py-1.5">
                <span>
                  {ruleDays(rule)}
                  {rule.label && <span className="text-muted-foreground"> · {rule.label}</span>}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {rule.start} {zoneAbbr(referenceDate, rule.timeZone)} ·{" "}
                  {fmtDuration(rule.durationMinutes)}
                </span>
              </li>
            ))}
          </ul>
          {hostZone && (
            <p className="text-xs text-muted-foreground">
              Host times are in {hostZone.replace(/_/g, " ")}. The calendar shows them in your own
              timezone.
            </p>
          )}
        </section>
      )}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Links</h3>
        <div className="flex flex-wrap gap-2">
          {hostPage && (
            <Button variant="outline" size="sm" onClick={() => window.open(hostPage, "_blank", "noopener")}>
              Host page <ExternalLinkIcon />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(DHAMMA_VIRTUAL_URL, "_blank", "noopener")}
          >
            dhamma.org listing <ExternalLinkIcon />
          </Button>
        </div>
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
