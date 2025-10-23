/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Buttons';
import { Typography } from '@/components/Typography';
import VendorOnboardingLayout from './VendorOnboardingLayout';
import { useCreateStoreMutation } from '@/redux/vendor';
import { toast } from 'react-toastify';
import LocationSelector from '@/components/LocationSelector';
import {
  getOnboardingState,
  updateOnboardingState,
  completeStep,
  OnboardingStep,
} from '@/utils/vendorOnboarding';
import AuthLayout from '@/layout/auth';

interface Location {
  name: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

const LocationSetup = () => {
  const navigate = useNavigate();

  // Load saved data from localStorage
  const savedState = getOnboardingState();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    savedState.data.location || null
  );
  const [noFixedAddress, setNoFixedAddress] = useState(false);
  const [createStore, { isLoading }] = useCreateStoreMutation();

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
  };

  const handleContinue = async () => {
    if (!selectedLocation && !noFixedAddress) {
      toast.error(
        'Please select a location or check the no fixed address option'
      );
      return;
    }

    try {
      // Save location to localStorage
      updateOnboardingState({
        data: {
          location: noFixedAddress ? undefined : selectedLocation || undefined,
        },
      });

      // Get all the collected data from previous steps
      const savedState = getOnboardingState();

      // Create the store with all data
      const payload = {
        name: savedState.data.storeName,
        type: savedState.data.storeTypes,
        description: savedState.data.storeDescription,
        bannerImageUrl: savedState.data.bannerImageUrl || '',
        preferredCategories: savedState.data.categories,
        tags: savedState.data.tags,
        location: noFixedAddress
          ? null
          : {
              name: selectedLocation!.name,
              address: selectedLocation!.address,
              city: selectedLocation!.city,
              state: selectedLocation!.state,
              zipcode: selectedLocation!.zipcode,
              coordinates: {
                latitude: selectedLocation!.coordinates.latitude,
                longitude: selectedLocation!.coordinates.longitude,
              },
            },
        openingHours: [],
      };

      try {
        await createStore(payload).unwrap();
      } catch (error: any) {
        toast.error(
          error?.data?.message ||
            'An error occurred while creating the store. Please try again.'
        );
        return;
      }

      toast.success('Store created successfully!');

      // Mark step as completed and set next step
      completeStep(OnboardingStep.LOCATION_SETUP, OnboardingStep.PAYOUT_SETUP);

      // Navigate to the next step (payout setup)
      navigate('/vendor/onboarding/payout');
    } catch (error: any) {
      console.error('Store creation error:', error);
      toast.error(
        error?.data?.message || 'Failed to create store. Please try again.'
      );
    }
  };

  return (
    <AuthLayout isLoading={false}>
      <VendorOnboardingLayout progress={65} currentStep={6}>
        <div className="px-4 mx-auto pb-8 max-w-[600px] flex flex-col items-center">
          <div className="w-full mb-6">
            <button
              onClick={() => navigate('/vendor/onboarding/visibility')}
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
              Where is your store located?
            </Typography>
            <p className="text-start font-normal text-[1rem] text-[#667185] !mt-3">
              Add your store address so nearby customers can discover your
              business
            </p>
          </div>

          <div className="w-full py-6 space-y-6">
            {/* Location Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <div
                className={
                  noFixedAddress ? 'opacity-50 pointer-events-none' : ''
                }
              >
                <LocationSelector
                  onLocationSelect={handleLocationSelect}
                  placeholder="Address"
                />
              </div>

              {/* Selected Location Display */}
              {selectedLocation && !noFixedAddress && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-gray-400 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {selectedLocation.address}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedLocation.city}, {selectedLocation.state}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* No Fixed Address Checkbox */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="no-fixed-address"
                checked={noFixedAddress}
                onChange={(e) => {
                  setNoFixedAddress(e.target.checked);
                  if (e.target.checked) {
                    setSelectedLocation(null);
                  }
                }}
                className="mt-1 h-4 w-4 rounded border-gray-300"
              />
              <label
                htmlFor="no-fixed-address"
                className="text-sm text-gray-700 cursor-pointer"
              >
                No fixed business address - online/mobile services only
              </label>
            </div>

            {/* Continue Button */}
            <div className="mt-8">
              <Button
                variant="default"
                size="full"
                onClick={handleContinue}
                disabled={(!selectedLocation && !noFixedAddress) || isLoading}
                loading={isLoading}
                className="bg-[#60983C] hover:bg-[#4d7a30] rounded-full py-3"
              >
                {isLoading ? 'Creating store...' : 'Continue'}
              </Button>
            </div>
          </div>
        </div>
      </VendorOnboardingLayout>
    </AuthLayout>
  );
};

export default LocationSetup;
