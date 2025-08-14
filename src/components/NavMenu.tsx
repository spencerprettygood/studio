
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
import { Menu, Bot, Library, FilePlus, Wand2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function NavMenu() {
  const pathname = usePathname();
  
  const navItems = [
    { href: "/chat", label: "Chat", icon: Bot },
    { href: "/prompts", label: "Prompt Library", icon: Library },
    { href: "/prompts/new", label: "New Prompt", icon: FilePlus },
    { href: "/prompts/processor", label: "Prompt Processor", icon: Wand2 },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-center bg-background/80 backdrop-blur-sm">
       <Link href="/chat" className="text-2xl text-foreground/80 hover:text-foreground transition-colors font-medium">
        roFl
      </Link>
      <Menubar className="bg-transparent border-none">
        <MenubarMenu>
          <MenubarTrigger className="p-2 text-muted-foreground hover:text-foreground data-[state=open]:text-foreground focus:text-foreground cursor-pointer">
            <Menu className="h-6 w-6" />
          </MenubarTrigger>
          <MenubarContent>
             {navItems.map((item, index) => (
                <MenubarItem key={index} asChild className={cn(pathname === item.href && "bg-muted")}>
                  <Link href={item.href} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <span>{item.label}</span>
                  </Link>
                </MenubarItem>
             ))}
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </header>
  );
}
