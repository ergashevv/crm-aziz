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

export function Sidebar({ lang = 'ru' }: { lang?: string }) {
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
    <div className="space-y-4 py-4 flex flex-col h-full bg-[#0B0F19] text-white w-64 fixed left-0 top-0 bottom-0 shadow-2xl z-50">
      <div className="px-4 py-2 flex-1">
        <Link href="/dashboard" className="flex items-center pl-2 mb-8 mt-2">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-primary/30">
            <Warehouse className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Adminka</h1>
        </Link>
        <div className="mb-8">
          <LangSwitcher lang={lang} />
        </div>
        <div className="space-y-1.5">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer rounded-xl transition-all duration-200",
                pathname === route.href ? "text-white bg-primary/20 font-semibold" : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3 transition-colors", pathname === route.href ? "text-primary" : "text-slate-400 group-hover:text-white")} />
                {route.label}
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
          className="text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition text-zinc-400"
        >
          <div className="flex items-center flex-1">
            <LogOut className="h-5 w-5 mr-3" />
            {dict.logout}
          </div>
        </button>
      </div>
    </div>
  );
}
