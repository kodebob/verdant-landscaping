import Sidebar from "./Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080c14] flex">
      <Sidebar />
      <div className="flex-1 ml-60 min-h-screen">
        {children}
      </div>
    </div>
  );
}
