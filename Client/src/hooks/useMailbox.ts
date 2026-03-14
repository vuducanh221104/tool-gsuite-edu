import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { parseApiError } from '@Client/lib/utils';
import { getMailboxMessage, listMailboxMessages } from '@Client/services/mailbox';
import { listUsers } from '@Client/services/users';
import type { MailboxMessageDetail, MailboxMessageSummary } from '@Client/types/mailbox';

export function useMailbox() {
  const [userEmail, setUserEmail] = useState('');
  const [query, setQuery] = useState('');
  const [availableEmails, setAvailableEmails] = useState<string[]>([]);
  const [selectedBulkEmails, setSelectedBulkEmails] = useState<string[]>([]);
  const [messages, setMessages] = useState<MailboxMessageSummary[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<MailboxMessageDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [tokenHistory, setTokenHistory] = useState<string[]>([]);
  const [resultSizeEstimate, setResultSizeEstimate] = useState(0);

  const currentPage = useMemo(() => tokenHistory.length + 1, [tokenHistory.length]);
  const isBulkMode = selectedBulkEmails.length > 0;

  const loadAvailableEmails = useCallback(async () => {
    try {
      const response = await listUsers({ maxResults: 500, orderBy: 'email' });
      const emails = (response.users || [])
        .map((user) => user.primaryEmail)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      setAvailableEmails(emails);
    } catch (error) {
      toast.error(parseApiError(error) || 'Failed to load available emails');
    }
  }, []);

  const toggleBulkEmail = useCallback((email: string) => {
    setSelectedBulkEmails((previous) => {
      if (previous.includes(email)) {
        return previous.filter((item) => item !== email);
      }
      return [...previous, email];
    });
  }, []);

  const clearBulkSelection = useCallback(() => {
    setSelectedBulkEmails([]);
  }, []);

  const selectAllBulkEmails = useCallback(() => {
    setSelectedBulkEmails(availableEmails);
  }, [availableEmails]);

  const loadMessages = useCallback(
    async (options?: { pageToken?: string; keepHistory?: boolean; nextTokenForHistory?: string | null }) => {
      const normalizedEmail = userEmail.trim();
      const bulkTargets = selectedBulkEmails;

      if (!normalizedEmail && bulkTargets.length === 0) {
        toast.error('Please enter an email address');
        return;
      }

      setLoading(true);
      try {
        if (bulkTargets.length > 0) {
          const responses = await Promise.all(
            bulkTargets.map(async (email) => {
              const response = await listMailboxMessages(email, {
                q: query.trim() || undefined,
                maxResults: 20,
              });

              return {
                email,
                data: response.data,
              };
            })
          );

          const combined = responses
            .flatMap((item) =>
              (item.data?.messages || []).map((message) => ({
                ...message,
                mailboxUser: item.email,
              }))
            )
            .sort((a, b) => Number(b.internalDate || 0) - Number(a.internalDate || 0));

          const estimate = responses.reduce((sum, item) => sum + (item.data?.resultSizeEstimate || 0), 0);

          setMessages(combined);
          setNextPageToken(null);
          setResultSizeEstimate(estimate);
          setSelectedMessage(null);
          setTokenHistory([]);
          return;
        }

        const response = await listMailboxMessages(normalizedEmail, {
          q: query.trim() || undefined,
          pageToken: options?.pageToken,
          maxResults: 20,
        });

        const data = response.data;
        setMessages(data?.messages || []);
        setNextPageToken(data?.nextPageToken || null);
        setResultSizeEstimate(data?.resultSizeEstimate || 0);
        setSelectedMessage(null);

        if (options?.keepHistory && options.nextTokenForHistory) {
          setTokenHistory((prev) => [...prev, options.nextTokenForHistory]);
        } else if (!options?.keepHistory) {
          setTokenHistory([]);
        }
      } catch (error) {
        toast.error(parseApiError(error) || 'Failed to load mailbox messages');
      } finally {
        setLoading(false);
      }
    },
    [query, selectedBulkEmails, userEmail]
  );

  const openMessage = useCallback(
    async (messageId: string, mailboxUser?: string) => {
      const normalizedEmail = (mailboxUser || userEmail).trim();
      if (!normalizedEmail) return;

      setDetailLoading(true);
      try {
        const response = await getMailboxMessage(normalizedEmail, messageId);
        setSelectedMessage(response.data ? { ...response.data, mailboxUser: normalizedEmail } : null);
      } catch (error) {
        toast.error(parseApiError(error) || 'Failed to load message details');
      } finally {
        setDetailLoading(false);
      }
    },
    [userEmail]
  );

  const goToNextPage = useCallback(async () => {
    if (!nextPageToken || isBulkMode) return;
    await loadMessages({ pageToken: nextPageToken, keepHistory: true, nextTokenForHistory: nextPageToken });
  }, [isBulkMode, loadMessages, nextPageToken]);

  const goToPreviousPage = useCallback(async () => {
    if (tokenHistory.length === 0 || isBulkMode) return;

    const previousHistory = [...tokenHistory];
    previousHistory.pop();

    const previousToken = previousHistory[previousHistory.length - 1];
    setTokenHistory(previousHistory);

    await loadMessages({
      pageToken: previousToken,
      keepHistory: false,
    });

    setTokenHistory(previousHistory);
  }, [isBulkMode, loadMessages, tokenHistory]);

  return {
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
  };
}
