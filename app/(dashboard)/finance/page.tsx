import React from 'react';
import { getFinanceData, getClients } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/dictionaries';
import { Wallet, ArrowUpRight, ArrowDownRight, Percent } from 'lucide-react';
import { ExpenseForm } from '@/components/forms/ExpenseForm';
import { FinanceCharts } from '@/components/FinanceCharts';
import { ExportButton } from '@/components/ExportButton';
import { FinanceFilter } from '@/components/FinanceFilter';

export default async function FinancePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const lang = cookies().get('lang')?.value;
  const dict = getDictionary(lang);

  // Fetch all database records
  const { allOrders, allExpenses, allWarehouseIncome } = await getFinanceData();
  const allClients = await getClients();
  const clientMap = new Map(allClients.map(c => [c.id, c]));

  // Read search & filter parameters
  const currentTab = typeof searchParams.tab === 'string' ? searchParams.tab : 'expenses';
  const q = typeof searchParams.q === 'string' ? searchParams.q.toLowerCase() : '';
  const categoryFilter = typeof searchParams.category === 'string' ? searchParams.category : '';
  const sourceFilter = typeof searchParams.source === 'string' ? searchParams.source : '';
  const startDateStr = typeof searchParams.startDate === 'string' ? searchParams.startDate : '';
  const endDateStr = typeof searchParams.endDate === 'string' ? searchParams.endDate : '';

  const startDate = startDateStr ? new Date(startDateStr) : null;
  const endDate = endDateStr ? new Date(endDateStr) : null;
  if (startDate) startDate.setHours(0, 0, 0, 0);
  if (endDate) endDate.setHours(23, 59, 59, 999);

  const isFiltered = !!(q || (currentTab === 'expenses' && categoryFilter && categoryFilter !== 'all') || (currentTab === 'income' && sourceFilter && sourceFilter !== 'all') || startDateStr || endDateStr);

  // ================= EXPENSES SECTION =================
  let filteredExpenses = allExpenses;

  if (categoryFilter && categoryFilter !== 'all') {
    filteredExpenses = filteredExpenses.filter(e => e.category === categoryFilter);
  }
  if (q) {
    filteredExpenses = filteredExpenses.filter(e => 
      e.note?.toLowerCase().includes(q) || 
      e.category.toLowerCase().includes(q) ||
      (dict[e.category as keyof typeof dict]?.toLowerCase() || '').includes(q)
    );
  }
  if (startDate) {
    filteredExpenses = filteredExpenses.filter(e => new Date(e.recordedAt) >= startDate);
  }
  if (endDate) {
    filteredExpenses = filteredExpenses.filter(e => new Date(e.recordedAt) <= endDate);
  }

  // Calculate overall & filtered expenses totals
  let overallTotalExpenses = 0;
  allExpenses.forEach(e => {
    overallTotalExpenses += e.amountRub;
  });

  let filteredTotalExpenses = 0;
  const filteredExpensesByCategory: Record<string, number> = {};
  filteredExpenses.forEach(e => {
    filteredTotalExpenses += e.amountRub;
    if (!filteredExpensesByCategory[e.category]) {
      filteredExpensesByCategory[e.category] = 0;
    }
    filteredExpensesByCategory[e.category] += e.amountRub;
  });

  // Calculate chart categories breakdown based on active filters
  const chartExpensesByCategory = Object.entries(filteredExpensesByCategory).map(([name, value]) => ({
    name,
    value
  }));

  // ================= INCOME SECTION =================
  interface IncomeItem {
    id: string;
    type: 'order' | 'warehouse';
    rawId: number;
    date: Date;
    amount: number;
    sourceKey: 'client_payment' | string;
    sourceLabel: string;
    clientName?: string;
    note: string;
    address?: string;
  }

  const combinedIncomes: IncomeItem[] = [];

  // 1. Client payments from completed/entered orders
  allOrders.forEach(o => {
    if (o.paymentStatus === 'entered' || o.paymentStatus === 'received') {
      const client = clientMap.get(o.clientId);
      combinedIncomes.push({
        id: `order-${o.id}`,
        type: 'order',
        rawId: o.id,
        date: new Date(o.createdAt),
        amount: o.paymentAmount,
        sourceKey: 'client_payment',
        sourceLabel: dict.client_payment || 'Оплата клиента',
        clientName: client?.name || dict.client || 'Client',
        note: o.operatorNote || '',
        address: o.address
      });
    }
  });

  // 2. Warehouse incomes excluding client_payment source to prevent double-counting
  allWarehouseIncome.forEach(w => {
    if (w.source !== 'client_payment') {
      combinedIncomes.push({
        id: `warehouse-${w.id}`,
        type: 'warehouse',
        rawId: w.id,
        date: new Date(w.recordedAt),
        amount: w.amountRub,
        sourceKey: w.source,
        sourceLabel: dict[w.source as keyof typeof dict] || w.source.replace('_', ' '),
        note: w.note || ''
      });
    }
  });

  // Sort timeline descending by date
  combinedIncomes.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Filter combined incomes
  let filteredIncomes = combinedIncomes;

  if (sourceFilter && sourceFilter !== 'all') {
    filteredIncomes = filteredIncomes.filter(i => i.sourceKey === sourceFilter);
  }
  if (q) {
    filteredIncomes = filteredIncomes.filter(i => 
      i.note.toLowerCase().includes(q) || 
      (i.clientName?.toLowerCase() || '').includes(q) ||
      (i.address?.toLowerCase() || '').includes(q) ||
      i.sourceLabel.toLowerCase().includes(q) ||
      (dict[i.sourceKey as keyof typeof dict]?.toLowerCase() || '').includes(q)
    );
  }
  if (startDate) {
    filteredIncomes = filteredIncomes.filter(i => i.date >= startDate);
  }
  if (endDate) {
    filteredIncomes = filteredIncomes.filter(i => i.date <= endDate);
  }

  // Calculate overall & filtered income totals
  let overallTotalIncome = 0;
  combinedIncomes.forEach(i => {
    overallTotalIncome += i.amount;
  });

  let filteredTotalIncome = 0;
  const filteredIncomeBySource: Record<string, number> = {};
  filteredIncomes.forEach(i => {
    filteredTotalIncome += i.amount;
    const srcLabel = i.sourceLabel;
    if (!filteredIncomeBySource[srcLabel]) {
      filteredIncomeBySource[srcLabel] = 0;
    }
    filteredIncomeBySource[srcLabel] += i.amount;
  });

  // ================= GENERAL METRICS =================
  const overallNetProfit = overallTotalIncome - overallTotalExpenses;
  const filteredNetProfit = filteredTotalIncome - filteredTotalExpenses;

  // ================= CHARTS DATA (All-Time Monthly) =================
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    d.setHours(0,0,0,0);
    return d;
  }).reverse();

  const chartMonthlyData = last6Months.map(date => {
    const monthStr = format(date, 'MMM');
    let income = 0;
    let expenses = 0;

    allOrders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      if (orderDate.getMonth() === date.getMonth() && orderDate.getFullYear() === date.getFullYear() && (order.paymentStatus === 'entered' || order.paymentStatus === 'received')) {
        income += order.paymentAmount;
      }
    });

    allWarehouseIncome.forEach(w => {
      if (w.source === 'client_payment') return;
      const wDate = new Date(w.recordedAt);
      if (wDate.getMonth() === date.getMonth() && wDate.getFullYear() === date.getFullYear()) {
        income += w.amountRub;
      }
    });

    allExpenses.forEach(e => {
      const eDate = new Date(e.recordedAt);
      if (eDate.getMonth() === date.getMonth() && eDate.getFullYear() === date.getFullYear()) {
        expenses += e.amountRub;
      }
    });

    return { month: monthStr, income, expenses };
  });

  // ================= EXPORTS DATA =================
  const exportExpensesData = filteredExpenses.map(e => ({
    id: `#${e.id}`,
    category: dict[e.category as keyof typeof dict] || e.category,
    note: e.note || '-',
    date: format(new Date(e.recordedAt), 'dd.MM.yyyy'),
    amount: `${e.amountRub.toLocaleString()} RUB`
  }));

  const exportExpensesColumns = [
    { key: 'id', label: 'ID' },
    { key: 'category', label: dict.category },
    { key: 'note', label: dict.note },
    { key: 'date', label: dict.date },
    { key: 'amount', label: dict.amount }
  ];

  const exportIncomesData = filteredIncomes.map(i => ({
    id: i.type === 'order' ? `#Buyurtma-${i.rawId}` : `#Ombor-${i.rawId}`,
    source: i.sourceLabel,
    details: i.type === 'order' 
      ? `${i.clientName} (${i.address || ''})` 
      : (i.note || '-'),
    date: format(i.date, 'dd.MM.yyyy'),
    amount: `${i.amount.toLocaleString()} RUB`
  }));

  const exportIncomesColumns = [
    { key: 'id', label: 'ID' },
    { key: 'source', label: dict.income_source || 'Manba' },
    { key: 'details', label: dict.details || 'Batafsil' },
    { key: 'date', label: dict.date },
    { key: 'amount', label: dict.amount }
  ];

  // Lists for Filter component
  const expenseCategories = [
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
  ];

  const incomeSources = [
    { value: 'client_payment', label: dict.client_payment || 'Оплата клиента' },
    { value: 'external_vehicle_rental', label: dict.external_vehicle_rental || 'Аренда стороннего авто' }
  ];

  return (
    <div className="space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200/60">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{dict.finance}</h1>
            <p className="text-slate-500 mt-1 font-medium">{dict.track_finance}</p>
          </div>
        </div>
        <div className="flex gap-3 items-center w-full sm:w-auto justify-end">
          <ExportButton 
            data={currentTab === 'expenses' ? exportExpensesData : exportIncomesData} 
            columns={currentTab === 'expenses' ? exportExpensesColumns : exportIncomesColumns} 
            filename={currentTab === 'expenses' ? "expenses_report" : "income_report"} 
            title={
              currentTab === 'expenses' 
                ? (lang === 'uz' ? "Xarajatlar Ro'yxati" : "Список расходов") 
                : (lang === 'uz' ? "Daromadlar Ro'yxati" : "Список доходов")
            } 
            dict={dict} 
          />
          <ExpenseForm dict={dict} />
        </div>
      </div>

      {/* Summary Cards with Filter Awareness */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Income */}
        <Card className="border-0 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-100 rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-50 to-white relative">
          <div className="absolute top-0 right-0 p-6 opacity-10 text-emerald-600">
            <ArrowUpRight className="w-16 h-16" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              {dict.total_income} {isFiltered && `(${dict.filtered_total?.toLowerCase()})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-emerald-600 tracking-tight">
              {filteredTotalIncome.toLocaleString()}{' '}
              <span className="text-xl font-semibold opacity-70">RUB</span>
            </div>
            {isFiltered && (
              <p className="text-xs font-semibold text-emerald-700/60 mt-1">
                {lang === 'uz' ? `Jami (all-time): ${overallTotalIncome.toLocaleString()} RUB` : `Всего (all-time): ${overallTotalIncome.toLocaleString()} RUB`}
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Total Expenses */}
        <Card className="border-0 shadow-lg shadow-rose-500/10 ring-1 ring-rose-100 rounded-3xl overflow-hidden bg-gradient-to-br from-rose-50 to-white relative">
          <div className="absolute top-0 right-0 p-6 opacity-10 text-rose-600">
            <ArrowDownRight className="w-16 h-16" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-rose-800 uppercase tracking-wider">
              {dict.total_expenses} {isFiltered && `(${dict.filtered_total?.toLowerCase()})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-rose-600 tracking-tight">
              {filteredTotalExpenses.toLocaleString()}{' '}
              <span className="text-xl font-semibold opacity-70">RUB</span>
            </div>
            {isFiltered && (
              <p className="text-xs font-semibold text-rose-700/60 mt-1">
                {lang === 'uz' ? `Jami (all-time): ${overallTotalExpenses.toLocaleString()} RUB` : `Всего (all-time): ${overallTotalExpenses.toLocaleString()} RUB`}
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Net Profit */}
        <Card className={`border-0 shadow-lg ring-1 rounded-3xl overflow-hidden relative ${filteredNetProfit >= 0 ? "shadow-blue-500/10 ring-blue-100 bg-gradient-to-br from-blue-50 to-white" : "shadow-orange-500/10 ring-orange-100 bg-gradient-to-br from-orange-50 to-white"}`}>
          <div className={`absolute top-0 right-0 p-6 opacity-10 ${filteredNetProfit >= 0 ? "text-blue-600" : "text-orange-600"}`}>
            <Percent className="w-16 h-16" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className={`text-xs font-bold uppercase tracking-wider ${filteredNetProfit >= 0 ? "text-blue-800" : "text-orange-800"}`}>
              {dict.net_profit} {isFiltered && `(${dict.filtered_total?.toLowerCase()})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-extrabold tracking-tight ${filteredNetProfit >= 0 ? "text-blue-600" : "text-orange-600"}`}>
              {filteredNetProfit.toLocaleString()}{' '}
              <span className="text-xl font-semibold opacity-70">RUB</span>
            </div>
            {isFiltered && (
              <p className={`text-xs font-semibold mt-1 ${filteredNetProfit >= 0 ? "text-blue-700/60" : "text-orange-700/60"}`}>
                {lang === 'uz' ? `Jami (all-time): ${overallNetProfit.toLocaleString()} RUB` : `Всего (all-time): ${overallNetProfit.toLocaleString()} RUB`}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Finance Charts */}
      <FinanceCharts 
        monthlyData={chartMonthlyData} 
        expensesByCategory={chartExpensesByCategory} 
        dict={dict} 
      />

      {/* Filters Area */}
      <div className="pt-4">
        <FinanceFilter 
          dict={dict}
          expenseCategories={expenseCategories}
          incomeSources={incomeSources}
        />
      </div>

      {/* Dynamic Ledgers Section depending on tab */}
      {currentTab === 'expenses' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Expenses Breakdown */}
          <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
            <CardHeader className="bg-white/50 backdrop-blur-sm border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider">{dict.expenses_breakdown}</CardTitle>
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
                  {Object.entries(filteredExpensesByCategory).sort((a, b) => b[1] - a[1]).map(([category, amount]) => (
                    <TableRow key={category}>
                      <TableCell className="capitalize font-semibold text-slate-700">
                        {dict[category as keyof typeof dict] || category.replace('_', ' ')}
                      </TableCell>
                      <TableCell className="text-right font-medium">{amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {Object.keys(filteredExpensesByCategory).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-8 text-slate-500 font-medium">
                        {lang === 'uz' ? "Xarajatlar taqsimoti mavjud emas." : "Нет данных о распределении расходов."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Expenses List */}
          <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
            <CardHeader className="bg-white/50 backdrop-blur-sm border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider">{dict.expense_ledger || dict.recent_expenses}</CardTitle>
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
                  {filteredExpenses.slice(0, 50).map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="text-xs text-slate-500">{format(new Date(expense.recordedAt), 'dd.MM.yyyy')}</TableCell>
                      <TableCell>
                        <span className="capitalize text-xs font-semibold px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-md inline-flex">
                          {dict[expense.category as keyof typeof dict] || expense.category.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs truncate max-w-[150px] font-medium text-slate-600">{expense.note || '-'}</TableCell>
                      <TableCell className="text-right text-sm text-rose-600 font-extrabold">-{expense.amountRub.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <ExpenseForm dict={dict} expense={expense} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500 font-medium">
                        {lang === 'uz' ? "Xarajatlar topilmadi." : "Расходы не найдены."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Income Breakdown */}
          <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
            <CardHeader className="bg-white/50 backdrop-blur-sm border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider">{lang === 'uz' ? "Daromad manbalari taqsimoti" : "Распределение доходов по источникам"}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead>{dict.source || "Manba"}</TableHead>
                    <TableHead className="text-right">{dict.amount} (RUB)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(filteredIncomeBySource).sort((a, b) => b[1] - a[1]).map(([source, amount]) => (
                    <TableRow key={source}>
                      <TableCell className="capitalize font-semibold text-slate-700">
                        {source}
                      </TableCell>
                      <TableCell className="text-right font-medium">{amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {Object.keys(filteredIncomeBySource).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-8 text-slate-500 font-medium">
                        {lang === 'uz' ? "Daromadlar taqsimoti mavjud emas." : "Нет данных о распределении доходов."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Income List */}
          <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-xl">
            <CardHeader className="bg-white/50 backdrop-blur-sm border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider">{dict.income_ledger || "Daromadlar daftari"}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead>{dict.date}</TableHead>
                    <TableHead>{dict.source || "Manba"}</TableHead>
                    <TableHead>{dict.details || "Batafsil"}</TableHead>
                    <TableHead className="text-right">{dict.amount}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncomes.slice(0, 50).map((income) => (
                    <TableRow key={income.id}>
                      <TableCell className="text-xs text-slate-500">{format(income.date, 'dd.MM.yyyy')}</TableCell>
                      <TableCell>
                        <span className={`capitalize text-xs font-semibold px-2 py-0.5 border rounded-md inline-flex ${
                          income.sourceKey === 'client_payment' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          {income.sourceLabel}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs truncate max-w-[200px] font-medium text-slate-600">
                        {income.type === 'order' ? (
                          <span>
                            <strong>{income.clientName}</strong> {income.address ? `- ${income.address}` : ''}
                            {income.note && <em className="text-slate-400 block font-normal text-[10px] truncate max-w-[180px]">{income.note}</em>}
                          </span>
                        ) : (
                          <span>
                            {income.note || '-'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm text-emerald-600 font-extrabold">+{income.amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {filteredIncomes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-slate-500 font-medium">
                        {dict.no_income_found || "Daromadlar topilmadi."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
