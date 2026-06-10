"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Search, Globe, Send, MessageSquare, Clock, Settings,
} from "lucide-react";

const NAV = [
  { label: "Dashboard",        href: "/dashboard",              icon: LayoutDashboard },
  { label: "Find Businesses",  href: "/dashboard/find",         icon: Search },
  { label: "Generated Sites",  href: "/dashboard/sites",        icon: Globe },
  { label: "Outreach",         href: "/dashboard/outreach",     icon: Send },
  { label: "Responses",        href: "/dashboard/responses",    icon: MessageSquare },
  { label: "Follow Ups",       href: "/dashboard/follow-ups",   icon: Clock },
  { label: "Settings",         href: "/dashboard/settings",     icon: Settings },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-[#060b17] border-r border-white/6 flex flex-col z-50">
      <div className="px-5 py-5 border-b border-white/6">
        <p className="font-sans font-bold text-white text-sm tracking-wider">Mallard Creative</p>
        <p className="text-white/30 text-[10px] tracking-[0.3em] uppercase mt-0.5 font-sans">Agency OS</p>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = path === href || (href !== "/dashboard" && path.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 text-[13px] font-sans transition-all rounded-sm ${
                active
                  ? "bg-[#d4a853]/10 text-[#d4a853] border-l-2 border-[#d4a853]"
                  : "text-white/40 hover:text-white/75 hover:bg-white/4 border-l-2 border-transparent"
              }`}
              style={{ paddingLeft: active ? "10px" : "12px" }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/6">
        <p className="text-white/15 text-[10px] font-sans tracking-widest uppercase">v1.0</p>
      </div>
    </aside>
  );
}
