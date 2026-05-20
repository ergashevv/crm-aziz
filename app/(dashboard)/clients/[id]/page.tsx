import React from 'react';
import { db } from '@/lib/db';
import { clients, orders, drivers } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/dictionaries';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { TableRowLink } from '@/components/TableRowLink';



export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const lang = cookies().get('lang')?.value;
  const dict = getDictionary(lang);
  const clientId = parseInt(params.id);

  if (isNaN(clientId)) return notFound();

  const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);

  if (!client) return notFound();

  const clientOrders = await db.select({
    order: orders,
    driver: drivers,
  })
  .from(orders)
  .leftJoin(drivers, eq(orders.driverId, drivers.id))
  .where(eq(orders.clientId, clientId))
  .orderBy(desc(orders.createdAt));

  let totalSpent = 0;
  clientOrders.forEach(({ order }) => {
    totalSpent += order.paymentAmount;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/clients"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{client.name}</h1>
          <p className="text-muted-foreground mt-1">{dict.manage_clients} - {dict.details}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{dict.client} {dict.details}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{dict.phone}</p>
              <p className="font-medium text-lg">{client.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{dict.address}</p>
              <p className="font-medium">{client.address}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{dict.registered}</p>
              <p className="font-medium">{format(new Date(client.createdAt), 'dd.MM.yyyy')}</p>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">{dict.total_orders}</p>
              <p className="font-bold text-xl text-blue-700">{clientOrders.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{dict.total_spent}</p>
              <p className="font-bold text-xl text-green-700">{totalSpent.toLocaleString()} RUB</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>{dict.orders} ({clientOrders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {clientOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>{dict.scheduled_date}</TableHead>
                    <TableHead>{dict.driver}</TableHead>
                    <TableHead>{dict.status}</TableHead>
                    <TableHead className="text-right">{dict.amount}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientOrders.map(({ order, driver }) => (
                    <TableRowLink href={`/orders/${order.id}`} key={order.id}>
                      <TableCell className="font-medium text-slate-500">#{order.id}</TableCell>
                      <TableCell>{format(new Date(order.scheduledAt), 'dd.MM.yyyy')}</TableCell>
                      <TableCell>{driver?.name || <span className="text-muted-foreground italic">{dict.unassigned}</span>}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold">
                          {dict[order.status as keyof typeof dict] || order.status.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">{order.paymentAmount.toLocaleString()} RUB</TableCell>
                    </TableRowLink>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-4">{dict.no_orders_found}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
