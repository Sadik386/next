"use client"
import { useState, useCallback } from "react"
import { downloadBlob, printBlob } from "@/lib/pdf/download"

type LoadingKey = string | null

export function usePDF() {
  const [loading, setLoading] = useState<LoadingKey>(null)

  const generate = useCallback(async (url: string): Promise<Blob | null> => {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to generate document")
      return await res.blob()
    } catch (err) {
      console.error(err)
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