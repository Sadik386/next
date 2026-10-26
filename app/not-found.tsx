import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] bg-[#f8fafc] text-[#18181b] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-zinc-200 rounded-xl p-8 text-center space-y-4 shadow-2xs">
        <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-600">
          <FileQuestion className="w-5 h-5" />
        </div>

        <div className="space-y-1">
          <div className="text-xs font-mono text-zinc-500 font-medium">
            Page not found (404)
          </div>
          <h1 className="font-heading font-extrabold text-xl text-zinc-950">
            This page does not exist
          </h1>
          <p className="text-xs text-zinc-500 leading-relaxed font-sans">
            The link you followed may be broken or the page has moved.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <Link
            href="/pos"
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-2xs transition-colors tactile-btn inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Open register</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
