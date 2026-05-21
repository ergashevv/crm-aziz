import React from 'react';
import { SearchAndFilter } from '@/components/SearchAndFilter';
import { getDrivers, getDashboardData } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/dictionaries';
import { TableRowLink } from '@/components/TableRowLink';
import { Car } from 'lucide-react';
import { DriverForm } from '@/components/forms/DriverForm';
import { ExportButton } from '@/components/ExportButton';

export const dynamic = 'force-dynamic';

export default async function DriversPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const lang = cookies().get('lang')?.value;
  const dict = getDictionary(lang);

  const allDrivers = await getDrivers();
  const allOrders = await getDashboardData();

  const q = typeof searchParams.q === 'string' ? searchParams.q.toLowerCase() : '';
  
  let filteredDrivers = allDrivers;
  if (q) {
    const num = parseInt(q.replace('#', ''));
    filteredDrivers = allDrivers.filter(d => 
      d.name.toLowerCase().includes(q) || 
      d.phone.toLowerCase().includes(q) || 
      d.vehiclePlate.toLowerCase().includes(q) ||
      (!isNaN(num) && d.id === num)
    );
  }

  const statsByDriver: Record<number, { total: number; active: number }> = {};
  allOrders.forEach(o => {
    if (o.driverId) {
      if (!statsByDriver[o.driverId]) statsByDriver[o.driverId] = { total: 0, active: 0 };
      statsByDriver[o.driverId].total++;
      if (o.status !== 'completed') statsByDriver[o.driverId].active++;
    }
  });

  const exportDriversData = filteredDrivers.map(d => ({
    id: `#${d.id}`,
    name: d.name,
    phone: d.phone,
    vehicle_plate: d.vehiclePlate,
    active_orders: statsByDriver[d.id]?.active || 0,
    total_orders: statsByDriver[d.id]?.total || 0,
    joined_date: format(new Date(d.createdAt), 'dd.MM.yyyy')
  }));

  const exportColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: dict.name },
    { key: 'phone', label: dict.phone },
    { key: 'vehicle_plate', label: dict.vehicle_plate },
    { key: 'active_orders', label: dict.active_orders },
    { key: 'total_orders', label: dict.total_orders },
    { key: 'joined_date', label: dict.joined_date || "Sana" }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200/60">
            <Car className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{dict.drivers}</h1>
            <p className="text-slate-500 mt-1 font-medium">{dict.manage_drivers}</p>
          </div>
        </div>
        <div className="flex gap-3 items-center w-full sm:w-auto justify-end">
          <ExportButton 
            data={exportDriversData} 
            columns={exportColumns} 
            filename="drivers_report" 
            title={lang === 'uz' ? "Haydovchilar Ro'yxati" : "Список водителей"} 
            dict={dict} 
          />
          <DriverForm dict={dict} />
        </div>
      </div>
      
      <SearchAndFilter 
        dict={dict} 
        hideFilter={true} 
        placeholder={lang === 'uz' ? "Ism, telefon, raqam yoki ID bo'yicha qidiruv..." : "Поиск по имени, телефону, номеру авто или ID..."} 
      />

      <Card className="border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-100">
              <TableRow className="hover:bg-transparent">
                <TableHead>ID</TableHead>
                <TableHead>{dict.name}</TableHead>
                <TableHead>{dict.phone}</TableHead>
                <TableHead>{dict.vehicle_plate}</TableHead>
                <TableHead>{dict.active_orders}</TableHead>
                <TableHead>{dict.total_orders}</TableHead>
                <TableHead>{dict.joined_date}</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDrivers.map((driver) => (
                <TableRowLink href={`/drivers/${driver.id}`} key={driver.id}>
                  <TableCell className="font-medium text-slate-500">#{driver.id}</TableCell>
                  <TableCell className="font-semibold">{driver.name}</TableCell>
                  <TableCell>{driver.phone}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-slate-100 border rounded-md font-mono text-xs">
                      {driver.vehiclePlate}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`font-bold ${(statsByDriver[driver.id]?.active || 0) > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                      {statsByDriver[driver.id]?.active || 0}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-slate-600">
                    {statsByDriver[driver.id]?.total || 0}
                  </TableCell>
                  <TableCell>{format(new Date(driver.createdAt), 'dd.MM.yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <DriverForm dict={dict} driver={driver} />
                  </TableCell>
                </TableRowLink>
              ))}
              {filteredDrivers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    {lang === 'uz' ? "Haydovchilar topilmadi." : "Водители не найдены."}
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
