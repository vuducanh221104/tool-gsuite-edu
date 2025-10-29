"use client";
import React from 'react';
import { Checkbox } from '@Client/components/ui/checkbox';
import { Badge } from '@Client/components/ui/badge';
import { Button } from '@Client/components/ui/button';
import { Table as STable } from '@Client/components/ui/table';
import type { DirectoryUser } from '@Client/types/users';
import { DropdownMenu, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuTrigger } from '@Client/components/ui/dropdown-menu';
import { DropdownMenuItem } from '@Client/components/ui/dropdown-menu';
import { Skeleton } from '@Client/components/ui/skeleton';
import { MoreVertical, CheckCircle2, XCircle, Shield, User } from 'lucide-react';

type Props = {
  users: DirectoryUser[];
  loading?: boolean;
  onDelete?: (email: string) => void;
  onEdit?: (user: DirectoryUser) => void;
  selectedUsers?: string[];
  onSelectionChange?: (emails: string[]) => void;
};

export function AllUsersTable({ users, loading, onDelete, onEdit, selectedUsers = [], onSelectionChange }: Props) {
  const [selected, setSelected] = React.useState<string[]>(selectedUsers);

  React.useEffect(() => {
    setSelected(selectedUsers);
  }, [selectedUsers]);

  const toggleAll = (checked: boolean | string) => {
    const newSelection = checked ? users.map(u => u.primaryEmail) : [];
    setSelected(newSelection);
    onSelectionChange?.(newSelection);
  };

  const toggleOne = (email: string, checked: boolean | string) => {
    const newSelection = checked 
      ? Array.from(new Set([...selected, email])) 
      : selected.filter(e => e !== email);
    setSelected(newSelection);
    onSelectionChange?.(newSelection);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <Checkbox 
            checked={selected.length > 0 && selected.length === users.length} 
            onCheckedChange={toggleAll} 
          />
          <span className="text-sm font-medium text-muted-foreground">
            {selected.length} of {users.length} selected
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border shadow-sm">
        <STable>
          <thead className="sticky top-0 z-10 bg-background">
            <tr>
              <th className="w-8">
                <Checkbox 
                  checked={selected.length > 0 && selected.length === users.length} 
                  onCheckedChange={toggleAll} 
                />
              </th>
              <th className="text-left">Email</th>
              <th className="text-left">Name</th>
              <th className="text-left">Org Unit</th>
              <th className="text-left">Role</th>
              <th className="text-left">Status</th>
              <th className="text-left">Created</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td><Skeleton className="h-4 w-4" /></td>
                  <td><Skeleton className="h-4 w-[220px]" /></td>
                  <td><Skeleton className="h-4 w-[180px]" /></td>
                  <td><Skeleton className="h-4 w-[100px]" /></td>
                  <td><Skeleton className="h-4 w-[80px]" /></td>
                  <td><Skeleton className="h-4 w-[80px]" /></td>
                  <td><Skeleton className="h-4 w-[120px]" /></td>
                  <td className="text-right pr-3"><Skeleton className="h-4 w-4 ml-auto" /></td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-sm text-muted-foreground">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id ?? u.primaryEmail} className="hover:bg-muted/40">
                  <td>
                    <Checkbox 
                      checked={selected.includes(u.primaryEmail)} 
                      onCheckedChange={(v) => toggleOne(u.primaryEmail, v)} 
                    />
                  </td>
                  <td className="font-mono text-sm">{u.primaryEmail}</td>
                  <td>
                    {u.name?.givenName || u.name?.familyName 
                      ? `${u.name?.givenName ?? ''} ${u.name?.familyName ?? ''}`.trim()
                      : '—'
                    }
                  </td>
                  <td>
                    <span className="text-sm text-muted-foreground">
                      {u.orgUnitPath || '/'}
                    </span>
                  </td>
                  <td>
                    {u.isAdmin ? (
                      <Badge variant="default" className="inline-flex items-center gap-1">
                        <Shield className="h-3 w-3" /> Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="inline-flex items-center gap-1">
                        <User className="h-3 w-3" /> User
                      </Badge>
                    )}
                  </td>
                  <td>
                    {u.suspended ? (
                      <Badge variant="destructive" className="inline-flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> Suspended
                      </Badge>
                    ) : (
                      <Badge variant="default" className="inline-flex items-center gap-1 bg-emerald-600">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </Badge>
                    )}
                  </td>
                  <td>
                    <span className="text-sm text-muted-foreground">
                      {u.creationTime ? new Date(u.creationTime).toLocaleDateString() : '—'}
                    </span>
                  </td>
                  <td className="text-right pr-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit?.(u)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            navigator.clipboard.writeText(u.primaryEmail);
                          }}
                        >
                          Copy Email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive" 
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete user "${u.primaryEmail}"?\n\nThis action cannot be undone!`)) {
                              onDelete?.(u.primaryEmail);
                            }
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </STable>
      </div>

      <div className="flex items-center justify-between py-3 text-sm text-muted-foreground border-t bg-muted/30 px-4 rounded-b-lg">
        <div className="font-medium">
          {selected.length} of {users.length} row(s) selected
        </div>
        <div className="text-sm font-medium">
          Total: {users.length} user{users.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
