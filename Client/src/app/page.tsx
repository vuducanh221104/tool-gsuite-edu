"use client";
import React from 'react';
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
import { UserForm } from '@Client/components/users/UserForm';
import { useUsers } from '@Client/hooks/useUsers';

export default function Dashboard() {
  const {
    users,
    loading,
    exporting,
    selectedUsers,
    setSelectedUsers,
    open,
    setOpen,
    bulkOpen,
    setBulkOpen,
    resultOpen,
    setResultOpen,
    bulkResults,
    editingUser,
    setEditingUser,
    fetchUsers,
    handleBulkImport,
    handleExport,
    handleDeleteUser,
    handleCreateOrUpdateUser
  } = useUsers();

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
              onDelete={handleDeleteUser}
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
                onSubmit={handleCreateOrUpdateUser}
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
