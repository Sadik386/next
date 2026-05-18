"use client"
import { useState, useCallback } from "react"
import { toast } from "sonner"
import { downloadBlob, printBlob } from "@/lib/pdf/download"
import { readErrorMessage } from "@/lib/read-error-message"

type LoadingKey = string | null

export function usePDF() {
  const [loading, setLoading] = useState<LoadingKey>(null)

  const generate = useCallback(async (url: string): Promise<Blob | null> => {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(await readErrorMessage(res, `Document generation failed (${res.status})`))
      return await res.blob()
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Document generation failed")
      return null
    }
  }, [])

  const downloadPDF = useCallback(async (url: string, filename: string, key: string) => {
    setLoading(key)
    const blob = await generate(url)
    if (blob) downloadBlob(blob, filename)
    setLoading(null)
  }, [generate])

  const printPDF = useCallback(async (url: string, key: string) => {
    setLoading(key)
    const blob = await generate(url)
    if (blob) printBlob(blob)
    setLoading(null)
  }, [generate])

  const isLoading = useCallback((key: string) => loading === key, [loading])

  return { downloadPDF, printPDF, isLoading, loading }
}
