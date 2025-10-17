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
    <HomeLayout isLoading={false} showNavBar={false}>
      <div className="min-h-screen bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          {/* Header */}
          <h1 className="text-[32px] font-semibold text-[#101828] mb-8">
            Settings
          </h1>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <div className="flex gap-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 text-[16px] font-medium relative transition-colors ${
                    activeTab === tab.id
                      ? 'text-[#343226]'
                      : 'text-[#9D9D9D] hover:text-[#6C6C6C]'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-[#4C9A2A]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="py-6">{activeTabContent}</div>
        </div>
      </div>
    </HomeLayout>
  );
};

export default Settings;
