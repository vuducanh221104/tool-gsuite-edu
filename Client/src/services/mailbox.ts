import { api } from '@Client/lib/axios';
import type { ApiEnvelope, MailboxListData, MailboxMessageDetail } from '@Client/types/mailbox';

export async function listMailboxMessages(userKey: string, params?: { q?: string; pageToken?: string; maxResults?: number }) {
  const res = await api.get(`/api/mailbox/${encodeURIComponent(userKey)}/messages`, { params });
  return res.data as ApiEnvelope<MailboxListData>;
}

export async function getMailboxMessage(userKey: string, messageId: string) {
  const res = await api.get(`/api/mailbox/${encodeURIComponent(userKey)}/messages/${encodeURIComponent(messageId)}`);
  return res.data as ApiEnvelope<MailboxMessageDetail>;
}
