import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { inferProcedureInput } from '@trpc/server';
import { createContext, ContextOptions } from '../context';
import { appRouter, type AppRouter } from '../routers/_app';
import { prisma } from '../../lib/prisma';

describe('Invoice Router', () => {
  let adminId: string;
  let customerId: string;

  beforeAll(async () => {
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });
    adminId = admin!.id;

    const customer = await prisma.customer.findFirst();
    customerId = customer!.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create an invoice', async () => {
    const ctx = await createContext({
      req: { headers: {} } as any,
      res: {} as any,
    } as ContextOptions);
    ctx.user = { id: adminId, role: 'ADMIN' } as any;

    const caller = appRouter.createCaller(ctx);

    type Input = inferProcedureInput<AppRouter['invoice']['create']>;
    const input: Input = {
      customerId,
      items: [
        { name: 'Test Product', quantity: 2, price: 100 },
      ],
    };

    const invoice = await caller.invoice.create(input);

    expect(invoice).toBeDefined();
    expect(invoice.amount).toBe(200);
    expect(invoice.status).toBe('PENDING');
  });

  it('should get customer invoices with history limit for manager', async () => {
    const manager = await prisma.user.findFirst({
      where: { role: 'MANAGER' },
    });

    const ctx = await createContext({
      req: { headers: {} } as any,
      res: {} as any,
    } as ContextOptions);
    ctx.user = { id: manager!.id, role: 'MANAGER', historyAccess: 30 } as any;

    const caller = appRouter.createCaller(ctx);

    const invoices = await caller.invoice.getCustomerInvoices({
      customerId,
    });

    expect(Array.isArray(invoices)).toBe(true);
    expect(invoices.length).toBeGreaterThan(0);
  });
});
