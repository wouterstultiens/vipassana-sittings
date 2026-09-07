// How a password is shown: as a value, or as a note when the value is not in
// the data.
import type { Join } from "@/schema/host";

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
