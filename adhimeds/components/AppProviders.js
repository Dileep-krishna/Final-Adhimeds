// components/AppProviders.js
'use client';

import { ThemeProvider } from '@/context/ThemeContext';
import { SidebarProvider } from '@/context/SidebarContext';
import Providers from '@/app/providers'; // ✅ correct absolute import

export default function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <Providers>{children}</Providers>
      </SidebarProvider>
    </ThemeProvider>
  );
}