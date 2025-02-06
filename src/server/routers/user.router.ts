import { z } from 'zod';
import { router, adminProcedure, protectedProcedure } from '../trpc';
import { hashPassword } from '../../lib/auth';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['MANAGER', 'RIDER']),
  managerId: z.string().optional(),
});

const updateHistoryAccessSchema = z.object({
  managerId: z.string(),
  days: z.number().min(1).max(365),
});

export const userRouter = router({
  //TODO: PASSWORD RESET POWER TO ADMIN ONLY
  addUser: adminProcedure
    .input(createUserSchema)
    .mutation(async ({ ctx, input }) => {
      const hashedPassword = await hashPassword(input.password);

      return ctx.prisma.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          role: input.role,
          managerId: input.managerId,
        },
      });
    }),

  updateHistoryAccess: adminProcedure
    .input(updateHistoryAccessSchema)
    .mutation(({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: input.managerId },
        data: { historyAccess: input.days },
      });
    }),

  getRiders: protectedProcedure
    .query(({ ctx }) => {
      if (ctx.user.role === 'ADMIN') {
        return ctx.prisma.user.findMany({
          where: { role: 'RIDER' },
        });
      }

      return ctx.prisma.user.findMany({
        where: {
          role: 'RIDER',
          managerId: ctx.user.id,
        },
      });
    }),
});
