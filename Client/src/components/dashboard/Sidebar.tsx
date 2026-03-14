"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Separator } from '@Client/components/ui/separator';
import { Badge } from '@Client/components/ui/badge';
import { cn } from '@Client/lib/utils';
import { Users, KeyRound, Mail } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    {
      label: 'Users Management',
      href: '/',
      icon: Users,
      exact: true,
    },
    {
      label: 'Backup Codes',
      href: '/backup-codes',
      icon: KeyRound,
      exact: false,
      badge: 'New',
    },
    {
      label: 'Mailbox',
      href: '/mailbox',
      icon: Mail,
      exact: false,
    },
  ];

  return (
    <aside className="hidden md:flex md:flex-col w-64 border-r border-border bg-background/40">
      <div className="p-4 text-lg font-semibold">GSuite EDU</div>
      <Separator />
      <nav className="p-2 space-y-1 text-sm">
        {menuItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-3 py-2 rounded hover:bg-muted block transition-colors',
                'inline-flex items-center justify-between w-full',
                isActive && 'bg-muted font-medium'
              )}
            >
              <span className="inline-flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
              {item.badge ? <Badge>{item.badge}</Badge> : null}
            </Link>
          );
        })}
      </nav>
      <Separator className="my-2" />
      <div className="px-2">
        <div className="px-3 py-2 text-xs text-muted-foreground uppercase">Notes</div>
        <div className="space-y-1">
          <div className="px-3 py-2 rounded text-muted-foreground">Google Workspace</div>
          <div className="px-3 py-2 rounded text-muted-foreground">Security & Recovery</div>
        </div>
      </div>
    </aside>
  );
}


