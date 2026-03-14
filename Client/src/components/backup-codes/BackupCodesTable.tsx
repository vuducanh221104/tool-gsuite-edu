"use client";

import React from 'react';
import { Badge } from '@Client/components/ui/badge';
import { Button } from '@Client/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@Client/components/ui/table';
import type { SavedBackupCodeEntry } from '@Client/types/backupCodes';

interface BackupCodesTableProps {
  rows: SavedBackupCodeEntry[];
  loading?: boolean;
  onLoadCodes: (email: string) => void;
}

type SortKey = 'email' | 'codes' | 'status' | 'updated';
type SortDirection = 'asc' | 'desc';

function formatDate(value?: string) {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleString();
}

export function BackupCodesTable({ rows, loading, onLoadCodes }: BackupCodesTableProps) {
  const [sortKey, setSortKey] = React.useState<SortKey>('updated');
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [rows, pageSize]);

  const sortedRows = React.useMemo(() => {
    const copied = [...rows];

    copied.sort((a, b) => {
      const aCount = a.codesCount || a.backupCodes?.length || 0;
      const bCount = b.codesCount || b.backupCodes?.length || 0;
      const aUpdated = a.invalidatedAt || a.generatedAt || a.retrievedAt || '';
      const bUpdated = b.invalidatedAt || b.generatedAt || b.retrievedAt || '';
      const aStatus = a.status || 'active';
      const bStatus = b.status || 'active';

      let result = 0;

      if (sortKey === 'email') {
        result = a.email.localeCompare(b.email);
      } else if (sortKey === 'codes') {
        result = aCount - bCount;
      } else if (sortKey === 'status') {
        result = aStatus.localeCompare(bStatus);
      } else {
        result = aUpdated.localeCompare(bUpdated);
      }

      return sortDirection === 'asc' ? result : -result;
    });

    return copied;
  }, [rows, sortDirection, sortKey]);

  const paginatedRows = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [currentPage, pageSize, sortedRows]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((previous) => (previous === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDirection('asc');
  };

  const sortMark = (key: SortKey) => {
    if (sortKey !== key) {
      return '';
    }
    return sortDirection === 'asc' ? '▲' : '▼';
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground py-8">Loading backup codes...</div>;
  }

  if (rows.length === 0) {
    return <div className="text-sm text-muted-foreground py-8">No saved backup codes found.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
        <div className="text-muted-foreground">
          Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, rows.length)} of {rows.length}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Rows per page</span>
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
          >
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>
                <button type="button" className="font-medium" onClick={() => handleSort('email')}>
                  Email {sortMark('email')}
                </button>
              </TableHead>
              <TableHead>
                <button type="button" className="font-medium" onClick={() => handleSort('codes')}>
                  Codes {sortMark('codes')}
                </button>
              </TableHead>
              <TableHead>
                <button type="button" className="font-medium" onClick={() => handleSort('status')}>
                  Status {sortMark('status')}
                </button>
              </TableHead>
              <TableHead>
                <button type="button" className="font-medium" onClick={() => handleSort('updated')}>
                  Last Updated {sortMark('updated')}
                </button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.map((row) => {
              const count = row.codesCount || row.backupCodes?.length || 0;
              const lastUpdated = row.invalidatedAt || row.generatedAt || row.retrievedAt;

              return (
                <TableRow key={row.email}>
                  <TableCell className="font-mono text-sm">{row.email}</TableCell>
                  <TableCell>{count}</TableCell>
                  <TableCell>
                    {row.status === 'invalidated' ? (
                      <Badge variant="destructive">Invalidated</Badge>
                    ) : (
                      <Badge className="bg-emerald-600 hover:bg-emerald-700">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(lastUpdated)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => onLoadCodes(row.email)}>
                      Load Active Codes
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <div className="text-sm text-muted-foreground">
          Page {currentPage} / {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((previous) => Math.min(totalPages, previous + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
