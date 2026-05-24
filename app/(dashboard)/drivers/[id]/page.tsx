import React from 'react';
import { db } from '@/lib/db';
import { drivers, orders, clients } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/dictionaries';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  Car,
  Calendar,
  User,
  Package,
  CheckCircle2,
  Clock,
  Circle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Hash,
  MapPin,
  Banknote,
  TrendingUp,
} from 'lucide-react';
import { notFound } from 'next/navigation';

const PAGE_SIZE = 15;

const STATUS_CONFIG: Record<string, { label_ru: string; label_uz: string; color: string }> = {
  new:                { label_ru: 'Новый',              label_uz: 'Yangi',          color: 'bg-sky-50 text-sky-700 border-sky-200' },
  assigned:           { label_ru: 'Назначен',           label_uz: 'Tayinlangan',    color: 'bg-violet-50 text-violet-700 border-violet-200' },
  in_progress:        { label_ru: 'В пути',             label_uz: 'Yo\'lda',        color: 'bg-amber-50 text-amber-700 border-amber-200' },
  container_placed:   { label_ru: 'Контейнер уст.',     label_uz: 'Konteyner qo\'y.', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  picked_up:          { label_ru: 'Забран',             label_uz: 'Olib ketildi',   color: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed:          { label_ru: 'Завершён',           label_uz: 'Tugallangan',    color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

const PAYMENT_CONFIG: Record<string, { label_ru: string; color: string }> = {
  pending:  { label_ru: 'Ожидает',  color: 'bg-slate-50 text-slate-500 border-slate-200' },
  received: { label_ru: 'Получен',  color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  entered:  { label_ru: 'Учтён',    color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export default async function DriverDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const lang = cookies().get('lang')?.value;
  const dict = getDictionary(lang);
  const isUz = lang === 'uz';
  const driverId = parseInt(params.id);

  if (isNaN(driverId)) return notFound();

  const [driver] = await db.select().from(drivers).where(eq(drivers.id, driverId)).limit(1);
  if (!driver) return notFound();

  // Fetch all driver orders with client info
  const allDriverOrders = await db
    .select({ order: orders, client: clients })
    .from(orders)
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .where(eq(orders.driverId, driverId))
    .orderBy(desc(orders.createdAt));

  // --- Filter params ---
  const statusFilter = typeof searchParams.status === 'string' ? searchParams.status : '';
  const paymentFilter = typeof searchParams.payment === 'string' ? searchParams.payment : '';
  const page = Math.max(1, parseInt(typeof searchParams.page === 'string' ? searchParams.page : '1') || 1);

  // Apply filters
  let filtered = allDriverOrders;
  if (statusFilter === 'active') {
    // All non-closed and non-completed orders
    filtered = filtered.filter(r => !r.order.isClosed && r.order.status !== 'completed');
  } else if (statusFilter && statusFilter !== 'all') {
    filtered = filtered.filter(r => r.order.status === statusFilter);
  }
  if (paymentFilter && paymentFilter !== 'all') {
    filtered = filtered.filter(r => r.order.paymentStatus === paymentFilter);
  }

  // Stats from ALL orders (no filter)
  const totalOrders = allDriverOrders.length;
  const completedOrders = allDriverOrders.filter(r => r.order.status === 'completed').length;
  const totalRevenue = allDriverOrders
    .filter(r => r.order.paymentStatus === 'entered')
    .reduce((sum, r) => sum + r.order.paymentAmount, 0);
  const activeOrders = allDriverOrders.filter(r => !r.order.isClosed && r.order.status !== 'completed').length;

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Build URL helper preserving filters
  const buildUrl = (overrides: Record<string, string | number>) => {
    const p = new URLSearchParams();
    // Start with current filters
    if (statusFilter) p.set('status', statusFilter);
    if (paymentFilter) p.set('payment', paymentFilter);
    p.set('page', String(page));
    // Apply overrides (can clear a param by setting empty string)
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === '' || v === undefined) {
        p.delete(k);
      } else {
        p.set(k, String(v));
      }
    });
    const qs = p.toString();
    return `/drivers/${driverId}${qs ? '?' + qs : ''}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="rounded-xl bg-white shadow-sm border-slate-200">
            <Link href="/drivers">
              <ArrowLeft className="h-4 w-4 text-slate-700" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{driver.name}</h1>
            <p className="text-slate-500 mt-1 font-medium">
              {isUz ? "Haydovchi profili va buyurtmalar tarixi" : "Профиль водителя и история заказов"}
            </p>
          </div>
        </div>
      </div>

      {/* Top Grid: Driver Info Card + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Driver Info */}
        <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl bg-white lg:col-span-1">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              {isUz ? "Haydovchi ma'lumotlari" : "Данные водителя"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Phone className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">{dict.phone}</p>
                <p className="font-bold text-slate-800">{driver.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Car className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">{dict.vehicle_plate}</p>
                <span className="inline-block mt-0.5 px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-sm font-bold text-slate-700">
                  {driver.vehiclePlate}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">{dict.joined_date}</p>
                <p className="font-bold text-slate-800">{format(new Date(driver.createdAt), 'dd.MM.yyyy')}</p>
              </div>
            </div>
            {driver.username && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">{dict.username}</p>
                <p className="font-mono font-bold text-slate-700 mt-0.5">{driver.username}</p>
              </div>
            )}
            {driver.password && (
              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">{dict.password}</p>
                <p className="font-mono font-bold text-slate-700 mt-0.5">{driver.password}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Total Orders */}
          <Link href={`/drivers/${driverId}`} className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg shadow-blue-500/30 p-5 flex flex-col justify-between min-h-[130px] cursor-pointer hover:brightness-105 transition-all active:scale-[0.98]">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Package className="h-28 w-28 text-white" />
            </div>
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                <Package className="h-5 w-5 text-white" />
              </div>
              <span className="text-[10px] font-extrabold text-blue-100 uppercase tracking-widest bg-white/10 px-2 py-1 rounded-lg">
                {isUz ? "Jami" : "Всего"}
              </span>
            </div>
            <div>
              <div className="text-4xl font-black text-white tracking-tight">{totalOrders}</div>
              <p className="text-xs font-semibold text-blue-100 mt-1">
                {isUz ? "Barcha buyurtmalar" : "Все заказы"}
              </p>
            </div>
          </Link>

          {/* Completed */}
          <Link href={`/drivers/${driverId}?status=completed`} className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30 p-5 flex flex-col justify-between min-h-[130px] cursor-pointer hover:brightness-105 transition-all active:scale-[0.98]">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <CheckCircle2 className="h-28 w-28 text-white" />
            </div>
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-[10px] font-extrabold text-emerald-100 uppercase tracking-widest bg-white/10 px-2 py-1 rounded-lg">
                {totalOrders > 0 ? `${Math.round((completedOrders / totalOrders) * 100)}%` : '0%'}
              </span>
            </div>
            <div>
              <div className="text-4xl font-black text-white tracking-tight">{completedOrders}</div>
              <p className="text-xs font-semibold text-emerald-100 mt-1">
                {isUz ? "Yakunlangan" : "Завершено"}
              </p>
            </div>
          </Link>

          {/* Active — shows all non-closed, non-completed orders */}
          <Link href={`/drivers/${driverId}?status=active`} className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-amber-500 to-orange-400 shadow-lg shadow-amber-500/30 p-5 flex flex-col justify-between min-h-[130px] cursor-pointer hover:brightness-105 transition-all active:scale-[0.98]">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Clock className="h-28 w-28 text-white" />
            </div>
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <span className="text-[10px] font-extrabold text-amber-100 uppercase tracking-widest bg-white/10 px-2 py-1 rounded-lg">
                {isUz ? "Faol" : "Активно"}
              </span>
            </div>
            <div>
              <div className="text-4xl font-black text-white tracking-tight">{activeOrders}</div>
              <p className="text-xs font-semibold text-amber-100 mt-1">
                {isUz ? "Jarayondagi" : "В работе"}
              </p>
            </div>
          </Link>

          {/* Revenue */}
          <Link href={`/drivers/${driverId}?payment=entered`} className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-violet-600 to-purple-500 shadow-lg shadow-violet-500/30 p-5 flex flex-col justify-between min-h-[130px] cursor-pointer hover:brightness-105 transition-all active:scale-[0.98]">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <TrendingUp className="h-28 w-28 text-white" />
            </div>
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-[10px] font-extrabold text-violet-100 uppercase tracking-widest bg-white/10 px-2 py-1 rounded-lg">RUB</span>
            </div>
            <div>
              <div className="text-2xl font-black text-white tracking-tight leading-tight">
                {totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs font-semibold text-violet-100 mt-1">
                {isUz ? "Hisoblangan to'lov" : "Учтённая выручка"}
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Orders Table Card */}
      <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden bg-white">
        {/* Card Header + Filter Bar */}
        <CardHeader className="border-b border-slate-100 bg-slate-50/60 pb-0 pt-5 px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Package className="h-4.5 w-4.5 text-primary" />
              {isUz ? "Barcha buyurtmalar" : "Все заказы"}
              <span className="text-sm font-semibold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full ml-1">
                {filtered.length}
              </span>
            </CardTitle>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />

              {/* Status Filter */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: '', label: isUz ? 'Barchasi' : 'Все', color: 'bg-slate-100 text-slate-600 hover:bg-slate-200' },
                  { value: 'new', label: isUz ? 'Yangi' : 'Новые', color: 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200' },
                  { value: 'in_progress', label: isUz ? "Yo'lda" : 'В пути', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200' },
                  { value: 'completed', label: isUz ? 'Tugallangan' : 'Завершены', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' },
                  { value: 'active', label: isUz ? 'Faol' : 'Активные', color: 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200' },
                ].map(opt => (
                  <Link
                    key={opt.value || 'all'}
                    href={buildUrl({ status: opt.value, page: 1 })}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${opt.color} ${statusFilter === opt.value ? 'ring-2 ring-offset-1 ring-primary/40 shadow-sm opacity-100' : 'opacity-75 hover:opacity-100'}`}
                  >
                    {opt.label}
                  </Link>
                ))}
              </div>

              <div className="w-px h-5 bg-slate-200 mx-1" />

              {/* Payment Filter */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: '', label: isUz ? "To'lov barchasi" : 'Все оплаты' },
                  { value: 'pending', label: isUz ? 'Kutilmoqda' : 'Ожидает' },
                  { value: 'received', label: isUz ? 'Qabul' : 'Получен' },
                  { value: 'entered', label: isUz ? 'Hisobda' : 'Учтён' },
                ].map(opt => (
                  <Link
                    key={opt.value || 'all-payment'}
                    href={buildUrl({ payment: opt.value, page: 1 })}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all border ${
                      paymentFilter === opt.value
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="w-[70px] pl-6">
                  <div className="flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-slate-400" />
                    ID
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {dict.address}
                  </div>
                </TableHead>
                <TableHead className="hidden sm:table-cell">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    {isUz ? "Mijoz" : "Клиент"}
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {dict.scheduled_date}
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1.5">
                    <Circle className="h-3.5 w-3.5 text-slate-400" />
                    {dict.status}
                  </div>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <div className="flex items-center gap-1.5">
                    <Banknote className="h-3.5 w-3.5 text-slate-400" />
                    {isUz ? "To'lov" : "Оплата"}
                  </div>
                </TableHead>
                <TableHead className="text-right hidden lg:table-cell pr-6">
                  {isUz ? "Summa" : "Сумма"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <Package className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                    <p className="font-semibold text-slate-400">
                      {isUz ? "Buyurtmalar topilmadi" : "Заказы не найдены"}
                    </p>
                    <p className="text-xs text-slate-300 mt-1">
                      {isUz ? "Filter shartlarini o'zgartiring" : "Измените условия фильтра"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map(({ order, client }) => {
                  const statusCfg = STATUS_CONFIG[order.status];
                  const paymentCfg = PAYMENT_CONFIG[order.paymentStatus];
                  return (
                    <TableRow
                      key={order.id}
                      className="hover:bg-slate-50/60 cursor-pointer transition-colors group"
                    >
                      <TableCell className="pl-6">
                        <Link href={`/orders/${order.id}`} className="block">
                          <span className="font-bold text-primary text-sm group-hover:underline">#{order.id}</span>
                          {order.isClosed && (
                            <span className="block text-[10px] font-bold text-slate-400 mt-0.5">
                              {isUz ? "Yopiq" : "Закрыт"}
                            </span>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/orders/${order.id}`} className="block">
                          <span className="font-semibold text-slate-800 text-sm truncate max-w-[160px] block">
                            {order.address}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {order.containerSizeM3} м³ · {order.rentalDuration?.replace('_', ' ')}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Link href={`/orders/${order.id}`} className="block">
                          {order.isExternalVehicle ? (
                            <span className="text-xs font-semibold text-slate-400 italic">
                              {isUz ? "Tashqi avto" : "Стороннее авто"}
                            </span>
                          ) : (
                            <span className="text-sm font-semibold text-slate-700">
                              {client?.name || <span className="text-slate-300">—</span>}
                            </span>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/orders/${order.id}`} className="block">
                          <div className="font-bold text-slate-800 text-sm">
                            {format(new Date(order.scheduledAt), 'dd.MM.yyyy')}
                          </div>
                          <div className="text-xs text-slate-400 font-medium">
                            {format(new Date(order.scheduledAt), 'HH:mm')}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/orders/${order.id}`} className="block">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border inline-flex items-center gap-1 ${statusCfg?.color || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                            {isUz
                              ? statusCfg?.label_uz || order.status
                              : statusCfg?.label_ru || order.status.replace('_', ' ')}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Link href={`/orders/${order.id}`} className="block">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded border inline-flex ${paymentCfg?.color || ''}`}>
                            {paymentCfg?.label_ru || order.paymentStatus}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right hidden lg:table-cell pr-6">
                        <Link href={`/orders/${order.id}`} className="block">
                          <span className="font-extrabold text-slate-800 text-sm">
                            {order.paymentAmount.toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-400 ml-1 font-semibold">RUB</span>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/40">
              <p className="text-xs text-slate-500 font-semibold">
                {isUz
                  ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} / ${filtered.length} ta`
                  : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} из ${filtered.length}`}
              </p>
              <div className="flex items-center gap-2">
                <Link
                  href={buildUrl({ page: page - 1 })}
                  aria-disabled={page <= 1}
                  className={`flex items-center justify-center h-8 w-8 rounded-lg border text-sm font-semibold transition-all ${
                    page <= 1
                      ? 'border-slate-100 text-slate-300 pointer-events-none'
                      : 'border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Link>

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | string)[]>((acc, p, idx, arr) => {
                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    typeof p === 'string' ? (
                      <span key={`ellipsis-${idx}`} className="text-slate-400 text-xs font-bold px-1">…</span>
                    ) : (
                      <Link
                        key={p}
                        href={buildUrl({ page: p })}
                        className={`flex items-center justify-center h-8 w-8 rounded-lg text-sm font-bold transition-all ${
                          p === page
                            ? 'bg-primary text-white shadow-sm shadow-primary/30'
                            : 'border border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 hover:shadow-sm'
                        }`}
                      >
                        {p}
                      </Link>
                    )
                  )}

                <Link
                  href={buildUrl({ page: page + 1 })}
                  aria-disabled={page >= totalPages}
                  className={`flex items-center justify-center h-8 w-8 rounded-lg border text-sm font-semibold transition-all ${
                    page >= totalPages
                      ? 'border-slate-100 text-slate-300 pointer-events-none'
                      : 'border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
