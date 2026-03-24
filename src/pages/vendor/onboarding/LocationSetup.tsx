/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/Buttons';
import { Typography } from '@/components/Typography';
import VendorOnboardingLayout from './VendorOnboardingLayout';
import { useCreateStoreMutation } from '@/redux/vendor';
import { toast } from 'react-toastify';
import LocationSelector from '@/components/LocationSelector';
import AuthLayout from '@/layout/auth';
import { GoBack } from '@/components/GoBack';

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
  const location = useLocation();

  // Get data passed from previous steps via navigation state
  const storeData = location.state?.storeData || {};

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    storeData.location || null
  );
  const [noFixedAddress] = useState(false);
  const [createStore, { isLoading }] = useCreateStoreMutation();

  const handleLocationSelect = (loc: Location) => {
    setSelectedLocation(loc);
  };

  const handleContinue = async () => {
    if (!selectedLocation && !noFixedAddress) {
      toast.error(
        'Please select a location or check the no fixed address option'
      );
      return;
    }

    try {
      // Create the store with all data collected from previous steps
      const payload = {
        name: storeData.name || storeData.storeName,
        type: storeData.type || storeData.storeTypes,
        description: storeData.description || storeData.storeDescription,
        bannerImageUrl: storeData.bannerImageUrl || '',
        preferredCategories: storeData.preferredCategories || storeData.categories,
        tags: storeData.tags,
        location: noFixedAddress
          ? null
          : {
            name: selectedLocation!.name,
            address: selectedLocation!.address,
            city: selectedLocation!.city,
            state: selectedLocation!.state,
            zipcode: selectedLocation!.zipcode || '111111',
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
        <div className="mx-auto pb-8 max-w-[600px] flex flex-col items-center">
          <div className="w-full mb-6 mt-12">
            <GoBack className='text-[1.3rem] mb-5' />

            <Typography
              variant="heading"
              className="text-left !text-[1.7rem] font-bold font-[lora] text-[#0A0A0A]"
            >
              Where is your store located?
            </Typography>
            <p className="text-left font-medium text-[1rem] text-[#6C6C6C] !mt-2">
            Add your store address so nearby customers can discover your busines
            </p>
          </div>

          <div className="w-full space-y-12 mt-3">
            {/* Location Selector */}
            <div>
              <label className="block text-sm font-medium text-[#0A0A0A] mb-2">
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
                  value={selectedLocation ? selectedLocation.address : undefined}
                />
              </div>

            </div>

            {/* No Fixed Address Checkbox */}
            {/* <div className="flex items-start gap-3">
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
            </div> */}

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
