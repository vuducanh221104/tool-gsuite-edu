export interface MailboxMessageSummary {
  id: string;
  threadId: string;
  mailboxUser?: string;
  snippet: string;
  internalDate: string;
  from: string;
  to: string;
  subject: string;
  date: string;
}

export interface MailboxMessageDetail extends MailboxMessageSummary {
  bodyText: string;
}

export interface MailboxListData {
  userKey: string;
  messages: MailboxMessageSummary[];
  nextPageToken: string | null;
  resultSizeEstimate: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}
