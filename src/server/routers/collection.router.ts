import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import type { Context } from '../context';
import { differenceInDays } from 'date-fns';

type PrismaTx = Omit<Context['prisma'], "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export async function updateCustomerRisk({ tx, customerId }: { tx: PrismaTx; customerId: string }) {
  try {
    const customer = await tx.customer.findUnique({
      where: { id: customerId },
      include: { invoices: true, collections: true },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const overdueInvoicesCount = customer.invoices.filter(inv => inv.status === 'OVERDUE').length;
    const moneyReceived = customer.collections
      .filter(col => col.status === 'PENDING' || col.status === 'APPROVED')
      .reduce((sum, col) => sum + col.amount, 0);
    const daysSinceLastPayment = customer.lastPayment ? differenceInDays(new Date(), customer.lastPayment) : 9999;
    const rejectedCount = customer.collections.filter(col => col.status === 'REJECTED' || col.status === 'REFUSED').length;

    let riskScore = (100 - customer.creditScore) + (overdueInvoicesCount * 20) + Math.floor(daysSinceLastPayment / 10) + (rejectedCount * 15);
    riskScore -= Math.floor(moneyReceived / 10);
    if (riskScore < 0) riskScore = 0;

    let newRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (riskScore < 30) newRiskLevel = 'LOW';
    else if (riskScore < 60) newRiskLevel = 'MEDIUM';
    else if (riskScore < 90) newRiskLevel = 'HIGH';
    else newRiskLevel = 'CRITICAL';

    await tx.customer.update({
      where: { id: customerId },
      data: { riskLevel: newRiskLevel },
    });

    await tx.customerRiskHistory.create({
      data: { customerId, riskLevel: newRiskLevel, riskScore },
    });

    return { riskLevel: newRiskLevel, riskScore };
  } catch (error) {
    console.error('Error in updateCustomerRisk:', error);
    throw error;
  }
}

const approveCollectionSchema = z.object({ collectionId: z.string() });
const rejectCollectionSchema = z.object({ collectionId: z.string() });

export const collectionRouter = router({
  submit: protectedProcedure
    .input(z.object({ customerId: z.string(), amount: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      try {
        if (ctx.user.role !== 'RIDER') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only riders can submit collections' });
        }

        return ctx.prisma.$transaction(async (tx) => {
          const collection = await tx.collection.create({
            data: { riderId: ctx.user.id, customerId: input.customerId, amount: input.amount, status: 'PENDING' },
          });

          await tx.user.update({ where: { id: ctx.user.id }, data: { balance: { increment: input.amount } } });
          await tx.auditLog.create({ data: { userId: ctx.user.id, action: 'SUBMIT_COLLECTION', details: `Submitted collection of ${input.amount} from customer ${input.customerId}` } });
          await updateCustomerRisk({ tx, customerId: input.customerId });

          return collection;
        });
      } catch (error) {
        console.error('Error in submit mutation:', error);
        throw error;
      }
    }),

  getCollection: protectedProcedure.query(async ({ ctx }) => {
    try {
      return ctx.prisma.collection.findMany({
        where: { riderId: ctx.user.id }, include: {
          customer: {
            select: {
              name: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error in getCollection query:', error);
      throw error;
    }
  }),

  approve: protectedProcedure.input(approveCollectionSchema).mutation(async ({ ctx, input }) => {
    try {
      return ctx.prisma.$transaction(async (tx) => {
        const collection = await tx.collection.findUnique({ where: { id: input.collectionId } });
        if (!collection || collection.status !== 'PENDING') {
          throw new TRPCError({ code: collection ? 'BAD_REQUEST' : 'NOT_FOUND', message: collection ? 'Collection is not pending' : 'Collection not found' });
        }

        await tx.collection.update({ where: { id: collection.id }, data: { status: 'APPROVED' } });
        await tx.auditLog.create({ data: { userId: ctx.user.id, action: 'APPROVE_TRANSFER', details: `Approved collection ${input.collectionId} of ${collection.amount}` } });
        return tx.collection.findUnique({ where: { id: input.collectionId } });
      });
    } catch (error) {
      console.error('Error in approve mutation:', error);
      throw error;
    }
  }),

  reject: protectedProcedure.input(rejectCollectionSchema).mutation(async ({ ctx, input }) => {
    try {
      return ctx.prisma.$transaction(async (tx) => {
        const collection = await tx.collection.findUnique({ where: { id: input.collectionId } });
        if (!collection || collection.status !== 'PENDING') {
          throw new TRPCError({ code: collection ? 'BAD_REQUEST' : 'NOT_FOUND', message: collection ? 'Collection is not pending' : 'Collection not found' });
        }

        await tx.collection.update({ where: { id: collection.id }, data: { status: 'REJECTED' } });
        await tx.auditLog.create({ data: { userId: ctx.user.id, action: 'REJECTED_TRANSFER', details: `Rejected collection ${input.collectionId} of ${collection.amount}` } });
        return tx.collection.findUnique({ where: { id: input.collectionId } });
      });
    } catch (error) {
      console.error('Error in reject mutation:', error);
      throw error;
    }
  }),
});



// import { z } from 'zod';
// import { TRPCError } from '@trpc/server';
// import { router, protectedProcedure } from '../trpc';
//
// import type { Context } from '../context';
// import { differenceInDays } from 'date-fns';
//
// type PrismaTx = Omit<Context['prisma'], "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;
//
// export async function updateCustomerRisk({
//   tx,
//   customerId
// }: {
//   tx: PrismaTx;
//   customerId: string;
// }) {
//   // Fetch the customer along with invoices and collections.
//   const customer = await tx.customer.findUnique({
//     where: { id: customerId },
//     include: {
//       invoices: true,
//       collections: true,
//     },
//   });
//
//   if (!customer) {
//     throw new Error('Customer not found');
//   }
//
//   // Calculate aggregates.
//   const overdueInvoicesCount = customer.invoices.filter(
//     (inv) => inv.status === 'OVERDUE'
//   ).length;
//
//   // Consider both PENDING and APPROVED as money received
//   const moneyReceived = customer.collections
//     .filter((col) => col.status === 'PENDING' || col.status === 'APPROVED')
//     .reduce((sum, col) => sum + col.amount, 0);
//
//   // If no payment has ever been made, assign a high value; else, calculate days.
//   const daysSinceLastPayment = customer.lastPayment
//     ? differenceInDays(new Date(), customer.lastPayment)
//     : 9999;
//
//   // Also count rejected/refused collections if needed.
//   const rejectedCount = customer.collections.filter(
//     (col) => col.status === 'REJECTED' || col.status === 'REFUSED'
//   ).length;
//
//   // A sample risk calculation.
//   // (You may wish to adjust the factors and weights)
//   let riskScore =
//     (100 - customer.creditScore) + // Lower credit score = higher risk
//     overdueInvoicesCount * 20 + // each overdue invoice adds risk
//     Math.floor(daysSinceLastPayment / 10) + // longer gap adds risk
//     rejectedCount * 15;
//
//   // Subtract a factor for money already collected.
//   // Here, every $10 collected reduces risk by 1 point.
//   riskScore = riskScore - Math.floor(moneyReceived / 10);
//
//   // Constrain the risk score to be at least 0.
//   if (riskScore < 0) riskScore = 0;
//
//   // Map risk score to a risk level.
//   let newRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
//   if (riskScore < 30) {
//     newRiskLevel = 'LOW';
//   } else if (riskScore < 60) {
//     newRiskLevel = 'MEDIUM';
//   } else if (riskScore < 90) {
//     newRiskLevel = 'HIGH';
//   } else {
//     newRiskLevel = 'CRITICAL';
//   }
//
//   // Update the customer's risk level and (optionally) risk score.
//   await tx.customer.update({
//     where: { id: customerId },
//     data: {
//       riskLevel: newRiskLevel,
//       // Optionally store riskScore in customer if you added that field.
//       // riskScore: riskScore,
//     },
//   });
//
//   // Record the risk history so you can track it over time.
//   await tx.customerRiskHistory.create({
//     data: {
//       customerId: customerId,
//       riskLevel: newRiskLevel,
//       riskScore: riskScore,
//     },
//   });
//
//   return { riskLevel: newRiskLevel, riskScore };
// }
// const approveCollectionSchema = z.object({
//   collectionId: z.string(),
// });
// const rejectCollectionSchema = z.object({
//   collectionId: z.string(),
// });
//
//
// export const collectionRouter = router({
//   submit: protectedProcedure
//     .input(z.object({
//       customerId: z.string(),
//       amount: z.number().positive(),
//     }))
//     .mutation(async ({ ctx, input }) => {
//       if (ctx.user.role !== 'RIDER') {
//         throw new TRPCError({
//           code: 'FORBIDDEN',
//           message: 'Only riders can submit collections',
//         });
//       }
//
//       return ctx.prisma.$transaction(async (tx) => {
//         const collection = await tx.collection.create({
//           data: {
//             riderId: ctx.user.id,
//             customerId: input.customerId,
//             amount: input.amount,
//             status: 'PENDING',
//           },
//         });
//
//         await tx.user.update({
//           where: { id: ctx.user.id },
//           data: {
//             balance: { increment: input.amount },
//           },
//         });
//
//         await tx.auditLog.create({
//           data: {
//             userId: ctx.user.id,
//             action: 'SUBMIT_COLLECTION',
//             details: `Submitted collection of ${input.amount} from customer ${input.customerId}`,
//           },
//         });
//         // Update risk immediately.
//         await updateCustomerRisk({ tx, customerId: input.customerId });
//
//         return collection;
//       });
//     }),
//   getCollection: protectedProcedure.query(async ({ ctx }) => {
//     console.log("THIS IS WHAT I GOT:", ctx.user)
//     return ctx.prisma.collection.findMany({
//       where: { riderId: ctx.user.id, }
//     });
//   }),
//
//
//   getMyCollections: protectedProcedure
//     .input(z.object({
//       startDate: z.string().transform((val) => new Date(val)), // Convert string to Date
//       endDate: z.string().transform((val) => new Date(val)),   // Convert string to Date    
//     }))
//     .query(async ({ ctx, input }) => {
//       return ctx.prisma.collection.findMany({
//         where: {
//           riderId: ctx.user.id,
//           createdAt: {
//             gte: input.startDate,
//             lte: input.endDate,
//           },
//         },
//         include: {
//           customer: true,
//         },
//         orderBy: {
//           createdAt: 'desc',
//         },
//       });
//     }),
//
//   approve: protectedProcedure
//     .input(approveCollectionSchema)
//     .mutation(async ({ ctx, input }) => {
//       return ctx.prisma.$transaction(async (tx) => {
//         const collection = await tx.collection.findUnique({
//           where: { id: input.collectionId },
//         });
//
//         if (!collection) {
//           throw new TRPCError({
//             code: 'NOT_FOUND',
//             message: 'Collection not found',
//           });
//         }
//
//         if (collection.status !== 'PENDING') {
//           throw new TRPCError({
//             code: 'BAD_REQUEST',
//             message: 'Collection is not pending',
//           });
//         }
//
//         await tx.collection.update({
//           where: { id: collection.id },
//           data: { status: 'APPROVED' },
//         });
//
//         await tx.user.update({
//           where: { id: collection.riderId },
//           data: {
//             balance: { decrement: collection.amount },
//           },
//         });
//
//         await tx.user.update({
//           where: { id: ctx.user.id },
//           data: {
//             balance: { increment: collection.amount },
//           },
//         });
//
//         await tx.auditLog.create({
//           data: {
//             userId: ctx.user.id,
//             action: 'APPROVE_TRANSFER',
//             details: `Approved collection ${input.collectionId} of ${collection.amount}`,
//           },
//         });
//
//         const updatedCollection = await tx.collection.findUnique({
//           where: { id: input.collectionId },
//         });
//
//         return updatedCollection;
//       });
//     }),
//
//   reject: protectedProcedure
//     .input(rejectCollectionSchema)
//     .mutation(async ({ ctx, input }) => {
//       return ctx.prisma.$transaction(async (tx) => {
//         const collection = await tx.collection.findUnique({
//           where: { id: input.collectionId },
//         });
//
//         if (!collection) {
//           throw new TRPCError({
//             code: 'NOT_FOUND',
//             message: 'Collection not found',
//           });
//         }
//
//         if (collection.status !== 'PENDING') {
//           throw new TRPCError({
//             code: 'BAD_REQUEST',
//             message: 'Collection is not pending',
//           });
//         }
//
//         await tx.collection.update({
//           where: { id: collection.id },
//           data: { status: 'REJECTED' },
//         });
//
//
//         await tx.auditLog.create({
//           data: {
//             userId: ctx.user.id,
//             action: 'REJECTED_TRANSFER',
//             details: `rejected collection ${input.collectionId} of ${collection.amount}`,
//           },
//         });
//
//         const updatedCollection = await tx.collection.findUnique({
//           where: { id: input.collectionId },
//         });
//
//         return updatedCollection;
//       });
//     }),
//
//
//
//
//   getPending: protectedProcedure
//     .query(async ({ ctx }) => {
//       if (ctx.user.role !== 'MANAGER') {
//         return [];
//       }
//
//       return ctx.prisma.collection.findMany({
//         where: {
//           status: 'PENDING',
//           rider: {
//             managerId: ctx.user.id,
//           },
//         },
//         include: {
//           rider: true,
//           customer: true,
//         },
//         orderBy: {
//           createdAt: 'desc',
//         },
//       });
//     }),
// });
