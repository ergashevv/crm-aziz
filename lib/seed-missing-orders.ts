import { db } from './db';
import { clients, drivers, orders, users } from './schema';
import { eq } from 'drizzle-orm';

async function seedMissing() {
  console.log('Fetching dependencies...');
  const operatorUsers = await db.select().from(users).where(eq(users.role, 'operator')).limit(1);
  const operatorUser = operatorUsers[0];
  const allClients = await db.select().from(clients);
  const allDrivers = await db.select().from(drivers);

  if (!operatorUser || allClients.length === 0 || allDrivers.length === 0) {
    console.error('Missing data to seed assigned orders');
    return;
  }

  const newOrders = [];
  
  // 1. Pending Confirmation (Ожидает подтверждения)
  // operator must confirm these (status: completed, isClosed: false)
  console.log('Inserting 5 Pending Confirmation orders...');
  for (let i = 0; i < 5; i++) {
    const client = allClients[i % allClients.length];
    const driver = allDrivers[i % allDrivers.length];
    
    newOrders.push({
      clientId: client.id,
      driverId: driver.id,
      operatorNote: `Ожидает подтверждения оператора (Seeded) #${i+1}`,
      address: client.address,
      mapUrl: `https://yandex.ru/maps/?pt=69.2401,41.2995&z=12`,
      scheduledAt: new Date(),
      containerSizeM3: 8,
      containerNumber: `КТ-30${i}`,
      rentalDuration: '1 день',
      status: 'completed', // completed by driver
      paymentAmount: 200000,
      paymentType: 'cash' as const,
      paymentStatus: 'received', // driver received it
      clientCategory: 'direct',
      isExternalVehicle: false,
      isClosed: false, // operator hasn't closed it yet
      operatorId: operatorUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 2. Hanging orders (Осилиб қолган, assigned to driver but not picked up)
  console.log('Inserting 5 Hanging (assigned) orders...');
  for (let i = 0; i < 5; i++) {
    const client = allClients[(i+2) % allClients.length];
    const driver = allDrivers[(i+1) % allDrivers.length];
    
    newOrders.push({
      clientId: client.id,
      driverId: driver.id,
      operatorNote: `Назначен, но не начат (Осилиб қолган) (Seeded) #${i+1}`,
      address: client.address,
      mapUrl: `https://yandex.ru/maps/?pt=69.2401,41.2995&z=12`,
      scheduledAt: new Date(),
      containerSizeM3: 20,
      containerNumber: null,
      rentalDuration: '1 день',
      status: 'assigned', // just assigned
      paymentAmount: 180000,
      paymentType: 'cash' as const,
      paymentStatus: 'pending',
      clientCategory: 'direct',
      isExternalVehicle: false,
      isClosed: false,
      operatorId: operatorUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await db.insert(orders).values(newOrders);
  console.log('Successfully inserted 10 orders total.');
}

seedMissing().catch((err) => {
  console.error('Seed execution error:', err);
  process.exit(1);
});
