
"use client";

import Link from 'next/link';
import { NavMenu } from './NavMenu';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-center">
      <Link href="/chat" className="text-2xl text-foreground/80 hover:text-foreground transition-colors font-medium">
        roFl
      </Link>
      <NavMenu />
    </header>
  );
}
