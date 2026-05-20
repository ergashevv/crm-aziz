"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  Car, 
  Wallet, 
  Fuel, 
  Warehouse,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LangSwitcher } from "./lang-switcher";
import { getDictionary } from "@/lib/dictionaries";

export function Sidebar({ 
  lang = 'ru',
  isCollapsed = false
}: { 
  lang?: string;
  isCollapsed?: boolean;
}) {
  const pathname = usePathname();
  const dict = getDictionary(lang);

  const routes = [
    { label: dict.dashboard, icon: LayoutDashboard, href: "/dashboard" },
    { label: dict.orders, icon: ClipboardList, href: "/orders" },
    { label: dict.clients, icon: Users, href: "/clients" },
    { label: dict.drivers, icon: Car, href: "/drivers" },
    { label: dict.finance, icon: Wallet, href: "/finance" },
    { label: dict.fuel_logs, icon: Fuel, href: "/fuel" },
    { label: dict.warehouse, icon: Warehouse, href: "/warehouse" },
  ];

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-[#0B0F19] text-white w-full h-full shadow-2xl z-50 overflow-y-auto overflow-x-hidden">
      <div className={cn("px-4 py-2 flex-1", isCollapsed && "px-2")}>
        <Link href="/dashboard" className={cn("flex items-center mb-8 mt-2 pl-2", isCollapsed && "pl-0 justify-center")}>
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/30 flex-shrink-0">
            <Warehouse className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && <h1 className="text-2xl font-bold tracking-tight ml-3 truncate">Adminka</h1>}
        </Link>
        {!isCollapsed && (
          <div className="mb-8">
            <LangSwitcher lang={lang} />
          </div>
        )}
        <div className="space-y-1.5">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              title={isCollapsed ? route.label : undefined}
              className={cn(
                "text-sm group flex p-3 w-full cursor-pointer rounded-xl transition-all duration-200",
                isCollapsed ? "justify-center" : "justify-start",
                pathname === route.href ? "text-white bg-primary/20 font-semibold" : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <div className={cn("flex items-center", isCollapsed ? "justify-center" : "flex-1 min-w-0")}>
                <route.icon className={cn("h-5 w-5 transition-colors flex-shrink-0", !isCollapsed && "mr-3", pathname === route.href ? "text-primary" : "text-slate-400 group-hover:text-white")} />
                {!isCollapsed && <span className="truncate">{route.label}</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="px-3 py-2">
        <button 
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/login';
          }}
          title={isCollapsed ? dict.logout : undefined}
          className={cn(
            "text-sm group flex p-3 w-full font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition text-zinc-400",
            isCollapsed ? "justify-center" : "justify-start"
          )}
        >
          <div className={cn("flex items-center", isCollapsed ? "justify-center" : "flex-1 min-w-0")}>
            <LogOut className={cn("h-5 w-5 flex-shrink-0", !isCollapsed && "mr-3")} />
            {!isCollapsed && <span className="truncate">{dict.logout}</span>}
          </div>
        </button>
      </div>
    </div>
  );
}
