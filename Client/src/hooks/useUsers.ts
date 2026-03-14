import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  listUsers, 
  createUser, 
  deleteUser, 
  bulkCreateUsers, 
  exportUsersToExcel, 
  type CreateUserPayload, 
  type BulkCreateResult 
} from '@Client/services/users';
import { parseApiError } from '@Client/lib/utils';
import type { DirectoryUser } from '@Client/types/users';

export function useUsers() {
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Dialog states
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  
  const [bulkResults, setBulkResults] = useState<BulkCreateResult[]>([]);
  const [editingUser, setEditingUser] = useState<DirectoryUser | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { users } = await listUsers({ maxResults: 500 });
      setUsers(users || []);
    } catch (e) {
      toast.error(parseApiError(e) || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBulkImport = async (usersData: Record<string, unknown>[]) => {
    const toastId = toast.loading('Creating users...');
    try {
      const { results } = await bulkCreateUsers(usersData as CreateUserPayload[]);
      toast.dismiss(toastId);
      
      setBulkResults(results);
      setResultOpen(true);
      
      const successCount = results.filter((r) => r.success).length;
      toast.success(`${successCount} out of ${results.length} users created successfully.`);
      
      fetchUsers();
    } catch (e) {
      toast.dismiss(toastId);
      toast.error(parseApiError(e) || 'Bulk import failed');
    }
  };

  const handleExport = async () => {
    const toastId = toast.loading('Generating Excel export...');
    try {
      setExporting(true);
      await exportUsersToExcel('google');
      toast.dismiss(toastId);
      toast.success('Successfully exported users records');
    } catch (e) {
      toast.dismiss(toastId);
      toast.error(parseApiError(e) || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteUser = async (email: string) => {
    const toastId = toast.loading(`Deleting ${email}...`);
    try {
      await deleteUser(email);
      toast.dismiss(toastId);
      toast.success(`Deleted successfully: ${email}`);
      fetchUsers();
    } catch (e) {
      toast.dismiss(toastId);
      toast.error(parseApiError(e) || 'Failed to delete user');
      console.error('Delete error:', e);
    }
  };

  const handleCreateOrUpdateUser = async (values: any) => {
    try {
      if (editingUser) {
        toast.info('Edit functionality coming soon');
      } else {
        await createUser(values as CreateUserPayload);
        toast.success('User created successfully');
      }
      setOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (e) {
      toast.error(parseApiError(e) || 'Operation failed');
    }
  };

  return {
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
  };
}
