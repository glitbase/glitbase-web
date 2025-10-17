/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import HomeLayout from '@/layout/home/HomeLayout';
import {
  useGetPayoutInfoQuery,
  useUpdatePayoutInfoMutation,
} from '@/redux/vendor';
import { useAppSelector } from '@/hooks/redux-hooks';
import { toast } from 'react-toastify';
import { Input } from '@/components/Inputs/TextInput';
import { CustomSelect } from '@/components/Inputs/SelectInput';
import { Button } from '@/components/Buttons';
import { nigerianBanks } from '@/utils/nigerianBanks';
import { ukBanks } from '@/utils/ukBanks';

const PayoutDetails = () => {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const {
    data: payoutData,
    isLoading,
    refetch,
  } = useGetPayoutInfoQuery(undefined);
  const [updatePayout, { isLoading: isUpdating }] =
    useUpdatePayoutInfoMutation();

  const [selectedBank, setSelectedBank] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const payoutInfo = payoutData?.payoutInfo;

  // Get bank list based on user's country
  const bankOptions = useMemo(() => {
    const countryName = user?.countryName?.toLowerCase() || '';

    if (countryName.includes('nigeria')) {
      return nigerianBanks.map((bank) => ({
        value: bank.name,
        label: bank.name,
      }));
    } else if (
      countryName.includes('united kingdom') ||
      countryName.includes('uk')
    ) {
      return ukBanks.map((bank) => ({
        value: bank.name,
        label: bank.name,
      }));
    }

    // Default to Nigerian banks if country not recognized
    return nigerianBanks.map((bank) => ({
      value: bank.name,
      label: bank.name,
    }));
  }, [user?.countryName]);

  useEffect(() => {
    if (payoutInfo) {
      const bankOption = bankOptions.find(
        (opt) => opt.value === payoutInfo.bankName
      );
      setSelectedBank(bankOption || null);
      setAccountNumber(payoutInfo.accountNumber || '');
    }
  }, [payoutInfo, bankOptions]);

  useEffect(() => {
    const changed =
      selectedBank?.value !== payoutInfo?.bankName ||
      accountNumber !== payoutInfo?.accountNumber;
    setHasChanges(changed);
  }, [selectedBank, accountNumber, payoutInfo]);

  const handleSave = async () => {
    if (!payoutInfo?.id) {
      toast.error('Payout information not found');
      return;
    }

    if (!selectedBank) {
      toast.error('Please select a bank');
      return;
    }

    try {
      await updatePayout({
        // id: payoutInfo.id,
        bankName: selectedBank.value,
        accountNumber,
      }).unwrap();

      toast.success('Payout details updated successfully');
      await refetch();
      setHasChanges(false);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update payout details');
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
            Payout details
          </h1>

          {/* Bank Account Number */}
          <div className="mb-6">
            <label className="block text-[14px] font-medium text-[#344054] mb-2">
              Bank account number
            </label>
            <Input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="1234567890"
              className="py-3 text-[16px]"
            />
          </div>

          {/* Bank Account Name (Read-only) */}
          <div className="mb-6">
            <label className="block text-[14px] font-medium text-[#344054] mb-2">
              Bank account name
            </label>
            <div className="px-4 py-3 bg-[#F9FAFB] text-[16px] text-[#6C6C6C] rounded-lg border border-gray-200">
              {payoutInfo?.fullName || '-'}
            </div>
          </div>

          {/* Bank Name */}
          <div className="mb-8">
            <label className="block text-[14px] font-medium text-[#344054] mb-2">
              Bank name
            </label>
            <CustomSelect
              options={bankOptions}
              value={selectedBank}
              onChange={(option) =>
                setSelectedBank(
                  option as { value: string; label: string } | null
                )
              }
              placeholder="Select bank"
              className="!py-3 text-[16px]"
            />
          </div>

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

export default PayoutDetails;
