import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { createContext, ContextOptions } from '../context';
import { appRouter } from '../routers/_app';
import { prisma } from '../../lib/prisma';

describe('Analytics Router', () => {
  let adminId: string;
  let managerId: string;
  let riderId: string;
  let customerId: string;

  beforeAll(async () => {
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });
    adminId = admin!.id;

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
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Customer Analytics', () => {
    it('should get customer risk analysis', async () => {
      const ctx = await createContext({
        req: { headers: {} } as any,
        res: {} as any,
      } as ContextOptions);
      ctx.user = { id: adminId, role: 'ADMIN' } as any;
      // trpc.createCallerFactory(router)
      const caller = appRouter.createCaller(ctx);

      const result = await caller.analytics.getCustomerAnalytics({
        startDate: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      });

      expect(result.customers).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.totalCustomers).toBeGreaterThan(0);
      expect(result.summary.highRiskCustomers).toBeDefined();
      expect(result.customers[0]).toHaveProperty('riskLevel');
      expect(result.customers[0]).toHaveProperty('creditScore');
    });
  });

  describe('Cashflow Analytics', () => {
    it('should get cashflow analysis', async () => {
      const ctx = await createContext({
        req: { headers: {} } as any,
        res: {} as any,
      } as ContextOptions);
      ctx.user = { id: adminId, role: 'ADMIN' } as any;

      const caller = appRouter.createCaller(ctx);

      const result = await caller.analytics.getCashflowAnalytics({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      });

      expect(result.totalCollected).toBeDefined();
      expect(result.totalTransferred).toBeDefined();
      expect(result.dailyCashflow).toBeDefined();
      expect(result.averageCollectionCycle).toBeDefined();
      expect(result.balances).toHaveProperty('withRiders');
      expect(result.balances).toHaveProperty('withManagers');
    });
  });

  describe('Rider Performance', () => {
    it('should get rider performance metrics', async () => {
      const ctx = await createContext({
        req: { headers: {} } as any,
        res: {} as any,
      } as ContextOptions);
      ctx.user = { id: managerId, role: 'MANAGER' } as any;

      const caller = appRouter.createCaller(ctx);

      const result = await caller.analytics.getRiderPerformance({
        riderId,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      });

      expect(result.totalCollections).toBeDefined();
      expect(result.totalCollected).toBeDefined();
      expect(result.approvalRate).toBeDefined();
      expect(result.dailyCollections).toBeDefined();
      expect(result.averageDaily).toBeDefined();
    });
  });
});
