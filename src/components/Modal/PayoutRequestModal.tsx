import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/Buttons';
import { Input } from '@/components/Inputs/TextInput';
import { useGetPayoutInfoQuery } from '@/redux/vendor';
import { useRequestPayoutMutation } from '@/redux/payment';
import { currencySymbol } from '@/pages/home/vendorHome/components/utils';
import { toast } from 'react-toastify';
import { useAppSelector } from '@/hooks/redux-hooks';

const getMinimumAmount = (currency: string) => {
  switch (currency) {
    case 'GBP':
      return 10;
    case 'NGN':
      return 10000;
    case 'USD':
    default:
      return 10;
  }
};

const getMinimumWithdrawal = (currency: string) => {
  switch (currency) {
    case 'GBP':
      return '£10';
    case 'NGN':
      return '₦10,000';
    case 'USD':
    default:
      return '$10';
  }
};

type PayoutRequestModalProps = {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  currency: string;
  onSuccess?: () => void;
};

const PayoutRequestModal = ({
  isOpen,
  onClose,
  availableBalance,
  currency,
  onSuccess,
}: PayoutRequestModalProps) => {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'form' | 'confirm'>('form');

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const { data: payoutInfo, isLoading: isLoadingPayoutInfo } = useGetPayoutInfoQuery(undefined, {
    skip: !isOpen,
  });
  const [requestPayout, { isLoading: isSubmittingPayout }] = useRequestPayoutMutation();

  const payoutInfoData = payoutInfo?.payoutInfo ?? (payoutInfo as { payoutInfo?: unknown })?.payoutInfo;
  const payout = (payoutInfoData as {
    fullName?: string;
    accountNumber?: string;
    bankName?: string;
    country?: string;
    sortCode?: string;
  }) ?? {};

  const handleOpenConfirm = () => {
    if (isLoadingPayoutInfo) {
      toast.info('Loading payout information...');
      return;
    }
    setStep('confirm');
  };

  const handleConfirmPayout = async () => {
    if (!payoutInfoData || !user?.hasPayoutInfo) {
      toast.error('No payout information available. Please set up your bank account first.');
      onClose();
      navigate('/settings/payment-billings/payout-details');
      return;
    }

    const numAmount = parseFloat(amount);
    if (numAmount < getMinimumAmount(currency)) {
      toast.error(`Amount must be at least ${getMinimumWithdrawal(currency)}`);
      return;
    }

    if (numAmount > availableBalance) {
      toast.error('Amount exceeds available balance');
      return;
    }

    try {
      const bankAccount =
        payout.country === 'GB'
          ? {
              accountName: payout.fullName ?? '',
              accountNumber: payout.accountNumber ?? '',
              bankName: payout.bankName ?? '',
              sortCode: payout.sortCode ?? '',
            }
          : {
              accountName: payout.fullName ?? '',
              accountNumber: payout.accountNumber ?? '',
              bankName: payout.bankName ?? '',
            };

      await requestPayout({
        amount: numAmount,
        payoutMethod: 'bank_transfer',
        bankAccount,
        notes: 'withdrawal',
      }).unwrap();

      setStep('form');
      setAmount('');
      onClose();
      onSuccess?.();
      toast.success(
        "Payout request submitted successfully! You will be notified when it's processed."
      );
    } catch {
      toast.error('Failed to submit payout request. Please try again.');
    }
  };

  const handleClose = () => {
    setStep('form');
    setAmount('');
    onClose();
  };

  const numAmount = parseFloat(amount) || 0;
  const canSubmit =
    amount &&
    numAmount >= getMinimumAmount(currency) &&
    numAmount <= availableBalance &&
    !isLoadingPayoutInfo;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Request payout"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 text-[#6C6C6C]"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-[20px] font-semibold text-[#0A0A0A] font-[lora] pr-10 mb-6 tracking-tight">
          Request payout
        </h2>

        {step === 'form' ? (
          <>
            <div className="mb-6">
              <div className="relative">
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="0.00"
                  type="tel"
                  className="pr-12"
                  label={`Amount (Min. ${getMinimumWithdrawal(currency)})`}
                />
                <span className="absolute right-4 top-12 -translate-y-1/2 text-[16px] font-medium text-[#6C6C6C]">
                  {currencySymbol(currency)}
                </span>
              </div>
              <p className="mt-3 text-[12px] text-[#6C6C6C] font-medium">
                Available balance: {currencySymbol(currency)}
                {availableBalance.toLocaleString()}
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="cancel" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleOpenConfirm}
                disabled={!canSubmit}
              >
                Request payout
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-[17px] text-[#6C6C6C] leading-relaxed mb-6">
              You&apos;re requesting a payout of{' '}
              <span className="font-semibold text-[#101828]">
                {currencySymbol(currency)}
                {amount}
              </span>
              . This payment will be transferred to account ****{' '}
              <span className="font-semibold text-[#101828]">
                {payout.accountNumber?.slice(-4) ?? '****'}
              </span>{' '}
              (
              <span className="font-semibold text-[#101828]">
                {payout.bankName ?? 'Bank'}
              </span>
              ). Is this correct?
            </p>
            <div className="flex gap-3">
              <Button
                variant="cancel"
                className="flex-1"
                onClick={() => setStep('form')}
                disabled={isSubmittingPayout}
              >
                Back
              </Button>
              <Button
                className="flex-1 !bg-[#4C9A2A] !text-white"
                onClick={handleConfirmPayout}
                disabled={isSubmittingPayout}
              >
                {isSubmittingPayout ? 'Submitting...' : 'Request payout'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PayoutRequestModal;
