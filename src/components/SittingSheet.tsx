// The detail panel as a right-side sheet. The week grid and the card list open
// it: with a sitting for one occurrence, without one for a listing that has no
// fixed time.
import type { Listing } from "@/schema/listing";
import type { Sitting } from "@/lib/expand";
import { SittingDetails } from "@/components/SittingDetails";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export type PanelTarget = { listing: Listing; sitting?: Sitting };

export function SittingSheet({
  target,
  onClose,
  zone,
  referenceDate,
}: {
  target: PanelTarget | null;
  onClose: () => void;
  zone: string;
  referenceDate: Date;
}) {
  return (
    <Sheet open={target !== null} onOpenChange={(open) => !open && onClose()}>
      {target && (
        <SheetContent className="sm:max-w-lg">
          {/* The panel prints the name itself; screen readers need it here too. */}
          <SheetTitle className="sr-only">{target.listing.name}</SheetTitle>
          <SittingDetails
            listing={target.listing}
            sitting={target.sitting}
            zone={zone}
            referenceDate={referenceDate}
          />
        </SheetContent>
      )}
    </Sheet>
  );
}
