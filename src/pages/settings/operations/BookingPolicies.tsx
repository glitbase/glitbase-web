/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import HomeLayout from '@/layout/home/HomeLayout';
import { Textarea } from '@/components/Inputs/TextAreaInput';
import { Button } from '@/components/Buttons';
import { useGetMyStoreQuery, useUpdateStoreMutation } from '@/redux/vendor';

const BookingPolicies = () => {
  const navigate = useNavigate();
  const { data: storeData, refetch } = useGetMyStoreQuery({});
  const [updateStore, { isLoading }] = useUpdateStoreMutation();

  const store = storeData?.store;

  const [cancellation, setCancellation] = useState('');
  const [rescheduling, setRescheduling] = useState('');
  const [depositRequired, setDepositRequired] = useState('');

  useEffect(() => {
    if (store?.policies?.booking) {
      setCancellation(store.policies.booking.cancellation || '');
      setRescheduling(store.policies.booking.rescheduling || '');

      if (store.policies.payment) {
        const { depositType, amount } = store.policies.payment;
        if (depositType && amount) {
          setDepositRequired(
            `${amount}${depositType === 'percentage' ? '%' : ''} deposit required at booking, remaining balance due at appointment`
          );
        }
      }
    }
  }, [store]);

  const handleSave = async () => {
    if (!cancellation.trim()) { toast.error('Please enter cancellation policy'); return; }
    if (!rescheduling.trim()) { toast.error('Please enter rescheduling policy'); return; }

    try {
      const cleanPolicies = store.policies ? { ...store.policies } : {};
      if ('_id' in cleanPolicies) delete cleanPolicies._id;
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
    <HomeLayout isLoading={false} showNavBar={false}>
      <div className="min-h-screen bg-white">
        <div className="max-w-[500px] px-6 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[14px] mb-6">
            <button
              onClick={() => navigate('/settings')}
              className="text-[#6C6C6C] hover:text-[#344054] font-medium"
            >
              Settings
            </button>
            <span className="text-[#6C6C6C]">/</span>
            <button
              onClick={() => navigate('/settings', { state: { tab: 'operations' } })}
              className="text-[#6C6C6C] hover:text-[#344054] font-medium"
            >
              Operations
            </button>
            <span className="text-[#6C6C6C]">/</span>
            <span className="text-[#101828] font-medium">Booking policies</span>
          </div>

          {/* Title */}
          <h1 className="text-[23px] font-bold text-[#0A0A0A] mb-8 tracking-tight font-[lora]">
            Booking policies
          </h1>

          <div className="space-y-7">
            {/* Cancellation */}
            <Textarea
              label="Cancellation window"
              value={cancellation}
              onChange={(e) => setCancellation(e.target.value)}
              placeholder="Cancellations must be made at least 24 hours in advance to avoid fees"
              rows={4}
            />

            {/* Rescheduling */}
            <Textarea
              label="Rescheduling rules"
              value={rescheduling}
              onChange={(e) => setRescheduling(e.target.value)}
              placeholder="Clients can reschedule up to 2 times without penalty with 12 hours notice"
              rows={4}
            />

            {/* Deposit (read-only) */}
            <div>
              <Textarea
                label="Deposit required"
                value={depositRequired}
                readOnly
                placeholder="No deposit policy set. Configure in Payment & Billings → Payment Policy"
                rows={4}
                className="cursor-not-allowed opacity-60"
              />
              <p className="mt-2 text-[13px] text-[#6C6C6C] font-medium">
                Deposit settings are managed in{' '}
                <button
                  type="button"
                  onClick={() => navigate('/settings/payment-billings/payment-policy')}
                  className="text-[#4C9A2A] hover:underline"
                >
                  Payment & Billings → Payment Policy
                </button>
              </p>
            </div>

            {/* Save */}
            <Button
              onClick={handleSave}
              disabled={isLoading || !cancellation.trim() || !rescheduling.trim()}
              variant="default"
              size="full"
              loading={isLoading}
            >
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
};

export default BookingPolicies;
