'use client';

import React from 'react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, SortableTableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableRowLink } from '@/components/TableRowLink';
import { OrderForm } from '@/components/forms/OrderForm';
import { ConfirmPaymentButton } from '@/components/ConfirmPaymentButton';
import { Phone } from 'lucide-react';
import { useSortableTable } from '@/hooks/use-sortable-table';

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

export function OrdersTable({ 
  orders, 
  page, 
  limit, 
  dict, 
  lang, 
  clients, 
  drivers, 
  dispatchers, 
  activeOrders 
}: any) {
  const enrichedOrders = orders.map((o: any) => ({
    ...o,
    orderId: o.order.id,
    clientName: o.order.isExternalVehicle ? (o.order.externalDriverName || 'Сторонняя машина') : (o.client?.name || '-'),
    address: o.order.address,
    scheduledAt: o.order.scheduledAt,
    driverName: o.order.isExternalVehicle ? (o.order.externalDriverName || 'Сторонняя машина') : (o.driver?.name || ''),
    statusStr: dict[o.order.status as keyof typeof dict] || o.order.status.replace('_', ' '),
    paymentStatusStr: dict[o.order.paymentStatus as keyof typeof dict] || o.order.paymentStatus,
    amount: o.order.paymentAmount,
  }));

  const { sortedData, sortKey, sortDirection, toggleSort } = useSortableTable(enrichedOrders);
  
  const paginatedOrders = sortedData.slice((page - 1) * limit, page * limit);

  return (
    <Table>
      <TableHeader className="bg-slate-50/80 border-b border-slate-100">
        <TableRow className="hover:bg-transparent">
          <SortableTableHead sortKey="orderId" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort}>
            ID
          </SortableTableHead>
          <SortableTableHead sortKey="clientName" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort}>
            {dict.client}
          </SortableTableHead>
          <SortableTableHead sortKey="address" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort}>
            {dict.address}
          </SortableTableHead>
          <SortableTableHead sortKey="scheduledAt" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort}>
            {dict.scheduled_date}
          </SortableTableHead>
          <SortableTableHead sortKey="driverName" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort}>
            {dict.driver}
          </SortableTableHead>
          <SortableTableHead sortKey="statusStr" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort}>
            {dict.status}
          </SortableTableHead>
          <SortableTableHead sortKey="paymentStatusStr" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort}>
            {dict.payment}
          </SortableTableHead>
          <SortableTableHead sortKey="amount" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={toggleSort} className="text-right justify-end">
            {dict.amount}
          </SortableTableHead>
          <SortableTableHead sortKey="" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={() => {}} className="w-10"></SortableTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paginatedOrders.map(({ order, client, driver, dispatcher, operator }: any) => (
          <TableRowLink href={`/orders/${order.id}`} key={order.id}>
            <TableCell className="font-medium text-slate-500">
              <div>#{order.id}</div>
              {operator && (
                <div className="text-[9px] text-slate-400 font-bold mt-0.5 truncate max-w-[85px]" title={`${lang === 'uz' ? 'Operator' : 'Оператор'}: ${operator.name}`}>
                  {operator.name}
                </div>
              )}
            </TableCell>
            <TableCell>
              {order.isExternalVehicle ? (
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200">
                    {lang === 'uz' ? 'Begona' : 'Сторонняя'}
                  </span>
                  <span className="font-semibold text-slate-800">{order.externalDriverName || 'Сторонняя машина'}</span>
                </div>
              ) : (
                <>
                  <div className="font-semibold">{client?.name}</div>
                  {dispatcher && (
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 mt-0.5">
                      <Phone className="h-2.5 w-2.5" />
                      {dispatcher.name}
                    </div>
                  )}
                </>
              )}
            </TableCell>
            <TableCell>
              <div className="truncate max-w-[180px] text-sm">{order.address}</div>
              {order.containerNumber && (
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">#{order.containerNumber}</div>
              )}
            </TableCell>
            <TableCell>
              <div className="font-semibold text-slate-800">
                {format(new Date(order.scheduledAt), 'dd.MM.yyyy')}
              </div>
              <div className="text-xs text-slate-400 font-medium">
                {format(new Date(order.scheduledAt), 'HH:mm')}
              </div>
            </TableCell>
            <TableCell>
              {order.isExternalVehicle ? (
                <span className="font-semibold text-orange-600">{order.externalDriverName || 'Сторонняя машина'}</span>
              ) : (
                driver?.name || <span className="text-muted-foreground italic">{dict.unassigned}</span>
              )}
            </TableCell>
            <TableCell>
              <span className={`inline-flex items-center text-xs font-bold border rounded-full px-3 py-1 ${getStatusClasses(order.status)}`}>
                {dict[order.status] || order.status.replace('_', ' ')}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center text-xs font-bold border rounded-full px-3 py-1 ${getPaymentClasses(order.paymentStatus)}`}>
                  {dict[order.paymentStatus] || order.paymentStatus}
                </span>
                <ConfirmPaymentButton orderId={order.id} currentStatus={order.paymentStatus} />
              </div>
            </TableCell>
            <TableCell className="text-right font-bold text-slate-700">
              {order.paymentAmount.toLocaleString()} <span className="text-xs text-slate-400 font-medium">RUB</span>
            </TableCell>
            <TableCell className="text-right flex items-center justify-end">
              <OrderForm dict={dict} order={order} clients={clients} drivers={drivers} dispatchers={dispatchers} activeOrders={activeOrders} />
            </TableCell>
          </TableRowLink>
        ))}
        {paginatedOrders.length === 0 && (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8 text-slate-500">
              {lang === 'uz' ? "Buyurtmalar topilmadi." : "Заказы не найдены."}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
