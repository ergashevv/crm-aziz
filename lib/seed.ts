import { db } from './db';
import { clients, drivers, orders, expenses, fuelLogs, warehouseIncome } from './schema';

async function seed() {
  console.log('Starting seed...');

  // 1. Clear existing data
  await db.delete(orders);
  await db.delete(fuelLogs);
  await db.delete(expenses);
  await db.delete(warehouseIncome);
  await db.delete(clients);
  await db.delete(drivers);

  // 2. Insert Drivers
  const driverData = [
    { name: 'Rustam', phone: '+998901234567', vehiclePlate: '01 A 123 AA' },
    { name: 'Aziz', phone: '+998902345678', vehiclePlate: '01 B 234 BB' },
    { name: 'Sardor', phone: '+998903456789', vehiclePlate: '01 C 345 CC' },
    { name: 'Farrux', phone: '+998904567890', vehiclePlate: '01 D 456 DD' },
    { name: 'Jasur', phone: '+998905678901', vehiclePlate: '01 E 567 EE' },
  ];
  const insertedDrivers = await db.insert(drivers).values(driverData).returning();

  // 3. Insert Clients
  const clientData = Array.from({ length: 10 }).map((_, i) => ({
    name: `Mijoz ${i + 1}`,
    phone: `+99893${1000000 + i}`,
    address: `Tashkent, Chilonzor ${i + 1}-kvartal`,
  }));
  const insertedClients = await db.insert(clients).values(clientData).returning();

  // 4. Insert Orders
  const statuses = ['new', 'assigned', 'in_progress', 'container_placed', 'picked_up', 'completed'] as const;
  const durations = ['1_day', '1_week', '1_month'] as const;
  const payTypes = ['cash', 'card', 'online'] as const;
  
  const orderData = Array.from({ length: 20 }).map((_, i) => {
    const client = insertedClients[i % insertedClients.length];
    const driver = insertedDrivers[i % insertedDrivers.length];
    const status = statuses[i % statuses.length];
    const date = new Date();
    date.setDate(date.getDate() - (20 - i));

    return {
      clientId: client.id,
      driverId: driver.id,
      address: client.address,
      scheduledAt: date,
      containerSizeM3: 8,
      rentalDuration: durations[i % durations.length],
      status: status,
      paymentAmount: 1500000 + (i * 50000), // higher income
      paymentType: payTypes[i % payTypes.length],
      paymentStatus: (i % 4 !== 0 ? 'entered' : 'pending') as 'entered' | 'pending',
      referralName: i % 3 === 0 ? 'Agent / Агент' : null,
      referralPercent: i % 3 === 0 ? 10 : null,
    };
  });
  await db.insert(orders).values(orderData);

  // 4.5 Insert Fuel Logs
  const fuelData = Array.from({ length: 15 }).map((_, i) => {
    const driver = insertedDrivers[i % insertedDrivers.length];
    const date = new Date();
    date.setDate(date.getDate() - (15 - i));
    const liters = Math.floor(20 + Math.random() * 50); // 20-70 liters
    return {
      driverId: driver.id,
      stationName: `Zapravka ${i % 3 + 1}`,
      liters: liters,
      priceRub: liters * 100, // example price
      vehicle: driver.vehiclePlate,
      loggedAt: date,
    };
  });
  await db.insert(fuelLogs).values(fuelData);

  // 5. Insert Expenses
  const expCategories = ['fuel', 'diesel', 'spare_parts', 'repair', 'utilization', 'base_rent', 'driver_salary', 'other'] as const;
  const expenseData = Array.from({ length: 30 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (30 - i));
    return {
      category: expCategories[i % expCategories.length],
      amountRub: Math.floor(10000 + (Math.random() * 40000)), // lower expenses
      note: `Xarajat / Расход ${i}`,
      recordedAt: date,
    };
  });
  await db.insert(expenses).values(expenseData);

  // 6. Insert Warehouse Income
  const warehouseData = Array.from({ length: 15 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (15 - i));
    return {
      source: (i % 2 === 0 ? 'client_payment' : 'external_vehicle_rental') as 'client_payment' | 'external_vehicle_rental',
      amountRub: Math.floor(200000 + (Math.random() * 300000)),
      note: `Kirim / Доход ${i}`,
      recordedAt: date,
    };
  });
  await db.insert(warehouseIncome).values(warehouseData);

  console.log('Seed completed successfully!');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
