export function getAppBaseUrl(req?: Request | { nextUrl?: { protocol?: string; host?: string } }): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, "");
  }

  if (req && "nextUrl" in req) {
    const nextUrl = (req as { nextUrl: { protocol?: string; host?: string } }).nextUrl;
    if (nextUrl) {
      const protocol = nextUrl.protocol || "https";
      const host = nextUrl.host;
      return `${protocol}//${host}`;
    }
  }

  return "https://app.accoraze.com";
}

export function buildScannerUrl(
  context: "pos" | "products",
  sessionId: string,
  req?: Request | { nextUrl?: { protocol?: string; host?: string } }
): string {
  const baseUrl = getAppBaseUrl(req);
  return `${baseUrl}/scan/${context}/${sessionId}`;
}