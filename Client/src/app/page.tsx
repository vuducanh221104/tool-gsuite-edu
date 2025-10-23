"use client";
import React from 'react';
import { message } from 'antd';
import { Button } from '@Client/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@Client/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@Client/components/ui/dialog';
// import { Table as STable } from '@Client/components/ui/table';
import { Plus } from 'lucide-react';
import { Sidebar } from '@Client/components/dashboard/Sidebar';
import { MetricCard } from '@Client/components/dashboard/MetricCard';
import { AreaChartShadcn } from '@Client/components/ui/chart';
import { ModeToggle } from '@Client/components/theme/ModeToggle';
import { AllUsersTable } from '@Client/components/users/AllUsersTable';
import { listUsers, createUser, deleteUser } from '@Client/services/users';
import { UserForm } from '@Client/components/users/UserForm';

import type { DirectoryUser } from '@Client/types/users';

export default function Dashboard() {
  const [users, setUsers] = React.useState<DirectoryUser[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const { users } = await listUsers({ maxResults: 50 });
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

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <Button onClick={() => setOpen(true)} className="inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> New User
          </Button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Users" value={String(users.length)} delta={loading ? 'Loading…' : '+0%'} subtitle="Current dataset" />
        <MetricCard title="Active" value="—" subtitle="Retention" />
        <MetricCard title="New This Month" value="—" subtitle="Provisioned" />
        <MetricCard title="Suspended" value="—" subtitle="Compliance" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visitors</CardTitle>
        </CardHeader>
        <CardContent>
          <AreaChartShadcn data={[
            { label: 'Jun 24', value: 2 },
            { label: 'Jun 25', value: 4 },
            { label: 'Jun 26', value: 6 },
            { label: 'Jun 27', value: 5 },
            { label: 'Jun 28', value: 7 },
            { label: 'Jun 29', value: 3 },
            { label: 'Jun 30', value: 8 },
          ]} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All users</CardTitle>
        </CardHeader>
        <CardContent>
          <AllUsersTable
            users={users}
            loading={loading}
            onDelete={async (email) => {
              try {
                await deleteUser(email);
                message.success('Deleted');
                fetchUsers();
              } catch (e) {
                const err = e as { response?: { data?: { error?: string } } };
                message.error(err?.response?.data?.error || 'Delete failed');
              }
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
          </DialogHeader>
          <div>
            <UserForm
              onSubmit={async (values) => {
                try {
                  await createUser(values);
                  message.success('Created');
                  setOpen(false);
                  fetchUsers();
                } catch (e) {
                  const err = e as { response?: { data?: { error?: string } } };
                  message.error(err?.response?.data?.error || 'Create failed');
                }
              }}
              submitText="Create"
            />
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
