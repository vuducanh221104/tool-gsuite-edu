"use client";
import React from 'react';
import { Checkbox } from '@Client/components/ui/checkbox';
import { Badge } from '@Client/components/ui/badge';
import { Button } from '@Client/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@Client/components/ui/table';
import type { DirectoryUser } from '@Client/types/users';
import { DropdownMenu, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuTrigger } from '@Client/components/ui/dropdown-menu';
import { DropdownMenuItem } from '@Client/components/ui/dropdown-menu';
import { Skeleton } from '@Client/components/ui/skeleton';
import { MoreVertical, CheckCircle2, XCircle, Shield, User } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@Client/components/ui/alert-dialog"

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
  const [userToDelete, setUserToDelete] = React.useState<string | null>(null);

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

      <div className="overflow-x-auto rounded-lg shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-12">
                <Checkbox 
                  checked={selected.length > 0 && selected.length === users.length} 
                  onCheckedChange={toggleAll} 
                />
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Org Unit</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[220px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[180px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-4 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id ?? u.primaryEmail}>
                  <TableCell>
                    <Checkbox 
                      checked={selected.includes(u.primaryEmail)} 
                      onCheckedChange={(v) => toggleOne(u.primaryEmail, v)} 
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">{u.primaryEmail}</TableCell>
                  <TableCell>
                    {u.name?.givenName || u.name?.familyName 
                      ? `${u.name?.givenName ?? ''} ${u.name?.familyName ?? ''}`.trim()
                      : '—'
                    }
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {u.orgUnitPath || '/'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {u.isAdmin ? (
                      <Badge variant="default" className="inline-flex items-center gap-1">
                        <Shield className="h-3 w-3" /> Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="inline-flex items-center gap-1">
                        <User className="h-3 w-3" /> User
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.suspended ? (
                      <Badge variant="destructive" className="inline-flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> Suspended
                      </Badge>
                    ) : (
                      <Badge variant="default" className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {u.creationTime ? new Date(u.creationTime).toLocaleDateString() : '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
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
                          className="text-destructive focus:bg-destructive focus:text-destructive-foreground" 
                          onClick={() => setUserToDelete(u.primaryEmail)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-3 text-sm text-muted-foreground border-t bg-muted/30 px-4 rounded-b-lg">
        <div className="font-medium">
          {selected.length} of {users.length} row(s) selected
        </div>
        <div className="text-sm font-medium">
          Total: {users.length} user{users.length !== 1 ? 's' : ''}
        </div>
      </div>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user{" "}
              <span className="font-medium text-foreground">{userToDelete}</span>{" "}
              from the Google Workspace directory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (userToDelete) {
                  onDelete?.(userToDelete);
                  setUserToDelete(null);
                }
              }}
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
