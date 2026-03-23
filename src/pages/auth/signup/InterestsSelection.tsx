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
import ProgressBar from '@/components/ProgressBar';
import { AUTH } from '@/pages/auth/authPageStyles';
import { CircleAlert } from 'lucide-react';

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
  } = useGetInspirationCategoriesQuery(undefined);

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
      className={`px-4 py-2 rounded-full transition-all text-sm flex items-center gap-2 ${selectedInterests.includes(interest.id)
          ? 'bg-[#FF71AA] text-white'
          : 'bg-[#FAFAFA] text-[#3B3B3B] hover:border-[#CC5A88]'
        }`}
    >
      <span>{interest.emoji}</span>
      <span className="text-sm font-medium">{interest.title}</span>
    </button>
  );

  const SkeletonChip = () => (
    <div className="px-4 py-2 rounded-full bg-[#FAFAFA] flex items-center gap-2 animate-pulse">
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
      <main className={`${AUTH.mainScroll} justify-center items-center`}>
        <div className={`px-4 mx-auto pb-8 ${AUTH.columnInterests} flex flex-col items-center w-full`}>
          <div className="w-full mb-8 md:mb-16">
            <p className="text-[#CC5A88] text-[14px] font-semibold mb-3">
              Step 2 of 2
            </p>
            <ProgressBar value={100} />
          </div>

          <div className="space-y-2 flex justify-center flex-col items-start w-full">
            <Typography variant="heading" className={`${AUTH.title} w-full`}>
              What are you into?
            </Typography>
            <p className={`${AUTH.subtitle} leading-[1.35] w-full`}>
              Select what you love so we can match you with inspirations and
              services that fit your vibe
            </p>
          </div>

          <div className="w-full py-6 md:py-10">
            <h3 className="font-medium mb-4 text-[#3B3B3B] text-[0.95rem] md:text-base">
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
      <main className={`${AUTH.mainScroll} justify-center items-center`}>
        <div className="px-4 mx-auto pb-8 w-full max-w-[440px] sm:max-w-[600px] flex flex-col items-center justify-center min-h-[50vh]">
          <div className="text-center px-2">
            <CircleAlert size={50} strokeWidth={1.5} color='#CC5A88' className='mx-auto mb-4' />
            <p className='text-[#3B3B3B] font-medium text-[1.1rem] md:text-[1.2rem] mb-2'>Failed to load categories</p>
            <p className="text-[#667185] font-medium text-[0.95rem] md:text-[1rem]">
              Please check your connection and try again.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-[#60983C] text-white hover:bg-[#4d7a30] mt-8"
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
    <main className={`${AUTH.mainScroll} justify-center items-center`}>
      <div className={`px-4 mx-auto pb-8 ${AUTH.columnInterests} flex flex-col w-full`}>
        {/* Progress indicator */}
        <div className="w-full mb-8 md:mb-16">
          <p className="text-[#CC5A88] text-[14px] font-semibold mb-3">
            Step 2 of 2
          </p>
          <ProgressBar value={100} />
        </div>

        <div className="space-y-2 flex justify-center flex-col items-start w-full">
          <Typography variant="heading" className={`${AUTH.title} w-full`}>
            What are you into?
          </Typography>
          <p className={`${AUTH.subtitle} leading-[1.35] w-full`}>
            Select what you love so we can match you with inspirations and
            services that fit your vibe
          </p>
        </div>

        <div className="w-full py-6 md:py-10">
          <h3 className="font-medium mb-4 text-[#3B3B3B] text-[0.95rem] md:text-base">
            {currentTitle}
          </h3>
          <div className="flex flex-wrap gap-3">
            {currentInterests.length > 0 ? (
              currentInterests.map((interest) => (
                <InterestChip key={interest.id} interest={interest} />
              ))
            ) : (
              <p className="text-[#6C6C6C] font-medium text-sm">
                No interests available for this category.
              </p>
            )}
          </div>
        </div>

        {/* Bottom button */}
        <Button
          className="w-full sm:w-auto min-w-0"
          onClick={currentStep === 3 ? handleSave : handleContinue}
          disabled={isUpdatingProfile}
          loading={isUpdatingProfile}
        >
          {currentStep === 3 ? 'Skip this for now' : 'Continue'}
        </Button>
      </div>
    </main>
  );
};

export default InterestsSelection;
