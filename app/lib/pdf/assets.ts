export type PdfLogoAsset = { dataUrl: string; format: "PNG" | "JPEG" }

const DEFAULT_LOGO_TIMEOUT_MS = 1500

export function publicAssetUrl(url: string | null | undefined, origin: string) {
  if (!url) return undefined
  if (/^(https?:|data:)/i.test(url)) return url
  // Ensure we don't have double slashes
  const base = origin.endsWith("/") ? origin.slice(0, -1) : origin
  const path = url.startsWith("/") ? url : `/${url}`
  return `${base}${path}`
}

export function printLogoUrl(
  profile: { printLogoUrl?: string | null; logoUrl?: string | null },
  origin: string,
) {
  const url = profile.printLogoUrl ?? profile.logoUrl
  if (!url) return undefined
  return publicAssetUrl(url, origin)
}

export async function loadPdfLogo(
  src: string | null | undefined,
  timeoutMs = DEFAULT_LOGO_TIMEOUT_MS,
): Promise<PdfLogoAsset | null> {
  if (!src) return null

  // If it's a remote URL, we might want to skip it if it's causing massive hangs
  // For now, let's keep it but with a very strict timeout
  console.log(`[PDF Assets] Loading logo from: ${src}`);
  const start = Date.now();

  try {
    if (/^data:image\//i.test(src)) {
      if (/^data:image\/svg/i.test(src)) return null
      return dataUrlLogo(src)
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => {
      try { controller.abort() } catch {}
    }, timeoutMs)

    try {
      const response = await fetch(src, { 
        signal: controller.signal,
        next: { revalidate: 3600 } 
      } as any)

      if (!response.ok) {
        console.warn(`[PDF Assets] Logo fetch failed with status: ${response.status}`);
        return null;
      }

      const type = response.headers.get("content-type") ?? ""
      const format = imageTypeToPdfFormat(type)
      if (!format) {
        console.warn(`[PDF Assets] Unsupported logo format: ${type}`);
        return null;
      }

      const buffer = Buffer.from(await response.arrayBuffer())
      console.log(`[PDF Assets] Logo loaded in ${Date.now() - start}ms`);
      return {
        dataUrl: `data:${type};base64,${buffer.toString("base64")}`,
        format,
      }
    } catch (err) {
      console.error(`[PDF Assets] Logo fetch error: ${err}`);
      return null
    } finally {
      clearTimeout(timeout)
    }
  } catch (err) {
    console.error(`[PDF Assets] loadPdfLogo catch-all error: ${err}`);
    return null
  }
}


function dataUrlLogo(src: string): PdfLogoAsset | null {
  const format = imageTypeToPdfFormat(src.slice(0, src.indexOf(";")))
  return format ? { dataUrl: src, format } : null
}

function imageTypeToPdfFormat(type: string): PdfLogoAsset["format"] | null {
  const normalized = type.toLowerCase()
  if (normalized.includes("svg")) return null
  if (normalized.includes("png")) return "PNG"
  if (normalized.includes("jpeg") || normalized.includes("jpg")) return "JPEG"
  return null
}
