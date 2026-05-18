"use client";
import Image from "next/image";

interface QrDisplayProps {
  value: string;
  alt: string;
  width?: number;
  height?: number;
}

export default function QrDisplay({ value, alt, width = 150, height = 150 }: QrDisplayProps) {
  return (
    <Image
      src={value}
      alt={alt}
      width={width}
      height={height}
      style={{ borderRadius: "8px", border: "1px solid var(--card-border)" }}
      unoptimized
    />
  );
}