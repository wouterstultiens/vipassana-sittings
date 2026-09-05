// Which join details a sitting uses, and how a password is shown. A schedule
// rule that carries its own join details overrides the listing's.
import type { Join, Listing, ScheduleRule } from "@/schema/listing";

export function joinFor(listing: Listing, rule?: ScheduleRule): Join {
  return rule?.join ?? listing.join;
}

export function passwordNote(password: Join["password"]): string {
  switch (password.kind) {
    case "none":
      return "No password";
    case "old-student":
      return "Use the old-student password";
    case "given":
      return password.value;
  }
}
