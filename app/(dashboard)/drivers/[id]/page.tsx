import React from 'react';
import { db } from '@/lib/db';
import { drivers, orders, fuelLogs } from '@/lib/schema';
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



export default async function DriverDetailPage({ params }: { params: { id: string } }) {
  const lang = cookies().get('lang')?.value;
  const dict = getDictionary(lang);
  const driverId = parseInt(params.id);

  if (isNaN(driverId)) return notFound();

  const [driver] = await db.select().from(drivers).where(eq(drivers.id, driverId)).limit(1);

  if (!driver) return notFound();

  const driverOrders = await db.select().from(orders).where(eq(orders.driverId, driverId)).orderBy(desc(orders.createdAt));
  const driverFuelLogs = await db.select().from(fuelLogs).where(eq(fuelLogs.driverId, driverId)).orderBy(desc(fuelLogs.loggedAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/drivers"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{driver.name}</h1>
          <p className="text-muted-foreground mt-1">{dict.manage_drivers} - {dict.details}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{dict.driver} {dict.details}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{dict.phone}</p>
              <p className="font-medium text-lg">{driver.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{dict.vehicle_plate}</p>
              <span className="inline-block mt-1 px-3 py-1 bg-slate-100 border rounded-md font-mono text-sm">
                {driver.vehiclePlate}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{dict.joined_date}</p>
              <p className="font-medium">{format(new Date(driver.createdAt), 'dd.MM.yyyy')}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>{dict.recent_orders} ({driverOrders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {driverOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>{dict.address}</TableHead>
                    <TableHead>{dict.scheduled_date}</TableHead>
                    <TableHead>{dict.status}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {driverOrders.slice(0, 5).map((order) => (
                    <TableRowLink href={`/orders/${order.id}`} key={order.id}>
                      <TableCell className="font-medium text-slate-500">#{order.id}</TableCell>
                      <TableCell className="truncate max-w-[200px]">{order.address}</TableCell>
                      <TableCell>{format(new Date(order.scheduledAt), 'dd.MM.yyyy')}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                          {dict[order.status as keyof typeof dict] || order.status.replace('_', ' ')}
                        </span>
                      </TableCell>
                    </TableRowLink>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-4">{dict.unassigned}</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{dict.fuel_logs}</CardTitle>
        </CardHeader>
        <CardContent>
          {driverFuelLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dict.date}</TableHead>
                  <TableHead>{dict.station}</TableHead>
                  <TableHead>{dict.vehicle}</TableHead>
                  <TableHead className="text-right">{dict.liters}</TableHead>
                  <TableHead className="text-right">{dict.amount} (RUB)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {driverFuelLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{format(new Date(log.loggedAt), 'dd.MM.yyyy HH:mm')}</TableCell>
                    <TableCell>{log.stationName}</TableCell>
                    <TableCell>{log.vehicle}</TableCell>
                    <TableCell className="text-right">{log.liters} L</TableCell>
                    <TableCell className="text-right font-medium">{log.priceRub.toLocaleString()} RUB</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">{dict.no_fuel_logs}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
