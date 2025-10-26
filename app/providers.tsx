'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { EnvironmentsProvider } from '@/contexts/EnvironmentsContext';

export function Providers({
  children,
  initialEnvironments,
}: {
  children: ReactNode;
  initialEnvironments?: string[];
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 2,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <EnvironmentsProvider initialEnvironments={initialEnvironments}>
        {children}
      </EnvironmentsProvider>
    </QueryClientProvider>
  );
}
