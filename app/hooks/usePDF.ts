"use client"
import { useState } from "react"
import { downloadBlob, printBlob } from "@/lib/pdf/download"

export function usePDF() {
  const [loading, setLoading] = useState<string | null>(null)

  const downloadPDF = async (url: string, filename: string, loadingKey: string) => {
    setLoading(loadingKey)
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to generate PDF")
      const blob = await res.blob()
      downloadBlob(blob, filename)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  const printPDF = async (url: string, loadingKey: string) => {
    setLoading(loadingKey)
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to generate PDF")
      const blob = await res.blob()
      printBlob(blob)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  return { downloadPDF, printPDF, loading }
}