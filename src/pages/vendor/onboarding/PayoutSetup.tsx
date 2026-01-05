/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Buttons';
import { Typography } from '@/components/Typography';
import { Input } from '@/components/Inputs/TextInput';
import VendorOnboardingLayout from './VendorOnboardingLayout';
import { useCreatePayoutInfoMutation } from '@/redux/vendor';
import { useAppSelector } from '@/hooks/redux-hooks';
import { toast } from 'react-toastify';
import { nigerianBanks } from '@/utils/nigerianBanks';
import { ukBanks } from '@/utils/ukBanks';
import AuthLayout from '@/layout/auth';

const PayoutSetup = () => {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const country = user?.countryCode || 'NG';

  // Form state - no localStorage needed
  const [fullName, setFullName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [sortCode, setSortCode] = useState('');
  const [showBankModal, setShowBankModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState<any>({});

  const [createPayoutInfo, { isLoading }] = useCreatePayoutInfoMutation();

  const banks = country === 'NG' ? nigerianBanks : ukBanks;
  const accountNumberLength = country === 'NG' ? 10 : 8;
  const requiresSortCode = country === 'GB';

  const filteredBanks = banks.filter((bank) =>
    bank.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    // Auto-fill sort code for UK banks
    if (requiresSortCode && selectedBank && 'sortCode' in selectedBank) {
      setSortCode(selectedBank.sortCode);
    }
  }, [selectedBank, requiresSortCode]);

  useEffect(() => {
    const newErrors: any = {};

    if (fullName && fullName.trim().split(' ').length < 2) {
      newErrors.fullName = 'Please enter both first and last name';
    }

    if (accountNumber && accountNumber.length !== accountNumberLength) {
      newErrors.accountNumber = `Account number must be ${accountNumberLength} digits`;
    }

    if (!selectedBank) {
      newErrors.bank = 'Please select a bank';
    }

    if (
      requiresSortCode &&
      (!sortCode || sortCode.replace(/-/g, '').length !== 6)
    ) {
      newErrors.sortCode = 'Sort code must be 6 digits';
    }

    setErrors(newErrors);
  }, [
    fullName,
    accountNumber,
    selectedBank,
    sortCode,
    accountNumberLength,
    requiresSortCode,
  ]);

  const handleBankSelect = (bank: any) => {
    setSelectedBank(bank);
    setShowBankModal(false);
    setSearchTerm('');
  };

  const isFormValid = () => {
    return (
      fullName.trim() &&
      fullName.trim().split(' ').length >= 2 &&
      accountNumber.length === accountNumberLength &&
      selectedBank &&
      (!requiresSortCode ||
        (sortCode && sortCode.replace(/-/g, '').length === 6)) &&
      Object.keys(errors).length === 0
    );
  };

  const handleContinue = async () => {
    if (!isFormValid()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    try {
      // API payload - no localStorage needed
      const payload: any = {
        country: country,
        fullName: fullName.trim(),
        accountNumber: accountNumber,
        bankName: selectedBank.name,
        sortCode: requiresSortCode ? sortCode : undefined
      };

      await createPayoutInfo(payload).unwrap();

      toast.success('Payout information saved successfully!');

      // Navigate to subscription setup
      navigate('/vendor/onboarding/subscription');
    } catch (error: any) {
      console.error('Payout setup error:', error);
      toast.error(error?.data?.message || 'Failed to save payout information');
    }
  };

  return (
    <AuthLayout isLoading={false}>
      <VendorOnboardingLayout progress={100} currentStep={7}>
        <div className="px-4 mx-auto pb-8 max-w-[600px] flex flex-col items-center">
          <div className="space-y-2 flex flex-col items-start w-full">
            <Typography
              variant="heading"
              className="text-left !text-[2rem] font-medium font-[lora]"
            >
              Set up payout information
            </Typography>
            <p className="text-left font-medium text-[1rem] text-[#667185] !mt-3">
              Add your bank account details to receive payments
            </p>
          </div>

        <form
          className="w-full py-10 space-y-6"
          onSubmit={(e) => e.preventDefault()}
        >
          {/* Full Name */}
          <div>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              label="Full name"
              placeholder="Enter your full name"
              required
              error={errors.fullName}
            />
          </div>

          {/* Account Number */}
          <div>
            <Input
              value={accountNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= accountNumberLength) {
                  setAccountNumber(value);
                }
              }}
              label="Account number"
              placeholder={`Enter ${accountNumberLength}-digit account number`}
              required
              error={errors.accountNumber}
              maxLength={accountNumberLength}
            />
            <p className="mt-1 text-xs text-gray-500">
              {accountNumber.length}/{accountNumberLength} digits
            </p>
          </div>

          {/* Bank Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bank name <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowBankModal(true)}
              className={`w-full px-4 py-2.5 border rounded-md text-left flex justify-between items-center ${
                errors.bank ? 'border-red-500' : 'border-gray-200'
              }`}
            >
              <span
                className={!selectedBank ? 'text-gray-400' : 'text-gray-900'}
              >
                {selectedBank ? selectedBank.name : 'Select your bank'}
              </span>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {errors.bank && (
              <p className="mt-1 text-xs text-red-500">{errors.bank}</p>
            )}
          </div>

          {/* Sort Code (UK Only) */}
          {requiresSortCode && (
            <div>
              <Input
                value={sortCode}
                onChange={(e) => setSortCode(e.target.value)}
                label="Sort code"
                placeholder="XX-XX-XX"
                required
                error={errors.sortCode}
                disabled={!selectedBank}
              />
              <p className="mt-1 text-xs text-gray-500">
                Sort code is auto-filled when you select your bank
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 bg-[#F0FDF4] border border-[#16A34A] rounded-lg">
            <div className="flex gap-2">
              <svg
                className="w-5 h-5 text-[#16A34A] mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm text-[#166534] font-medium">
                  Secure & encrypted
                </p>
                <p className="text-sm text-[#166534] mt-1">
                  Your payout information is encrypted and secure. We use this
                  to transfer your earnings
                </p>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <div className="mt-8">
            <Button
              variant="default"
              size="full"
              onClick={handleContinue}
              disabled={!isFormValid() || isLoading}
              loading={isLoading}
              className="bg-[#60983C] hover:bg-[#4d7a30]"
            >
              {isLoading ? 'Saving...' : 'Continue'}
            </Button>
          </div>
        </form>
      </div>

      {/* Bank Selection Modal */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">Select your bank</h3>
              <button
                onClick={() => {
                  setShowBankModal(false);
                  setSearchTerm('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-4 border-b">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for your bank"
                className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC5A88] focus:border-transparent"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {filteredBanks.map((bank) => (
                  <button
                    key={bank.name}
                    onClick={() => handleBankSelect(bank)}
                    className={`w-full p-3 text-left rounded-lg hover:bg-gray-50 border transition-colors ${
                      selectedBank?.name === bank.name
                        ? 'border-[#CC5A88] bg-[#FFEFF6]'
                        : 'border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">
                        {bank.name}
                      </span>
                      {selectedBank?.name === bank.name && (
                        <svg
                          className="w-5 h-5 text-[#CC5A88]"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {filteredBanks.length === 0 && (
                <p className="text-center text-gray-500 py-8">No banks found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </VendorOnboardingLayout>
    </AuthLayout>
  );
};

export default PayoutSetup;
