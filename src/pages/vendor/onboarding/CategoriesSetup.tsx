/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Buttons';
import { Typography } from '@/components/Typography';
import VendorOnboardingLayout from './VendorOnboardingLayout';
import { useGetMarketplaceCategoriesQuery } from '@/redux/vendor';
import { toast } from 'react-toastify';
import CategoryCardSkeleton from '@/components/EntityCards/CategoryCardSkeleton';
import AuthLayout from '@/layout/auth';
import {
  getOnboardingState,
  updateOnboardingState,
  completeStep,
  OnboardingStep,
} from '@/utils/vendorOnboarding';

const CategoriesSetup = () => {
  const navigate = useNavigate();

  // Load saved data from localStorage
  const savedState = getOnboardingState();
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    savedState.data.categories || []
  );

  const { data, isLoading, error } =
    useGetMarketplaceCategoriesQuery('service');

  useEffect(() => {
    if (error) {
      toast.error('Failed to load categories');
    }
  }, [error]);

  const handleCategoryToggle = (categoryName: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((c) => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleContinue = () => {
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one category');
      return;
    }

    // Save to localStorage for persistence
    updateOnboardingState({
      data: {
        categories: selectedCategories,
      },
    });

    // Mark step as completed and set next step
    completeStep(
      OnboardingStep.CATEGORIES_SETUP,
      OnboardingStep.VISIBILITY_SETUP
    );

    // Get existing store data and add categories (for backward compatibility)
    const existingData = JSON.parse(
      sessionStorage.getItem('vendorStoreData') || '{}'
    );
    const updatedData = {
      ...existingData,
      preferredCategories: selectedCategories,
    };

    sessionStorage.setItem('vendorStoreData', JSON.stringify(updatedData));

    // Navigate to visibility setup
    navigate('/vendor/onboarding/visibility');
  };

  return (
    <AuthLayout isLoading={false}>
      <VendorOnboardingLayout progress={66} currentStep={4}>
        <div className="px-4 mx-auto pb-8 max-w-[600px] flex flex-col items-center">
          <div className="space-y-2 flex flex-col items-start w-full">
            <Typography
              variant="heading"
              className="text-left !text-[2rem] font-medium font-[lora]"
            >
              Choose your categories
            </Typography>
            <p className="text-left font-normal text-[1rem] text-[#667185] !mt-3 max-w-[440px]">
              Choose your categories so customers can easily browse and find
              what they need
            </p>
          </div>

          <div className="w-full py-10">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <CategoryCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {data?.categories?.map((category: any) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryToggle(category.name)}
                    className={`p-4  rounded-lg transition-all ${
                      selectedCategories.includes(category.name)
                        ? 'border-[#CC5A88] bg-[#FFF4FD]'
                        : 'bg-[#FAFAFA] hover:border-[#CC5A88]'
                    }`}
                  >
                    <div className="flex flex-col items-start gap-3">
                      {category.icon ? (
                        <img
                          src={category.icon}
                          alt={category.name}
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#F5F5F5] flex items-center justify-center">
                          <span className="text-2xl">
                            {category.emoji || '📦'}
                          </span>
                        </div>
                      )}
                      <p className="font-medium text-[1rem] text-left text-[#101928]">
                        {category.name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedCategories.length > 0 && (
              <div className="mt-6 p-4 bg-[#F9FAFB] rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  Selected ({selectedCategories.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map((cat) => (
                    <span
                      key={cat}
                      className="px-3 py-1 bg-white border border-[#CC5A88] text-[#CC5A88] rounded-full text-sm"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8">
              <Button
                variant="default"
                size="full"
                onClick={handleContinue}
                disabled={selectedCategories.length === 0 || isLoading}
                className="bg-[#60983C] hover:bg-[#4d7a30]"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      </VendorOnboardingLayout>
    </AuthLayout>
  );
};

export default CategoriesSetup;
