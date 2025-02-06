import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, adminProcedure } from '../trpc';

const requestTransferSchema = z.object({
  amount: z.number().positive(),
});

const approveTransferSchema = z.object({
  transferId: z.string(),
});

export const transferRouter = router({
  request: protectedProcedure
    .input(requestTransferSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'MANAGER') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only managers can request transfers',
        });
      }

      if (ctx.user.balance < input.amount) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Insufficient balance',
        });
      }

      return ctx.prisma.transfer.create({
        data: {
          fromUserId: ctx.user.id,
          amount: input.amount,
          status: 'PENDING',
        },
      });
    }),
  //TODO:: add super manager, office collection and submanager(without payment collection only add invoice).
  //create inactive customers.
  //create detete options for all the customers
  approve: adminProcedure
    .input(approveTransferSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (tx) => {
        const transfer = await tx.transfer.findUnique({
          where: { id: input.transferId },
          include: { fromUser: true },
        });

        if (!transfer) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Transfer not found',
          });
        }

        if (transfer.status !== 'PENDING') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Transfer is not pending',
          });
        }

        await tx.transfer.update({
          where: { id: input.transferId },
          data: { status: 'APPROVED' },
        });

        await tx.user.update({
          where: { id: transfer.fromUserId },
          data: {
            balance: { decrement: transfer.amount },
          },
        });

        await tx.user.update({
          where: { id: ctx.user.id },
          data: {
            balance: { increment: transfer.amount },
          },
        });

        await tx.auditLog.create({
          data: {
            userId: ctx.user.id,
            action: 'APPROVE_TRANSFER',
            details: `Approved transfer ${input.transferId} of ${transfer.amount}`,
          },
        });

        return transfer;
      });
    }),
});
