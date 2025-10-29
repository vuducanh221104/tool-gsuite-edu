import { api } from '@Client/lib/axios';
import type { DirectoryUser, ListUsersResponse } from '@Client/types/users';

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  [key: string]: unknown;
}

export interface UpdateUserPayload {
  [key: string]: unknown;
}

export async function listUsers(params?: Record<string, unknown>) {
  const res = await api.get('/api/users', { params });
  return res.data as ListUsersResponse;
}

export async function listAllUsers() {
  const res = await api.get('/api/users/all');
  return res.data as { users: DirectoryUser[]; count: number };
}

export async function createUser(payload: CreateUserPayload) {
  const res = await api.post('/api/users', payload);
  return res.data as { user: DirectoryUser };
}

export async function updateUser(userKey: string, payload: UpdateUserPayload) {
  const res = await api.patch(`/api/users/${encodeURIComponent(userKey)}`, payload);
  return res.data as { user: DirectoryUser };
}

export async function deleteUser(userKey: string) {
  const res = await api.delete(`/api/users/${encodeURIComponent(userKey)}`);
  return res.data as { message: string };
}

export interface BulkCreateResult {
  success: boolean;
  email: string;
  password?: string;
  backupCodes?: string[];
  error?: string;
  user?: DirectoryUser;
}

export async function bulkCreateUsers(users: CreateUserPayload[]) {
  const res = await api.post('/api/users/bulk', { users });
  return res.data as { results: BulkCreateResult[] };
}

export async function exportUsersToExcel(source: 'google' | 'mongodb' = 'google') {
  const res = await api.get('/api/users/export', {
    params: { source },
    responseType: 'blob'
  });
  
  // Create download link
  const blob = new Blob([res.data], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `users-export-${Date.now()}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  return { success: true };
}


