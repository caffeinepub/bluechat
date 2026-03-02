export type CallType = 'voice' | 'video';
export type CallDirection = 'outgoing' | 'incoming';

export interface CallHistoryEntry {
  id: string;
  contactId: string;
  contactName: string;
  contactAvatar?: string;
  callType: CallType;
  timestamp: number;
  duration: number; // seconds
  direction: CallDirection;
}

const STORAGE_KEY = 'xeta_call_history';

export function readCallHistory(): CallHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CallHistoryEntry[];
  } catch {
    return [];
  }
}

export function writeCallHistory(entries: CallHistoryEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function addCallHistoryEntry(entry: CallHistoryEntry): void {
  const existing = readCallHistory();
  writeCallHistory([entry, ...existing].slice(0, 200));
}
