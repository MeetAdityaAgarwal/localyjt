import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from '../lib/trpc';
import { createTrpcClient } from '../utils/trpc';
import { useAuth } from '../hooks/useAuth';

// Create a single instance of QueryClient
const queryClient = new QueryClient();

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth(); // Get the user's token from your auth context
  const [trpcClient, setTrpcClient] = useState(() => createTrpcClient(token));

  useEffect(() => {
    // Recreate the tRPC client whenever the token changes
    setTrpcClient(createTrpcClient(token));
  }, [token]);

  return (
    <trpc.Provider client= { trpcClient } queryClient = { queryClient } >
      <QueryClientProvider client={ queryClient }>
        { children }
        </QueryClientProvider>
        </trpc.Provider>
  );
}
