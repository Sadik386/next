import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--page-bg)" }}>
      <Sidebar />
      <Topbar />
      <main style={{ marginLeft: "220px", paddingTop: "48px", minHeight: "100vh" }}>
        <div style={{ padding: "24px 28px" }}>{children}</div>
      </main>
    </div>
  );
}
