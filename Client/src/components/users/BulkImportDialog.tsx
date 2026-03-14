"use client";
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@Client/components/ui/dialog';
import { Button } from '@Client/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@Client/components/ui/tabs';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (users: Record<string, unknown>[]) => Promise<void>;
};

export function BulkImportDialog({ open, onOpenChange, onImport }: Props) {
  const [csvText, setCsvText] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleCSVParse = () => {
    if (!csvText.trim()) {
      toast.error('Please enter CSV data');
      return;
    }

    try {
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Validate headers
      const requiredHeaders = ['email', 'password', 'firstName', 'lastName'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        toast.error(`Missing required columns: ${missingHeaders.join(', ')}`);
        return;
      }

      const users: Record<string, unknown>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length === headers.length && lines[i].trim() !== '') {
          const user: Record<string, unknown> = {};
          headers.forEach((header, index) => {
            user[header] = values[index];
          });
          users.push(user);
        }
      }

      if (users.length === 0) {
        toast.error('No valid user data found');
        return;
      }

      handleImport(users);
    } catch (error) {
      toast.error('Failed to parse CSV: ' + (error as Error).message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleImport = async (users: Record<string, unknown>[]) => {
    setLoading(true);
    try {
      await onImport(users);
      onOpenChange(false);
      setCsvText('');
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Users</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="paste" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paste">Paste CSV</TabsTrigger>
            <TabsTrigger value="upload">Upload File</TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Paste your CSV data below. Required columns: <strong>email, password, firstName, lastName</strong>
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Example:
                <br />
                <code className="bg-muted px-2 py-1 rounded text-xs">
                  email,password,firstName,lastName,orgUnitPath
                  <br />
                  user1@example.edu,Pass123!,John,Doe,/Students
                  <br />
                  user2@example.edu,Pass456!,Jane,Smith,/Teachers
                </code>
              </p>
              <textarea
                className="w-full h-64 p-3 border rounded-md font-mono text-sm"
                placeholder="email,password,firstName,lastName&#10;user1@example.edu,Pass123!,John,Doe&#10;user2@example.edu,Pass456!,Jane,Smith"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCSVParse} disabled={loading}>
                {loading ? 'Processing...' : 'Import Users'}
              </Button>
              <Button variant="outline" onClick={() => setCsvText('')}>
                Clear
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload a CSV or Excel file (.csv, .xlsx)
              </p>
              <label className="inline-block">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button variant="outline" className="inline-flex items-center gap-2" asChild>
                  <span>
                    <Upload className="h-4 w-4" />
                    Choose File
                  </span>
                </Button>
              </label>
            </div>
            {csvText && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Preview:</p>
                <pre className="p-3 bg-muted rounded-md text-xs overflow-x-auto max-h-40">
                  {csvText.slice(0, 500)}
                  {csvText.length > 500 && '...'}
                </pre>
                <Button onClick={handleCSVParse} disabled={loading} className="w-full">
                  {loading ? 'Processing...' : 'Import Users'}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

