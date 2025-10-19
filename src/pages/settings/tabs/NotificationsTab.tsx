/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import {
  useUserProfileQuery,
  useUpdateNotificationPreferencesMutation,
} from '../../../redux/auth';

interface NotificationItem {
  key: string;
  title: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
}

interface NotificationSection {
  title: string;
  items: NotificationItem[];
}

const NotificationsTab = () => {
  const { data: profileData, refetch } = useUserProfileQuery({});
  const [updateNotificationPreferences, { isLoading }] =
    useUpdateNotificationPreferencesMutation();

  const user = profileData?.data?.user;
  const isVendor = user?.activeRole === 'vendor';

  // State for notification preferences
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});

  // Initialize preferences from user data
  useEffect(() => {
    if (user?.notificationPreferences) {
      setPreferences(user.notificationPreferences);
    }
  }, [user?.notificationPreferences]);

  // Define sections based on user type
  const sections: NotificationSection[] = useMemo(() => {
    if (isVendor) {
      return [
        {
          title: 'Orders & sales',
          items: [
            {
              key: 'newOrderNotifications',
              title: 'New order notifications',
              description: 'Get notified when customers place new orders',
              enabled: preferences.newOrderNotifications ?? false,
            },
            {
              key: 'orderUpdates',
              title: 'Order updates',
              description:
                'Received alerts when order status changes (processing, shipped, delivered)',
              enabled: preferences.orderUpdates ?? false,
            },
            {
              key: 'paymentConfirmations',
              title: 'Payment confirmations',
              description:
                'Get notified when payments are successfully processed',
              enabled: preferences.paymentConfirmations ?? false,
            },
          ],
        },
        {
          title: 'Inventory & products',
          items: [
            {
              key: 'lowStockAlerts',
              title: 'Low stock alerts',
              description: 'Receive warnings when product inventory runs low',
              enabled: false,
              disabled: true,
            },
            {
              key: 'outOfStockNotifications',
              title: 'Out of stock notifications',
              description: 'Get alerted when products are completely sold out',
              enabled: false,
              disabled: true,
            },
            {
              key: 'productPerformance',
              title: 'Product performance',
              description:
                'Weekly reports on best-selling and underperforming products',
              enabled: false,
              disabled: true,
            },
          ],
        },
        {
          title: 'Customer interactions',
          items: [
            {
              key: 'newReviewsRatings',
              title: 'New reviews & ratings',
              description: 'Get notified when customers leave product reviews',
              enabled: false,
              disabled: true,
            },
            {
              key: 'customerMessages',
              title: 'Customer messages',
              description:
                'Receive alerts for direct customer inquiries and support requests',
              enabled: false,
              disabled: true,
            },
            {
              key: 'returnRefundsRequest',
              title: 'Return & refunds request',
              description:
                'Get notified when customers request returns or refunds',
              enabled: false,
              disabled: true,
            },
          ],
        },
      ];
    } else {
      return [
        {
          title: 'Bookings & services',
          items: [
            {
              key: 'bookingConfirmations',
              title: 'Booking confirmations',
              description:
                'Get notified confirmed bookings and appointment reminders',
              enabled: preferences.bookingConfirmations ?? false,
            },
            {
              key: 'providerUpdates',
              title: 'Provider updates',
              description:
                "Stay informed about your provider's status and any booking changes",
              enabled: preferences.providerUpdates ?? false,
            },
            {
              key: 'queueUpdates',
              title: 'Queue updates',
              description:
                "Track your position in virtual queues and know when it's your turn",
              enabled: false,
              disabled: true,
            },
          ],
        },
        {
          title: 'Messages',
          items: [
            {
              key: 'newMessages',
              title: 'New messages',
              description:
                'Get alerts when you receive new messages about your bookings',
              enabled: preferences.newMessages ?? false,
            },
          ],
        },
        {
          title: 'Orders & payments',
          items: [
            {
              key: 'orderConfirmations',
              title: 'Order confirmations',
              description:
                'Receive notifications about successful purchases and payment processing',
              enabled: false,
              disabled: true,
            },
          ],
        },
        {
          title: 'Inspiration & content',
          items: [
            {
              key: 'trendingContents',
              title: 'Trending contents',
              description:
                'Discover new inspiration based on your selected preferences',
              enabled: false,
              disabled: true,
            },
            {
              key: 'likesOnYourUploads',
              title: 'Likes on your uploads',
              description: 'Know when other users like your uploaded contents',
              enabled: false,
              disabled: true,
            },
          ],
        },
      ];
    }
  }, [isVendor, preferences]);

  const handleToggle = async (key: string, currentValue: boolean) => {
    const newValue = !currentValue;

    // Optimistically update UI
    setPreferences((prev) => ({
      ...prev,
      [key]: newValue,
    }));

    try {
      await updateNotificationPreferences({
        [key]: newValue,
      }).unwrap();

      toast.success('Notification settings saved');
      refetch();
    } catch (error: any) {
      // Revert on error
      setPreferences((prev) => ({
        ...prev,
        [key]: currentValue,
      }));
      toast.error(
        error?.data?.message || 'Failed to update notification settings'
      );
    }
  };

  return (
    <div className="w-full max-w-[600px]">
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="mb-8">
          {/* Section Title */}
          <h3 className="text-[14px] font-normal text-[#6C6C6C] mb-4">
            {section.title}
          </h3>

          {/* Section Items */}
          <div className="space-y-0">
            {section.items.map((item) => (
              <div
                key={item.key}
                className={`bg-[#F9FAFB] p-4 flex items-start justify-between ${
                  item.disabled ? 'opacity-50' : ''
                }`}
              >
                <div className="flex-1 pr-4">
                  <h4 className="text-[16px] font-semibold text-[#101828] mb-1">
                    {item.title}
                  </h4>
                  <p className="text-[14px] text-[#6C6C6C]">
                    {item.description}
                  </p>
                </div>

                {/* Toggle Switch */}
                <div className="flex-shrink-0">
                  <button
                    onClick={() =>
                      !item.disabled && handleToggle(item.key, item.enabled)
                    }
                    disabled={item.disabled || isLoading}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      item.enabled && !item.disabled
                        ? 'bg-[#FF71AA]'
                        : 'bg-[#D0D5DD]'
                    } ${
                      item.disabled ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        item.enabled && !item.disabled
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationsTab;
