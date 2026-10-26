import React from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] bg-[#F4F6FA]">
      {/* Persistent Primary Navigation */}
      <AppSidebar />

      {/* Main Content Workbench */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader />
        <main className="flex-1 p-5 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
