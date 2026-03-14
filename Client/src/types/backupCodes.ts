export interface BackupCodeItem {
  code?: string;
  verificationCode?: string;
}

export interface BackupCodesApiData {
  items?: BackupCodeItem[];
}

export interface SavedBackupCodeEntry {
  email: string;
  backupCodes: string[];
  retrievedAt?: string;
  generatedAt?: string;
  invalidatedAt?: string;
  status?: string;
  codesCount?: number;
}

export type SavedBackupCodesMap = Record<string, SavedBackupCodeEntry>;

export interface UserSecurityStatus {
  id?: string;
  email: string;
  isEnforcedIn2Sv?: boolean;
  isEnrolledIn2Sv?: boolean;
}

export interface BackupCodesResponse {
  success: boolean;
  data?: BackupCodesApiData;
  message?: string;
  error?: string;
}
