import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppSelector } from '@/hooks/redux-hooks';
import {
  useGetMessagesQuery,
  useSendMessageMutation,
  useMarkChatReadMutation,
  useDeleteMessageMutation,
  chatApi,
} from '@/redux/chat';
import type { Chat, Message } from '@/redux/chat/types';
import {
  connectChatSocket,
  joinChat,
  leaveChat,
  emitTypingStart,
  emitTypingStop,
  onNewMessage,
  onMessageSent,
  onUserTyping,
} from '@/services/chatSocket';
import { format } from 'date-fns';
import { Send, Trash2 } from 'lucide-react';
import { useAppDispatch } from '@/hooks/redux-hooks';

const TYPING_DEBOUNCE_MS = 400;

interface ChatThreadProps {
  chat: Chat;
  onBack?: () => void;
}

export default function ChatThread({ chat, onBack }: ChatThreadProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const currentUserId = user?.id ?? '';
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading } = useGetMessagesQuery({ chatId: chat.chatId });
  const [sendMessage, { isLoading: sending }] = useSendMessageMutation();
  const [markRead] = useMarkChatReadMutation();
  const [deleteMessage] = useDeleteMessageMutation();
  const [olderMessages, setOlderMessages] = useState<Message[]>([]);
  const [nextOlderPage, setNextOlderPage] = useState(2);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [fetchOlder, { isFetching: loadingOlder }] = chatApi.useLazyGetMessagesQuery();

  // Reset older messages and optimistic when switching chat
  useEffect(() => {
    setOlderMessages([]);
    setNextOlderPage(2);
    setOptimisticMessages([]);
  }, [chat.chatId]);

  const currentPageMessages = data?.messages ?? [];
  const messages = [...olderMessages, ...currentPageMessages, ...optimisticMessages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const hasNextPage = data?.meta?.hasNextPage ?? false;

  // Mark as read on open
  useEffect(() => {
    markRead(chat.chatId);
  }, [chat.chatId, markRead]);

  // Socket: connect, join, leave
  useEffect(() => {
    const s = connectChatSocket();
    if (!s) return;
    joinChat(chat.chatId);
    return () => leaveChat(chat.chatId);
  }, [chat.chatId]);

  // New message from socket -> update cache
  useEffect(() => {
    const unsub = onNewMessage(({ chatId, message: msg }) => {
      if (chatId !== chat.chatId) return;
      dispatch(
        // @ts-expect-error RTK util thunk vs AppDispatch
        chatApi.util.updateQueryData(
          'getMessages',
          { chatId },
          (draft) => {
            if (!draft.messages.some((m) => m.id === msg.id)) {
              draft.messages.push(msg);
            }
          }
        )
      );
      dispatch(chatApi.util.invalidateTags([{ type: 'Chats', id: 'LIST' }]));
    });
    return unsub;
  }, [chat.chatId, dispatch]);

  // Message sent confirmation (if we use socket send) -> already added optimistically or update
  useEffect(() => {
    const unsub = onMessageSent(({ chatId, message: msg }) => {
      if (chatId !== chat.chatId) return;
      dispatch(
        // @ts-expect-error RTK util thunk vs AppDispatch
        chatApi.util.updateQueryData(
          'getMessages',
          { chatId },
          (draft) => {
            const idx = draft.messages.findIndex((m) => m.id === msg.id);
            if (idx >= 0) draft.messages[idx] = msg;
            else draft.messages.push(msg);
          }
        )
      );
    });
    return unsub;
  }, [chat.chatId, dispatch]);

  // Typing indicator
  useEffect(() => {
    const unsub = onUserTyping(({ chatId, userId, isTyping }) => {
      if (chatId !== chat.chatId || userId === currentUserId) return;
      setTypingUserId(isTyping ? userId : null);
    });
    return unsub;
  }, [chat.chatId, currentUserId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const now = new Date().toISOString();
    const currentUserSender = {
      _id: currentUserId,
      id: currentUserId,
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      profileImageUrl: user?.profileImageUrl ?? null,
    };
    const optimisticMessage: Message = {
      id: tempId,
      sender: currentUserSender,
      chatId: chat.chatId,
      type: 'text',
      content: text,
      imageUrl: null,
      imageCaption: null,
      isRead: false,
      readAt: null,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };
    setOptimisticMessages((prev) => [...prev, optimisticMessage]);
    setInput('');
    emitTypingStop(chat.chatId);

    sendMessage({
      chatId: chat.chatId,
      payload: { type: 'text', content: text },
    })
      .unwrap()
      .then((res) => {
        const serverMessage = res.message;
        setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempId));
        dispatch(
          // @ts-expect-error RTK util thunk vs AppDispatch
          chatApi.util.updateQueryData(
            'getMessages',
            { chatId: chat.chatId },
            (draft) => {
              if (!draft.messages.some((m) => m.id === serverMessage.id)) {
                draft.messages.push(serverMessage);
              }
            }
          )
        );
        dispatch(chatApi.util.invalidateTags([{ type: 'Chats', id: 'LIST' }]));
      })
      .catch(() => {
        setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempId));
        setInput(text);
      });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const emitTyping = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    emitTypingStart(chat.chatId);
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStop(chat.chatId);
      typingTimeoutRef.current = null;
    }, TYPING_DEBOUNCE_MS);
  }, [chat.chatId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    emitTyping();
  };

  const handleDeleteMessage = (messageId: string) => {
    if (window.confirm('Delete this message?')) {
      deleteMessage({ chatId: chat.chatId, messageId });
    }
  };

  const store = chat.store as { _id?: string; name?: string; bannerImageUrl?: string } | null;
  const otherParticipant = user?.activeRole === 'customer' && store
    ? {
        _id: store._id ?? '',
        id: store._id ?? '',
        firstName: store.name ?? '',
        lastName: '',
        profileImageUrl: store.bannerImageUrl ?? null,
      }
    : chat.participants.find((p) => p._id !== currentUserId);

  const displayName = otherParticipant
    ? `${otherParticipant.firstName} ${otherParticipant.lastName}`.trim() || 'Unknown'
    : chat.title || 'Chat';

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col h-full min-h-0">
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-[#F0F0F0] shrink-0">
          {onBack && <div className="w-9 h-9 rounded-lg bg-gray-200 animate-pulse" />}
          <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse shrink-0" />
          <div className="h-4 bg-gray-200 rounded w-28 animate-pulse" />
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4 py-2 sm:py-3 flex flex-col gap-2 sm:gap-3 min-h-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`flex ${i % 3 === 0 ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`h-12 rounded-2xl animate-pulse ${
                  i % 3 === 0
                    ? 'w-48 rounded-br-md bg-gray-200'
                    : 'w-56 rounded-bl-md bg-gray-100'
                }`}
              />
            </div>
          ))}
        </div>
        <div className="shrink-0 px-3 sm:px-4 py-2.5 sm:py-3 border-t border-[#F0F0F0]">
          <div className="flex gap-2 items-end">
            <div className="flex-1 min-w-0 h-10 sm:h-11 rounded-xl bg-gray-200 animate-pulse" />
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gray-200 animate-pulse shrink-0" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-[#F0F0F0] shrink-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 -ml-0.5 rounded-lg hover:bg-gray-100 text-[#1D2739] touch-manipulation shrink-0"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E7F6EC] flex items-center justify-center text-primary font-semibold shrink-0">
          <img src={otherParticipant?.profileImageUrl ?? ''} alt="" className="w-full h-full object-cover rounded-full" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] sm:text-[14px] font-semibold text-[#1D2739] truncate">{displayName}</p>
          {typingUserId && (
            <p className="text-[11px] sm:text-[12px] text-primary">typing...</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4 py-2 sm:py-3 flex flex-col gap-2 sm:gap-3 min-h-0">
        {hasNextPage && (
          <div className="text-center">
            <button
              type="button"
              disabled={loadingOlder}
              className="text-[13px] sm:text-[14px] text-primary font-medium disabled:opacity-50 touch-manipulation"
              onClick={() => {
                const pageToLoad = nextOlderPage;
                setNextOlderPage((p) => p + 1);
                fetchOlder({ chatId: chat.chatId, page: pageToLoad }).then((res) => {
                  if (res.data?.messages?.length) {
                    setOlderMessages((prev) => [...prev, ...res.data!.messages]);
                  }
                });
              }}
            >
              {loadingOlder ? 'Loading...' : 'Load older messages'}
            </button>
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            isOwn={m.sender.id === currentUserId}
            onDelete={() => handleDeleteMessage(m.id)}
            canDelete={m.sender._id === currentUserId && !m.isDeleted && !String(m.id).startsWith('pending-')}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-3 sm:px-4 py-2.5 sm:py-3 border-t border-[#F0F0F0] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex gap-2 items-end max-w-full">
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 min-w-0 max-h-28 sm:max-h-32 bg-[#FAFAFA] font-medium resize-y rounded-xl px-3 py-3 sm:px-4 sm:py-3.5 text-[14px] text-[#1D2739] placeholder:text-[#98A2B3] focus:outline-none focus:ring-0 focus:border-primary"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary text-white flex items-center justify-center hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            <Send className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  isOwn,
  onDelete,
  canDelete,
}: {
  message: Message;
  isOwn: boolean;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const [showActions, setShowActions] = useState(false);

  if (message.isDeleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[min(92%,20rem)] sm:max-w-[75%] px-3 py-2 rounded-2xl bg-gray-100 text-gray-500 text-[13px] sm:text-[14px] italic">
          Message deleted
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div
        className={`flex items-end gap-1 max-w-[min(92%,20rem)] sm:max-w-[75%] ${isOwn ? 'flex-row-reverse' : ''}`}
      >
        <div
          className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-[13px] sm:text-[14px] font-medium ${
            isOwn
              ? 'bg-[#FF71AA] text-white rounded-br-sm'
              : 'bg-[#FAFAFA] text-[#3B3B3B] rounded-bl-md'
          }`}
        >
          {message.type === 'image' && message.imageUrl && (
            <a href={message.imageUrl} target="_blank" rel="noopener noreferrer" className="block mb-1">
              <img
                src={message.imageUrl}
                alt=""
                className="rounded-lg max-w-full max-h-40 sm:max-h-48 object-cover"
              />
            </a>
          )}
          {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
          {message.imageCaption && (
            <p className="text-[12px] opacity-90 mt-1">{message.imageCaption}</p>
          )}
          <p className={`text-[11px] mt-1 ${isOwn ? 'text-white/80' : 'text-gray-500'}`}>
            {format(new Date(message.createdAt), 'HH:mm')}
          </p>
        </div>
        {canDelete && showActions && (
          <button
            type="button"
            onClick={onDelete}
            className="p-1 rounded text-red-500 hover:bg-red-50"
            aria-label="Delete message"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
