// The pages a row opens, pushed in from the right: the slot's list of
// sittings, and over it the one sitting picked. A slot with one sitting
// opens on that sitting at once. Every page starts with the same back row,
// to the list from a picked sitting, else to the calendar, and a drag to
// the right takes the page away too, so the way back is under the thumb as
// well as on screen. A page fills the screen on a phone and is a panel at
// the right on a laptop. A page keeps its content while it slides away.
import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Drawer } from "vaul";
import type { Sitting } from "@/lib/expand";
import type { Slot } from "@/lib/slots";
import { type Clock, fmtDate, fmtDuration, fmtTime } from "@/lib/labels";
import { HostBadges } from "@/components/HostBadges";
import { SittingDetails } from "@/components/SittingDetails";
import { Button } from "@/components/ui/button";

/** The value, or the last one while it is null, so a page keeps its content while it slides away. */
function useLast<T>(value: T | null): T | null {
  const [last, setLast] = React.useState(value);
  if (value !== null && value !== last) setLast(value);
  return value ?? last;
}

/** One page of the sheet. The first page dims the calendar; a page over another does not. */
function Page({ dim = false, children }: { dim?: boolean; children: React.ReactNode }) {
  return (
    <Drawer.Portal>
      {dim && <Drawer.Overlay className="fixed inset-0 z-50 bg-black/50" />}
      <Drawer.Content
        aria-describedby={undefined}
        className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-background outline-none md:max-w-lg md:border-l md:shadow-lg"
      >
        {children}
      </Drawer.Content>
    </Drawer.Portal>
  );
}

const BackRow = ({ onBack }: { onBack: () => void }) => (
  <div className="border-b px-3 py-2">
    <Button variant="ghost" size="sm" onClick={onBack}>
      <ChevronLeftIcon /> Back
    </Button>
  </div>
);

function SittingPage({ sitting, zone, clock, onBack }: { sitting: Sitting; zone: string; clock: Clock; onBack: () => void }) {
  return (
    <>
      <BackRow onBack={onBack} />
      <Drawer.Title className="sr-only">{sitting.host.name}</Drawer.Title>
      <SittingDetails sitting={sitting} zone={zone} clock={clock} />
    </>
  );
}

function SlotPages({ slot, zone, clock, onClose }: { slot: Slot; zone: string; clock: Clock; onClose: () => void }) {
  const [picked, setPicked] = React.useState<Sitting | null>(null);
  const shown = useLast(picked);
  if (slot.sittings.length === 1) return <SittingPage sitting={slot.sittings[0]} zone={zone} clock={clock} onBack={onClose} />;

  return (
    <>
      <BackRow onBack={onClose} />
      <header className="border-b p-5">
        <div className="text-sm text-muted-foreground">{fmtDate(slot.start, zone)}</div>
        <Drawer.Title className="text-2xl font-semibold tabular-nums">
          {fmtTime(slot.start, zone, clock)} – {fmtTime(slot.end, zone, clock)}
          <span className="ml-2 text-sm font-normal text-muted-foreground">{fmtDuration(slot.durationMinutes)}</span>
        </Drawer.Title>
      </header>
      {/* The list scrolls up and down on its own; a drag to the right is the page's. */}
      <ul className="min-h-0 flex-1 touch-pan-y divide-y overflow-y-auto">
        {slot.sittings.map((s) => (
          <li key={s.key}>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-accent active:bg-accent"
              onClick={() => setPicked(s)}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium" title={s.host.name}>
                  {s.host.name}
                </div>
                <div className="mt-1">
                  <HostBadges host={s.host} size="xs" />
                </div>
              </div>
              <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
      <Drawer.NestedRoot direction="right" open={picked !== null} onOpenChange={(open) => !open && setPicked(null)}>
        {shown && (
          <Page>
            <SittingPage sitting={shown} zone={zone} clock={clock} onBack={() => setPicked(null)} />
          </Page>
        )}
      </Drawer.NestedRoot>
    </>
  );
}

export function SittingSheet({ slot, onClose, zone, clock }: { slot: Slot | null; onClose: () => void; zone: string; clock: Clock }) {
  const shown = useLast(slot);
  return (
    <Drawer.Root direction="right" open={slot !== null} onOpenChange={(open) => !open && onClose()}>
      {shown && (
        <Page dim>
          {/* Keyed on the slot, so a new row starts from its list again. */}
          <SlotPages key={shown.key} slot={shown} zone={zone} clock={clock} onClose={onClose} />
        </Page>
      )}
    </Drawer.Root>
  );
}
