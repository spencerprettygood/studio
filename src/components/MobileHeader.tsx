
"use client";

import Link from 'next/link';
import { Brain, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';

export function MobileHeader() {
  const { toggleSidebar } = useSidebar();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="-ml-1">
        <Menu className="h-6 w-6" />
        <span className="sr-only">Toggle Menu</span>
      </Button>
      <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-primary">
          <Brain className="h-6 w-6" />
          <span>PromptFlow</span>
      </Link>
    </header>
  );
}
