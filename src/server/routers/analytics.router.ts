import { z } from 'zod';
import { router, adminProcedure, protectedProcedure } from '../trpc';
import { differenceInDays } from 'date-fns';

export const analyticsRouter = router({
  getRiderPerformance: protectedProcedure
    .input(z.object({
      riderId: z.string(),
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role === 'MANAGER') {
        const rider = await ctx.prisma.user.findUnique({
          where: { id: input.riderId },
        });
        // if (!rider) {
        //   throw new Error("No Rider");
        // }
        if (rider?.managerId !== ctx.user.id) {
          throw new Error('Unauthorized');
        }
      }

      const collections = await ctx.prisma.collection.findMany({
        where: {
          riderId: input.riderId,
          createdAt: {
            gte: input.startDate,
            lte: input.endDate,
          },
        },
      });

      const dailyCollections = collections.reduce((acc, collection) => {
        const date = collection.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + collection.amount;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalCollections: collections.length,
        totalCollected: collections.reduce((sum, c) => sum + c.amount, 0),
        approvedCollections: collections.filter(c => c.status === 'APPROVED').length,
        approvalRate: collections.length > 0
          ? collections.filter(c => c.status === 'APPROVED').length / collections.length
          : 0,
        dailyCollections,
        averageDaily: Object.values(dailyCollections).reduce((a, b) => a + b, 0) /
          Object.keys(dailyCollections).length || 0,
      };
    }),

  getCustomerAnalytics: adminProcedure
    // .input(z.object({
    //   startDate: z.instanceof(Date),
    //   endDate: z.instanceof(Date),
    // }))
    .query(async ({ ctx, input }) => {
      console.log('Received input:', input);
      // console.log('Start date:', input.startDate instanceof Date, input.startDate);
      // console.log('End date:', input.endDate instanceof Date, input.endDate);
      //
      console.log("GOT CTX: ", ctx.user.email)
      const customers = await ctx.prisma.customer.findMany({
        include: {
          invoices: {

          },
          collections: {

          },
        },
      });
      //TODO: PROOF OF RIDER COLLECTION VIA PHOTO UPLOAD
      //TODO new customer by manager to be approved by admin
      const customerAnalytics = customers.map(customer => {
        const totalInvoiced = customer.invoices.reduce((sum, inv) => sum + inv.amount, 0);
        const totalCollected = customer.collections
          .filter(c => c.status === 'APPROVED')
          .reduce((sum, c) => sum + c.amount, 0);

        const daysSinceLastPayment = customer.lastPayment
          ? differenceInDays(new Date(), customer.lastPayment)
          : null;

        const overdueInvoices = customer.invoices.filter(inv =>
          inv.status === 'OVERDUE'
        ).length;

        return {
          id: customer.id,
          name: customer.name,
          balance: customer.balance,
          totalInvoiced,
          totalCollected,
          paymentRate: totalInvoiced > 0 ? totalCollected / totalInvoiced : 0,
          creditScore: customer.creditScore,
          riskLevel: customer.riskLevel,
          daysSinceLastPayment,
          overdueInvoices,
        };
      });

      // Sort by risk level and balance
      customerAnalytics.sort((a, b) => {
        const riskOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        if (a.riskLevel !== b.riskLevel) {
          return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
        }
        return b.balance - a.balance;
      });

      return {
        customers: customerAnalytics,
        summary: {
          totalCustomers: customers.length,
          totalOutstanding: customers.reduce((sum, c) => sum + c.balance, 0),
          highRiskCustomers: customers.filter(c =>
            c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL'
          ).length,
          averageCreditScore: customers.reduce((sum, c) => sum + c.creditScore, 0) /
            customers.length || 0,
        },
      };
    }),

  getCashflowAnalytics: adminProcedure
    // .input(z.object({
    //   startDate: z.date(),
    //   endDate: z.date(),
    // }))
    .query(async ({ ctx }) => {
      const [collections, transfers, invoices] = await Promise.all([
        ctx.prisma.collection.findMany({
          where: {
            createdAt: {
              // gte: input.startDate,
              // lte: input.endDate,
            },
            status: 'APPROVED',
          },
          include: {
            rider: true,
          },
        }),
        ctx.prisma.transfer.findMany({
          where: {
            createdAt: {
              // gte: input.startDate,
              // lte: input.endDate,
            },
            status: 'APPROVED',
          },
        }),
        ctx.prisma.invoice.findMany({
          where: {
            createdAt: {
              // gte: input.startDate,
              // lte: input.endDate,
            },
          },
        }),
      ]);

      // Daily cashflow analysis
      const dailyCashflow = collections.reduce((acc, col) => {
        const date = col.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + col.amount;
        return acc;
      }, {} as Record<string, number>);

      // Calculate average collection cycle
      const collectionCycles = collections.map(col => {
        const invoice = invoices.find(inv =>
          inv.customerId === col.customerId &&
          inv.createdAt < col.createdAt
        );
        return invoice
          ? differenceInDays(col.createdAt, invoice.createdAt)
          : 0;
      }).filter(days => days > 0);

      const averageCollectionCycle = collectionCycles.length > 0
        ? collectionCycles.reduce((a, b) => a + b, 0) / collectionCycles.length
        : 0;

      return {
        totalCollected: collections.reduce((sum, c) => sum + c.amount, 0),
        totalTransferred: transfers.reduce((sum, t) => sum + t.amount, 0),
        totalInvoiced: invoices.reduce((sum, i) => sum + i.amount, 0),
        dailyCashflow,
        averageDaily: Object.values(dailyCashflow).reduce((a, b) => a + b, 0) /
          Object.keys(dailyCashflow).length || 0,
        averageCollectionCycle,
        balances: {
          withRiders: collections.reduce((sum, c) =>
            sum + (c.rider.role === 'RIDER' ? c.amount : 0), 0),
          withManagers: collections.reduce((sum, c) =>
            sum + (c.rider.role === 'MANAGER' ? c.amount : 0), 0),
        },
      };
    }),
});
