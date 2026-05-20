import React from 'react';
import { db } from '@/lib/db';
import { orders, clients, drivers } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/dictionaries';
import Link from 'next/link';
import { ArrowLeft, MapPin, User, Truck, CreditCard } from 'lucide-react';
import { notFound } from 'next/navigation';
import { OrderStatusUpdater } from '@/components/OrderStatusUpdater';
import { PaymentStatusUpdater } from '@/components/PaymentStatusUpdater';



export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const lang = cookies().get('lang')?.value;
  const dict = getDictionary(lang);
  const orderId = parseInt(params.id);

  if (isNaN(orderId)) return notFound();

  const [orderData] = await db.select({
    order: orders,
    client: clients,
    driver: drivers,
  })
  .from(orders)
  .leftJoin(clients, eq(orders.clientId, clients.id))
  .leftJoin(drivers, eq(orders.driverId, drivers.id))
  .where(eq(orders.id, orderId))
  .limit(1);

  if (!orderData) return notFound();

  const { order, client, driver } = orderData;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/orders"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{dict.order} #{order.id}</h1>
          <p className="text-muted-foreground mt-1">{dict.manage_orders}</p>
        </div>
      </div>

      <Card className="border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl mb-8">
        <CardContent className="p-8">
          <OrderStatusUpdater orderId={order.id} currentStatus={order.status} dict={dict} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6 opacity-5 text-slate-900">
            <User className="w-24 h-24" />
          </div>
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle>{dict.client}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 relative z-10">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">{dict.name}</p>
              <p className="font-extrabold text-xl">{client?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">{dict.phone}</p>
              <p className="font-bold text-lg">{client?.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">{dict.address}</p>
              <p className="font-semibold">{client?.address || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6 opacity-5 text-slate-900">
            <Truck className="w-24 h-24" />
          </div>
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle>{dict.order} {dict.details}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 relative z-10">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">{dict.scheduled_date}</p>
                <p className="font-bold text-lg">{format(new Date(order.scheduledAt), 'dd.MM.yyyy')}</p>
                <p className="text-sm font-medium text-slate-500">{format(new Date(order.scheduledAt), 'HH:mm')}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">{dict.container_size}</p>
                <p className="font-bold text-lg">{order.containerSizeM3} m³</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">{dict.rental_duration}</p>
                <p className="font-bold text-lg capitalize">{dict[order.rentalDuration as keyof typeof dict] || order.rentalDuration.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">{dict.driver}</p>
                <p className="font-bold text-lg text-primary">{driver?.name || <span className="text-slate-400 italic">{dict.unassigned}</span>}</p>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-100">
              <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">{dict.operator_note}</p>
              <p className="font-semibold text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">{order.operatorNote || dict.no_notes}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden relative md:col-span-2 bg-gradient-to-br from-emerald-50/30 to-white">
          <div className="absolute top-0 right-0 p-6 opacity-5 text-emerald-900">
            <CreditCard className="w-32 h-32" />
          </div>
          <CardHeader className="bg-white/50 backdrop-blur border-b border-slate-100">
            <CardTitle>{dict.finance}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">{dict.amount}</p>
                <p className="font-extrabold text-4xl text-emerald-600">{order.paymentAmount.toLocaleString()} <span className="text-lg opacity-70">RUB</span></p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">{dict.payment}</p>
                <p className="font-bold text-xl capitalize text-slate-700">{dict[order.paymentType as keyof typeof dict] || order.paymentType}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">{dict.payment_status}</p>
                <PaymentStatusUpdater orderId={order.id} currentStatus={order.paymentStatus} dict={dict} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
