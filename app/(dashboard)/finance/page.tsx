import React from 'react';
import { SearchAndFilter } from '@/components/SearchAndFilter';
import { getFinanceData } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/dictionaries';
import { Wallet } from 'lucide-react';
import { ExpenseForm } from '@/components/forms/ExpenseForm';

export default async function FinancePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const lang = cookies().get('lang')?.value;
  const dict = getDictionary(lang);

  const { allOrders, allExpenses, allWarehouseIncome } = await getFinanceData();

  const q = typeof searchParams.q === 'string' ? searchParams.q.toLowerCase() : '';
  const categoryFilter = typeof searchParams.category === 'string' ? searchParams.category : '';

  let filteredExpenses = allExpenses;
  if (categoryFilter && categoryFilter !== 'all') {
    filteredExpenses = filteredExpenses.filter(e => e.category === categoryFilter);
  }
  if (q) {
    filteredExpenses = filteredExpenses.filter(e => 
      e.note?.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)
    );
  }

  let totalIncome = 0;
  allOrders.forEach(o => {
    if (o.paymentStatus === 'entered') totalIncome += o.paymentAmount;
  });
  allWarehouseIncome.forEach(w => {
    totalIncome += w.amountRub;
  });

  let totalExpenses = 0;
  const expensesByCategory: Record<string, number> = {};
  
  allExpenses.forEach(e => {
    totalExpenses += e.amountRub;
    if (!expensesByCategory[e.category]) {
      expensesByCategory[e.category] = 0;
    }
    expensesByCategory[e.category] += e.amountRub;
  });

  const netProfit = totalIncome - totalExpenses;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200/60">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{dict.finance}</h1>
            <p className="text-slate-500 mt-1 font-medium">{dict.track_finance}</p>
          </div>
        </div>
        <ExpenseForm dict={dict} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-100 rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-50 to-white relative">
          <div className="absolute top-0 right-0 p-6 opacity-10 text-emerald-600">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-emerald-800 uppercase tracking-wider">{dict.total_income}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-emerald-600 tracking-tight">{totalIncome.toLocaleString()} <span className="text-xl font-semibold opacity-70">RUB</span></div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg shadow-rose-500/10 ring-1 ring-rose-100 rounded-3xl overflow-hidden bg-gradient-to-br from-rose-50 to-white relative">
          <div className="absolute top-0 right-0 p-6 opacity-10 text-rose-600">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-rose-800 uppercase tracking-wider">{dict.total_expenses}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-rose-600 tracking-tight">{totalExpenses.toLocaleString()} <span className="text-xl font-semibold opacity-70">RUB</span></div>
          </CardContent>
        </Card>
        
        <Card className={`border-0 shadow-lg ring-1 rounded-3xl overflow-hidden relative ${netProfit >= 0 ? "shadow-blue-500/10 ring-blue-100 bg-gradient-to-br from-blue-50 to-white" : "shadow-orange-500/10 ring-orange-100 bg-gradient-to-br from-orange-50 to-white"}`}>
          <div className={`absolute top-0 right-0 p-6 opacity-10 ${netProfit >= 0 ? "text-blue-600" : "text-orange-600"}`}>
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-bold uppercase tracking-wider ${netProfit >= 0 ? "text-blue-800" : "text-orange-800"}`}>{dict.net_profit}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-extrabold tracking-tight ${netProfit >= 0 ? "text-blue-600" : "text-orange-600"}`}>
              {netProfit.toLocaleString()} <span className="text-xl font-semibold opacity-70">RUB</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="pt-4">
        <SearchAndFilter 
          dict={dict} 
          placeholder={lang === 'uz' ? "Izoh bo'yicha qidiruv..." : "Поиск по заметке..."} 
          filterOptions={[
            { value: 'fuel', label: dict.fuel || 'Топливо' },
            { value: 'diesel', label: dict.diesel || 'Дизель' },
            { value: 'spare_parts', label: dict.spare_parts || 'Запчасти' },
            { value: 'repair', label: dict.repair || 'Ремонт' },
            { value: 'utilization', label: dict.utilization || 'Утилизация' },
            { value: 'base_rent', label: dict.base_rent || 'Аренда базы' },
            { value: 'gai', label: dict.gai || 'ГАИ' },
            { value: 'driver_salary', label: dict.driver_salary || 'Зарплата водителя' },
            { value: 'worker_salary', label: dict.worker_salary || 'Зарплата рабочего' },
            { value: 'dispatcher_salary', label: dict.dispatcher_salary || 'Зарплата диспетчера' },
            { value: 'referral_fee', label: dict.referral_fee || 'Реферальные' },
            { value: 'other', label: dict.other || 'Другое' }
          ]}
          filterPlaceholder={lang === 'uz' ? "Barcha toifalar" : "Все категории"}
          filterParam="category"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden">
          <CardHeader className="bg-white/50 backdrop-blur-sm border-b border-slate-100">
            <CardTitle>{dict.expenses_breakdown}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead>{dict.category}</TableHead>
                  <TableHead className="text-right">{dict.amount} (RUB)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]).map(([category, amount]) => (
                  <TableRow key={category}>
                    <TableCell className="capitalize font-semibold text-slate-700">{dict[category as keyof typeof dict] || category.replace('_', ' ')}</TableCell>
                    <TableCell className="text-right font-medium">{amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden">
          <CardHeader className="bg-white/50 backdrop-blur-sm border-b border-slate-100">
            <CardTitle>{dict.recent_expenses}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead>{dict.date}</TableHead>
                  <TableHead>{dict.category}</TableHead>
                  <TableHead>{dict.note}</TableHead>
                  <TableHead className="text-right">{dict.amount}</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.slice(0, 15).map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="text-xs text-slate-500">{format(new Date(expense.recordedAt), 'dd.MM.yyyy')}</TableCell>
                    <TableCell className="capitalize text-xs font-semibold px-2 py-1 bg-slate-100 rounded text-slate-700 inline-flex mt-2">{dict[expense.category as keyof typeof dict] || expense.category.replace('_', ' ')}</TableCell>
                    <TableCell className="text-xs truncate max-w-[150px]">{expense.note || '-'}</TableCell>
                    <TableCell className="text-right text-sm text-rose-600 font-bold">-{expense.amountRub.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <ExpenseForm dict={dict} expense={expense} />
                    </TableCell>
                  </TableRow>
                ))}
                {filteredExpenses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                      {lang === 'uz' ? "Xarajatlar topilmadi." : "Расходы не найдены."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
