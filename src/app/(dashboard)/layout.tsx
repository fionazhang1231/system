'use client';

import { AuthProvider } from '@/hooks/useAuth';
import DashboardShell from './shell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DashboardShell>
        {children}
      </DashboardShell>
    </AuthProvider>
  );
}
