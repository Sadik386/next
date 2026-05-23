export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function printBlob(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const iframe = document.createElement("iframe")
  
  // Minimal style to keep it hidden but functional
  iframe.style.position = "fixed"
  iframe.style.right = "0"
  iframe.style.bottom = "0"
  iframe.style.width = "0"
  iframe.style.height = "0"
  iframe.style.border = "none"
  iframe.style.visibility = "hidden"
  
  const cleanup = () => {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe)
    }
    URL.revokeObjectURL(url)
  }

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch (err) {
      console.error("PDF print error:", err)
    }
    
    // Remove after a delay to ensure print dialog has opened/handled the blob
    setTimeout(cleanup, 10000)
  }

  iframe.onerror = () => {
    console.error("PDF iframe load error")
    cleanup()
  }

  iframe.src = url
  document.body.appendChild(iframe)
}