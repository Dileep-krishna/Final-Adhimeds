// components/ClientProviders.js
'use client';

import { ThemeProvider } from '@/context/ThemeContext';
import { SidebarProvider } from '@/context/SidebarContext';
import Providers from './providers'; // your existing Providers

export default function ClientProviders({ children }) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <Providers>{children}</Providers>
      </SidebarProvider>
    </ThemeProvider>
  );
}