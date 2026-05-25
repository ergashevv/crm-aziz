import React from 'react';
import { getDrivers } from '@/lib/data';
import { db } from '@/lib/db';
import { expenses } from '@/lib/schema';
import { inArray, desc } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/dictionaries';
import { getCurrentUser } from '@/lib/auth';
import { FuelForm } from '@/components/forms/FuelForm';
import { DriverFuelTracker } from '@/components/DriverFuelTracker';

export const dynamic = 'force-dynamic';

export default async function FuelPage() {
  const lang = 'ru';
  const dict = getDictionary(lang);
  const user = await getCurrentUser();
  const isOperator = user?.role === 'operator';

  // 1. Fetch drivers
  const drivers = await getDrivers();

  // 2. Fetch fuel & diesel expenses directly
  let rawExpenses = await db.select({
    id: expenses.id,
    category: expenses.category,
    amountRub: expenses.amountRub,
    note: expenses.note,
    driverId: expenses.driverId,
    liters: expenses.liters,
    recordedAt: expenses.recordedAt,
    operatorId: expenses.operatorId,
  })
  .from(expenses)
  .where(inArray(expenses.category, ['fuel', 'diesel']))
  .orderBy(desc(expenses.recordedAt));

  // Apply operator restriction if applicable
  if (isOperator && user) {
    rawExpenses = rawExpenses.filter(e => e.operatorId === user.id);
  }

  // Cast categories correctly for frontend component
  const fuelExpenses = rawExpenses.map(e => ({
    ...e,
    category: e.category as 'fuel' | 'diesel'
  }));

  return (
    <div className="space-y-6">
      {/* Header View */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {dict.fuel_logs || 'Учет Топлива'}
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            {dict.monitor_fuel || 'Мониторинг расхода топлива и затрат по всем автомобилям.'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <FuelForm dict={dict} drivers={drivers} />
        </div>
      </div>

      {/* Driver Fuel Tracker Component */}
      <DriverFuelTracker 
        dict={dict} 
        drivers={drivers} 
        expenses={fuelExpenses} 
      />
    </div>
  );
}
