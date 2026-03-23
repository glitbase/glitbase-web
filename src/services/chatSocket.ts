import { io, Socket } from 'socket.io-client';
import type { Message } from '@/redux/chat/types';

const getAccessToken = (): string | null => {
  try {
    const tokensString = localStorage.getItem('tokens');
    if (!tokensString) return null;
    const tokens = JSON.parse(tokensString);
    return tokens?.accessToken ?? null;
  } catch {
    return null;
  }
};

let socket: Socket | null = null;

export function getChatSocket(): Socket | null {
  return socket;
}

export function connectChatSocket(): Socket | null {
  if (socket?.connected) return socket;
  const token = getAccessToken();
  if (!token) return null;
  const baseUrl = import.meta.env.VITE_API_URL ?? '';
  if (!baseUrl) return null;
  socket = io(baseUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
  return socket;
}

export function disconnectChatSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinChat(chatId: string): void {
  socket?.emit('join_chat', { chatId });
}

export function leaveChat(chatId: string): void {
  socket?.emit('leave_chat', { chatId });
}

export function sendMessageSocket(chatId: string, message: { type: 'text' | 'image'; content?: string; imageUrl?: string; imageCaption?: string }): void {
  socket?.emit('send_message', { chatId, message });
}

export function emitTypingStart(chatId: string): void {
  socket?.emit('typing_start', { chatId });
}

export function emitTypingStop(chatId: string): void {
  socket?.emit('typing_stop', { chatId });
}

export type NewMessageHandler = (payload: { chatId: string; message: Message }) => void;
export type MessageSentHandler = (payload: { chatId: string; message: Message }) => void;
export type UserTypingHandler = (payload: { chatId: string; userId: string; isTyping: boolean }) => void;
export type SocketErrorHandler = (payload: { message: string }) => void;

export function onNewMessage(cb: NewMessageHandler): () => void {
  if (!socket) return () => {};
  socket.on('new_message', cb);
  return () => socket?.off('new_message', cb);
}

export function onMessageSent(cb: MessageSentHandler): () => void {
  if (!socket) return () => {};
  socket.on('message_sent', cb);
  return () => socket?.off('message_sent', cb);
}

export function onUserTyping(cb: UserTypingHandler): () => void {
  if (!socket) return () => {};
  socket.on('user_typing', cb);
  return () => socket?.off('user_typing', cb);
}

export function onSocketError(cb: SocketErrorHandler): () => void {
  if (!socket) return () => {};
  socket.on('error', cb);
  return () => socket?.off('error', cb);
}
