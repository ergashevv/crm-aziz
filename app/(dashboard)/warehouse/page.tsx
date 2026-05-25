import React from 'react';
import { SearchAndFilter } from '@/components/SearchAndFilter';
import { getWarehouseData } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { getDictionary } from '@/lib/dictionaries';
import { WarehouseIncomeForm } from '@/components/forms/WarehouseIncomeForm';
import { WarehouseIncomeTable } from '@/components/tables/WarehouseIncomeTable';
import { getCurrentUser } from '@/lib/auth';
import { cookies } from 'next/headers';

export default async function WarehousePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const lang = cookies().get('lang')?.value;
  const dict = getDictionary(lang);
  const user = await getCurrentUser();
  const isOperator = user?.role === 'operator';

  const { allIncomes: incomes } = await getWarehouseData();

  const q = typeof searchParams.q === 'string' ? searchParams.q.toLowerCase() : '';
  const sourceFilter = typeof searchParams.source === 'string' ? searchParams.source : '';

  let filteredIncomes = incomes;
  if (isOperator) {
    filteredIncomes = filteredIncomes.filter(i => i.operatorId === user?.id);
  }

  if (sourceFilter && sourceFilter !== 'all') {
    filteredIncomes = filteredIncomes.filter(i => i.source === sourceFilter);
  }
  if (q) {
    filteredIncomes = filteredIncomes.filter(i => 
      i.note?.toLowerCase().includes(q)
    );
  }

  const totalWarehouseIncome = incomes.reduce((acc, curr) => acc + curr.amountRub, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{dict.warehouse}</h1>
          <p className="text-muted-foreground mt-2">{dict.manage_warehouse}</p>
        </div>
        <div className="flex space-x-2 w-full sm:w-auto justify-end">
          <Button variant="outline">{dict.log_waste}</Button>
          <WarehouseIncomeForm dict={dict} />
        </div>
      </div>
      
      <SearchAndFilter 
        dict={dict} 
        filterOptions={[
          { value: 'client_payment', label: dict.client_payment || 'Оплата клиента' },
          { value: 'external_vehicle_rental', label: dict.external_vehicle_rental || 'Аренда стороннего авто' },
        ]} 
        filterParam="source" 
        filterPlaceholder={lang === 'uz' ? "Barcha manbalar" : "Все источники"} 
        placeholder={lang === 'uz' ? "Izoh bo'yicha qidiruv..." : "Поиск по заметке..."} 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900 text-white border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">{dict.total_warehouse_income}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalWarehouseIncome.toLocaleString()} RUB</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{dict.warehouse_income_ledger}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <WarehouseIncomeTable incomes={filteredIncomes} dict={dict} />
        </CardContent>
      </Card>
    </div>
  );
}
