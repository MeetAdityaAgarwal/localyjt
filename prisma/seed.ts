import { hashPassword } from '../src/lib/auth';
import { addDays, subDays } from 'date-fns';
import { prisma } from "../src/lib/prisma";

// const prisma = new PrismaClient();

export async function main() {
  // Create admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: await hashPassword('admin123'),
      role: 'ADMIN',
    },
  });

  // Create managers
  const managers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'manager1@example.com',
        password: await hashPassword('manager123'),
        role: 'MANAGER',
        historyAccess: 30,
      },
    }),
    prisma.user.create({
      data: {
        email: 'manager2@example.com',
        password: await hashPassword('manager123'),
        role: 'MANAGER',
        historyAccess: 15,
      },
    }),
  ]);

  // Create riders
  const riders = await Promise.all([
    prisma.user.create({
      data: {
        email: 'rider1@example.com',
        password: await hashPassword('rider123'),
        role: 'RIDER',
        managerId: managers[0].id,
        collectionAccess: 7,
      },
    }),
    prisma.user.create({
      data: {
        email: 'rider2@example.com',
        password: await hashPassword('rider123'),
        role: 'RIDER',
        managerId: managers[0].id,
        collectionAccess: 3,
      },
    }),
    prisma.user.create({
      data: {
        email: 'rider3@example.com',
        password: await hashPassword('rider123'),
        role: 'RIDER',
        managerId: managers[1].id,
        collectionAccess: 5,
      },
    }),
  ]);

  // Create customers with varying risk levels
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'Store A',
        balance: 5000,
        creditScore: 90,
        riskLevel: 'LOW',
        lastPayment: subDays(new Date(), 5),
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Store B',
        balance: 12000,
        creditScore: 60,
        riskLevel: 'MEDIUM',
        lastPayment: subDays(new Date(), 15),
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Store C',
        balance: 25000,
        creditScore: 30,
        riskLevel: 'HIGH',
        lastPayment: subDays(new Date(), 45),
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Store D',
        balance: 50000,
        creditScore: 10,
        riskLevel: 'CRITICAL',
        lastPayment: subDays(new Date(), 90),
      },
    }),
  ]);

  // Create invoices with different statuses
  for (const customer of customers) {
    const numInvoices = Math.floor(Math.random() * 5) + 3;
    for (let i = 0; i < numInvoices; i++) {
      const dueDate = addDays(new Date(), Math.floor(Math.random() * 30));
      const status = Math.random() > 0.7 ? 'OVERDUE' : 'PENDING';

      await prisma.invoice.create({
        data: {
          customerId: customer.id,
          amount: Math.floor(Math.random() * 5000) + 1000,
          status,
          dueDate,
          items: {
            create: [
              {
                name: `Product ${Math.floor(Math.random() * 5) + 1}`,
                quantity: Math.floor(Math.random() * 10) + 1,
                price: Math.floor(Math.random() * 200) + 100,
              },
            ],
          },
        },
      });
    }
  }

  // Create collections with different statuses
  for (const rider of riders) {
    const numCollections = Math.floor(Math.random() * 10) + 5;
    for (let i = 0; i < numCollections; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const status = Math.random() > 0.3 ? 'APPROVED' : 'PENDING';

      await prisma.collection.create({
        data: {
          riderId: rider.id,
          customerId: customer.id,
          amount: Math.floor(Math.random() * 2000) + 500,
          status,
        },
      });
    }
  }

  // Create transfers
  for (const manager of managers) {
    const numTransfers = Math.floor(Math.random() * 5) + 2;
    for (let i = 0; i < numTransfers; i++) {
      const status = Math.random() > 0.3 ? 'APPROVED' : 'PENDING';

      await prisma.transfer.create({
        data: {
          fromUserId: manager.id,
          amount: Math.floor(Math.random() * 10000) + 5000,
          status,
        },
      });
    }
  }

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
