import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../server/routers/_app';

// Create React Query hooks
export const trpc = createTRPCReact<AppRouter>();