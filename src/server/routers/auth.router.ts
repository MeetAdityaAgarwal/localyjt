import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { verifyPassword, generateToken, hashPassword } from '../../lib/auth';
import { encrypt, decrypt } from '../../lib/encryption';
import { addHours } from 'date-fns';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
});

const updatePasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
});

export const authRouter = router({
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      const isValid = await verifyPassword(input.password, user.password);

      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid password',
        });
      }

      const token = generateToken(user.id);

      // Remove sensitive data
      const { password: _, ...userWithoutPassword } = user;

      // Log the login attempt
      await ctx.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          details: `User logged in from ${ctx.req.ip}`,
        },
      });

      return {
        user: userWithoutPassword,
        token,
      };
    }),

  resetPassword: publicProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        // Return success even if user doesn't exist to prevent email enumeration
        return { success: true };
      }

      // Generate a reset token that expires in 1 hour
      const resetToken = encrypt(JSON.stringify({
        userId: user.id,
        expires: addHours(new Date(), 1).toISOString(),
      }));

      // In a real application, you would send this token via email
      // For demo purposes, we'll just return it
      return {
        success: true,
        resetToken,
      };
    }),
  validateToken: protectedProcedure
    .query(({ ctx }) => {
      return ctx.user;
    }),

  updatePassword: publicProcedure
    .input(updatePasswordSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const decrypted = JSON.parse(decrypt(input.token));

        if (new Date(decrypted.expires) < new Date()) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Reset token has expired',
          });
        }

        const hashedPassword = await hashPassword(input.newPassword);

        await ctx.prisma.user.update({
          where: { id: decrypted.userId },
          data: { password: hashedPassword },
        });

        await ctx.prisma.auditLog.create({
          data: {
            userId: decrypted.userId,
            action: 'PASSWORD_RESET',
            details: 'Password was reset successfully',
          },
        });

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid reset token',
        });
      }
    }),
});
