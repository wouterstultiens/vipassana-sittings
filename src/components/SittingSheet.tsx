// The detail panel as a right-side sheet. The week grid opens it for the one
// sitting the old student clicked.
import type { Sitting } from "@/lib/expand";
import { SittingDetails } from "@/components/SittingDetails";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export function SittingSheet({
  sitting,
  onClose,
  zone,
}: {
  sitting: Sitting | null;
  onClose: () => void;
  zone: string;
}) {
  return (
    <Sheet open={sitting !== null} onOpenChange={(open) => !open && onClose()}>
      {sitting && (
        <SheetContent className="sm:max-w-lg">
          {/* The panel prints the name itself; screen readers need it here too. */}
          <SheetTitle className="sr-only">{sitting.listing.name}</SheetTitle>
          <SittingDetails listing={sitting.listing} sitting={sitting} zone={zone} />
        </SheetContent>
      )}
    </Sheet>
  );
}
