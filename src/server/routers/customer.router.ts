import { router, protectedProcedure } from '../trpc';

export const customerRouter = router({
  getCustomer: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.customer.findMany();
  }),
  getAssigned: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== 'RIDER') {
        return [];
      }

      return ctx.prisma.customer.findMany({
        where: {
          collections: {
            some: {
              riderId: ctx.user.id,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
    }),
});
