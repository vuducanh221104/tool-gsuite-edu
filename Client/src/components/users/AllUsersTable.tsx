"use client";
import React from 'react';
import { Checkbox } from '@Client/components/ui/checkbox';
import { Badge } from '@Client/components/ui/badge';
import { Button } from '@Client/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@Client/components/ui/select';
import { Table as STable } from '@Client/components/ui/table';
import type { DirectoryUser } from '@Client/types/users';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@Client/components/ui/dropdown-menu';
import { DropdownMenuItem } from '@Client/components/ui/dropdown-menu';
import { Skeleton } from '@Client/components/ui/skeleton';
import { GripVertical, MoreVertical, CheckCircle2, Loader2 } from 'lucide-react';

type Props = {
  users: DirectoryUser[];
  loading?: boolean;
  onDelete?: (email: string) => void;
};

export function AllUsersTable({ users, loading, onDelete }: Props) {
  const [selected, setSelected] = React.useState<string[]>([]);
  const [visible, setVisible] = React.useState<{ type: boolean; status: boolean; target: boolean; limit: boolean; reviewer: boolean }>(() => {
    if (typeof window === 'undefined') return { type: true, status: true, target: true, limit: true, reviewer: true };
    try {
      const raw = localStorage.getItem('allUsersTable.columns');
      if (raw) return JSON.parse(raw);
    } catch {}
    return { type: true, status: true, target: true, limit: true, reviewer: true };
  });

  React.useEffect(() => {
    try { localStorage.setItem('allUsersTable.columns', JSON.stringify(visible)); } catch {}
  }, [visible]);

  const toggleAll = (checked: boolean | string) => {
    if (checked) setSelected(users.map(u => u.primaryEmail));
    else setSelected([]);
  };

  const toggleOne = (email: string, checked: boolean | string) => {
    setSelected(prev => checked ? Array.from(new Set([...prev, email])) : prev.filter(e => e !== email));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox checked={selected.length > 0 && selected.length === users.length} onCheckedChange={toggleAll} />
          <span className="text-sm text-muted-foreground">{selected.length} selected</span>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="inline-flex items-center gap-2">Customize Columns</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={visible.type} onCheckedChange={(v) => setVisible((s) => ({ ...s, type: !!v }))}>Type</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visible.status} onCheckedChange={(v) => setVisible((s) => ({ ...s, status: !!v }))}>Status</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visible.target} onCheckedChange={(v) => setVisible((s) => ({ ...s, target: !!v }))}>Target</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visible.limit} onCheckedChange={(v) => setVisible((s) => ({ ...s, limit: !!v }))}>Limit</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visible.reviewer} onCheckedChange={(v) => setVisible((s) => ({ ...s, reviewer: !!v }))}>Reviewer</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm">Add Section</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <STable>
          <thead className="sticky top-0 z-10 bg-background">
            <tr>
              <th className="w-8"></th>
              <th className="w-8"><Checkbox checked={selected.length > 0 && selected.length === users.length} onCheckedChange={toggleAll} /></th>
              <th className="text-left">Header</th>
              {visible.type && <th className="text-left">Section Type</th>}
              {visible.status && <th className="text-left">Status</th>}
              {visible.target && <th className="text-left">Target</th>}
              {visible.limit && <th className="text-left">Limit</th>}
              {visible.reviewer && <th className="text-left">Reviewer</th>}
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td className="pl-2"><Skeleton className="h-4 w-4" /></td>
                  <td><Skeleton className="h-4 w-4" /></td>
                  <td><Skeleton className="h-4 w-[280px]" /></td>
                  {visible.type && <td><Skeleton className="h-4 w-[120px]" /></td>}
                  {visible.status && <td><Skeleton className="h-4 w-[90px]" /></td>}
                  {visible.target && <td><Skeleton className="h-4 w-[40px]" /></td>}
                  {visible.limit && <td><Skeleton className="h-4 w-[40px]" /></td>}
                  {visible.reviewer && <td><Skeleton className="h-4 w-[160px]" /></td>}
                  <td className="text-right pr-3"><Skeleton className="h-4 w-4 ml-auto" /></td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr><td colSpan={8} className="py-6 text-center text-sm text-muted-foreground">No users</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id ?? u.primaryEmail} className="hover:bg-muted/40">
                  <td className="pl-2 text-muted-foreground"><GripVertical className="h-4 w-4" /></td>
                  <td><Checkbox checked={selected.includes(u.primaryEmail)} onCheckedChange={(v) => toggleOne(u.primaryEmail, v)} /></td>
                  <td>{u.name?.familyName ? `${u.name.familyName}, ${u.name.givenName}` : u.primaryEmail}</td>
                  {visible.type && <td><Badge variant="secondary">Narrative</Badge></td>}
                  {visible.status && (
                    <td>
                      <Badge className="inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Done
                      </Badge>
                    </td>
                  )}
                  {visible.target && <td>—</td>}
                  {visible.limit && <td>—</td>}
                  {visible.reviewer && (
                    <td>
                      <Select>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Assign reviewer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          <SelectItem value="r1">Reviewer 1</SelectItem>
                          <SelectItem value="r2">Reviewer 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  )}
                  <td className="text-right pr-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => window.alert('View user')}>View</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.alert('Edit user')}>Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.(u.primaryEmail)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </STable>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>0 of {users.length} row(s) selected.</div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">Rows per page <Select defaultValue="10"><SelectTrigger className="w-[72px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem><SelectItem value="50">50</SelectItem></SelectContent></Select></div>
          <div>Page 1 of 1</div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon">«</Button>
            <Button variant="outline" size="icon">‹</Button>
            <Button variant="outline" size="icon">›</Button>
            <Button variant="outline" size="icon">»</Button>
          </div>
        </div>
      </div>
    </div>
  );
}


