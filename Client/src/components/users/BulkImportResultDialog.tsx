"use client";
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@Client/components/ui/dialog';
import { Button } from '@Client/components/ui/button';
import { Badge } from '@Client/components/ui/badge';
import { CheckCircle2, XCircle, Download, Copy } from 'lucide-react';
import { message } from 'antd';
import type { BulkCreateResult } from '@Client/services/users';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: BulkCreateResult[];
};

export function BulkImportResultDialog({ open, onOpenChange, results }: Props) {
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  const exportToCSV = () => {
    const successful = results.filter(r => r.success);
    if (successful.length === 0) {
      message.error('No successful users to export');
      return;
    }

    const headers = ['Email', 'Password', 'Backup Codes'];
    const rows = successful.map(r => [
      r.email,
      r.password || '',
      (r.backupCodes || []).join('; ')
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-import-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('Results exported');
  };

  const copyAllCredentials = () => {
    const successful = results.filter(r => r.success);
    const text = successful.map(r => 
      `Email: ${r.email}\nPassword: ${r.password}\nBackup Codes: ${(r.backupCodes || []).join(', ')}\n`
    ).join('\n---\n\n');
    
    navigator.clipboard.writeText(text);
    message.success('All credentials copied to clipboard');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Results</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="flex gap-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span className="font-medium">{successCount} Successful</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <span className="font-medium">{failCount} Failed</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline" className="inline-flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export to CSV
            </Button>
            <Button onClick={copyAllCredentials} variant="outline" className="inline-flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Copy All Credentials
            </Button>
          </div>

          {/* Results List */}
          <div className="space-y-3">
            {results.map((result, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success 
                    ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-500 shrink-0" />
                    )}
                    <span className="font-mono text-sm font-medium text-foreground">{result.email}</span>
                  </div>
                  <Badge 
                    variant={result.success ? 'default' : 'destructive'}
                    className={result.success ? 'bg-green-600' : ''}
                  >
                    {result.success ? 'Success' : 'Failed'}
                  </Badge>
                </div>

                {result.success ? (
                  <div className="ml-7 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Password */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Password:
                        </label>
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border rounded px-3 py-2">
                          <span className="font-mono text-sm flex-1 select-all">
                            {result.password}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(result.password || '');
                              message.success('Password copied');
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Backup Codes Count */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Backup Codes ({result.backupCodes?.length || 0}):
                        </label>
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border rounded px-3 py-2">
                          <span className="text-sm flex-1">
                            {result.backupCodes?.length || 0} codes generated
                          </span>
                          {result.backupCodes && result.backupCodes.length > 0 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 shrink-0"
                              onClick={() => {
                                navigator.clipboard.writeText(result.backupCodes?.join(', ') || '');
                                message.success('Backup codes copied');
                              }}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Backup Codes Grid */}
                    {result.backupCodes && result.backupCodes.length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Codes:
                        </label>
                        <div className="bg-white dark:bg-gray-900 border rounded p-3 max-h-24 overflow-y-auto">
                          <div className="grid grid-cols-2 gap-2">
                            {result.backupCodes.map((code, i) => (
                              <code 
                                key={i}
                                className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded select-all"
                              >
                                {code}
                              </code>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="ml-7 text-sm text-red-700 dark:text-red-400 bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 rounded px-3 py-2">
                    <strong className="font-medium">Error:</strong> {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

