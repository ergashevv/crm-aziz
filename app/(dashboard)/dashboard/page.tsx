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
import { LayoutDashboard, Users, Truck, DollarSign, Fuel, CarFront, FileWarning, Recycle, Wrench, Briefcase, HandCoins } from 'lucide-react';
import { DashboardCharts } from '@/components/DashboardCharts';
import { DashboardDatePicker } from '@/components/DashboardDatePicker';
import { MetricCard } from '@/components/MetricCard';

export const dynamic = 'force-dynamic';

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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const lang = cookies().get('lang')?.value;
  const dict = getDictionary(lang);

  const allOrders = await getDashboardData();
  const { allExpenses, allWarehouseIncome } = await getFinanceData();
  const allClients = await getClients();
  const allDrivers = await getDrivers();

  // Date Parsing Logic
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const fromParam = searchParams?.from as string;
  const toParam = searchParams?.to as string;

  const parseLocal = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d), 0, 0, 0, 0);
  };

  const currentFrom = fromParam ? parseLocal(fromParam) : new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
  const currentTo = toParam ? parseLocal(toParam) : new Date(todayDate.getTime());
  currentTo.setHours(23, 59, 59, 999);

  const durationMs = currentTo.getTime() - currentFrom.getTime();
  
  const prevTo = new Date(currentFrom.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - durationMs);
  prevFrom.setHours(0, 0, 0, 0);
  prevTo.setHours(23, 59, 59, 999);

  const isCurrent = (d: Date) => d >= currentFrom && d <= currentTo;
  const isPrev = (d: Date) => d >= prevFrom && d <= prevTo;

  let currentMetrics = {
    revenue: 0, expenses: 0, profit: 0,
    dispatcherOrders: 0, dispatcherFee: 0, dispatcherSalary: 0,
    fuel: 0, gai: 0, utilizationM3: 0, utilizationExpense: 0,
    spareParts: 0, driverSalary: 0
  };

  let prevMetrics = {
    revenue: 0, expenses: 0, profit: 0,
    dispatcherOrders: 0, dispatcherFee: 0, dispatcherSalary: 0,
    fuel: 0, gai: 0, utilizationM3: 0, utilizationExpense: 0,
    spareParts: 0, driverSalary: 0
  };

  let pendingPayments = 0;
  let activeOrders = 0;

  for (const order of allOrders) {
    const orderDate = new Date(order.createdAt);
    
    // Revenue
    if (order.paymentStatus === 'entered' || order.paymentStatus === 'received') {
      if (isCurrent(orderDate)) currentMetrics.revenue += order.paymentAmount;
      if (isPrev(orderDate)) prevMetrics.revenue += order.paymentAmount;
    }

    // Dispatcher
    if (order.dispatcherId) {
      if (isCurrent(orderDate)) {
        currentMetrics.dispatcherOrders++;
        currentMetrics.dispatcherFee += (order.dispatcherFee || 0);
      }
      if (isPrev(orderDate)) {
        prevMetrics.dispatcherOrders++;
        prevMetrics.dispatcherFee += (order.dispatcherFee || 0);
      }
    }

    // Utilization Volume
    if (order.status === 'completed') {
      if (isCurrent(orderDate)) currentMetrics.utilizationM3 += (order.containerSizeM3 || 0);
      if (isPrev(orderDate)) prevMetrics.utilizationM3 += (order.containerSizeM3 || 0);
    }

    // Active & Pending status counts for quick links (ignoring date)
    if (order.paymentStatus === 'pending') pendingPayments++;
    if (order.status !== 'completed') activeOrders++;
  }

  for (const w of allWarehouseIncome) {
     if (w.source === 'client_payment') continue;
     const wDate = new Date(w.recordedAt);
     if (isCurrent(wDate)) currentMetrics.revenue += w.amountRub;
     if (isPrev(wDate)) prevMetrics.revenue += w.amountRub;
  }

  for (const e of allExpenses) {
    const eDate = new Date(e.recordedAt);
    const amt = e.amountRub;
    
    if (isCurrent(eDate)) {
      currentMetrics.expenses += amt;
      if (e.category === 'fuel' || e.category === 'diesel') currentMetrics.fuel += amt;
      if (e.category === 'gai') currentMetrics.gai += amt;
      if (e.category === 'utilization') currentMetrics.utilizationExpense += amt;
      if (e.category === 'spare_parts') currentMetrics.spareParts += amt;
      if (e.category === 'driver_salary') currentMetrics.driverSalary += amt;
      if (e.category === 'dispatcher_salary') currentMetrics.dispatcherSalary += amt;
    }
    if (isPrev(eDate)) {
      prevMetrics.expenses += amt;
      if (e.category === 'fuel' || e.category === 'diesel') prevMetrics.fuel += amt;
      if (e.category === 'gai') prevMetrics.gai += amt;
      if (e.category === 'utilization') prevMetrics.utilizationExpense += amt;
      if (e.category === 'spare_parts') prevMetrics.spareParts += amt;
      if (e.category === 'driver_salary') prevMetrics.driverSalary += amt;
      if (e.category === 'dispatcher_salary') prevMetrics.dispatcherSalary += amt;
    }
  }

  currentMetrics.profit = currentMetrics.revenue - currentMetrics.expenses;
  prevMetrics.profit = prevMetrics.revenue - prevMetrics.expenses;

  const calcTrend = (current: number, prev: number) => {
    if (prev === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - prev) / Math.abs(prev)) * 100);
  };

  const totalClientsCount = allClients.length;
  const totalDriversCount = allDrivers.length;

  const recentOrders = allOrders.filter(o => o.status !== 'completed').slice(0, 8);

  // Generate last 7 days list for charts
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(todayDate.getDate() - i);
    d.setHours(0, 0, 0, 0);
    return d;
  }).reverse();

  const chartFinanceData = last7Days.map(date => {
    const dateStr = format(date, 'dd.MM');
    let income = 0;
    let expenses = 0;

    allOrders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      if (orderDate.getTime() === date.getTime() && (order.paymentStatus === 'entered' || order.paymentStatus === 'received')) {
        income += order.paymentAmount;
      }
    });

    allWarehouseIncome.forEach(w => {
      if (w.source === 'client_payment') return;
      const wDate = new Date(w.recordedAt);
      wDate.setHours(0, 0, 0, 0);
      if (wDate.getTime() === date.getTime()) {
        income += w.amountRub;
      }
    });

    allExpenses.forEach(e => {
      const eDate = new Date(e.recordedAt);
      eDate.setHours(0, 0, 0, 0);
      if (eDate.getTime() === date.getTime()) {
        expenses += e.amountRub;
      }
    });

    return { date: dateStr, income, expenses };
  });

  const expensesMap: Record<string, number> = {};
  allExpenses.forEach(e => {
    if (isCurrent(new Date(e.recordedAt))) {
      expensesMap[e.category] = (expensesMap[e.category] || 0) + e.amountRub;
    }
  });

  const chartExpensesByCategory = Object.entries(expensesMap).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200/60">
            <LayoutDashboard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{dict.dashboard}</h1>
            <p className="text-slate-500 mt-1 font-medium">Мониторинг основных показателей</p>
          </div>
        </div>
        <DashboardDatePicker />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="Оборот" 
          value={currentMetrics.revenue} 
          prevValue={prevMetrics.revenue}
          unit="RUB" 
          trend={calcTrend(currentMetrics.revenue, prevMetrics.revenue)} 
          colorScheme="emerald"
          icon={<DollarSign className="w-12 h-12" />}
        />
        <MetricCard 
          title="Расход" 
          value={currentMetrics.expenses} 
          prevValue={prevMetrics.expenses}
          unit="RUB" 
          trend={calcTrend(currentMetrics.expenses, prevMetrics.expenses)} 
          colorScheme="rose"
          icon={<DollarSign className="w-12 h-12" />}
        />
        <MetricCard 
          title="Доход" 
          value={currentMetrics.profit} 
          prevValue={prevMetrics.profit}
          unit="RUB" 
          trend={calcTrend(currentMetrics.profit, prevMetrics.profit)} 
          colorScheme={currentMetrics.profit >= 0 ? "cyan" : "orange"}
          icon={<HandCoins className="w-12 h-12" />}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard 
          title="Диспетчеры" 
          value={currentMetrics.dispatcherOrders} 
          prevValue={prevMetrics.dispatcherOrders}
          unit="зак." 
          trend={calcTrend(currentMetrics.dispatcherOrders, prevMetrics.dispatcherOrders)} 
          colorScheme="indigo"
          icon={<Briefcase className="w-8 h-8" />}
        />
        <MetricCard 
          title="Топливо" 
          value={currentMetrics.fuel} 
          prevValue={prevMetrics.fuel}
          unit="RUB" 
          trend={calcTrend(currentMetrics.fuel, prevMetrics.fuel)} 
          colorScheme="amber"
          icon={<Fuel className="w-8 h-8" />}
        />
        <MetricCard 
          title="ГАИ" 
          value={currentMetrics.gai} 
          prevValue={prevMetrics.gai}
          unit="RUB" 
          trend={calcTrend(currentMetrics.gai, prevMetrics.gai)} 
          colorScheme="rose"
          icon={<FileWarning className="w-8 h-8" />}
        />
        <MetricCard 
          title="Свалка" 
          value={currentMetrics.utilizationM3} 
          prevValue={prevMetrics.utilizationM3}
          unit="м³" 
          trend={calcTrend(currentMetrics.utilizationM3, prevMetrics.utilizationM3)} 
          colorScheme="purple"
          icon={<Recycle className="w-8 h-8" />}
        />
        <MetricCard 
          title="Запчасти" 
          value={currentMetrics.spareParts} 
          prevValue={prevMetrics.spareParts}
          unit="RUB" 
          trend={calcTrend(currentMetrics.spareParts, prevMetrics.spareParts)} 
          colorScheme="slate"
          icon={<Wrench className="w-8 h-8" />}
        />
        <MetricCard 
          title="Зарплата вод." 
          value={currentMetrics.driverSalary} 
          prevValue={prevMetrics.driverSalary}
          unit="RUB" 
          trend={calcTrend(currentMetrics.driverSalary, prevMetrics.driverSalary)} 
          colorScheme="blue"
          icon={<CarFront className="w-8 h-8" />}
        />
      </div>

      <DashboardCharts 
        financeData={chartFinanceData} 
        expensesByCategory={chartExpensesByCategory} 
        dict={dict} 
      />
      
      <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden">
        <CardHeader className="bg-white/50 backdrop-blur-sm border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle>{dict.recent_orders}</CardTitle>
          <div className="flex gap-4">
            <Link href="/orders?status=active" className="text-sm font-medium text-blue-600 hover:underline">
              Активные ({activeOrders})
            </Link>
            <Link href="/orders?paymentStatus=pending" className="text-sm font-medium text-rose-600 hover:underline">
              Неоплаченные ({pendingPayments})
            </Link>
          </div>
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
