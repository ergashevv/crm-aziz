import { db } from './db';
import { clients, drivers, orders, expenses, fuelLogs, warehouseIncome } from './schema';

type OrderStatus = 'new' | 'assigned' | 'in_progress' | 'container_placed' | 'picked_up' | 'completed';

/** Local midnight for today + offset days (0 = today, 1 = tomorrow, -1 = yesterday). */
function dayOffset(offset: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

function atTimeOnDay(day: Date, hours: number, minutes = 0): Date {
  const d = new Date(day);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function formatDay(d: Date): string {
  return d.toLocaleDateString('uz-UZ', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}

async function seed() {
  console.log('Starting realistic seed...');

  await db.delete(orders);
  await db.delete(fuelLogs);
  await db.delete(expenses);
  await db.delete(warehouseIncome);
  await db.delete(clients);
  await db.delete(drivers);

  const driverData = [
    { name: 'Polat', phone: '+998901234567', vehiclePlate: '01 A 123 AA', username: 'driver', password: 'driver123' },
    { name: 'Aziz', phone: '+998902345678', vehiclePlate: '01 B 234 BB', username: 'aziz', password: 'password123' },
    { name: 'Sardor', phone: '+998903456789', vehiclePlate: '01 C 345 CC', username: 'sardor', password: 'password123' },
    { name: 'Farrux', phone: '+998904567890', vehiclePlate: '01 D 456 DD', username: 'farrux', password: 'password123' },
    { name: 'Jasur', phone: '+998905678901', vehiclePlate: '01 E 567 EE', username: 'jasur', password: 'password123' },
  ];
  const insertedDrivers = await db.insert(drivers).values(driverData).returning();
  const polat = insertedDrivers[0]; // mobil test — seed buyurtma bermaydi, dashboarddan qo'shiladi
  const aziz = insertedDrivers[1];
  const seedDrivers = insertedDrivers.filter((d) => d.id !== polat.id);
  const sardor = insertedDrivers[2];
  const farrux = insertedDrivers[3];
  const jasur = insertedDrivers[4];

  const clientData = Array.from({ length: 10 }).map((_, i) => ({
    name: `Mijoz ${i + 1}`,
    phone: `+99893${1000000 + i}`,
    address: `Toshkent, Chilonzor ${i + 1}-kvartal`,
  }));
  const insertedClients = await db.insert(clients).values(clientData).returning();

  const durations = ['1_day', '1_week', '1_month'] as const;
  const payTypes = ['cash', 'card', 'online'] as const;
  const expCategories = ['fuel', 'diesel', 'spare_parts', 'repair', 'utilization', 'base_rent', 'driver_salary', 'other'] as const;

  const orderData: Array<{
    clientId: number;
    driverId: number;
    address: string;
    scheduledAt: Date;
    createdAt: Date;
    containerSizeM3: number;
    rentalDuration: (typeof durations)[number];
    status: OrderStatus;
    paymentAmount: number;
    paymentType: (typeof payTypes)[number];
    paymentStatus: 'pending' | 'received' | 'entered';
    operatorNote?: string;
  }> = [];

  let orderSeq = 0;
  const pickClient = () => insertedClients[orderSeq++ % insertedClients.length];
  const amount = () => 150000 + Math.floor(Math.random() * 8) * 10000;

  const today = dayOffset(0);
  const tomorrow = dayOffset(1);

  console.log(`Bugun: ${formatDay(today)}`);
  console.log(`Ertaga: ${formatDay(tomorrow)}`);

  // --- O'tgan 14 kun: har kuni 2-4 ta buyurtma, HAMMASI completed ---
  for (let daysBack = 14; daysBack >= 1; daysBack--) {
    const day = dayOffset(-daysBack);
    const ordersToday = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < ordersToday; i++) {
      const client = pickClient();
      const driver = seedDrivers[(daysBack + i) % seedDrivers.length];
      const hour = 8 + i * 3 + Math.floor(Math.random() * 2);
      orderData.push({
        clientId: client.id,
        driverId: driver.id,
        address: client.address,
        scheduledAt: atTimeOnDay(day, hour, 30),
        createdAt: atTimeOnDay(day, hour, 0),
        containerSizeM3: 8,
        rentalDuration: durations[i % durations.length],
        status: 'completed',
        paymentAmount: amount(),
        paymentType: payTypes[i % payTypes.length],
        paymentStatus: 'received',
      });
    }
  }

  // --- BUGUN: har haydovchida 0-2 ta FAOL buyurtma (Polat — dashboarddan qo'shiladi) ---
  orderData.push({
    clientId: insertedClients[2].id,
    driverId: aziz.id,
    address: insertedClients[2].address,
    scheduledAt: atTimeOnDay(today, 11, 0),
    createdAt: atTimeOnDay(today, 10, 0),
    containerSizeM3: 8,
    rentalDuration: '1_day',
    status: 'new',
    paymentAmount: amount(),
    paymentType: 'online',
    paymentStatus: 'pending',
  });

  orderData.push({
    clientId: insertedClients[3].id,
    driverId: sardor.id,
    address: insertedClients[3].address,
    scheduledAt: atTimeOnDay(today, 9, 0),
    createdAt: atTimeOnDay(today, 8, 0),
    containerSizeM3: 8,
    rentalDuration: '1_month',
    status: 'container_placed',
    paymentAmount: amount(),
    paymentType: 'cash',
    paymentStatus: 'pending',
  });

  orderData.push({
    clientId: insertedClients[4].id,
    driverId: farrux.id,
    address: insertedClients[4].address,
    scheduledAt: atTimeOnDay(today, 14, 0),
    createdAt: atTimeOnDay(today, 13, 0),
    containerSizeM3: 8,
    rentalDuration: '1_week',
    status: 'picked_up',
    paymentAmount: amount(),
    paymentType: 'card',
    paymentStatus: 'pending',
    operatorNote: 'To\'lovni oling',
  });

  // Jasur bugun buyurtmasiz (bo'sh haydovchi)

  // --- ERTAGA: jadval uchun kelajak buyurtma ---
  orderData.push({
    clientId: insertedClients[6].id,
    driverId: jasur.id,
    address: insertedClients[6].address,
    scheduledAt: atTimeOnDay(tomorrow, 12, 0),
    createdAt: atTimeOnDay(today, 12, 0),
    containerSizeM3: 8,
    rentalDuration: '1_week',
    status: 'assigned',
    paymentAmount: amount(),
    paymentType: 'online',
    paymentStatus: 'pending',
  });

  // --- Xarajatlar, yoqilg'i, ombor (14 kun) ---
  const fuelData = [];
  const expenseData = [];
  const warehouseData = [];

  for (let d = 14; d >= 0; d--) {
    const date = dayOffset(-d);
    expenseData.push({
      category: expCategories[d % expCategories.length],
      amountRub: Math.floor(10000 + Math.random() * 20000),
      note: `Kunlik xarajat`,
      recordedAt: atTimeOnDay(date, 18, 0),
    });
    if (d % 2 === 0) {
      const driver = insertedDrivers[d % insertedDrivers.length];
      const liters = Math.floor(30 + Math.random() * 40);
      fuelData.push({
        driverId: driver.id,
        stationName: `Yoqilg'i ${(d % 3) + 1}`,
        liters,
        priceRub: liters * 100,
        vehicle: driver.vehiclePlate,
        loggedAt: atTimeOnDay(date, 17, 0),
      });
    }
    if (d % 2 === 1) {
      warehouseData.push({
        source: (d % 3 === 0 ? 'client_payment' : 'external_vehicle_rental') as 'client_payment' | 'external_vehicle_rental',
        amountRub: Math.floor(20000 + Math.random() * 50000),
        note: `Ombor daromadi`,
        recordedAt: atTimeOnDay(date, 19, 0),
      });
    }
  }

  await db.insert(orders).values(orderData);
  await db.insert(fuelLogs).values(fuelData);
  await db.insert(expenses).values(expenseData);
  await db.insert(warehouseIncome).values(warehouseData);

  console.log(`Seed done: ${orderData.length} orders total`);
  for (const dr of insertedDrivers) {
    const count = orderData.filter((o) => o.driverId === dr.id).length;
    const active = orderData.filter((o) => o.driverId === dr.id && o.status !== 'completed').length;
    console.log(`  ${dr.name}: ${count} jami, ${active} faol`);
  }

  console.log(`\n${polat.name} (${polat.username}): seed buyurtmasiz — dashboarddan qo'shing.`);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
