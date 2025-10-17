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
  const [hasChanges, setHasChanges] = useState(false);

  const store = storeData?.store;
  const policies = store?.policies?.payment;

  const depositTypeOptions = [
    { value: 'percentage', label: 'Percentage' },
    { value: 'fixed', label: 'Fixed' },
  ];

  // Get currency symbol based on user's country
  const currencySymbol = useMemo(() => {
    const countryName = user?.countryName?.toLowerCase() || '';
    if (countryName.includes('nigeria')) {
      return 'NGN';
    } else if (
      countryName.includes('united kingdom') ||
      countryName.includes('uk')
    ) {
      return 'GBP';
    }
    return 'NGN'; // Default to NGN
  }, [user?.countryName]);

  useEffect(() => {
    if (policies) {
      const typeOption = depositTypeOptions.find(
        (opt) => opt.value === policies.depositType
      );
      setDepositType(typeOption || null);
      setAmount(policies.amount?.toString() || '');
    }
  }, [policies]);

  useEffect(() => {
    const changed =
      depositType?.value !== policies?.depositType ||
      parseFloat(amount) !== policies?.amount;
    setHasChanges(changed);
  }, [depositType, amount, policies]);

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
          },
        },
      }).unwrap();

      toast.success('Payment policy updated successfully');
      setHasChanges(false);
    } catch (error: any) {
      console.log(error);
      toast.error(error?.data?.message[0] || 'Failed to update payment policy');
    }
  };

  return (
    <HomeLayout isLoading={isLoading} showNavBar={false}>
      <div className="min-h-screen bg-white">
        <div className="max-w-[800px] mx-auto px-6 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[14px] mb-6">
            <button
              onClick={() => navigate('/settings')}
              className="text-[#6C6C6C] hover:text-[#344054]"
            >
              Settings
            </button>
            <span className="text-[#6C6C6C]">/</span>
            <button
              onClick={() =>
                navigate('/settings', { state: { tab: 'payment-billings' } })
              }
              className="text-[#6C6C6C] hover:text-[#344054]"
            >
              Payment & billings
            </button>
            <span className="text-[#6C6C6C]">/</span>
            <span className="text-[#101828]">Payout details</span>
          </div>

          {/* Title */}
          <h1 className="text-[32px] font-semibold text-[#101828] mb-8">
            Payment policy
          </h1>

          {/* Deposit Type */}
          <div className="mb-6 relative z-20">
            <label className="block text-[14px] font-medium text-[#344054] mb-2">
              Deposit type
            </label>
            <CustomSelect
              options={depositTypeOptions}
              value={depositType}
              onChange={(option) =>
                setDepositType(option as { value: string; label: string })
              }
              placeholder="Percentage"
              className="!py-3 text-[16px]"
            />
          </div>

          {/* Amount/Percentage Input */}
          {depositType && (
            <div className="mb-8 relative z-10">
              <label className="block text-[14px] font-medium text-[#344054] mb-2">
                {depositType.value === 'percentage' ? 'Percentage' : 'Amount'}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-[#6C6C6C] font-medium pointer-events-none z-[5]">
                  {depositType.value === 'percentage' ? '%' : currencySymbol}
                </span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={
                    depositType.value === 'percentage' ? '0.00' : '12,000'
                  }
                  className="py-3 pl-16 text-[16px] relative z-[1]"
                />
              </div>
            </div>
          )}

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isUpdating}
            variant="default"
            size="full"
            className="py-3 rounded-lg"
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
