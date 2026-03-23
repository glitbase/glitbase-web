import { useState, useMemo, useEffect } from 'react';
import { useAppSelector } from '@/hooks/redux-hooks';
import { useLocation } from 'react-router-dom';
import HomeLayout from '@/layout/home/HomeLayout';
import ProfileTab from './tabs/ProfileTab';
import BillingInformationTab from './tabs/BillingInformationTab';
import AccountSettingsTab from './tabs/AccountSettingsTab';
import NotificationsTab from './tabs/NotificationsTab';
import PaymentBillingsTab from './tabs/PaymentBillingsTab';
import BusinessSettingsTab from './tabs/BusinessSettingsTab';
import OperationsTab from './tabs/OperationsTab';
import CustomerSupport from './tabs/CustomerSupport';

type TabType = {
  id: string;
  label: string;
  component: JSX.Element;
};

const Settings = () => {
  const user = useAppSelector((state) => state.auth.user);
  const isVendor = user?.activeRole?.includes('vendor');
  const location = useLocation();

  // Define tabs based on user role
  const tabs: TabType[] = useMemo(() => {
    if (isVendor) {
      // Vendor sees all tabs
      return [
        { id: 'profile', label: 'Profile', component: <ProfileTab /> },
        {
          id: 'payment-billings',
          label: 'Payment & billings',
          component: <PaymentBillingsTab />,
        },
        {
          id: 'account-settings',
          label: 'Account settings',
          component: <AccountSettingsTab />,
        },
        {
          id: 'business-settings',
          label: 'Business settings',
          component: <BusinessSettingsTab />,
        },
        {
          id: 'operations',
          label: 'Operations',
          component: <OperationsTab />,
        },
        {
          id: 'notifications',
          label: 'Notifications',
          component: <NotificationsTab />,
        },
        {
          id: 'customer-support',
          label: 'Customer support',
          component: <CustomerSupport />,
        },
      ];
    } else {
      // Regular user sees limited tabs
      return [
        { id: 'profile', label: 'Profile', component: <ProfileTab /> },
        {
          id: 'billing-information',
          label: 'Billing information',
          component: <BillingInformationTab />,
        },
        {
          id: 'account-settings',
          label: 'Account Settings',
          component: <AccountSettingsTab />,
        },
        {
          id: 'notifications',
          label: 'Notifications',
          component: <NotificationsTab />,
        },
        {
          id: 'customer-support',
          label: 'Customer support',
          component: <CustomerSupport />,
        },
      ];
    }
  }, [isVendor]);

  const [activeTab, setActiveTab] = useState<string>('profile');

  // Handle tab navigation from location state
  useEffect(() => {
    const state = location.state as { tab?: string } | null;
    if (state?.tab) {
      setActiveTab(state.tab);
    }
  }, [location.state]);

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.component;

  return (
    <HomeLayout isLoading={false} showNavBar={true} showSearch={false}>
      <div className="min-h-[100dvh] min-h-screen bg-white w-full min-w-0 -mt-12 md:-mt-0">
        <div className="w-full max-w-[960px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-5 sm:py-6 md:py-8 pb-8 sm:pb-10 min-w-0">
          {/* Header */}
          <p className="text-[1.1rem] sm:text-[1.5rem] md:text-2xl tracking-tight font-semibold text-[#1D2739] font-[lora] mb-4 sm:mb-6 md:mb-8">
            Settings
          </p>

          {/* Tab Navigation — horizontal scroll on narrow screens */}
          <div className="mb-4 sm:mb-6 -mx-1 px-1">
            <div className="flex overflow-x-auto overflow-y-hidden scrollbar-hide gap-4 sm:gap-6 md:gap-8 pb-0 touch-pan-x snap-x snap-mandatory">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-2.5 sm:pb-2 shrink-0 snap-start text-left text-[14px] sm:text-[13px] md:text-[15px] font-semibold relative tracking-tight transition-colors touch-manipulation whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-[#343226]'
                      : 'text-[#9D9D9D] hover:text-[#6C6C6C]'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#4C9A2A] rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="py-4 sm:py-6 min-w-0 overflow-x-hidden">{activeTabContent}</div>
        </div>
      </div>
    </HomeLayout>
  );
};

export default Settings;
