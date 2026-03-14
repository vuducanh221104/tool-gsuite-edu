"use client";

import React from 'react';
import { Sidebar } from '@Client/components/dashboard/Sidebar';
import { ModeToggle } from '@Client/components/theme/ModeToggle';
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
import { MetricCard } from '@Client/components/dashboard/MetricCard';
import { useMailbox } from '@Client/hooks/useMailbox';
import { Mail, RefreshCw, ChevronLeft, ChevronRight, Users, ChevronDown, ChevronUp } from 'lucide-react';

function formatDate(value: string) {
  if (!value) return '-';
  const asNumber = Number(value);
  if (Number.isFinite(asNumber) && asNumber > 0) {
    return new Date(asNumber).toLocaleString();
  }
  return value;
}

function cleanBodyText(rawText?: string) {
  if (!rawText) return '';
  return rawText
    .replace(/\[image:[^\]]+\]/gi, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function renderTextWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s<>")]+)/g;
  const segments = text.split(urlRegex);

  return segments.map((segment, index) => {
    const isUrl = /^https?:\/\//.test(segment);
    if (!isUrl) {
      return <React.Fragment key={`txt-${index}`}>{segment}</React.Fragment>;
    }

    return (
      <a
        key={`url-${index}`}
        href={segment}
        target="_blank"
        rel="noreferrer"
        className="text-primary underline underline-offset-2 break-all"
      >
        {segment}
      </a>
    );
  });
}

function renderReadableBody(rawText?: string) {
  const cleaned = cleanBodyText(rawText);
  if (!cleaned) {
    return <div className="text-muted-foreground">No readable content.</div>;
  }

  const paragraphs = cleaned.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, paragraphIndex) => {
        const lines = paragraph.split('\n');

        return (
          <p key={`p-${paragraphIndex}`} className="leading-7 text-[15px] text-foreground/95">
            {lines.map((line, lineIndex) => (
              <React.Fragment key={`l-${paragraphIndex}-${lineIndex}`}>
                {renderTextWithLinks(line)}
                {lineIndex < lines.length - 1 ? <br /> : null}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export default function MailboxPage() {
  const [bulkSearch, setBulkSearch] = React.useState('');
  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});

  const {
    userEmail,
    setUserEmail,
    query,
    setQuery,
    availableEmails,
    selectedBulkEmails,
    isBulkMode,
    messages,
    selectedMessage,
    loading,
    detailLoading,
    currentPage,
    nextPageToken,
    tokenHistory,
    resultSizeEstimate,
    loadAvailableEmails,
    toggleBulkEmail,
    clearBulkSelection,
    selectAllBulkEmails,
    loadMessages,
    openMessage,
    goToNextPage,
    goToPreviousPage,
  } = useMailbox();

  React.useEffect(() => {
    loadAvailableEmails();
  }, [loadAvailableEmails]);

  const filteredBulkEmails = React.useMemo(() => {
    const keyword = bulkSearch.trim().toLowerCase();
    if (!keyword) {
      return availableEmails;
    }
    return availableEmails.filter((email) => email.toLowerCase().includes(keyword));
  }, [availableEmails, bulkSearch]);

  const groupedMessages = React.useMemo(() => {
    const groups = new Map<string, typeof messages>();

    for (const message of messages) {
      const mailbox = message.mailboxUser || userEmail || 'Unknown mailbox';
      if (!groups.has(mailbox)) {
        groups.set(mailbox, []);
      }
      groups.get(mailbox)?.push(message);
    }

    const orderedMailboxes = Array.from(groups.keys()).sort((a, b) => {
      const aIdx = selectedBulkEmails.indexOf(a);
      const bIdx = selectedBulkEmails.indexOf(b);

      if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
      if (aIdx >= 0) return -1;
      if (bIdx >= 0) return 1;
      return a.localeCompare(b);
    });

    return orderedMailboxes.map((mailbox) => ({
      mailbox,
      items: groups.get(mailbox) || [],
    }));
  }, [messages, selectedBulkEmails, userEmail]);

  const toggleGroupCollapsed = React.useCallback((mailbox: string) => {
    setCollapsedGroups((previous) => ({
      ...previous,
      [mailbox]: !previous[mailbox],
    }));
  }, []);

  const renderMessageCard = (message: (typeof messages)[number]) => {
    const active =
      selectedMessage?.id === message.id &&
      (selectedMessage?.mailboxUser || userEmail) === (message.mailboxUser || userEmail);

    return (
      <button
        key={`${message.mailboxUser || userEmail}:${message.id}`}
        type="button"
        onClick={() => openMessage(message.id, message.mailboxUser)}
        className={`w-full text-left rounded-md border p-3 transition-colors ${
          active ? 'bg-muted border-primary/40' : 'hover:bg-muted/40'
        }`}
      >
        <div className="font-medium truncate">{message.subject || '(No subject)'}</div>
        {message.mailboxUser ? (
          <div className="text-xs text-muted-foreground truncate mt-1">Mailbox: {message.mailboxUser}</div>
        ) : null}
        <div className="text-xs text-muted-foreground truncate mt-1">From: {message.from || '-'}</div>
        <div className="text-xs text-muted-foreground truncate">Date: {formatDate(message.internalDate || message.date)}</div>
        <div className="text-sm text-muted-foreground mt-2 line-clamp-2">{message.snippet}</div>
      </button>
    );
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Mailbox Viewer</h1>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Button variant="outline" onClick={() => loadMessages()} disabled={loading} className="inline-flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard title="Messages (Current Page)" value={String(messages.length)} subtitle="Loaded from Gmail" />
          <MetricCard title="Estimated Total" value={String(resultSizeEstimate)} subtitle="Result size estimate" />
          <MetricCard title="Current Page" value={String(currentPage)} subtitle={isBulkMode ? 'Bulk mode' : 'Token-based pagination'} />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Select Mailbox</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1.2fr_1.6fr_1.6fr_auto] gap-3">
              <Select
                value={userEmail || 'manual'}
                onValueChange={(value) => {
                  if (value === 'manual') {
                    return;
                  }
                  setUserEmail(value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Quick select mailbox" />
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
                value={userEmail}
                onChange={(event) => setUserEmail(event.target.value)}
                placeholder="User email (example: teacher01@school.edu)"
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="justify-start inline-flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {selectedBulkEmails.length > 0 ? `Bulk selected: ${selectedBulkEmails.length}` : 'Select bulk mailboxes'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80">
                  <DropdownMenuLabel>Bulk mailbox selection</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 pb-2">
                    <Input
                      value={bulkSearch}
                      onChange={(event) => setBulkSearch(event.target.value)}
                      placeholder="Search mailbox email"
                    />
                  </div>
                  <div className="px-2 py-1 flex items-center gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={selectAllBulkEmails}>
                      Select all
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={clearBulkSelection}>
                      Clear
                    </Button>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="max-h-64 overflow-y-auto">
                    {filteredBulkEmails.length === 0 ? (
                      <div className="px-2 py-3 text-xs text-muted-foreground">No mailbox matched your search.</div>
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

              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Gmail query (example: newer_than:7d or from:principal@school.edu)"
              />
              <Button onClick={() => loadMessages()} disabled={loading} className="inline-flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Load Mailbox
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={loading || tokenHistory.length === 0 || isBulkMode}>
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextPage} disabled={loading || !nextPageToken || isBulkMode}>
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Badge variant="secondary">Page {currentPage}</Badge>
              {isBulkMode ? <Badge variant="outline">Bulk mode</Badge> : null}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="text-sm text-muted-foreground py-6">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-6">No messages found for this mailbox/query.</div>
                ) : isBulkMode ? (
                  <div className="space-y-4">
                    {groupedMessages.map((group) => (
                      <div key={group.mailbox} className="space-y-2">
                        <div className="flex items-center justify-between sticky top-0 bg-background py-1 z-10">
                          <div className="text-sm font-semibold truncate">{group.mailbox}</div>
                          <div className="inline-flex items-center gap-2">
                            <Badge variant="secondary">{group.items.length}</Badge>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 px-2"
                              onClick={() => toggleGroupCollapsed(group.mailbox)}
                            >
                              {collapsedGroups[group.mailbox] ? (
                                <>
                                  <ChevronDown className="h-3 w-3" /> Expand
                                </>
                              ) : (
                                <>
                                  <ChevronUp className="h-3 w-3" /> Collapse
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        {!collapsedGroups[group.mailbox] ? <div className="space-y-2">{group.items.map((message) => renderMessageCard(message))}</div> : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  messages.map((message) => renderMessageCard(message))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Message Detail</CardTitle>
            </CardHeader>
            <CardContent>
              {detailLoading ? (
                <div className="text-sm text-muted-foreground py-6">Loading message detail...</div>
              ) : !selectedMessage ? (
                <div className="text-sm text-muted-foreground py-6">Select a message to view content.</div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border bg-muted/20 p-4">
                    <div className="text-xs font-medium tracking-wide uppercase text-muted-foreground">Subject</div>
                    <div className="mt-1 text-lg font-semibold leading-7">{selectedMessage.subject || '(No subject)'}</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-md border p-3 bg-background">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Mailbox</div>
                      <div className="mt-1 break-all font-medium">{selectedMessage.mailboxUser || userEmail || '-'}</div>
                    </div>
                    <div className="rounded-md border p-3 bg-background">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">From</div>
                      <div className="mt-1 break-all font-medium">{selectedMessage.from || '-'}</div>
                    </div>
                    <div className="rounded-md border p-3 bg-background">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">To</div>
                      <div className="mt-1 break-all font-medium">{selectedMessage.to || '-'}</div>
                    </div>
                    <div className="rounded-md border p-3 bg-background">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Date</div>
                      <div className="mt-1 font-medium">{formatDate(selectedMessage.internalDate || selectedMessage.date)}</div>
                    </div>
                  </div>

                  {selectedMessage.snippet ? (
                    <div className="rounded-md border bg-muted/30 p-3">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Snippet</div>
                      <div className="mt-1 text-sm leading-6 text-foreground/85">{selectedMessage.snippet}</div>
                    </div>
                  ) : null}

                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Body</div>
                    <div className="rounded-md border bg-background p-4 break-words max-h-[500px] overflow-y-auto">
                      {renderReadableBody(selectedMessage.bodyText || selectedMessage.snippet)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
