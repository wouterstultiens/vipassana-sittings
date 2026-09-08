import { describe, expect, it } from "vitest";
import { absoluteUrl, describeLink } from "./links.ts";

describe("absoluteUrl", () => {
  it("roots a relative API url on dhamma.org", () => {
    expect(absoluteUrl("/en/schedules/noncenter/ps")).toBe("https://www.dhamma.org/en/schedules/noncenter/ps");
    expect(absoluteUrl("https://a.invalid/x")).toBe("https://a.invalid/x");
  });
});

describe("describeLink", () => {
  it("gives the status, and the landing url when it moved on the same site", () => {
    expect(describeLink({ url: "https://a.invalid/", status: 200, finalUrl: "https://a.invalid/", error: null })).toBe(
      "leads to: status 200",
    );
    expect(describeLink({ url: "http://www.a.invalid/os", status: 200, finalUrl: "https://a.invalid/", error: null })).toBe(
      "leads to: status 200, lands on https://a.invalid/",
    );
  });

  it("names only the host when the url lands on another site", () => {
    const teams = "https://teams.microsoft.com/dl/launcher/launcher.html?deeplinkId=1";
    expect(describeLink({ url: "https://a.invalid/sit", status: 200, finalUrl: teams, error: null })).toBe(
      "leads to: status 200, lands on teams.microsoft.com",
    );
  });

  it("names the failure when the url is unreachable", () => {
    expect(describeLink({ url: "https://a.invalid/", status: null, finalUrl: null, error: "fetch failed" })).toBe(
      "leads to: unreachable (fetch failed)",
    );
  });
});
