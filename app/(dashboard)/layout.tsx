import { cookies } from "next/headers";
import { SidebarWrapper } from "@/components/layout/SidebarWrapper";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = cookies().get('lang')?.value || 'ru';

  return (
    <SidebarWrapper lang={lang}>
      {children}
    </SidebarWrapper>
  );
}
