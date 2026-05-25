import React from 'react';
import { getOrders, getClients, getDrivers, getDispatchers } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/dictionaries';
import { TableRowLink } from '@/components/TableRowLink';
import { ClipboardList, Phone } from 'lucide-react';
import { SearchAndFilter } from '@/components/SearchAndFilter';
import { StatusTabs } from '@/components/StatusTabs';
import { AutoRefresh } from '@/components/AutoRefresh';
import { OrderForm } from '@/components/forms/OrderForm';
import { ExportButton } from '@/components/ExportButton';
import { ConfirmPaymentButton } from '@/components/ConfirmPaymentButton';
import { isOverdue } from '@/lib/utils';
import { DashboardDatePicker } from '@/components/DashboardDatePicker';
import { Pagination } from '@/components/Pagination';
import { OrdersTable } from '@/components/tables/OrdersTable';

export const dynamic = 'force-dynamic';

const getStatusClasses = (status: string) => {
  switch (status) {
    case 'new': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'assigned': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'in_progress': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'container_placed': return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'picked_up': return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default: return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

const getPaymentClasses = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'received': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'entered': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default: return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const lang = cookies().get('lang')?.value;
  const dict = getDictionary(lang);

  const q = typeof searchParams.q === 'string' ? searchParams.q : '';
  const statusParam = typeof searchParams.status === 'string' ? searchParams.status : '';
  const status = statusParam || 'all';
  const from = typeof searchParams.from === 'string' ? searchParams.from : undefined;
  const to = typeof searchParams.to === 'string' ? searchParams.to : undefined;

  const [allFetchedOrders, activeOrders, clients, drivers, dispatchers] = await Promise.all([
    getOrders(status === 'overdue_containers' ? 'all' : status, q, from, to),
    getOrders('active', ''),
    getClients(),
    getDrivers(),
    getDispatchers(),
  ]);
  const activeCount = activeOrders.length;
  
  // Filter for overdue if needed
  const allOrders = status === 'overdue_containers' 
    ? allFetchedOrders.filter((o) => isOverdue(o.order))
    : allFetchedOrders;

  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const limit = 10;
  const exportOrdersData = allOrders.map(({ order, client, driver }) => ({
    id: `#${order.id}`,
    client: order.isExternalVehicle 
      ? (lang === 'uz' ? `Begona: ${order.externalDriverName || ''}` : `Сторонняя: ${order.externalDriverName || ''}`) 
      : (client?.name || '-'),
    address: order.address,
    date: format(new Date(order.scheduledAt), 'dd.MM.yyyy'),
    driver: order.isExternalVehicle ? (order.externalDriverName || '-') : (driver?.name || '-'),
    status: dict[order.status] || order.status,
    payment_status: dict[order.paymentStatus] || order.paymentStatus,
    amount: `${order.paymentAmount.toLocaleString()} RUB`
  }));

  const exportColumns = [
    { key: 'id', label: 'ID' },
    { key: 'client', label: dict.client },
    { key: 'address', label: dict.address },
    { key: 'date', label: dict.scheduled_date },
    { key: 'driver', label: dict.driver },
    { key: 'status', label: dict.status },
    { key: 'payment_status', label: dict.payment_status },
    { key: 'amount', label: dict.amount }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200/60">
            <ClipboardList className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{dict.orders}</h1>
            <p className="text-slate-500 mt-1 font-medium">
              {lang === 'uz'
                ? `Ko'rsatilmoqda: ${allOrders.length} ta${status === 'active' ? ' faol' : ''} · jami faol: ${activeCount}`
                : `Показано: ${allOrders.length}${status === 'active' ? ' активных' : ''} · всего активных: ${activeCount}`}
            </p>
          </div>
        </div>
        <div className="flex gap-3 items-center w-full sm:w-auto justify-end">
          <ExportButton 
            data={exportOrdersData} 
            columns={exportColumns} 
            filename="orders_report" 
            title={lang === 'uz' ? "Buyurtmalar Ro'yxati" : "Список заказов"} 
            dict={dict} 
          />
          <OrderForm dict={dict} clients={clients} drivers={drivers} dispatchers={dispatchers} activeOrders={activeOrders} />
        </div>
      </div>

      <AutoRefresh intervalMs={10000} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <StatusTabs 
          options={[
            { value: 'active', label: lang === 'uz' ? 'Faol (tugallanmagan)' : 'Активные' },
          { value: 'pending_confirmation', label: lang === 'uz' ? 'Tasdiqlash kutilmoqda' : 'Ожидает подтверждения' },
          { value: 'overdue_containers', label: lang === 'uz' ? 'Muddati o\'tgan konteynerlar' : 'Просроченные контейнеры' },
          { value: 'all', label: lang === 'uz' ? 'Barchasi' : 'Все' },
          { value: 'new', label: dict.new },
          { value: 'assigned', label: dict.assigned },
          { value: 'in_progress', label: dict.in_progress },
          { value: 'container_placed', label: dict.container_placed },
          { value: 'picked_up', label: dict.picked_up },
          { value: 'completed', label: dict.completed },
        ]}
        defaultFilter="all"
      />
      <DashboardDatePicker />
    </div>

    <SearchAndFilter
        dict={dict}
        hideFilter={true}
      />

      <Card className="border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
        <CardContent className="p-0">
          <OrdersTable 
            orders={allOrders} 
            page={page} 
            limit={limit} 
            dict={dict} 
            lang={lang} 
            clients={clients} 
            drivers={drivers} 
            dispatchers={dispatchers} 
            activeOrders={activeOrders} 
          />
        </CardContent>
      </Card>

      <Pagination totalItems={allOrders.length} itemsPerPage={limit} />
    </div>
  );
}
