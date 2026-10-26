'use client';

import React from 'react';
import { Sidebar, SidebarProvider } from './sidebar';
import { Topbar } from './topbar';

export function DashboardShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: any;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* Sidebar (Desktop fixed + Mobile drawer) */}
        <Sidebar user={user} />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar user={user} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
