import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import HomeLayout from '@/layout/home/HomeLayout';
import { useMatchMedia } from '@/hooks/useMatchMedia';
import { useGetChatsQuery } from '@/redux/chat';
import type { Chat } from '@/redux/chat/types';
import { useAppSelector } from '@/hooks/redux-hooks';
import { connectChatSocket } from '@/services/chatSocket';
import { formatDistanceToNow } from 'date-fns';
import ChatThread from './ChatThread';

const Inbox = () => {
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const currentUserId = user?.id ?? '';
  const { data, isLoading, refetch } = useGetChatsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const refetchForOpenChatAttempted = useRef<string | null>(null);

  const chats = data?.chats ?? [];
  const openChatId = (location.state as { openChatId?: string })?.openChatId;

  // Connect socket when user is on Inbox
  useEffect(() => {
    if (currentUserId) connectChatSocket();
  }, [currentUserId]);

  // Auto-select chat when navigating with openChatId (e.g. store Message / booking)
  useEffect(() => {
    if (!openChatId) {
      refetchForOpenChatAttempted.current = null;
      return;
    }

    const trySelect = (list: Chat[]) => {
      const chat = list.find((c) => c.chatId === openChatId || c.id === openChatId);
      if (chat) {
        setSelectedChat(chat);
        window.history.replaceState({}, document.title, location.pathname);
        return true;
      }
      return false;
    };

    if (isLoading) return;

    if (trySelect(chats)) return;

    // Newly created chat may not be in cache yet — refetch at most once per openChatId
    if (refetchForOpenChatAttempted.current !== openChatId) {
      refetchForOpenChatAttempted.current = openChatId;
      refetch()
        .unwrap()
        .then((res) => {
          if (res?.chats) trySelect(res.chats);
        })
        .catch(() => {
          /* ignore */
        });
    }
  }, [openChatId, chats, isLoading, refetch]);

  const getChatDisplayName = (chat: Chat) => {
    const other = user?.activeRole === 'customer' ? {
      id: chat.store?._id,
      firstName: chat.store?.name,
      lastName: '',
      profileImageUrl: chat.store?.bannerImageUrl ?? ''
    } : chat.participants.find((p) => p._id !== currentUserId);
    if (other) return `${other.firstName} ${other.lastName}`.trim() || 'Unknown';
    return chat.title || 'Chat';
  };

  const getChatProfileImage = (chat: Chat) => {
    return user?.activeRole === 'customer' ? chat.store?.bannerImageUrl ?? '' : chat.participants.find((p) => p._id !== currentUserId)?.profileImageUrl ?? '';
  }

  const getChatSubtitle = (chat: Chat) => {
    if (chat.lastMessage) {
      const prefix = chat.lastMessage.type === 'image' ? 'Photo' : ( chat?.lastMessage?.sender === currentUserId ? `You: ${chat?.lastMessage?.content ?? ""}` : '' + (chat.lastMessage.content ?? ''));
      return prefix.length > 40 ? `${prefix.slice(0, 40)}...` : prefix;
    }
    return 'No messages yet';
  };

  const isNarrowScreen = useMatchMedia('(max-width: 767px)');

  return (
    <HomeLayout isLoading={false} showNavBar={true} showSearch={false}>
      <div className="flex flex-col md:flex-row min-h-0 w-full h-[calc(100dvh-5.5rem)] max-h-[calc(100dvh-5.5rem)] sm:h-[calc(100dvh-6rem)] sm:max-h-[calc(100dvh-6rem)] md:h-[calc(100dvh-6.5rem)] md:max-h-[calc(100dvh-6.5rem)]">
        {/* Chat list */}
        <div
          className={`w-full md:w-[min(100%,400px)] md:min-w-[260px] md:max-w-[400px] md:shrink-0 border-[#F0F0F0] flex flex-col min-h-0 px-3 sm:px-4 py-4 md:py-8  md:border-b-0 md:border-r md:h-full ${
            selectedChat && isNarrowScreen
              ? 'hidden'
              : 'flex max-h-[min(44vh,420px)] md:max-h-none'
          }`}
        >
          <p className={`md:-mt-0 text-[1.25rem] sm:text-[1.35rem] md:text-2xl tracking-tight font-semibold text-[#1D2739] font-[lora] pb-3 md:pb-4 ${user?.activeRole === 'customer' ? '-mt-12' : ''}`}>
            Inbox
          </p>
          {isLoading ? (
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-0">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="w-full px-3 py-3 rounded-xl flex items-center gap-3 animate-pulse"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0 skeleton-shimmer" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="h-4 bg-gray-200 rounded w-32 skeleton-shimmer" />
                      <div className="h-3 bg-gray-200 rounded w-12 shrink-0 skeleton-shimmer" />
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-full max-w-[200px] skeleton-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : chats.length === 0 ? (
            <div className="text-[#6C6C6C] text-[13px] sm:text-[14px] py-3 sm:py-4 font-medium leading-snug">
              No conversations yet. Start a chat from a provider or booking.
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-0">
              {chats.map((chat) => {
                const isSelected = selectedChat?.id === chat.id;
                return (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => setSelectedChat(chat)}
                    className={`w-full text-left px-2.5 sm:px-3 py-2.5 sm:py-3 rounded-xl transition-colors flex items-center gap-2 sm:gap-3 touch-manipulation ${
                      isSelected ? 'bg-[#E7F6EC]' : 'hover:bg-gray-50 active:bg-gray-100'
                    }`}
                  >
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#E7F6EC] flex items-center justify-center text-primary font-semibold text-base sm:text-[18px] shrink-0">
                      <img src={getChatProfileImage(chat)} alt="" className="w-full h-full object-cover rounded-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[14px] font-semibold text-[#1D2739] truncate">
                          {getChatDisplayName(chat)}
                        </p>
                        {chat.lastMessageAt && (
                          <span className="text-[12px] text-[#98A2B3] shrink-0">
                            {formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: false })}
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] text-[#6C6C6C] font-medium truncate mt-0.5">
                        {getChatSubtitle(chat)}
                      </p>
                    </div>
                    {chat.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
                        {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Thread or empty state */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col bg-white">
          {selectedChat ? (
            <ChatThread
              chat={selectedChat}
              onBack={isNarrowScreen ? () => setSelectedChat(null) : undefined}
            />
          ) : (
            <div className="hidden md:flex-1 md:flex items-center justify-center text-[#98A2B3] text-[13px] sm:text-[14px] md:text-[15px] font-medium px-4 text-center max-w-md mx-auto">
              Select a conversation or start a new chat from a provider profile.
            </div>
          )}
        </div>
      </div>
    </HomeLayout>
  );
};

export default Inbox;
