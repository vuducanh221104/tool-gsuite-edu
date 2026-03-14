import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  generateVerificationCodes,
  getSavedBackupCodes,
  getUserBackupStatus,
  invalidateVerificationCodes,
  listVerificationCodes,
} from '@Client/services/backupCodes';
import { listUsers } from '@Client/services/users';
import { parseApiError } from '@Client/lib/utils';
import type { SavedBackupCodesMap, UserSecurityStatus } from '@Client/types/backupCodes';

function extractCodes(items: Array<{ code?: string; verificationCode?: string }> = []) {
  return items
    .map((item) => item.code || item.verificationCode || '')
    .filter(Boolean);
}

function parseUserTargets(rawInput: string) {
  return Array.from(
    new Set(
      rawInput
        .split(/[\n,;]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

export function useBackupCodes() {
  const [savedCodes, setSavedCodes] = useState<SavedBackupCodesMap>({});
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeCodes, setActiveCodes] = useState<string[]>([]);
  const [securityStatus, setSecurityStatus] = useState<UserSecurityStatus | null>(null);
  const [activeUser, setActiveUser] = useState('');
  const [availableEmails, setAvailableEmails] = useState<string[]>([]);

  const fetchSavedCodes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getSavedBackupCodes();
      setSavedCodes(response.data || {});
    } catch (error) {
      toast.error(parseApiError(error) || 'Failed to load saved backup codes');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAvailableEmails = useCallback(async () => {
    try {
      const response = await listUsers({ maxResults: 500, orderBy: 'email' });
      const emails = (response.users || [])
        .map((user) => user.primaryEmail)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      setAvailableEmails(emails);
    } catch (error) {
      toast.error(parseApiError(error) || 'Failed to load available user emails');
    }
  }, []);

  const loadUserStatus = useCallback(async (userKey: string) => {
    try {
      const response = await getUserBackupStatus(userKey);
      setSecurityStatus(response.data || null);
    } catch (error) {
      setSecurityStatus(null);
      toast.error(parseApiError(error) || 'Failed to load 2-step verification status');
    }
  }, []);

  const loadLiveCodes = useCallback(async (userKey: string) => {
    const targets = parseUserTargets(userKey);
    if (targets.length === 0) {
      toast.error('Please enter user email');
      return;
    }

    if (targets.length > 1) {
      setActionLoading(true);
      const toastId = toast.loading(`Loading active codes for ${targets.length} users...`);

      try {
        const results = await Promise.allSettled(targets.map((target) => listVerificationCodes(target)));
        const successCount = results.filter((item) => item.status === 'fulfilled').length;

        setActiveUser(`${successCount}/${targets.length} users loaded`);
        setActiveCodes([]);
        setSecurityStatus(null);

        toast.dismiss(toastId);
        if (successCount > 0) {
          toast.success(`Loaded active backup codes for ${successCount}/${targets.length} users.`);
        } else {
          toast.error('No user loaded successfully.');
        }

        await fetchSavedCodes();
      } catch (error) {
        toast.dismiss(toastId);
        toast.error(parseApiError(error) || 'Failed to load active backup codes');
      } finally {
        setActionLoading(false);
      }

      return;
    }

    const normalizedUser = targets[0];

    setActionLoading(true);
    const toastId = toast.loading(`Loading active codes for ${normalizedUser}...`);

    try {
      const response = await listVerificationCodes(normalizedUser);
      const codes = extractCodes(response.data?.items);
      setActiveCodes(codes);
      setActiveUser(normalizedUser);
      toast.dismiss(toastId);
      toast.success(codes.length > 0 ? `Loaded ${codes.length} active code(s)` : 'No active backup codes found');

      await Promise.all([fetchSavedCodes(), loadUserStatus(normalizedUser)]);
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(parseApiError(error) || 'Failed to load active backup codes');
    } finally {
      setActionLoading(false);
    }
  }, [fetchSavedCodes, loadUserStatus]);

  const generateCodes = useCallback(async (userKey: string) => {
    const targets = parseUserTargets(userKey);
    if (targets.length === 0) {
      toast.error('Please enter user email');
      return;
    }

    if (targets.length > 1) {
      setActionLoading(true);
      const toastId = toast.loading(`Generating new codes for ${targets.length} users...`);

      try {
        const results = await Promise.allSettled(targets.map((target) => generateVerificationCodes(target)));
        const successCount = results.filter((item) => item.status === 'fulfilled').length;

        toast.dismiss(toastId);
        if (successCount > 0) {
          toast.success(`Generated new codes for ${successCount}/${targets.length} users.`);
        } else {
          toast.error('No user generated successfully.');
        }

        setActiveUser(`${successCount}/${targets.length} users generated`);
        setActiveCodes([]);
        setSecurityStatus(null);
        await fetchSavedCodes();
      } catch (error) {
        toast.dismiss(toastId);
        toast.error(parseApiError(error) || 'Failed to generate backup codes');
      } finally {
        setActionLoading(false);
      }

      return;
    }

    const normalizedUser = targets[0];

    setActionLoading(true);
    const toastId = toast.loading(`Generating new codes for ${normalizedUser}...`);

    try {
      await generateVerificationCodes(normalizedUser);
      toast.dismiss(toastId);
      toast.success('New backup codes generated');
      await loadLiveCodes(normalizedUser);
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(parseApiError(error) || 'Failed to generate backup codes');
    } finally {
      setActionLoading(false);
    }
  }, [fetchSavedCodes, loadLiveCodes]);

  const invalidateCodes = useCallback(async (userKey: string) => {
    const targets = parseUserTargets(userKey);
    if (targets.length === 0) {
      toast.error('Please enter user email');
      return;
    }

    if (targets.length > 1) {
      setActionLoading(true);
      const toastId = toast.loading(`Invalidating codes for ${targets.length} users...`);

      try {
        const results = await Promise.allSettled(targets.map((target) => invalidateVerificationCodes(target)));
        const successCount = results.filter((item) => item.status === 'fulfilled').length;

        setActiveCodes([]);
        setSecurityStatus(null);
        setActiveUser(`${successCount}/${targets.length} users invalidated`);

        toast.dismiss(toastId);
        if (successCount > 0) {
          toast.success(`Invalidated backup codes for ${successCount}/${targets.length} users.`);
        } else {
          toast.error('No user invalidated successfully.');
        }

        await fetchSavedCodes();
      } catch (error) {
        toast.dismiss(toastId);
        toast.error(parseApiError(error) || 'Failed to invalidate backup codes');
      } finally {
        setActionLoading(false);
      }

      return;
    }

    const normalizedUser = targets[0];

    setActionLoading(true);
    const toastId = toast.loading(`Invalidating codes for ${normalizedUser}...`);

    try {
      await invalidateVerificationCodes(normalizedUser);
      setActiveCodes([]);
      toast.dismiss(toastId);
      toast.success('All backup codes invalidated');
      await Promise.all([fetchSavedCodes(), loadUserStatus(normalizedUser)]);
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(parseApiError(error) || 'Failed to invalidate backup codes');
    } finally {
      setActionLoading(false);
    }
  }, [fetchSavedCodes, loadUserStatus]);

  const metrics = useMemo(() => {
    const records = Object.values(savedCodes);
    const totalRecords = records.length;
    const activeRecords = records.filter((item) => item.status !== 'invalidated').length;
    const invalidatedRecords = records.filter((item) => item.status === 'invalidated').length;
    const totalCodes = records.reduce((sum, item) => sum + (item.codesCount || item.backupCodes?.length || 0), 0);

    return {
      totalRecords,
      activeRecords,
      invalidatedRecords,
      totalCodes,
    };
  }, [savedCodes]);

  return {
    savedCodes,
    loading,
    actionLoading,
    activeCodes,
    activeUser,
    securityStatus,
    availableEmails,
    metrics,
    fetchSavedCodes,
    fetchAvailableEmails,
    loadLiveCodes,
    generateCodes,
    invalidateCodes,
  };
}
