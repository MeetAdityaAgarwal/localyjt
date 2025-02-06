import { describe, expect, it, beforeAll, afterAll } from 'vitest';
// import { inferProcedureInput } from '@trpc/server';
import { appRouter } from '../routers/_app';
import { prisma } from '../../lib/prisma';
import { CollectionStatus } from '@prisma/client';
import { createTestContext } from "../context";

describe('Collection Router', () => {
  let riderId: string;
  let managerId: string;
  let customerId: string;
  let collectionId: string;
  //
  // beforeAll(async () => {
  //   // Setup test users and data
  //   const manager = await prisma.user.create({
  //     data: {
  //       email: 'manager@test.com',
  //       role: UserRole.MANAGER,
  //       password: 'hashed-password', // Add a hashed password for testing
  //     },
  //   });
  //   managerId = manager.id;
  //
  //   const rider = await prisma.user.create({
  //     data: {
  //       email: 'rider@test.com',
  //       role: UserRole.RIDER,
  //       managerId: managerId,
  //       password: 'hashed-password', // Add a hashed password for testing
  //     },
  //   });
  //   riderId = rider.id;
  //
  //   const customer = await prisma.customer.create({
  //     data: {
  //       name: 'Test Customer',
  //       // Add other required fields
  //     },
  //   });
  //   customerId = customer.id;
  //
  //   const collection = await prisma.collection.create({
  //     data: {
  //       riderId: riderId,
  //       customerId: customerId,
  //       amount: 500,
  //       status: CollectionStatus.PENDING,
  //     },
  //   });
  //   collectionId = collection.id;
  // });
  //
  beforeAll(async () => {
    const manager = await prisma.user.findFirst({
      where: { role: 'MANAGER' },
    });
    managerId = manager!.id;

    const rider = await prisma.user.findFirst({
      where: { role: 'RIDER', managerId },
    });
    riderId = rider!.id;

    const customer = await prisma.customer.findFirst();
    customerId = customer!.id;

    const collection = await prisma.collection.findFirst({
      where: { status: "PENDING" }
    });
    collectionId = collection!.id;
  });



  afterAll(async () => {
    // await prisma.$transaction([
    //   prisma.collection.deleteMany(),
    //   prisma.customer.deleteMany(),
    //   prisma.user.deleteMany(),
    // ]);
    await prisma.$disconnect();
  });

  it('should get a collection', async () => {
    const ctx = await createTestContext(riderId);

    const caller = appRouter.createCaller(ctx);

    const collection = await caller.collection.getCollection();

    expect(collection).toBeDefined();
    expect(collection?.riderId).toBeDefined();
    // expect(collection).toMatchObject({
    //   riderId: riderId,
    //   // customerId: customerId,
    //   // amount: 500,
    //   // status: CollectionStatus.PENDING,
    // });
  });

  it('should get rider collections within date range', async () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');

    // Create test collections within and outside the date range
    await prisma.collection.createMany({
      data: [
        {
          riderId: riderId,
          customerId: customerId,
          amount: 200,
          status: CollectionStatus.PENDING,
          createdAt: new Date('2024-02-15'),
        },
        {
          riderId: riderId,
          customerId: customerId,
          amount: 300,
          status: CollectionStatus.APPROVED,
          createdAt: new Date('2023-12-31'), // Outside range
        },
      ],
    });

    const ctx = await createTestContext(riderId);
    const caller = appRouter.createCaller(ctx);

    const collections = await caller.collection.getMyCollections({
      startDate,
      endDate,
    });

    await prisma.collection.deleteMany({
      where:
      {
        riderId: riderId,
        customerId: customerId,
        amount: 200,
        status: CollectionStatus.PENDING,
        createdAt: new Date('2024-02-15'),
      }
    });
    await prisma.collection.deleteMany({
      where: {
        riderId: riderId,
        customerId: customerId,
        amount: 300,
        status: CollectionStatus.APPROVED,
        createdAt: new Date('2023-12-31'), // Outside range
      }
    })

    expect(collections).toHaveLength(1);
    expect(collections[0].amount).toBe(200);
    expect(collections[0].customer).toBeDefined();
    expect(collections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          createdAt: expect.any(Date),
        }),
      ])
    );
  });
  it('manager should get pending collections for their riders', async () => {

    const ctx = await createTestContext(managerId);
    const caller = appRouter.createCaller(ctx);

    const pendingCollections = await caller.collection.getPending();

    // Verify there are pending collections
    expect(pendingCollections.length).toBeGreaterThan(0);

    // Check each collection's status and rider's manager
    pendingCollections.forEach(collection => {
      expect(collection.status).toBe(CollectionStatus.PENDING);
      expect(collection.rider.managerId).toBe(managerId);
    });
  });
  // it('manager should get pending collections for their riders', async () => {
  //   const ctx = await createTestContext(managerId);
  //
  //   const caller = appRouter.createCaller(ctx);
  //
  //   const pendingCollections = await caller.collection.getPending();
  //
  //   expect(pendingCollections).toHaveProperty(pendingCollections[0].id);
  //   expect(pendingCollections[0]).toMatchObject({
  //     id: collectionId,
  //     status: CollectionStatus.PENDING,
  //     rider: expect.objectContaining({ id: riderId }),
  //     customer: expect.objectContaining({ id: customerId }),
  //   });
  // });
  //
  it('non-manager should get empty array from getPending', async () => {
    const ctx = await createTestContext(riderId);

    const caller = appRouter.createCaller(ctx);

    const pendingCollections = await caller.collection.getPending();

    expect(pendingCollections).toEqual([]);
  });
});
