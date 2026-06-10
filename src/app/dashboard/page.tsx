import { supabase } from "@/lib/supabase";
import SalesChart from "./SalesChart";

async function getStats() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [previews, textsSent, responses, salesWeek, salesMonth, clients] = await Promise.allSettled([
    supabase.from("sites").select("*", { count: "exact", head: true }),
    supabase.from("outreach_log").select("*", { count: "exact", head: true })
      .eq("method", "text").gte("sent_at", todayStart.toISOString()),
    supabase.from("responses").select("*", { count: "exact", head: true }),
    supabase.from("sales").select("amount").gte("created_at", weekAgo.toISOString()),
    supabase.from("sales").select("amount").gte("created_at", monthAgo.toISOString()),
    supabase.from("businesses").select("*", { count: "exact", head: true }).eq("status", "client"),
  ]);

  return {
    totalPreviews:    previews.status    === "fulfilled" ? (previews.value.count    ?? 0) : 0,
    textsSentToday:   textsSent.status   === "fulfilled" ? (textsSent.value.count   ?? 0) : 0,
    responsesCount:   responses.status   === "fulfilled" ? (responses.value.count   ?? 0) : 0,
    salesThisWeek:    salesWeek.status   === "fulfilled" ? (salesWeek.value.data?.length ?? 0) : 0,
    monthlyRevenue:   salesMonth.status  === "fulfilled"
      ? (salesMonth.value.data?.reduce((s, r) => s + (r.amount ?? 0), 0) ?? 0)
      : 0,
    activeClients:    clients.status     === "fulfilled" ? (clients.value.count     ?? 0) : 0,
  };
}

async function getChartData() {
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("sales")
    .select("amount, created_at")
    .gte("created_at", monthAgo)
    .order("created_at");

  if (!data?.length) return [];

  const byDay: Record<string, number> = {};
  for (const row of data) {
    const day = row.created_at.slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + (row.amount ?? 0);
  }

  return Object.entries(byDay).map(([date, revenue]) => ({
    date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    revenue,
  }));
}

async function getRecentSites() {
  const { data } = await supabase
    .from("sites")
    .select("slug, business_name, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  return data ?? [];
}

const STAT_CARDS = [
  { key: "totalPreviews",  label: "Total Previews",      prefix: "",  suffix: "" },
  { key: "textsSentToday", label: "Texts Sent Today",    prefix: "",  suffix: "" },
  { key: "responsesCount", label: "Responses Received",  prefix: "",  suffix: "" },
  { key: "salesThisWeek",  label: "Sales This Week",     prefix: "",  suffix: "" },
  { key: "monthlyRevenue", label: "Monthly Revenue",     prefix: "$", suffix: "" },
  { key: "activeClients",  label: "Active Clients",      prefix: "",  suffix: "" },
] as const;

export default async function DashboardPage() {
  const [stats, chartData, recentSites] = await Promise.all([
    getStats(),
    getChartData(),
    getRecentSites(),
  ]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-white font-sans font-bold text-xl">Dashboard</h1>
        <p className="text-white/35 text-sm font-sans mt-1">Agency overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {STAT_CARDS.map(({ key, label, prefix }) => (
          <div key={key} className="bg-[#0d1321] border border-white/6 p-5">
            <p className="text-white/40 text-[11px] tracking-[0.25em] uppercase font-sans mb-2">{label}</p>
            <p className="text-white font-sans font-bold text-3xl">
              {key === "monthlyRevenue"
                ? `${prefix}${stats[key].toLocaleString()}`
                : stats[key as keyof typeof stats]}
            </p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-[#0d1321] border border-white/6 p-6 mb-8">
        <p className="text-white/40 text-[11px] tracking-[0.25em] uppercase font-sans mb-5">
          Revenue — Last 30 Days
        </p>
        <SalesChart data={chartData} />
      </div>

      {/* Recent sites */}
      <div className="bg-[#0d1321] border border-white/6">
        <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
          <p className="text-white/40 text-[11px] tracking-[0.25em] uppercase font-sans">Recent Sites</p>
          <a href="/dashboard/sites" className="text-[#d4a853] text-xs font-sans hover:underline">View all →</a>
        </div>
        {recentSites.length === 0 ? (
          <div className="px-6 py-8 text-white/25 text-sm font-sans text-center">No sites generated yet</div>
        ) : (
          <table className="w-full text-sm font-sans">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-3 text-white/25 text-[10px] tracking-[0.2em] uppercase">Business</th>
                <th className="text-left px-6 py-3 text-white/25 text-[10px] tracking-[0.2em] uppercase">Status</th>
                <th className="text-left px-6 py-3 text-white/25 text-[10px] tracking-[0.2em] uppercase">Created</th>
              </tr>
            </thead>
            <tbody>
              {recentSites.map((site) => (
                <tr key={site.slug} className="border-b border-white/4 hover:bg-white/2 transition-colors">
                  <td className="px-6 py-3 text-white font-medium">{site.business_name}</td>
                  <td className="px-6 py-3">
                    <span className={`text-[10px] tracking-[0.15em] uppercase font-semibold px-2 py-1 ${
                      site.status === "sold"
                        ? "bg-emerald-900/40 text-emerald-400"
                        : "bg-white/5 text-white/40"
                    }`}>
                      {site.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-white/35">
                    {new Date(site.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
