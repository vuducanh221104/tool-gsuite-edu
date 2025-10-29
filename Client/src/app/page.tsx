"use client";
import React from 'react';
import { message } from 'antd';
import { Button } from '@Client/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@Client/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@Client/components/ui/dialog';
import { Plus, Download, Upload } from 'lucide-react';
import { Sidebar } from '@Client/components/dashboard/Sidebar';
import { MetricCard } from '@Client/components/dashboard/MetricCard';
import { AreaChartShadcn } from '@Client/components/ui/chart';
import { ModeToggle } from '@Client/components/theme/ModeToggle';
import { AllUsersTable } from '@Client/components/users/AllUsersTable';
import { BulkImportDialog } from '@Client/components/users/BulkImportDialog';
import { BulkImportResultDialog } from '@Client/components/users/BulkImportResultDialog';
import { listUsers, createUser, deleteUser, bulkCreateUsers, exportUsersToExcel, type CreateUserPayload, type BulkCreateResult } from '@Client/services/users';
import { UserForm } from '@Client/components/users/UserForm';

import type { DirectoryUser } from '@Client/types/users';

export default function Dashboard() {
  const [users, setUsers] = React.useState<DirectoryUser[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [resultOpen, setResultOpen] = React.useState(false);
  const [bulkResults, setBulkResults] = React.useState<BulkCreateResult[]>([]);
  const [selectedUsers, setSelectedUsers] = React.useState<string[]>([]);
  const [editingUser, setEditingUser] = React.useState<DirectoryUser | null>(null);
  const [exporting, setExporting] = React.useState(false);

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const { users } = await listUsers({ maxResults: 500 });
      setUsers(users || []);
    } catch (e) {
      const err = e as { response?: { data?: { error?: string } } };
      message.error(err?.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleBulkImport = async (usersData: Record<string, unknown>[]) => {
    try {
      message.loading({ content: 'Creating users...', key: 'bulk-import', duration: 0 });
      const { results } = await bulkCreateUsers(usersData as CreateUserPayload[]);
      message.destroy('bulk-import');
      
      setBulkResults(results);
      setResultOpen(true);
      
      const successCount = results.filter((r) => r.success).length;
      message.success(`${successCount} of ${results.length} users created successfully`);
      
      fetchUsers();
    } catch (e) {
      message.destroy('bulk-import');
      const err = e as { response?: { data?: { error?: string } } };
      message.error(err?.response?.data?.error || 'Bulk import failed');
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      message.loading({ content: 'Generating Excel file...', key: 'export', duration: 0 });
      await exportUsersToExcel('google');
      message.destroy('export');
      message.success('Users exported successfully');
    } catch (e) {
      message.destroy('export');
      const err = e as { response?: { data?: { error?: string } } };
      message.error(err?.response?.data?.error || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const activeUsers = users.filter(u => !u.suspended).length;
  const suspendedUsers = users.filter(u => u.suspended).length;
  const adminUsers = users.filter(u => u.isAdmin).length;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Users Management</h1>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Button 
              onClick={handleExport} 
              variant="outline" 
              className="inline-flex items-center gap-2"
              disabled={exporting || users.length === 0}
            >
              <Download className="w-4 h-4" /> 
              Export Excel
            </Button>
            <Button 
              onClick={() => setBulkOpen(true)} 
              variant="outline" 
              className="inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" /> 
              Bulk Import
            </Button>
            <Button onClick={() => {
              setEditingUser(null);
              setOpen(true);
            }} className="inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> New User
            </Button>
          </div>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            title="Total Users" 
            value={String(users.length)} 
            delta={loading ? 'Loading…' : ''} 
            subtitle="In directory" 
          />
          <MetricCard 
            title="Active" 
            value={String(activeUsers)} 
            subtitle="Not suspended" 
          />
          <MetricCard 
            title="Suspended" 
            value={String(suspendedUsers)} 
            subtitle="Blocked access" 
          />
          <MetricCard 
            title="Admins" 
            value={String(adminUsers)} 
            subtitle="Super & delegated" 
          />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Activity Trend</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <AreaChartShadcn data={[
              { label: 'Mon', value: users.length > 0 ? Math.floor(users.length * 0.7) : 0 },
              { label: 'Tue', value: users.length > 0 ? Math.floor(users.length * 0.75) : 0 },
              { label: 'Wed', value: users.length > 0 ? Math.floor(users.length * 0.8) : 0 },
              { label: 'Thu', value: users.length > 0 ? Math.floor(users.length * 0.85) : 0 },
              { label: 'Fri', value: users.length > 0 ? Math.floor(users.length * 0.9) : 0 },
              { label: 'Sat', value: users.length > 0 ? Math.floor(users.length * 0.95) : 0 },
              { label: 'Sun', value: users.length },
            ]} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">All Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <AllUsersTable
              users={users}
              loading={loading}
              selectedUsers={selectedUsers}
              onSelectionChange={setSelectedUsers}
              onDelete={async (email) => {
                try {
                  message.loading({ content: 'Deleting user...', key: 'delete-user', duration: 0 });
                  await deleteUser(email);
                  message.destroy('delete-user');
                  message.success(`User ${email} deleted successfully`);
                  fetchUsers();
                } catch (e) {
                  message.destroy('delete-user');
                  const err = e as { response?: { data?: { error?: string } } };
                  message.error(err?.response?.data?.error || 'Failed to delete user. Please try again.');
                  console.error('Delete error:', e);
                }
              }}
              onEdit={(user) => {
                setEditingUser(user);
                setOpen(true);
              }}
            />
          </CardContent>
        </Card>

        {/* Create/Edit User Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit User' : 'Create User'}</DialogTitle>
            </DialogHeader>
            <div>
              <UserForm
                initialValues={editingUser ? {
                  firstName: editingUser.name?.givenName || '',
                  lastName: editingUser.name?.familyName || '',
                  email: editingUser.primaryEmail,
                  password: ''
                } : undefined}
                onSubmit={async (values) => {
                  try {
                    if (editingUser) {
                      // TODO: Implement update
                      message.info('Edit functionality coming soon');
                    } else {
                      await createUser(values);
                      message.success('User created successfully');
                    }
                    setOpen(false);
                    setEditingUser(null);
                    fetchUsers();
                  } catch (e) {
                    const err = e as { response?: { data?: { error?: string } } };
                    message.error(err?.response?.data?.error || 'Operation failed');
                  }
                }}
                submitText={editingUser ? 'Update' : 'Create'}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Import Dialog */}
        <BulkImportDialog
          open={bulkOpen}
          onOpenChange={setBulkOpen}
          onImport={handleBulkImport}
        />

        {/* Bulk Import Results Dialog */}
        <BulkImportResultDialog
          open={resultOpen}
          onOpenChange={setResultOpen}
          results={bulkResults}
        />
      </div>
    </div>
  );
}
