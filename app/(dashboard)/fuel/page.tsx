import React from 'react';
import { SearchAndFilter } from '@/components/SearchAndFilter';
import { getFuelLogs } from '@/lib/data';
import { cookies } from 'next/headers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { getDictionary } from '@/lib/dictionaries';
import { FuelForm } from '@/components/forms/FuelForm';
import { getDrivers } from '@/lib/data';
import { getCurrentUser } from '@/lib/auth';

export default async function FuelPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const lang = cookies().get('lang')?.value;
  const dict = getDictionary(lang);
  const user = await getCurrentUser();
  const isOperator = user?.role === 'operator';

  const allLogs = await getFuelLogs();
  const drivers = await getDrivers();

  const q = typeof searchParams.q === 'string' ? searchParams.q.toLowerCase() : '';
  
  let filteredLogs = allLogs;
  if (isOperator) {
    filteredLogs = filteredLogs.filter(l => l.log.operatorId === user?.id);
  }

  if (q) {
    filteredLogs = allLogs.filter(({ log, driver }) => 
      log.stationName.toLowerCase().includes(q) || 
      log.vehicle.toLowerCase().includes(q) || 
      (driver?.name || '').toLowerCase().includes(q)
    );
  }

  let totalLiters = 0;
  let totalCost = 0;
  const driverStats: Record<string, { liters: number, cost: number }> = {};

  allLogs.forEach(({ log, driver }) => {
    totalLiters += log.liters;
    totalCost += log.priceRub;
    
    if (driver) {
      if (!driverStats[driver.name]) {
        driverStats[driver.name] = { liters: 0, cost: 0 };
      }
      driverStats[driver.name].liters += log.liters;
      driverStats[driver.name].cost += log.priceRub;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{dict.fuel_logs}</h1>
          <p className="text-muted-foreground mt-2">{dict.monitor_fuel}</p>
        </div>
        <FuelForm dict={dict} drivers={drivers} />
      </div>

      <SearchAndFilter 
        dict={dict} 
        hideFilter={true} 
        placeholder={lang === 'uz' ? "Haydovchi, avtomobil yoki stansiya bo'yicha qidiruv..." : "Поиск по водителю, авто или заправке..."} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{dict.total_fuel_consumed}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{totalLiters.toLocaleString()} L</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{dict.total_fuel_cost}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{totalCost.toLocaleString()} RUB</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{dict.fuel_entries}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>{dict.date}</TableHead>
                    <TableHead>{dict.driver}</TableHead>
                    <TableHead>{dict.vehicle}</TableHead>
                    <TableHead>{dict.station}</TableHead>
                    <TableHead className="text-right">{dict.liters}</TableHead>
                    <TableHead className="text-right">{dict.cost}</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map(({ log, driver }) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">{format(new Date(log.loggedAt), 'dd.MM.yyyy')}</TableCell>
                      <TableCell className="font-semibold text-sm">{driver?.name}</TableCell>
                      <TableCell className="text-sm">{log.vehicle}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{log.stationName}</TableCell>
                      <TableCell className="text-right font-medium text-sm">{log.liters} L</TableCell>
                      <TableCell className="text-right font-medium text-sm text-red-600">
                        {log.priceRub.toLocaleString()} RUB
                      </TableCell>
                      <TableCell className="text-right">
                        <FuelForm dict={dict} log={log} drivers={drivers} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        {dict.no_fuel_logs}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>{dict.driver_stats}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>{dict.driver}</TableHead>
                    <TableHead className="text-right">{dict.liters}</TableHead>
                    <TableHead className="text-right">{dict.cost}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(driverStats).map(([name, stats]) => (
                    <TableRow key={name}>
                      <TableCell className="font-semibold text-sm">{name}</TableCell>
                      <TableCell className="text-right text-sm">{stats.liters} L</TableCell>
                      <TableCell className="text-right text-sm text-red-600">{stats.cost.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
