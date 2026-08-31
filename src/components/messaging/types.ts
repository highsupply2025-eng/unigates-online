export type MessagePayloadType = 'text' | 'voice' | 'image' | 'file' | 'call_log';

export interface RichMessageData {
  type: MessagePayloadType;
  text?: string;
  url?: string;
  fileName?: string;
  fileSize?: number;
  fileMime?: string;
  duration?: number; // for voice in seconds
  callType?: 'video' | 'audio';
  callStatus?: 'completed' | 'missed' | 'declined';
  callDuration?: number; // in seconds
  reactions?: Record<string, string[]>; // emoji -> array of user_ids
}

export interface Contact {
  user_id: string;
  full_name: string;
  specific_role: string;
  email: string | null;
  photo_url: string | null;
  isAdmin?: boolean;
  department_name?: string;
  isOnline?: boolean;
  lastActive?: string;
  unreadCount?: number;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  parsed?: RichMessageData;
}

export function parseMessageContent(raw: string): RichMessageData {
  if (!raw) return { type: 'text', text: '' };
  if (raw.startsWith('__UG_RICH_MSG__')) {
    try {
      const json = raw.substring('__UG_RICH_MSG__'.length);
      return JSON.parse(json) as RichMessageData;
    } catch (e) {
      console.warn("Failed to parse rich message:", e);
      return { type: 'text', text: raw };
    }
  }
  // If it's pure JSON starting with {"type":
  if (raw.startsWith('{"type":') && raw.endsWith('}')) {
    try {
      return JSON.parse(raw) as RichMessageData;
    } catch {
      return { type: 'text', text: raw };
    }
  }
  return { type: 'text', text: raw };
}

export function serializeMessage(payload: RichMessageData): string {
  return `__UG_RICH_MSG__${JSON.stringify(payload)}`;
}

export function formatSeconds(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
