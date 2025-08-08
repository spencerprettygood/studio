
"use client";

import Link from 'next/link';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Menu } from 'lucide-react';

export function NavMenu() {
  return (
    <Menubar className="bg-transparent border-none">
      <MenubarMenu>
        <MenubarTrigger className="p-2 text-muted-foreground hover:text-foreground data-[state=open]:text-foreground focus:text-foreground cursor-pointer">
          <Menu className="h-5 w-5" />
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem asChild>
            <Link href="/chat">Chat</Link>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem asChild>
            <Link href="/prompts">Prompt Library</Link>
          </MenubarItem>
          <MenubarItem asChild>
            <Link href="/prompts/new">New Prompt</Link>
          </MenubarItem>
          <MenubarItem asChild>
            <Link href="/prompts/processor">Prompt Processor</Link>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
