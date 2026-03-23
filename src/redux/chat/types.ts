export type ChatType = 'general' | 'booking' | 'support';

export interface ChatParticipant {
  id: any;
  _id: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
}

export interface LastMessage {
  id: string;
  content: string | null;
  type: 'text' | 'image';
  imageUrl: string | null;
  imageCaption: string | null;
  sender: string;
  createdAt: string;
  isRead: boolean;
}

export interface Chat {
  id: string;
  chatId: string;
  participants: ChatParticipant[];
  type: ChatType;
  booking: { bookingReference: string; service: string } | null;
  store: {
    name: string;
    bannerImageUrl?: string | null;
    _id?: string;
    id?: string;
  } | null;
  lastMessageAt: string;
  isActive: boolean;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessage: LastMessage | null;
  unreadCount: number;
}

export interface Message {
  id: string;
  sender: ChatParticipant;
  chatId: string;
  type: 'text' | 'image';
  content: string | null;
  imageUrl: string | null;
  imageCaption: string | null;
  isRead: boolean;
  readAt: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatsMeta {
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CreateChatPayload {
  participants: string[];
  type?: ChatType;
  bookingId?: string;
  storeId?: string;
  title?: string;
}

export interface SendMessagePayload {
  type: 'text' | 'image';
  content?: string;
  imageUrl?: string;
  imageCaption?: string;
}
