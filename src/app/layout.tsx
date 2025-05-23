
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarInset,
  SidebarTrigger
  // useSidebar removed as MobileHeader is now a separate client component
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Home, PlusCircle, Settings, Brain, Rows3 } from 'lucide-react'; // Menu removed
// Button import removed as MobileHeader handles its own button
import { MobileHeader } from '@/components/MobileHeader';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'PromptFlow',
  description: 'Organize and optimize your AI LLM prompts.',
};

// MobileHeader function definition moved to src/components/MobileHeader.tsx

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SidebarProvider defaultOpen={true}>
          <Sidebar collapsible="icon" variant="sidebar" side="left">
            <SidebarHeader className="p-4">
              <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-[hsl(var(--sidebar-primary))]">
                <Brain className="h-7 w-7" />
                <span className="group-data-[collapsible=icon]:hidden">PromptFlow</span>
              </Link>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={{ children: "Dashboard", sideOffset: 8 }}>
                    <Link href="/">
                      <Home />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={{ children: "New Prompt", sideOffset: 8 }}>
                    <Link href="/prompts/new">
                      <PlusCircle />
                      <span>New Prompt</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={{ children: "All Prompts", sideOffset: 8 }}>
                    <Link href="/prompts">
                      <Rows3 />
                      <span>All Prompts</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
            {/* Optional Footer Example
            <SidebarFooter>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={{ children: "Settings", sideOffset: 8 }}>
                    <Link href="/settings">
                      <Settings />
                      <span>Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter> 
            */}
          </Sidebar>
          <SidebarInset>
            <MobileHeader />
            <main className="flex-1 p-4 sm:p-6 bg-background min-h-[calc(100vh-3.5rem)] md:min-h-screen">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
