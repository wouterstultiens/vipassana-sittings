import { describe, expect, it } from "vitest";
import { joinFor, passwordNote } from "@/lib/join";
import { aJoin, aListing, aRule } from "@/test/fixtures";

describe("joinFor", () => {
  const listingJoin = aJoin({ url: "https://example.org/listing-room" });
  const ruleJoin = aJoin({ url: "https://example.org/evening-room" });

  it("uses the listing's join details when the rule carries none", () => {
    const listing = aListing({ join: listingJoin, scheduleRules: [aRule({ join: null })] });
    expect(joinFor(listing, listing.scheduleRules[0])).toBe(listingJoin);
  });

  it("uses the rule's own join details when it carries them", () => {
    const listing = aListing({ join: listingJoin, scheduleRules: [aRule({ join: ruleJoin })] });
    expect(joinFor(listing, listing.scheduleRules[0])).toBe(ruleJoin);
  });

  it("falls back to the listing when there is no rule", () => {
    const listing = aListing({ join: listingJoin, scheduleRules: [] });
    expect(joinFor(listing)).toBe(listingJoin);
  });
});

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
