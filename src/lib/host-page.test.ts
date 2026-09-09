import { describe, expect, it } from "vitest";
import { hostPage, VIRTUAL_EVENTS_URL } from "./host-page.ts";
import { aHost } from "@/test/fixtures";

describe("hostPage", () => {
  it("keeps the host's own page, and asks for no title", () => {
    expect(hostPage(aHost({ pageUrl: "https://atala.dhamma.org/os/" }))).toEqual({
      url: "https://atala.dhamma.org/os/",
      title: null,
    });
  });

  it("sends a host without a page to the virtual events page, under its title", () => {
    expect(hostPage(aHost({ pageUrl: null, eventsTitle: "IN, India Standard Time (IST)" }))).toEqual({
      url: VIRTUAL_EVENTS_URL,
      title: "IN, India Standard Time (IST)",
    });
  });
});
