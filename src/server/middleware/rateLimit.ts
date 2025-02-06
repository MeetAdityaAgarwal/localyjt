import rateLimit from 'express-rate-limit';
import { TRPCError } from '@trpc/server';
import { middleware } from '../trpc';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const rateLimitMiddleware = middleware(async ({ ctx, next }) => {
  const ip = ctx.req.ip;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const max = 100; // max requests per window

  const current = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > current.resetTime) {
    current.count = 0;
    current.resetTime = now + windowMs;
  }

  if (current.count >= max) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests, please try again later',
    });
  }

  current.count++;
  rateLimitMap.set(ip, current);

  return next();
});
