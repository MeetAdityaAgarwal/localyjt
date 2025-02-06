import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { addDays } from 'date-fns';

const createInvoiceSchema = z.object({
  customerId: z.string(),
  items: z.array(z.object({
    name: z.string(),
    quantity: z.number().positive(),
    price: z.number().positive(),
  })),
});

export const invoiceRouter = router({
  //TODO: Add mode of transposrt
  create: protectedProcedure
    .input(createInvoiceSchema)
    .mutation(async ({ ctx, input }) => {
      const totalAmount = input.items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      );

      return ctx.prisma.$transaction(async (tx) => {
        const dueDate = addDays(new Date(), Math.floor(Math.random() * 30));
        const invoice = await tx.invoice.create({
          data: {
            customerId: input.customerId,
            amount: totalAmount,
            status: 'PENDING',
            items: {
              create: input.items,
            },
            dueDate,
          },
          include: {
            items: true,
          },
        });

        await tx.customer.update({
          where: { id: input.customerId },
          data: {
            balance: { increment: totalAmount },
          },
        });

        await tx.auditLog.create({
          data: {
            userId: ctx.user.id,
            action: 'CREATE_INVOICE',
            details: `Created invoice for customer ${input.customerId} with amount ${totalAmount}`,
          },
        });

        return invoice;
      });
    }),

  getCustomerInvoices: protectedProcedure
    .input(z.object({
      customerId: z.string(),
      days: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const daysFilter = input.days ?? (
        ctx.user.role === 'MANAGER'
          ? ctx.user.historyAccess
          : undefined
      );

      return ctx.prisma.invoice.findMany({
        where: {
          customerId: input.customerId,
          ...(daysFilter && {
            createdAt: {
              gte: new Date(Date.now() - daysFilter * 24 * 60 * 60 * 1000),
            },
          }),
        },
        include: {
          items: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }),
});
