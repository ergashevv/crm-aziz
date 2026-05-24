import React from 'react';
import { SearchAndFilter } from '@/components/SearchAndFilter';
import { getDispatchers, getDashboardData } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/dictionaries';
import { TableRowLink } from '@/components/TableRowLink';
import { Phone } from 'lucide-react';
import { DispatcherForm } from '@/components/forms/DispatcherForm';
import { ExportButton } from '@/components/ExportButton';

export default async function DispatchersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const lang = cookies().get('lang')?.value;
  const dict = getDictionary(lang);

  const allDispatchers = await getDispatchers();
  const allOrders = await getDashboardData();

  const q = typeof searchParams.q === 'string' ? searchParams.q.toLowerCase() : '';
  
  let filteredDispatchers = allDispatchers;
  if (q) {
    const num = parseInt(q.replace('#', ''));
    filteredDispatchers = allDispatchers.filter(d => 
      d.name.toLowerCase().includes(q) || 
      d.phone.toLowerCase().includes(q) || 
      (!isNaN(num) && d.id === num)
    );
  }

  const statsByDisp: Record<number, { count: number, volume: number }> = {};
  allOrders.forEach(o => {
    if (o.dispatcherId !== null) {
      if (!statsByDisp[o.dispatcherId]) statsByDisp[o.dispatcherId] = { count: 0, volume: 0 };
      statsByDisp[o.dispatcherId].count++;
      statsByDisp[o.dispatcherId].volume += o.paymentAmount;
    }
  });

  const exportDispatchersData = filteredDispatchers.map(d => ({
    id: `#${d.id}`,
    name: d.name,
    phone: d.phone,
    total_orders: statsByDisp[d.id]?.count || 0,
    total_volume: `${(statsByDisp[d.id]?.volume || 0).toLocaleString()} RUB`
  }));

  const exportColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: dict.name },
    { key: 'phone', label: dict.phone },
    { key: 'total_orders', label: lang === 'uz' ? "Buyurtmalar soni" : "Количество заказов" },
    { key: 'total_volume', label: lang === 'uz' ? "Umumiy aylanma" : "Общий оборот" }
  ];

  const titleText = lang === 'uz' ? 'Dispetcherlar' : 'Диспетчеры';
  const descText = lang === 'uz' ? 'Dispetcherlarni boshqarish va buyurtmalar tahlili.' : 'Управление всеми диспетчерами и анализ их заказов.';

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200/60">
            <Phone className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{titleText}</h1>
            <p className="text-slate-500 mt-1 font-medium">{descText}</p>
          </div>
        </div>
        <div className="flex gap-3 items-center w-full sm:w-auto justify-end">
          <ExportButton 
            data={exportDispatchersData} 
            columns={exportColumns} 
            filename="dispatchers_report" 
            title={lang === 'uz' ? "Dispetcherlar Ro'yxati" : "Список диспетчеров"} 
            dict={dict} 
          />
          <DispatcherForm dict={dict} />
        </div>
      </div>
      
      <SearchAndFilter 
        dict={dict} 
        hideFilter={true} 
        placeholder={lang === 'uz' ? "Ism, telefon yoki ID bo'yicha qidiruv..." : "Поиск по имени, телефону или ID..."} 
      />

      <Card className="border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-100">
              <TableRow className="hover:bg-transparent">
                <TableHead>ID</TableHead>
                <TableHead>{dict.name}</TableHead>
                <TableHead>{dict.phone}</TableHead>
                <TableHead className="text-center">{lang === 'uz' ? "Buyurtmalar soni" : "Реферальные заказы"}</TableHead>
                <TableHead className="text-right">{lang === 'uz' ? "Umumiy aylanma" : "Общий оборот"}</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDispatchers.map((disp) => (
                <TableRowLink href={`/dispatchers/${disp.id}/dispatcher_salary`} key={disp.id}>
                  <TableCell className="font-medium text-slate-500">#{disp.id}</TableCell>
                  <TableCell className="font-semibold">{disp.name}</TableCell>
                  <TableCell>{disp.phone}</TableCell>
                  <TableCell className="text-center font-medium text-blue-600">
                    {statsByDisp[disp.id]?.count || 0}
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    {statsByDisp[disp.id]?.volume?.toLocaleString() || 0} RUB
                  </TableCell>
                  <TableCell className="text-right">
                    <DispatcherForm dict={dict} dispatcher={disp} />
                  </TableCell>
                </TableRowLink>
              ))}
              {filteredDispatchers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    {lang === 'uz' ? "Dispetcherlar topilmadi." : "Диспетчеры не найдены."}
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
