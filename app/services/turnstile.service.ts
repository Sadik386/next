const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileVerifyResult =
  | { success: true }
  | { success: false; errorCodes: string[] };

export async function verifyTurnstileToken(token: string): Promise<TurnstileVerifyResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    if (process.env.NODE_ENV === "production") {
      console.error("[Turnstile] TURNSTILE_SECRET_KEY is not set in production");
      return { success: false, errorCodes: ["configuration_error"] };
    }
    console.warn("[Turnstile] TURNSTILE_SECRET_KEY not set — skipping verification (dev mode only)");
    return { success: true };
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    if (!response.ok) {
      console.error("[Turnstile] Verification request failed:", response.status);
      return { success: false, errorCodes: ["network_error"] };
    }

    const data = await response.json() as { success: boolean; "error-codes"?: string[] };

    if (data.success) {
      return { success: true };
    }

    return { success: false, errorCodes: data["error-codes"] || ["invalid"] };
  } catch (error) {
    console.error("[Turnstile] Verification error:", error);
    return { success: false, errorCodes: ["network_error"] };
  }
}