import type { ApiRow } from "./api.ts";
import { type Page, type PageInput, Session } from "./fetch-page.ts";
import { inputHash } from "./hash.ts";

// The sources of every host as they are now, behind one browsing session. A
// page shared by several hosts is fetched once, however many hosts ask for it.
export class LiveSources {
  private session = new Session();
  private fetched = new Map<string, Promise<string>>();

  private text(page: Page): Promise<string> {
    let text = this.fetched.get(page.url);
    if (!text) this.fetched.set(page.url, (text = this.session.fetchPage(page)));
    return text;
  }

  // The input hash of one host, or a throw when a page cannot be read.
  async hash(rows: ApiRow[], pages: Page[]): Promise<string> {
    const read: PageInput[] = [];
    for (const page of pages) read.push({ url: page.url, text: await this.text(page) });
    return inputHash(rows, read);
  }
}
