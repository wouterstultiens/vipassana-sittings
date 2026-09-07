// One file name per page URL: host and path, nothing a file system
// rejects. Used wherever a page text is written next to other pages.
export const pageFileName = (url: string): string => {
  const u = new URL(url);
  const path = (u.pathname + u.search).replace(/\/+$/, "").replace(/[^A-Za-z0-9.-]+/g, "-");
  return `${u.host}${path}.txt`;
};
