import { describe, expect, it } from "vitest";
import { passwordNote } from "@/lib/join";

describe("passwordNote", () => {
  it("names the old-student password instead of showing a value", () => {
    expect(passwordNote({ kind: "old-student" })).toBe("Use the old-student password");
  });

  it("says when there is no password", () => {
    expect(passwordNote({ kind: "none" })).toBe("No password");
  });

  it("shows a given password as it stands", () => {
    expect(passwordNote({ kind: "given", value: "dhamma" })).toBe("dhamma");
  });
});
