'use client';
import { Suspense, useState } from 'react';
import { ConfirmProvider, ToastProvider, BackgroundCalculationToast, PwaRegister } from '@/components/common';
import { SessionTimeoutGuard } from '@/components/modules/login/SessionTimeoutGuard';
import { LoginSuccessFlash } from '@/components/modules/login/LoginSuccessFlash';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ConfirmProvider>
          <PwaRegister />
          <SessionTimeoutGuard />
          <Suspense fallback={null}>
            <LoginSuccessFlash />
          </Suspense>
          <Toaster position="top-right" richColors closeButton style={{ marginTop: '70px' }} />
          <BackgroundCalculationToast />
          {children}
        </ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

