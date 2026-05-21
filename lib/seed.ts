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
    { name: 'Polat', phone: '+998901234567', vehiclePlate: '01 A 123 AA', username: 'driver', password: 'driver123' },
    { name: 'Aziz', phone: '+998902345678', vehiclePlate: '01 B 234 BB', username: 'aziz', password: 'password123' },
    { name: 'Sardor', phone: '+998903456789', vehiclePlate: '01 C 345 CC', username: 'sardor', password: 'password123' },
    { name: 'Farrux', phone: '+998904567890', vehiclePlate: '01 D 456 DD', username: 'farrux', password: 'password123' },
    { name: 'Jasur', phone: '+998905678901', vehiclePlate: '01 E 567 EE', username: 'jasur', password: 'password123' },
  ];
  const insertedDrivers = await db.insert(drivers).values(driverData).returning();

  // 3. Insert Clients
  const clientData = Array.from({ length: 10 }).map((_, i) => ({
    name: `Mijoz ${i + 1}`,
    phone: `+99893${1000000 + i}`,
    address: `Tashkent, Chilonzor ${i + 1}-kvartal`,
  }));
  const insertedClients = await db.insert(clients).values(clientData).returning();

  // 4. Generate Daily Data for the Last 30 Days
  const statuses = ['new', 'assigned', 'in_progress', 'container_placed', 'picked_up', 'completed'] as const;
  const durations = ['1_day', '1_week', '1_month'] as const;
  const payTypes = ['cash', 'card', 'online'] as const;
  const expCategories = ['fuel', 'diesel', 'spare_parts', 'repair', 'utilization', 'base_rent', 'driver_salary', 'other'] as const;

  const orderData = [];
  const fuelData = [];
  const expenseData = [];
  const warehouseData = [];

  for (let d = 0; d <= 180; d++) {
    const date = new Date();
    date.setDate(date.getDate() - (180 - d));

    // Create 1-2 orders for each day
    const numOrders = Math.floor(Math.random() * 2) + 1;
    for (let o = 0; o < numOrders; o++) {
      const index = d * 2 + o;
      const client = insertedClients[index % insertedClients.length];
      const driver = insertedDrivers[index % insertedDrivers.length];
      const status = d === 180 ? (o === 0 ? 'completed' : 'new') : statuses[index % statuses.length];
      const paymentStatus = (d === 180 ? (o === 0 ? 'entered' : 'pending') : (index % 4 !== 0 ? 'entered' : 'pending')) as 'pending' | 'entered';

      orderData.push({
        clientId: client.id,
        driverId: driver.id,
        address: client.address,
        scheduledAt: date,
        createdAt: date,
        containerSizeM3: 8,
        rentalDuration: durations[index % durations.length],
        status: status,
        paymentAmount: 150000 + (Math.floor(Math.random() * 10) * 10000), // realistic payments in RUB
        paymentType: payTypes[index % payTypes.length],
        paymentStatus: paymentStatus,
        referralName: index % 5 === 0 ? 'Agent / Агент' : null,
        referralPercent: index % 5 === 0 ? 10 : null,
      });
    }

    // Create 1 expense for each day
    expenseData.push({
      category: expCategories[d % expCategories.length],
      amountRub: Math.floor(10000 + (Math.random() * 20000)),
      note: `Xarajat / Расход kun-${d}`,
      recordedAt: date,
    });

    // Create fuel logs every other day
    if (d % 2 === 0) {
      const driver = insertedDrivers[d % insertedDrivers.length];
      const liters = Math.floor(30 + Math.random() * 40);
      fuelData.push({
        driverId: driver.id,
        stationName: `Zapravka ${d % 3 + 1}`,
        liters: liters,
        priceRub: liters * 100,
        vehicle: driver.vehiclePlate,
        loggedAt: date,
      });
    }

    // Create warehouse income every other day
    if (d % 2 === 1) {
      warehouseData.push({
        source: (d % 3 === 0 ? 'client_payment' : 'external_vehicle_rental') as 'client_payment' | 'external_vehicle_rental',
        amountRub: Math.floor(20000 + (Math.random() * 50000)),
        note: `Omborxona daromadi kun-${d}`,
        recordedAt: date,
      });
    }
  }

  await db.insert(orders).values(orderData);
  await db.insert(fuelLogs).values(fuelData);
  await db.insert(expenses).values(expenseData);
  await db.insert(warehouseIncome).values(warehouseData);

  console.log('Seed completed successfully!');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
