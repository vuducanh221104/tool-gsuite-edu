"use client";

import React from 'react';
import { Button } from '@Client/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@Client/components/ui/card';
import { Input } from '@Client/components/ui/input';
import { Badge } from '@Client/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@Client/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@Client/components/ui/dropdown-menu';
import { Sidebar } from '@Client/components/dashboard/Sidebar';
import { MetricCard } from '@Client/components/dashboard/MetricCard';
import { ModeToggle } from '@Client/components/theme/ModeToggle';
import { BackupCodesTable } from '@Client/components/backup-codes/BackupCodesTable';
import { useBackupCodes } from '@Client/hooks/useBackupCodes';
import { RefreshCw, KeyRound, RotateCcw, Ban, Copy, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function BackupCodesPage() {
  const {
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
  } = useBackupCodes();

  const [search, setSearch] = React.useState('');
  const [userKey, setUserKey] = React.useState('');
  const [bulkSearch, setBulkSearch] = React.useState('');
  const [selectedBulkEmails, setSelectedBulkEmails] = React.useState<string[]>([]);

  React.useEffect(() => {
    fetchSavedCodes();
    fetchAvailableEmails();
  }, [fetchAvailableEmails, fetchSavedCodes]);

  const filteredRows = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const rows = Object.values(savedCodes);

    if (!keyword) {
      return rows;
    }

    return rows.filter((row) => row.email.toLowerCase().includes(keyword));
  }, [savedCodes, search]);

  const filteredBulkEmails = React.useMemo(() => {
    const keyword = bulkSearch.trim().toLowerCase();
    if (!keyword) {
      return availableEmails;
    }
    return availableEmails.filter((email) => email.toLowerCase().includes(keyword));
  }, [availableEmails, bulkSearch]);

  const toggleBulkEmail = (email: string) => {
    setSelectedBulkEmails((previous) => {
      if (previous.includes(email)) {
        return previous.filter((item) => item !== email);
      }
      return [...previous, email];
    });
  };

  const selectAllBulk = () => {
    setSelectedBulkEmails(filteredBulkEmails);
  };

  const clearBulk = () => {
    setSelectedBulkEmails([]);
  };

  const applyBulkToInput = () => {
    if (selectedBulkEmails.length === 0) {
      toast.error('No users selected in bulk list');
      return;
    }
    setUserKey(selectedBulkEmails.join(', '));
    toast.success(`Applied ${selectedBulkEmails.length} users to input`);
  };

  const copyCodes = async () => {
    if (!activeCodes.length) {
      toast.error('No active codes to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(activeCodes.join('\n'));
      toast.success('Backup codes copied to clipboard');
    } catch {
      toast.error('Cannot copy to clipboard');
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Backup Codes Management</h1>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Button
              variant="outline"
              onClick={fetchSavedCodes}
              disabled={loading || actionLoading}
              className="inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Saved Users" value={String(metrics.totalRecords)} subtitle="In backup file" />
          <MetricCard title="Active Records" value={String(metrics.activeRecords)} subtitle="Ready to use" />
          <MetricCard title="Invalidated" value={String(metrics.invalidatedRecords)} subtitle="Marked revoked" />
          <MetricCard title="Total Codes" value={String(metrics.totalCodes)} subtitle="Across all users" />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Manage by User</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1.8fr_auto_auto_auto] gap-3">
              <Select
                value={userKey || 'manual'}
                onValueChange={(value) => {
                  if (value === 'manual') return;
                  setUserKey(value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Quick select account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual input</SelectItem>
                  {availableEmails.map((email) => (
                    <SelectItem key={email} value={email}>
                      {email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                value={userKey}
                onChange={(event) => setUserKey(event.target.value)}
                placeholder="Enter user email (example: student01@school.edu)"
              />
              <Button
                variant="outline"
                disabled={actionLoading}
                onClick={() => loadLiveCodes(userKey)}
                className="inline-flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                Load Active
              </Button>
              <Button
                disabled={actionLoading}
                onClick={() => generateCodes(userKey)}
                className="inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Generate New
              </Button>
              <Button
                variant="destructive"
                disabled={actionLoading}
                onClick={() => invalidateCodes(userKey)}
                className="inline-flex items-center gap-2"
              >
                <Ban className="w-4 h-4" />
                Invalidate All
              </Button>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="inline-flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {selectedBulkEmails.length > 0 ? `Bulk selected: ${selectedBulkEmails.length}` : 'Bulk select users'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80">
                  <DropdownMenuLabel>Select users for bulk action</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 pb-2">
                    <Input
                      value={bulkSearch}
                      onChange={(event) => setBulkSearch(event.target.value)}
                      placeholder="Search user email"
                    />
                  </div>
                  <div className="px-2 py-1 flex items-center gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={selectAllBulk}>
                      Select all visible
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={clearBulk}>
                      Clear
                    </Button>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="max-h-64 overflow-y-auto">
                    {filteredBulkEmails.length === 0 ? (
                      <div className="px-2 py-3 text-xs text-muted-foreground">No users matched your search.</div>
                    ) : null}
                    {filteredBulkEmails.map((email) => (
                      <DropdownMenuCheckboxItem
                        key={email}
                        checked={selectedBulkEmails.includes(email)}
                        onCheckedChange={() => toggleBulkEmail(email)}
                      >
                        {email}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" onClick={applyBulkToInput} disabled={selectedBulkEmails.length === 0}>
                Apply selected to input
              </Button>
              <div className="text-xs text-muted-foreground">
                Tip: after applying, the action buttons will run for all selected users.
              </div>
            </div>

            <div className="rounded-md border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Selected User</div>
                  <div className="font-medium">{activeUser || '-'}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyCodes}
                  disabled={activeCodes.length === 0}
                  className="inline-flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Codes
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {securityStatus ? (
                  <>
                    <Badge variant={securityStatus.isEnrolledIn2Sv ? 'default' : 'secondary'}>
                      2SV Enrolled: {securityStatus.isEnrolledIn2Sv ? 'Yes' : 'No'}
                    </Badge>
                    <Badge variant={securityStatus.isEnforcedIn2Sv ? 'default' : 'secondary'}>
                      2SV Enforced: {securityStatus.isEnforcedIn2Sv ? 'Yes' : 'No'}
                    </Badge>
                  </>
                ) : (
                  <Badge variant="secondary">2SV status unavailable</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {activeCodes.length > 0 ? (
                  activeCodes.map((code) => (
                    <div
                      key={code}
                      className="font-mono text-center text-base rounded-md border bg-muted/30 px-3 py-2"
                    >
                      {code}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground col-span-full py-2">
                    No active codes loaded.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Saved Backup Codes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by user email"
            />
            <BackupCodesTable rows={filteredRows} loading={loading} onLoadCodes={loadLiveCodes} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
