'use client';

import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#3b82f6', '#14b8a6', '#f43f5e', '#06b6d4'];

export function DashboardCharts({ 
  financeData, 
  expensesByCategory, 
  dict 
}: { 
  financeData: { date: string, income: number, expenses: number }[],
  expensesByCategory: { name: string, value: number }[],
  dict: any 
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[350px]">
        <Card className="lg:col-span-2 border-0 shadow-sm ring-1 ring-slate-100 rounded-3xl bg-white/50 animate-pulse" />
        <Card className="border-0 shadow-sm ring-1 ring-slate-100 rounded-3xl bg-white/50 animate-pulse" />
      </div>
    );
  }

  const translatedExpenses = expensesByCategory.map(e => ({
    name: dict[e.name as keyof typeof dict] || e.name.replace('_', ' '),
    value: e.value
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 border border-white shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden bg-white/70 backdrop-blur-2xl">
        <CardHeader className="bg-white/40 border-b border-white/50 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
            </div>
            <CardTitle className="text-lg font-black tracking-tight text-slate-800">
              {dict.financial_overview || "Financial Overview"}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6 px-4">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val >= 1000 ? (val / 1000) + 'k' : val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '1rem', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                  labelStyle={{ fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}
                  itemStyle={{ fontWeight: '600', fontSize: '13px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontWeight: '600' }} />
                <Area type="monotone" name={dict.total_income || "Income"} dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" activeDot={{ r: 6, strokeWidth: 0 }} />
                <Area type="monotone" name={dict.total_expenses || "Expenses"} dataKey="expenses" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpenses)" activeDot={{ r: 6, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-white shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden bg-white/70 backdrop-blur-2xl">
        <CardHeader className="bg-white/40 border-b border-white/50 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-orange-500" />
            </div>
            <CardTitle className="text-lg font-black tracking-tight text-slate-800">
              {dict.expenses_breakdown || "Expenses Breakdown"}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6 px-6">
          <div className="h-[230px] w-full flex items-center justify-center relative">
            {translatedExpenses.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={translatedExpenses}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={4}
                  >
                    {translatedExpenses.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '1rem', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                    itemStyle={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-sm font-bold flex flex-col items-center">
                <div className="h-16 w-16 mb-2 rounded-full bg-slate-100 flex items-center justify-center">📉</div>
                {dict.no_expenses || "No expenses"}
              </div>
            )}
            {translatedExpenses.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-3xl">💸</span>
              </div>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-y-3 gap-x-2 text-[11px] max-h-[85px] overflow-y-auto pr-1">
            {translatedExpenses.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2 min-w-0 bg-white/50 p-1.5 rounded-lg">
                <span className="h-2.5 w-2.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-slate-700 font-bold truncate capitalize">{entry.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
