export type NotificationType =
  | 'booking_confirmation'
  | 'provider_update'
  | 'new_message'
  | 'new_order'
  | 'order_update'
  | 'payment_confirmation';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  body?: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetNotificationsRequest {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: NotificationType;
  /** Used only for cache key so notifications refetch when user changes (e.g. after logout/login). */
  userId?: string;
}

export interface MarkNotificationsReadRequest {
  notificationIds: string[];
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface MarkReadResponse {
  matchedCount: number;
  modifiedCount: number;
}
