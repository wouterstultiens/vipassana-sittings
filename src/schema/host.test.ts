import { describe, expect, it } from "vitest";
import { HostExtraction, Join } from "./host.ts";

const extraction = {
  name: "X",
  timeZone: "America/Montreal",
  languages: ["en"],
  medium: "video",
  teacherLed: false,
  questionsAndAnswers: false,
  pageUrl: null,
  rules: [],
};

describe("HostExtraction", () => {
  it("keeps the zone name the extraction read", () => {
    expect(HostExtraction.parse({ ...extraction, timeZone: "Asia/Kolkata" }).timeZone).toBe("Asia/Kolkata");
  });

  it("rejects a zone the runtime does not know", () => {
    expect(HostExtraction.safeParse({ ...extraction, timeZone: "Mars/Olympus" }).success).toBe(false);
  });

  it("names the language code format in the validation error", () => {
    const result = HostExtraction.safeParse({ ...extraction, languages: ["zh-TW"] });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain("ISO 639-1");
  });
});

describe("Join", () => {
  const join = { platform: "teams", meetingId: null, password: { kind: "none" }, dialIn: null };

  it("drops a closing bracket copied from the page text", () => {
    expect(Join.parse({ ...join, url: "https://a.invalid/x?y=1]" }).url).toBe("https://a.invalid/x?y=1");
  });

  it("rejects a url that is not http", () => {
    expect(Join.safeParse({ ...join, url: "zoommtg://a.invalid" }).success).toBe(false);
  });

  it("keeps the dial-in access code and its password apart", () => {
    const dialIn = { numbers: ["+1 778 907 2071"], accessCode: "819 423 1414", password: "269712" };
    expect(Join.parse({ ...join, url: null, dialIn }).dialIn).toEqual(dialIn);
  });

  it("rejects a join with no way in", () => {
    expect(Join.safeParse({ ...join, url: null }).success).toBe(false);
  });

  it("rejects a dial-in that leaves the password out", () => {
    const dialIn = { numbers: ["+1 778 907 2071"], accessCode: "819 423 1414" };
    expect(Join.safeParse({ ...join, url: null, dialIn }).success).toBe(false);
  });
});
