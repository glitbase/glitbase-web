/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Buttons';
import { Typography } from '@/components/Typography';
import VendorOnboardingLayout from './VendorOnboardingLayout';
import { toast } from 'react-toastify';
import AuthLayout from '@/layout/auth';
import {
  getOnboardingState,
  updateOnboardingState,
  completeStep,
  OnboardingStep,
} from '@/utils/vendorOnboarding';
import { Input } from '@/components/Inputs/TextInput';

const VisibilitySetup = () => {
  const navigate = useNavigate();

  // Load saved data from localStorage
  const savedState = getOnboardingState();
  const [tags, setTags] = useState<string[]>(savedState.data.tags || []);
  const [inputValue, setInputValue] = useState('');

  const MAX_TAGS = 5;

  const handleAddTag = () => {
    const trimmedValue = inputValue.trim().toLowerCase();

    if (!trimmedValue) {
      return;
    }

    if (tags.length >= MAX_TAGS) {
      toast.error(`You can add up to ${MAX_TAGS} tags only`);
      return;
    }

    if (tags.includes(trimmedValue)) {
      toast.error('This tag already exists');
      return;
    }

    setTags([...tags, trimmedValue]);
    setInputValue('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleContinue = () => {
    if (tags.length === 0) {
      toast.error('Please add at least one tag');
      return;
    }

    // Save to localStorage for persistence
    updateOnboardingState({
      data: {
        tags: tags,
      },
    });

    // Mark step as completed and set next step
    completeStep(
      OnboardingStep.VISIBILITY_SETUP,
      OnboardingStep.LOCATION_SETUP
    );

    // Get existing store data and add tags (for backward compatibility)
    const existingData = JSON.parse(
      sessionStorage.getItem('vendorStoreData') || '{}'
    );
    const updatedData = {
      ...existingData,
      tags: tags,
    };

    sessionStorage.setItem('vendorStoreData', JSON.stringify(updatedData));

    // Navigate to location setup
    navigate('/vendor/onboarding/location');
  };

  return (
    <AuthLayout isLoading={false}>
      <VendorOnboardingLayout progress={83} currentStep={5}>
        <div className="px-4 mx-auto pb-8 max-w-[600px] flex flex-col items-center">
          <div className="w-full mb-6">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 12H5M12 19l-7-7 7-7"
                />
              </svg>
            </button>

            <Typography
              variant="heading"
              className="text-start !text-[2rem] font-semibold font-[lora]"
            >
              Boost your visibility
            </Typography>
            <p className="text-start font-normal text-[1rem] text-[#667185] !mt-3 max-w-[440px]">
              Add up to {MAX_TAGS} keywords for Glitfinder and Glitmatch tags so
              customers can discover your business easily
            </p>
          </div>

          <form
            className="w-full py-6 space-y-6"
            onSubmit={(e) => e.preventDefault()}
          >
            {/* Tag Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Glit tags
              </label>
              <div className="flex gap-2 w-full ">
                <div className="w-full">
                  <Input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Add glit tags"
                    maxLength={50}
                    disabled={tags.length >= MAX_TAGS}
                    variant="default"
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Tags Display */}
            <div className="flex flex-wrap gap-2 mt-4">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-gray-100 border border-gray-200 rounded-full text-sm"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-gray-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Continue Button */}
            <div className="mt-8">
              <Button
                variant="default"
                size="full"
                onClick={handleContinue}
                disabled={tags.length === 0}
                className="bg-[#60983C] hover:bg-[#4d7a30] rounded-full py-3"
              >
                Continue
              </Button>
            </div>
          </form>
        </div>
      </VendorOnboardingLayout>
    </AuthLayout>
  );
};

export default VisibilitySetup;
