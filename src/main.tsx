import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from './lib/trpc';
import { createTrpcClient } from './utils/trpc';
import App from './App';
import './index.css';

const queryClient = new QueryClient();
const trpcClient = createTrpcClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* <trpc.Provider client={trpcClient} queryClient={queryClient}> */}
    {/* <QueryClientProvider client={queryClient}> */}
    <App />
    {/* </QueryClientProvider> */}
    {/* </trpc.Provider> */}
  </StrictMode>
);
