import React from 'react';
import { getDashboardData, getFinanceData, getClients, getDrivers } from '@/lib/data';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/dictionaries';
import { TableRowLink } from '@/components/TableRowLink';
import { LayoutDashboard, Users, Truck, TrendingDown, DollarSign } from 'lucide-react';

function getStatusBadge(status: string, dict: any) {
  switch (status) {
    case 'new': return <Badge variant="info">{dict.new}</Badge>;
    case 'assigned': return <Badge variant="secondary">{dict.assigned}</Badge>;
    case 'in_progress': return <Badge variant="warning">{dict.in_progress}</Badge>;
    case 'container_placed': return <Badge variant="warning">{dict.container_placed}</Badge>;
    case 'picked_up': return <Badge variant="info">{dict.picked_up}</Badge>;
    case 'completed': return <Badge variant="success">{dict.completed}</Badge>;
    default: return <Badge>{status}</Badge>;
  }
}

export default async function DashboardPage() {
  const lang = cookies().get('lang')?.value;
  const dict = getDictionary(lang);

  const allOrders = await getDashboardData();
  const { allExpenses, allWarehouseIncome } = await getFinanceData();
  const allClients = await getClients();
  const allDrivers = await getDrivers();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  let todaysRevenue = 0;
  let monthlyRevenue = 0;
  let pendingPayments = 0;
  let activeOrders = 0;

  for (const order of allOrders) {
    const orderDate = new Date(order.createdAt);
    if (orderDate >= today && order.paymentStatus === 'entered') {
      todaysRevenue += order.paymentAmount;
    }
    if (orderDate >= thisMonth && order.paymentStatus === 'entered') {
      monthlyRevenue += order.paymentAmount;
    }
    if (order.paymentStatus === 'pending') {
      pendingPayments++;
    }
    if (order.status !== 'completed' && order.status !== 'picked_up') {
      activeOrders++;
    }
  }

  for (const w of allWarehouseIncome) {
     const wDate = new Date(w.recordedAt);
     if (wDate >= today) todaysRevenue += w.amountRub;
     if (wDate >= thisMonth) monthlyRevenue += w.amountRub;
  }

  let monthlyExpenses = 0;
  for (const e of allExpenses) {
    const eDate = new Date(e.recordedAt);
    if (eDate >= thisMonth) monthlyExpenses += e.amountRub;
  }

  const monthlyProfit = monthlyRevenue - monthlyExpenses;

  const totalClientsCount = allClients.length;
  const totalDriversCount = allDrivers.length;

  const recentOrders = allOrders.slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200/60">
            <LayoutDashboard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{dict.dashboard}</h1>
            <p className="text-slate-500 mt-1 font-medium">{dict.overview}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Link href="/finance" className="block transition-transform hover:scale-105 active:scale-95">
          <Card className="h-full border-0 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-100 rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-50 to-white relative cursor-pointer">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-indigo-600">
               <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-indigo-800 uppercase tracking-wider">{dict.todays_revenue}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-indigo-600 tracking-tight">{todaysRevenue.toLocaleString()} <span className="text-lg font-semibold opacity-70">RUB</span></div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/finance" className="block transition-transform hover:scale-105 active:scale-95">
          <Card className="h-full border-0 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-100 rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-50 to-white relative cursor-pointer">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-600">
               <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-emerald-800 uppercase tracking-wider">{dict.monthly_revenue}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">{monthlyRevenue.toLocaleString()} <span className="text-lg font-semibold opacity-70">RUB</span></div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/orders?paymentStatus=pending" className="block transition-transform hover:scale-105 active:scale-95">
          <Card className="h-full border-0 shadow-lg shadow-rose-500/10 ring-1 ring-rose-100 rounded-3xl overflow-hidden bg-gradient-to-br from-rose-50 to-white relative cursor-pointer">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-rose-600">
               <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-rose-800 uppercase tracking-wider">{dict.pending_payments}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-rose-600">{pendingPayments}</div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/orders" className="block transition-transform hover:scale-105 active:scale-95">
          <Card className="h-full border-0 shadow-lg shadow-blue-500/10 ring-1 ring-blue-100 rounded-3xl overflow-hidden bg-gradient-to-br from-blue-50 to-white relative cursor-pointer">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-600">
               <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-blue-800 uppercase tracking-wider">{dict.active_orders}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-blue-600">{activeOrders}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/finance" className="block transition-transform hover:scale-105 active:scale-95">
          <Card className="h-full border-0 shadow-lg shadow-red-500/10 ring-1 ring-red-100 rounded-3xl overflow-hidden bg-gradient-to-br from-red-50 to-white relative cursor-pointer">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-red-600">
               <TrendingDown className="w-12 h-12" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-red-800 uppercase tracking-wider">{dict.monthly_expenses || "Monthly Expenses"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-red-600 tracking-tight">{monthlyExpenses.toLocaleString()} <span className="text-lg font-semibold opacity-70">RUB</span></div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/finance" className="block transition-transform hover:scale-105 active:scale-95">
          <Card className={`h-full border-0 shadow-lg ring-1 rounded-3xl overflow-hidden relative cursor-pointer ${monthlyProfit >= 0 ? "shadow-cyan-500/10 ring-cyan-100 bg-gradient-to-br from-cyan-50 to-white" : "shadow-orange-500/10 ring-orange-100 bg-gradient-to-br from-orange-50 to-white"}`}>
            <div className={`absolute top-0 right-0 p-4 opacity-10 ${monthlyProfit >= 0 ? "text-cyan-600" : "text-orange-600"}`}>
               <DollarSign className="w-12 h-12" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className={`text-xs font-bold uppercase tracking-wider ${monthlyProfit >= 0 ? "text-cyan-800" : "text-orange-800"}`}>{dict.monthly_profit || "Monthly Profit"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-extrabold tracking-tight ${monthlyProfit >= 0 ? "text-cyan-600" : "text-orange-600"}`}>{monthlyProfit.toLocaleString()} <span className="text-lg font-semibold opacity-70">RUB</span></div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/clients" className="block transition-transform hover:scale-105 active:scale-95">
          <Card className="h-full border-0 shadow-lg shadow-purple-500/10 ring-1 ring-purple-100 rounded-3xl overflow-hidden bg-gradient-to-br from-purple-50 to-white relative cursor-pointer">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-purple-600">
               <Users className="w-12 h-12" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-purple-800 uppercase tracking-wider">{dict.total_clients || "Total Clients"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-purple-600">{totalClientsCount}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/drivers" className="block transition-transform hover:scale-105 active:scale-95">
          <Card className="h-full border-0 shadow-lg shadow-amber-500/10 ring-1 ring-amber-100 rounded-3xl overflow-hidden bg-gradient-to-br from-amber-50 to-white relative cursor-pointer">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-600">
               <Truck className="w-12 h-12" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-amber-800 uppercase tracking-wider">{dict.total_drivers || "Total Drivers"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-amber-600">{totalDriversCount}</div>
            </CardContent>
          </Card>
        </Link>
      </div>
      
      <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden">
        <CardHeader className="bg-white/50 backdrop-blur-sm border-b border-slate-100">
          <CardTitle>{dict.recent_orders}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80 backdrop-blur-sm">
              <TableRow>
                <TableHead>{dict.date}</TableHead>
                <TableHead>{dict.address}</TableHead>
                <TableHead>{dict.status}</TableHead>
                <TableHead>{dict.payment}</TableHead>
                <TableHead className="text-right">{dict.amount}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRowLink href={`/orders/${order.id}`} key={order.id}>
                  <TableCell className="font-medium">
                    {format(new Date(order.createdAt), 'dd.MM.yyyy')}
                  </TableCell>
                  <TableCell className="truncate max-w-[200px]">{order.address}</TableCell>
                  <TableCell>{getStatusBadge(order.status, dict)}</TableCell>
                  <TableCell>
                    {order.paymentStatus === 'entered' ? (
                      <Badge variant="success">{dict.entered}</Badge>
                    ) : (
                      <Badge variant="destructive">{dict.pending}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {order.paymentAmount.toLocaleString()} RUB
                  </TableCell>
                </TableRowLink>
              ))}
              {recentOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    {dict.no_recent_orders}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
