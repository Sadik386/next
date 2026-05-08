import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { SidebarProvider } from "@/contexts/SidebarContext";

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <SidebarProvider>
        <div style={{ minHeight: "100vh", backgroundColor: "var(--page-bg)" }}>
          <Sidebar />
          <Topbar />
          <main
            style={{
              marginLeft: "var(--sidebar-width)",
              paddingTop: "48px",
              minHeight: "100vh",
              transition: "margin-left 0.2s ease",
            }}
          >
            <div style={{ padding: "24px 28px" }}>{children}</div>
          </main>
        </div>
      </SidebarProvider>
    </SettingsProvider>
  );
}
