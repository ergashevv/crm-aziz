import React from 'react';
import { SearchAndFilter } from '@/components/SearchAndFilter';
import { getClients, getDashboardData } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/dictionaries';
import { TableRowLink } from '@/components/TableRowLink';
import { Users } from 'lucide-react';
import { ClientForm } from '@/components/forms/ClientForm';
import { ExportButton } from '@/components/ExportButton';

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const lang = cookies().get('lang')?.value;
  const dict = getDictionary(lang);

  const allClients = await getClients();
  const allOrders = await getDashboardData();

  const q = typeof searchParams.q === 'string' ? searchParams.q.toLowerCase() : '';
  
  let filteredClients = allClients;
  if (q) {
    const num = parseInt(q.replace('#', ''));
    filteredClients = allClients.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.phone.toLowerCase().includes(q) || 
      c.address.toLowerCase().includes(q) ||
      (!isNaN(num) && c.id === num)
    );
  }

  const statsByClient: Record<number, { count: number, spent: number }> = {};
  allOrders.forEach(o => {
    if (o.clientId !== null) {
      if (!statsByClient[o.clientId]) statsByClient[o.clientId] = { count: 0, spent: 0 };
      statsByClient[o.clientId].count++;
      statsByClient[o.clientId].spent += o.paymentAmount;
    }
  });

  const exportClientsData = filteredClients.map(c => ({
    id: `#${c.id}`,
    name: c.name,
    phone: c.phone,
    address: c.address,
    total_orders: statsByClient[c.id]?.count || 0,
    total_spent: `${(statsByClient[c.id]?.spent || 0).toLocaleString()} RUB`
  }));

  const exportColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: dict.name },
    { key: 'phone', label: dict.phone },
    { key: 'address', label: dict.address },
    { key: 'total_orders', label: dict.total_orders },
    { key: 'total_spent', label: dict.total_spent }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200/60">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{dict.clients}</h1>
            <p className="text-slate-500 mt-1 font-medium">{dict.manage_clients}</p>
          </div>
        </div>
        <div className="flex gap-3 items-center w-full sm:w-auto justify-end">
          <ExportButton 
            data={exportClientsData} 
            columns={exportColumns} 
            filename="clients_report" 
            title={lang === 'uz' ? "Mijozlar Ro'yxati" : "Список клиентов"} 
            dict={dict} 
          />
          <ClientForm dict={dict} />
        </div>
      </div>
      
      <SearchAndFilter 
        dict={dict} 
        hideFilter={true} 
        placeholder={lang === 'uz' ? "Ism, telefon, manzil yoki ID bo'yicha qidiruv..." : "Поиск по имени, телефону, адресу или ID..."} 
      />

      <Card className="border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-100">
              <TableRow className="hover:bg-transparent">
                <TableHead>ID</TableHead>
                <TableHead>{dict.name}</TableHead>
                <TableHead>{dict.phone}</TableHead>
                <TableHead>{dict.address}</TableHead>
                <TableHead className="text-center">{dict.total_orders}</TableHead>
                <TableHead className="text-right">{dict.total_spent}</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRowLink href={`/clients/${client.id}`} key={client.id}>
                  <TableCell className="font-medium text-slate-500">#{client.id}</TableCell>
                  <TableCell className="font-semibold">{client.name}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell className="truncate max-w-[200px]">{client.address}</TableCell>
                  <TableCell className="text-center font-medium text-blue-600">
                    {statsByClient[client.id]?.count || 0}
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    {statsByClient[client.id]?.spent?.toLocaleString() || 0} RUB
                  </TableCell>
                  <TableCell className="text-right">
                    <ClientForm dict={dict} client={client} />
                  </TableCell>
                </TableRowLink>
              ))}
              {filteredClients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    {lang === 'uz' ? "Mijozlar topilmadi." : "Клиенты не найдены."}
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
