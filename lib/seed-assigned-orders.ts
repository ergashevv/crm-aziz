import { db } from './db';
import { clients, drivers, orders, users } from './schema';
import { eq } from 'drizzle-orm';

async function seedAssigned() {
  console.log('Fetching dependencies...');
  const operatorUsers = await db.select().from(users).where(eq(users.role, 'operator')).limit(1);
  const operatorUser = operatorUsers[0];
  const allClients = await db.select().from(clients);
  const allDrivers = await db.select().from(drivers);

  if (!operatorUser || allClients.length === 0 || allDrivers.length === 0) {
    console.error('Missing data to seed assigned orders');
    return;
  }

  console.log('Inserting 5 assigned orders...');
  const newOrders = [];
  
  for (let i = 0; i < 5; i++) {
    const client = allClients[i % allClients.length];
    const driver = allDrivers[i % allDrivers.length];
    
    newOrders.push({
      clientId: client.id,
      driverId: driver.id,
      operatorNote: `Ожидает подтверждения (Seeded) #${i+1}`,
      address: client.address,
      mapUrl: `https://yandex.ru/maps/?pt=69.2401,41.2995&z=12`,
      scheduledAt: new Date(),
      containerSizeM3: 8,
      containerNumber: `КТ-20${i}`,
      rentalDuration: '1 день',
      status: 'assigned',
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
  console.log('Successfully inserted 5 assigned orders.');
}

seedAssigned().catch((err) => {
  console.error('Seed execution error:', err);
  process.exit(1);
});
