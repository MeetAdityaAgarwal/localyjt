import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { inferProcedureInput } from '@trpc/server';
import { createContext, ContextOptions } from '../context';
import { appRouter, type AppRouter } from '../routers/_app';
import { prisma } from '../../lib/prisma';

describe('Collection Router', () => {
  let riderId: string;
  let managerId: string;
  let customerId: string;
  let collectionId: string;
  let collectionIdToReject: string;

  beforeAll(async () => {
    const rider = await prisma.user.findFirst({
      where: { role: 'RIDER' },
    });
    riderId = rider!.id;

    const manager = await prisma.user.findFirst({
      where: { role: 'MANAGER' },
    });
    managerId = manager!.id;

    const customer = await prisma.customer.findFirst();
    customerId = customer!.id;

    const collection = await prisma.collection.findFirst({
      where: { status: "PENDING" }
    });
    collectionId = collection!.id;

    const collectionToReject = await prisma.collection.findMany({
      where: { status: "PENDING" }
    });
    collectionIdToReject = collectionToReject[1]!.id;

  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should submit a collection', async () => {
    const ctx = await createContext({
      req: { headers: {} } as any,
      res: {} as any,
    } as ContextOptions);
    ctx.user = { id: riderId, role: 'RIDER' } as any;

    const caller = appRouter.createCaller(ctx);

    type Input = inferProcedureInput<AppRouter['collection']['submit']>;
    const input: Input = {
      customerId,
      amount: 500,
    };

    const collection = await caller.collection.submit(input);
    collectionId = collection.id;

    expect(collection).toBeDefined();
    expect(collection.status).toBe('PENDING');
    expect(collection.amount).toBe(500);
  });

  it('should approve a collection', async () => {
    const ctx = await createContext({
      req: { headers: {} } as any,
      res: {} as any,
    } as ContextOptions);
    ctx.user = { id: managerId, role: 'MANAGER' } as any;

    const caller = appRouter.createCaller(ctx);

    type Input = inferProcedureInput<AppRouter['collection']['approve']>;
    const input: Input = {
      collectionId,
    };



    const collectionfetched = await caller.collection.approve(input);

    expect(collectionfetched).toBeDefined();
    expect(collectionfetched?.status).toBe('APPROVED');
  });
  it('should reject a collection', async () => {
    const ctx = await createContext({
      req: { headers: {} } as any,
      res: {} as any,
    } as ContextOptions);
    ctx.user = { id: managerId, role: 'MANAGER' } as any;

    const caller = appRouter.createCaller(ctx);

    type Input = inferProcedureInput<AppRouter['collection']['reject']>;
    const input: Input = {
      collectionId: collectionIdToReject,
    };



    const collectionfetched = await caller.collection.reject(input);

    expect(collectionfetched).toBeDefined();
    expect(collectionfetched?.status).toBe('REJECTED');
  });

});
