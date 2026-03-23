/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, KeyboardEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/Buttons';
import { Typography } from '@/components/Typography';
import VendorOnboardingLayout from './VendorOnboardingLayout';
import { toast } from 'react-toastify';
import AuthLayout from '@/layout/auth';
import { Input } from '@/components/Inputs/TextInput';
import { GoBack } from '@/components/GoBack';

const VisibilitySetup = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get data passed from previous step via navigation state
  const storeData = location.state?.storeData || {};

  const [tags, setTags] = useState<string[]>(storeData.tags || []);
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

    // Pass data to next step via navigation state
    navigate('/vendor/onboarding/location', {
      state: {
        storeData: {
          ...storeData,
          tags: tags,
        },
      },
    });
  };

  return (
    <AuthLayout isLoading={false}>
      <VendorOnboardingLayout progress={83} currentStep={5}>
        <div className="mx-auto pb-8 max-w-[600px] flex flex-col items-center mt-12">
          <div className="w-full mb-6">
            <GoBack className='text-[1.3rem] mb-5' />
            <Typography
              variant="heading"
              className="text-left !text-[1.7rem] font-bold font-[lora] text-[#0A0A0A]"
            >
              Boost your visibility
            </Typography>
            <p className="text-left font-medium text-[1rem] text-[#6C6C6C] !mt-2">
              Add up to 5 keywords for Glitfinder and Glitmatch tags so customers can discover your business easily
            </p>
          </div>

          <form
            className="w-full py-4"
            onSubmit={(e) => e.preventDefault()}
          >
            {/* Tag Input */}
            <div>
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
                    label="Glit tags"
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
                  className="inline-flex items-center gap-3 px-4 py-2 bg-[#FAFAFA] text-[#0A0A0A] text-sm font-medium rounded-full text-sm"
                >
                  <p className='capitalize'>{tag}</p>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-[#3B3B3B] hover:text-gray-700 text-lg leading-none"
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
