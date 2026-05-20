import { Sidebar } from "@/components/layout/sidebar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { cookies } from "next/headers";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = cookies().get('lang')?.value || 'ru';

  return (
    <div className="h-full relative bg-slate-100/80 min-h-screen font-sans antialiased">
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-slate-200/50 to-transparent pointer-events-none z-0" />
      
      {/* Mobile Sidebar & Header */}
      <MobileSidebar lang={lang} />

      {/* Desktop Sidebar */}
      <div className="hidden h-full md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-[80]">
        <Sidebar lang={lang} />
      </div>
      
      <main className="md:pl-64 h-full relative z-10 pt-16 md:pt-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
