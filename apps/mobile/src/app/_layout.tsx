import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import '@/lib/i18n';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60_000 } },
});

export default function RootLayout() {
  useEffect(() => {
    void useAuthStore.getState().loadMe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Cuenta' }} />
        <Stack.Screen name="site/[id]" options={{ title: 'Detalle' }} />
        <Stack.Screen name="suggest" options={{ title: 'Sugerir lugar' }} />
        <Stack.Screen name="report/[id]" options={{ title: 'Reportar problema' }} />
      </Stack>
    </QueryClientProvider>
  );
}
