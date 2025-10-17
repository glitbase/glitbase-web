/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useGetMyStoreQuery, useUpdateStoreMutation } from '@/redux/vendor';
import HomeLayout from '@/layout/home/HomeLayout';

const BookingPolicies = () => {
  const navigate = useNavigate();
  const { data: storeData, refetch } = useGetMyStoreQuery({});
  const [updateStore, { isLoading }] = useUpdateStoreMutation();

  const store = storeData?.store;

  const [cancellation, setCancellation] = useState('');
  const [rescheduling, setRescheduling] = useState('');
  const [depositRequired, setDepositRequired] = useState('');

  // Load existing policies
  useEffect(() => {
    if (store?.policies?.booking) {
      setCancellation(store.policies.booking.cancellation || '');
      setRescheduling(store.policies.booking.rescheduling || '');

      // Handle deposit from payment policy
      if (store.policies.payment) {
        const { depositType, amount } = store.policies.payment;
        if (depositType && amount) {
          setDepositRequired(
            `${amount}${
              depositType === 'percentage' ? '%' : ''
            } deposit required at booking, remaining balance due at appointment`
          );
        }
      }
    }
  }, [store]);

  const handleSave = async () => {
    if (!cancellation.trim()) {
      toast.error('Please enter cancellation policy');
      return;
    }

    if (!rescheduling.trim()) {
      toast.error('Please enter rescheduling policy');
      return;
    }

    try {
      // Clean policies object to remove _id fields
      const cleanPolicies = store.policies ? { ...store.policies } : {};

      // Remove _id from root level
      if ('_id' in cleanPolicies) {
        delete cleanPolicies._id;
      }

      // Remove _id from nested objects if they exist
      if (cleanPolicies.booking && '_id' in cleanPolicies.booking) {
        cleanPolicies.booking = { ...cleanPolicies.booking };
        delete cleanPolicies.booking._id;
      }
      if (cleanPolicies.payment && '_id' in cleanPolicies.payment) {
        cleanPolicies.payment = { ...cleanPolicies.payment };
        delete cleanPolicies.payment._id;
      }

      await updateStore({
        storeId: store.id,
        policies: {
          ...cleanPolicies,
          booking: {
            cancellation: cancellation.trim(),
            rescheduling: rescheduling.trim(),
          },
        },
      }).unwrap();

      toast.success('Booking policies updated successfully');
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update booking policies');
    }
  };

  return (
    <HomeLayout
      isLoading={false}
      showNavBar={false}
      onSearch={() => {}}
      onLocationChange={() => {}}
    >
      <div className="min-h-screen bg-white">
        <div className="max-w-[600px] mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[14px] text-[#667085] mb-6">
            <button
              onClick={() => navigate('/settings')}
              className="hover:text-[#101828]"
            >
              Settings
            </button>
            <span>/</span>
            <button
              onClick={() =>
                navigate('/settings', { state: { tab: 'operations' } })
              }
              className="hover:text-[#101828]"
            >
              Operations
            </button>
            <span>/</span>
            <span className="text-[#101828]">Booking policies</span>
          </div>

          {/* Header */}
          <h1 className="text-[28px] font-semibold text-[#101828] mb-8">
            Booking policies
          </h1>

          {/* Form */}
          <div className="space-y-6">
            {/* Cancellation Window */}
            <div>
              <label className="block text-[14px] font-medium text-[#344054] mb-2">
                Cancellation window
              </label>
              <textarea
                value={cancellation}
                onChange={(e) => setCancellation(e.target.value)}
                placeholder="Cancellations must be made at least 24 hours in advance to avoid fees"
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg resize-none text-[14px]"
              />
            </div>

            {/* Rescheduling Rules */}
            <div>
              <label className="block text-[14px] font-medium text-[#344054] mb-2">
                Rescheduling rules
              </label>
              <textarea
                value={rescheduling}
                onChange={(e) => setRescheduling(e.target.value)}
                placeholder="Clients can reschedule up to 2 times without penalty with 12 hours notice"
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg resize-none text-[14px]"
              />
            </div>

            {/* Deposit Required (Read-only) */}
            <div>
              <label className="block text-[14px] font-medium text-[#344054] mb-2">
                Deposit required
              </label>
              <textarea
                value={depositRequired}
                readOnly
                placeholder="No deposit policy set. Configure in Payment & Billings > Payment Policy"
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg resize-none text-[14px] bg-gray-50 cursor-not-allowed"
              />
              <p className="mt-2 text-[12px] text-[#667085]">
                Deposit settings are managed in{' '}
                <button
                  onClick={() =>
                    navigate('/settings/payment-billings/payment-policy')
                  }
                  className="text-[#3D7B22] hover:underline"
                >
                  Payment & Billings → Payment Policy
                </button>
              </p>
            </div>

            {/* Save Button */}
            <div className="mt-8">
              <button
                onClick={handleSave}
                disabled={
                  isLoading || !cancellation.trim() || !rescheduling.trim()
                }
                className="w-full px-4 py-3 text-[16px] font-medium text-white bg-[#3D7B22] rounded-full hover:bg-[#2d5c19] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
};

export default BookingPolicies;
