"use client";
import React from 'react';
import { Separator } from '@Client/components/ui/separator';
import { Badge } from '@Client/components/ui/badge';

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:flex-col w-64 border-r border-border bg-background/40">
      <div className="p-4 text-lg font-semibold">Acme Inc.</div>
      <Separator />
      <nav className="p-2 space-y-1 text-sm">
        {[
          'Dashboard',
          'Lifecycle',
          'Analytics',
          'Projects',
          'Team',
        ].map((i) => (
          <a key={i} className="px-3 py-2 rounded hover:bg-muted cursor-pointer block">
            {i}
          </a>
        ))}
      </nav>
      <Separator className="my-2" />
      <div className="px-2">
        <div className="px-3 py-2 text-xs text-muted-foreground uppercase">Documents</div>
        <div className="space-y-1">
          <a className="px-3 py-2 rounded hover:bg-muted cursor-pointer block">Data Library</a>
          <a className="px-3 py-2 rounded hover:bg-muted cursor-pointer block">Reports</a>
          <a className="px-3 py-2 rounded hover:bg-muted cursor-pointer block">Word Assistant <Badge className="ml-2">New</Badge></a>
        </div>
      </div>
    </aside>
  );
}


