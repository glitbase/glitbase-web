/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import HomeLayout from '@/layout/home/HomeLayout';
import { useGetMyStoreQuery, useUpdateStoreMutation } from '@/redux/vendor';
import { useAppSelector } from '@/hooks/redux-hooks';
import { toast } from 'react-toastify';
import { CustomSelect } from '@/components/Inputs/SelectInput';
import { Input } from '@/components/Inputs/TextInput';
import { Button } from '@/components/Buttons';

const PaymentPolicy = () => {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const { data: storeData, isLoading } = useGetMyStoreQuery(undefined);
  const [updateStore, { isLoading: isUpdating }] = useUpdateStoreMutation();

  const [depositType, setDepositType] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [amount, setAmount] = useState('');
  const [lateFee, setLateFee] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const store = storeData?.store;
  const policies = store?.policies?.payment;
  const bookingPolicy = store?.policies?.booking;

  const depositTypeOptions = [
    { value: 'percentage', label: 'Percentage' },
    { value: 'fixed', label: 'Fixed' },
  ];

  // Get currency symbol based on user's country
  const currency = useMemo(() => {
    const code = (user as any)?.countryCode;
    if (code === 'NG') return 'NGN';
    if (code === 'GB') return 'GBP';
    const countryName = user?.countryName?.toLowerCase() || '';
    if (countryName.includes('nigeria')) return 'NGN';
    if (countryName.includes('united kingdom') || countryName.includes('uk')) return 'GBP';
    return 'NGN';
  }, [user]);

  useEffect(() => {
    if (policies) {
      const typeOption = depositTypeOptions.find(
        (opt) => opt.value === policies.depositType
      );
      setDepositType(typeOption || null);
      setAmount(policies.amount?.toString() || '');
      setLateFee((policies as any)?.lateFee?.toString() || '');
    }
  }, [policies]);

  useEffect(() => {
    const changed =
      depositType?.value !== policies?.depositType ||
      parseFloat(amount) !== policies?.amount ||
      parseFloat(lateFee) !== (policies as any)?.lateFee;
    setHasChanges(changed);
  }, [depositType, amount, lateFee, policies]);

  const prefix =
    depositType?.value === 'percentage'
      ? '%'
      : depositType?.value === 'fixed'
      ? currency
      : '';

  const handleSave = async () => {
    if (!store?.id) {
      toast.error('Store information not found');
      return;
    }

    if (!depositType || !amount) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await updateStore({
        storeId: store.id,
        policies: {
          payment: {
            depositType: depositType.value as 'fixed' | 'percentage',
            amount: parseFloat(amount),
            ...(lateFee.trim() ? { lateFee: parseFloat(lateFee) } : {}),
          },
          booking: bookingPolicy,
        },
      }).unwrap();

      toast.success('Payment policy updated successfully');
      setHasChanges(false);
    } catch (error: any) {
      toast.error(error?.data?.message?.[0] || error?.data?.message || 'Failed to update payment policy');
    }
  };

  return (
    <HomeLayout isLoading={isLoading} showNavBar={false}>
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
              onClick={() => navigate('/settings', { state: { tab: 'payment-billings' } })}
              className="text-[#6C6C6C] hover:text-[#344054] font-medium"
            >
              Payment & billings
            </button>
            <span className="text-[#6C6C6C]">/</span>
            <span className="text-[#101828] font-medium">Payment policy</span>
          </div>

          {/* Title */}
          <h1 className="text-[23px] font-bold text-[#0A0A0A] mb-8 tracking-tight font-[lora]">
            Payment policy
          </h1>

          {/* Deposit Type */}
          <div className="mb-7 relative z-20">
            <label className="block text-[14px] font-medium text-[#344054] mb-2">
              Deposit type
            </label>
            <CustomSelect
              options={depositTypeOptions}
              value={depositType}
              onChange={(option) => {
                setDepositType(option as { value: string; label: string });
                setAmount('');
              }}
              placeholder="Select deposit type"
              className="!py-3 text-[16px]"
            />
          </div>

          {/* Amount / Percentage Input */}
          <div className="mb-7 relative z-10">
            <label className="block text-[14px] font-medium text-[#344054] mb-2">
              {depositType?.value === 'percentage' ? 'Percentage' : 'Amount'}
            </label>
            <div className="relative">
              <Input
                type="tel"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="py-3 pr-14 text-[16px]"
              />
              {prefix && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[15px] text-[#6C6C6C] font-medium pointer-events-none">
                  {prefix}
                </span>
              )}
            </div>
          </div>

          {/* Late Fee Input */}
          <div className="mb-2 relative z-10">
            <label className="block text-[14px] font-medium text-[#344054] mb-2">
              Late fee for every 5 minutes
            </label>
            <div className="relative">
              <Input
                type="tel"
                value={lateFee}
                onChange={(e) => setLateFee(e.target.value)}
                placeholder="0.00"
                className="py-3 pr-14 text-[16px]"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[15px] text-[#6C6C6C] font-medium pointer-events-none">
                {currency}
              </span>
            </div>
          </div>
          <p className="text-[13px] text-[#6C6C6C] font-medium leading-relaxed mb-8">
            Late fees apply for every 5 minutes after the scheduled time. Bookings can be marked as no-show after 30 minutes.
          </p>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isUpdating}
            variant="default"
            size="full"
            loading={isUpdating}
          >
            Save changes
          </Button>
        </div>
      </div>
    </HomeLayout>
  );
};

export default PaymentPolicy;
