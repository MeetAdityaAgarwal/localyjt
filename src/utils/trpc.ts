import { httpBatchLink } from '@trpc/client';
import { trpc } from '../lib/trpc';

export function createTrpcClient(token?: string | null) {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: 'http://localhost:3001/api/trpc',
        headers: token ? {
          Authorization: `Bearer ${token}`,
        } : undefined,
      }),
    ],
  });
}
