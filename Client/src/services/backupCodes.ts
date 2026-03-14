import { api } from '@Client/lib/axios';
import type {
  BackupCodesResponse,
  SavedBackupCodesMap,
  SavedBackupCodeEntry,
  UserSecurityStatus,
} from '@Client/types/backupCodes';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export async function listVerificationCodes(userKey: string) {
  const res = await api.get(`/api/backup-codes/${encodeURIComponent(userKey)}`);
  return res.data as BackupCodesResponse;
}

export async function generateVerificationCodes(userKey: string) {
  const res = await api.post(`/api/backup-codes/${encodeURIComponent(userKey)}/generate`);
  return res.data as BackupCodesResponse;
}

export async function invalidateVerificationCodes(userKey: string) {
  const res = await api.post(`/api/backup-codes/${encodeURIComponent(userKey)}/invalidate`);
  return res.data as { success: boolean; message?: string; error?: string };
}

export async function getSavedBackupCodes() {
  const res = await api.get('/api/backup-codes/saved');
  return res.data as ApiEnvelope<SavedBackupCodesMap>;
}

export async function getSavedBackupCodesByUser(userKey: string) {
  const res = await api.get(`/api/backup-codes/saved/${encodeURIComponent(userKey)}`);
  return res.data as ApiEnvelope<SavedBackupCodeEntry>;
}

export async function getUserBackupStatus(userKey: string) {
  const res = await api.get(`/api/backup-codes/${encodeURIComponent(userKey)}/status`);
  return res.data as ApiEnvelope<UserSecurityStatus>;
}
