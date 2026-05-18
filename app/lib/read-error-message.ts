export async function readErrorMessage(res: Response, fallback = "Request failed") {
  const text = await res.text().catch(() => "");
  if (!text) return fallback;

  try {
    const data = JSON.parse(text) as {
      error?: unknown;
      message?: unknown;
    };
    const message = data.message ?? data.error;
    return typeof message === "string" && message.trim() ? message : fallback;
  } catch {
    const clean = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return clean ? clean.slice(0, 240) : fallback;
  }
}
