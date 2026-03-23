import { useCallback } from 'react';
import HomeLayout from '@/layout/home/HomeLayout';
import { useAppSelector } from '@/hooks/redux-hooks';
import {
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
  useMarkAllNotificationsReadMutation,
  type Notification,
  type NotificationType,
} from '@/redux/notifications';
import {
  IoCalendarOutline,
  IoChatbubbleOutline,
  IoInformationCircleOutline,
  IoBagOutline,
  IoCardOutline,
  IoNotificationsOutline,
  IoCheckmarkDoneOutline,
} from 'react-icons/io5';

const formatRelativeTime = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays < 1) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return diffInMinutes < 1 ? 'now' : `${diffInMinutes}m ago`;
    }
    return `${diffInHours}h ago`;
  }
  if (diffInDays < 7) return `${diffInDays}d ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}mo ago`;
  return `${Math.floor(diffInDays / 365)}y ago`;
};

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'booking_confirmation':
      return { Icon: IoCalendarOutline, color: '#4CAF50' };
    case 'new_message':
      return { Icon: IoChatbubbleOutline, color: '#2196F3' };
    case 'provider_update':
      return { Icon: IoInformationCircleOutline, color: '#FF9800' };
    case 'new_order':
    case 'order_update':
      return { Icon: IoBagOutline, color: '#9C27B0' };
    case 'payment_confirmation':
      return { Icon: IoCardOutline, color: '#4CAF50' };
    default:
      return { Icon: IoNotificationsOutline, color: '#6C6C6C' };
  }
};

const groupNotificationsByDate = (notifications: Notification[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: { today: Notification[]; yesterday: Notification[]; older: Notification[] } = {
    today: [],
    yesterday: [],
    older: [],
  };

  notifications.forEach((notification) => {
    const notificationDate = new Date(notification.createdAt);
    notificationDate.setHours(0, 0, 0, 0);
    if (notificationDate.getTime() === today.getTime()) {
      groups.today.push(notification);
    } else if (notificationDate.getTime() === yesterday.getTime()) {
      groups.yesterday.push(notification);
    } else {
      groups.older.push(notification);
    }
  });

  return groups;
};

const Notifications = () => {
  const userId = useAppSelector((state) => state.auth.user?._id ?? state.auth.user?.id ?? '');
  const user = useAppSelector((state) => state.auth.user);
  const page = 1;
  const limit = 50;

  const { data, isLoading, isFetching, refetch } = useGetNotificationsQuery({
    page,
    limit,
    userId,
  });
  const [markRead] = useMarkNotificationsReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const notifications = data?.notifications ?? [];
  const grouped = groupNotificationsByDate(notifications);
  const hasUnread = notifications.some((n) => !n.isRead);

  const handleNotificationPress = useCallback(
    async (notification: Notification) => {
      if (!notification.isRead) {
        try {
          await markRead({ notificationIds: [notification.id] }).unwrap();
        } catch (err) {
          console.error('Failed to mark notification as read:', err);
        }
      }
    },
    [markRead]
  );

  const handleMarkAllRead = useCallback(async () => {
    if (!hasUnread) return;
    try {
      await markAllRead().unwrap();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, [hasUnread, markAllRead]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderNotificationItem = (notification: Notification) => {
    const { Icon, color } = getNotificationIcon(notification.type);
    const text = notification.body ?? notification.message ?? notification.title ?? '';

    return (
      <button
        key={notification.id}
        type="button"
        onClick={() => handleNotificationPress(notification)}
        className={`w-full text-left flex items-start gap-3 py-3 border-b border-[#F4F4F4] transition-colors hover:bg-gray-50 ${
          !notification.isRead ? 'bg-white' : 'bg-white'
        }`}
      >
        <span
          className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={18} style={{ color }} />
        </span>
        <div className="min-w-0 flex-1">
          {text && (
            <p className="text-[12px] md:text-[14px] font-medium text-[#1D2739] leading-5">
              {typeof text === 'string' ? text : String(text)}
            </p>
          )}
          <p className="text-[10px] md:text-[11px] font-medium text-[#98A2B3] mt-1">
            {formatRelativeTime(notification.createdAt)}
          </p>
        </div>
        {!notification.isRead && (
          <span className="shrink-0 w-2 h-2 rounded-full bg-red-500 mt-2" />
        )}
      </button>
    );
  };

  const renderSection = (title: string, items: Notification[]) => {
    if (items.length === 0) return null;
    return (
      <div key={title} className="pt-4">
        <p className="text-[11px] md:text-[13px] font-semibold text-[#98A2B3] pb-3 uppercase tracking-wide">
          {title}
        </p>
        {items.map(renderNotificationItem)}
      </div>
    );
  };

  const NotificationItemSkeleton = () => (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-[#F4F4F4] animate-pulse">
      <div className="shrink-0 w-10 h-10 rounded-full bg-gray-200" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full max-w-[85%]" />
        <div className="h-3 bg-gray-200 rounded w-16" />
      </div>
    </div>
  );

  const NotificationsListSkeleton = ({ count = 10 }: { count?: number }) => (
    <div className="pt-4">
      <div className="h-4 bg-gray-200 rounded w-20 mx-4 mb-3 animate-pulse" />
      {Array.from({ length: count }).map((_, i) => (
        <NotificationItemSkeleton key={i} />
      ))}
    </div>
  );

  if (isLoading && notifications.length === 0) {
    return (
      <HomeLayout isLoading={false} showNavBar={false}>
        <div className="max-w-[560px] px-4 py-8 flex flex-col min-h-[60vh]">
          <div className="flex items-center justify-between pb-4">
            <div className="h-7 bg-gray-200 rounded w-36 animate-pulse" />
          </div>
          <NotificationsListSkeleton count={10} />
        </div>
      </HomeLayout>
    );
  }

  return (
    <HomeLayout isLoading={false} showNavBar={true} showSearch={false}>
      <div className={`max-w-[560px] px-4 py-0 md:py-8 md:-mt-0 flex flex-col min-h-[60vh] ${user?.activeRole === 'customer' ? '-mt-6' : ''}`}>
        <div className="flex items-center justify-between pb-4">
          <h1 className="text-[18px] md:text-[24px] tracking-tight font-semibold text-[#1D2739] font-[lora]">
            Notifications
          </h1>
          {hasUnread && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 text-[12px] md:text-[14px] font-medium text-primary hover:underline"
            >
              <IoCheckmarkDoneOutline size={18} />
              Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div
            className="flex-1 flex flex-col items-center justify-center py-16 px-4 md:px-6 text-center"
            style={{ minHeight: 280 }}
          >
            <p className="text-[20px] font-semibold text-[#1D2739] font-[lora] mb-2 tracking-tight">
              No notifications yet
            </p>
            <p className="text-[15px] text-[#6C6C6C] max-w-[85%] font-medium">
              We&apos;ll notify you about booking updates, messages, and order status
            </p>
            <button
              type="button"
              onClick={onRefresh}
              disabled={isFetching}
              className="mt-6 text-[14px] font-medium text-primary hover:underline disabled:opacity-50"
            >
              {isFetching ? 'Refreshing...' : 'Tap to refresh'}
            </button>
          </div>
        ) : (
          <div className="flex-1">
            {renderSection('Today', grouped.today)}
            {renderSection('Yesterday', grouped.yesterday)}
            {renderSection('Older', grouped.older)}
            {isFetching && notifications.length > 0 && (
              <div className="pt-2">
                <NotificationsListSkeleton count={3} />
              </div>
            )}
          </div>
        )}
      </div>
    </HomeLayout>
  );
};

export default Notifications;
