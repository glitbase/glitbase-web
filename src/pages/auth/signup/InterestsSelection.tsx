/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Buttons';
import { Typography } from '@/components/Typography';
import {
  useGetInspirationCategoriesQuery,
  useUpdateUserProfileMutation,
} from '@/redux/auth';
import { toast } from 'react-toastify';

interface Interest {
  id: string;
  emoji: string;
  title: string;
}

const InterestsSelection = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Fetch inspiration categories from API
  const {
    data: categoriesData,
    isLoading,
    isError,
  } = useGetInspirationCategoriesQuery();

  // Update user profile mutation
  const [updateProfile, { isLoading: isUpdatingProfile }] =
    useUpdateUserProfileMutation();

  // Extract categories from API response
  const stylesInspo = categoriesData?.data?.stylesInspo || [];
  const touchupsTransformations =
    categoriesData?.data?.touchupsTransformations || [];
  const productsVendors = categoriesData?.data?.productsVendors || [];

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(-1);
    }
  };

  const handleSave = async () => {
    if (selectedInterests.length === 0) {
      toast.error('Please select at least one interest');
      return;
    }

    try {
      await updateProfile({
        interests: selectedInterests,
      }).unwrap();

      toast.success('Interests saved successfully!');
      navigate('/');
    } catch (error: any) {
      toast.error(
        error?.data?.message || 'Failed to save interests. Please try again.'
      );
    }
  };

  const getCurrentInterests = (): Interest[] => {
    switch (currentStep) {
      case 1:
        return stylesInspo;
      case 2:
        return touchupsTransformations;
      case 3:
        return productsVendors;
      default:
        return stylesInspo;
    }
  };

  const getCurrentTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Styles, slays & inspo you love';
      case 2:
        return 'From touch-ups to transformations';
      case 3:
        return 'Products, tools & vendors you rate';
      default:
        return '';
    }
  };

  const InterestChip = ({ interest }: { interest: Interest }) => (
    <button
      type="button"
      onClick={() => toggleInterest(interest.id)}
      className={`px-4 py-2 rounded-full border transition-all flex items-center gap-2 ${
        selectedInterests.includes(interest.id)
          ? 'bg-[#CC5A88] border-[#CC5A88] text-white'
          : 'bg-white border-gray-300 text-gray-700 hover:border-[#CC5A88]'
      }`}
    >
      <span>{interest.emoji}</span>
      <span className="text-sm font-medium">{interest.title}</span>
    </button>
  );

  const SkeletonChip = () => (
    <div className="px-4 py-2 rounded-full border border-gray-200 bg-gray-100 flex items-center gap-2 animate-pulse">
      <div className="w-4 h-4 bg-gray-300 rounded" />
      <div
        className="h-3 bg-gray-300 rounded"
        style={{ width: `${Math.random() * 60 + 80}px` }}
      />
    </div>
  );

  const SkeletonSection = ({ count }: { count: number }) => (
    <div className="flex flex-wrap gap-3">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonChip key={i} />
      ))}
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <main className="h-screen w-full !bg-[white] overflow-y-auto">
        <div className="flex justify-between py-8 px-12">
          <button className="flex items-center gap-2 text-[#60983C]">
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            <span>Back</span>
          </button>
        </div>

        <div className="px-4 mx-auto pb-8 max-w-[600px] flex flex-col items-center">
          <div className="w-full mb-6">
            <p className="text-[#CC5A88] text-sm font-semibold mb-2">
              Step 2 of 2
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className="bg-[#CC5A88] h-1 rounded-full"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div className="space-y-2 flex justify-center flex-col items-start w-full">
            <Typography
              variant="heading"
              className="text-left !text-[2rem] font-medium font-[lora]"
            >
              What are you into?
            </Typography>
            <p className="text-left font-medium text-[1rem] text-[#667185] !mt-3">
              Select what you love so we can match you with inspirations and
              services that fit your vibe
            </p>
          </div>

          <div className="w-full py-10">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Loading categories...
            </h3>
            <SkeletonSection count={9} />
          </div>
        </div>
      </main>
    );
  }

  // Error state
  if (isError) {
    return (
      <main className="h-screen w-full !bg-[white] overflow-y-auto">
        <div className="flex justify-between py-8 px-12">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#60983C] hover:underline"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            <span>Back</span>
          </button>
        </div>

        <div className="px-4 mx-auto pb-8 max-w-[600px] flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-red-500 mb-4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <Typography
              variant="heading"
              className="!text-[1.5rem] font-medium mb-2"
            >
              Failed to load categories
            </Typography>
            <p className="text-[#667185] mb-6">
              Please check your connection and try again.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-[#60983C] text-white hover:bg-[#4d7a30]"
            >
              Retry
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const currentInterests = getCurrentInterests();
  const currentTitle = getCurrentTitle();

  return (
    <main className="h-screen w-full !bg-[white] overflow-y-auto">
      <div className="flex justify-between py-8 px-12">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-[#60983C] hover:underline"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          <span>Back</span>
        </button>
      </div>

      <div className="px-4 mx-auto pb-8 max-w-[600px] flex flex-col items-center">
        {/* Progress indicator */}
        <div className="w-full mb-6">
          <p className="text-[#CC5A88] text-sm font-semibold mb-2">
            Step 2 of 2
          </p>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div
              className="bg-[#CC5A88] h-1 rounded-full"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div className="space-y-2 flex justify-center flex-col items-start w-full">
          <Typography
            variant="heading"
            className="text-left !text-[2rem] font-medium font-[lora]"
          >
            What are you into?
          </Typography>
          <p className="text-left font-medium text-[1rem] text-[#667185] !mt-3">
            Select what you love so we can match you with inspirations and
            services that fit your vibe
          </p>
        </div>

        <div className="w-full py-10">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            {currentTitle}
          </h3>
          <div className="flex flex-wrap gap-3">
            {currentInterests.length > 0 ? (
              currentInterests.map((interest) => (
                <InterestChip key={interest.id} interest={interest} />
              ))
            ) : (
              <p className="text-gray-500">
                No interests available for this category.
              </p>
            )}
          </div>
        </div>

        {/* Bottom button */}
        <div className="w-full mt-8">
          <Button
            onClick={currentStep === 3 ? handleSave : handleContinue}
            disabled={isUpdatingProfile}
            loading={isUpdatingProfile}
            className="w-full py-3 rounded-lg bg-[#60983C] text-white hover:bg-[#4d7a30]"
          >
            {currentStep === 3 ? 'Save' : 'Continue'}
          </Button>
        </div>
      </div>
    </main>
  );
};

export default InterestsSelection;
