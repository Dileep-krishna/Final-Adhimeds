'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartProvider } from '@/context/CartContext';
import { OrderNotificationProvider } from '@/context/OrderNotificationContext'; // ✅ added
import { Toaster } from 'sonner';

const queryClient = new QueryClient();

export default function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        {/* <NotificationProvider> */}
          <OrderNotificationProvider>   {/* ✅ new wrapper – added without changing existing code */}
            {children}
            <Toaster
              position="top-right"
              richColors
              duration={1500}
              visibleToasts={3}
            />
          </OrderNotificationProvider>
        {/* </NotificationProvider> */}
      </CartProvider>
    </QueryClientProvider>
  );
}