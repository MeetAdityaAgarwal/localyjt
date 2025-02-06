import { router } from '../trpc';
import { userRouter } from './user.router';
import { invoiceRouter } from './invoice.router';
import { collectionRouter } from './collection.router';
import { transferRouter } from './transfer.router';
import { analyticsRouter } from './analytics.router';
import { authRouter } from './auth.router';
import { customerRouter } from './customer.router';
// import { rateLimitMiddleware } from '../middleware/rateLimit';

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  invoice: invoiceRouter,
  collection: collectionRouter,
  transfer: transferRouter,
  analytics: analyticsRouter,
  customer: customerRouter,
});

export type AppRouter = typeof appRouter;
