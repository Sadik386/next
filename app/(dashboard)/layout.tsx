import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { Toaster } from "@/components/ui/sonner";
import { DynamicFavicon } from "@/components/layout/DynamicFavicon";

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <DynamicFavicon />
      <CurrencyProvider>
        <SidebarProvider>
          <div className="acc-dashboard-shell acc-overflow-hidden" style={{ minHeight: "100vh", backgroundColor: "var(--page-bg)" }}>
            <Sidebar />
            <Topbar />
            <main
              className="acc-main-content"
              style={{
                marginLeft: "var(--sidebar-width)",
                paddingTop: "48px",
                minHeight: "100vh",
                transition: "margin-left 0.2s ease",
              }}
            >
              <div className="acc-page-content" style={{ padding: "24px 28px" }}>{children}</div>
            </main>
            <Toaster richColors closeButton />
          </div>
        </SidebarProvider>
      </CurrencyProvider>
    </SettingsProvider>
  );
}
