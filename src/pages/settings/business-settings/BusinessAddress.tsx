/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import HomeLayout from '@/layout/home/HomeLayout';
import LocationSelector from '@/components/LocationSelector';
import { Button } from '@/components/Buttons';
import { useGetMyStoreQuery, useUpdateStoreMutation } from '@/redux/vendor';

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

const BusinessAddress = () => {
  const navigate = useNavigate();

  const { data: storeData, refetch: refetchStore } = useGetMyStoreQuery({});
  const [updateStore, { isLoading }] = useUpdateStoreMutation();

  const store = storeData?.store;

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [noFixedAddress, setNoFixedAddress] = useState(false);

  useEffect(() => {
    if (store) {
      if (store.location) {
        setSelectedLocation({
          name: store.location.name,
          address: store.location.address,
          city: store.location.city,
          state: store.location.state,
          zipcode: store.location.zipcode,
          coordinates: {
            latitude: store.location.geoPoint?.coordinates?.[1] || 0,
            longitude: store.location.geoPoint?.coordinates?.[0] || 0,
          },
        });
        setNoFixedAddress(false);
      } else {
        setSelectedLocation(null);
        setNoFixedAddress(true);
      }
    }
  }, [store]);

  const handleSave = async () => {
    if (!selectedLocation && !noFixedAddress) {
      toast.error('Please select a location or check the no fixed address option');
      return;
    }

    try {
      await updateStore({
        storeId: store.id,
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
      }).unwrap();

      toast.success('Business address updated successfully');
      refetchStore();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update business address');
    }
  };

  return (
    <HomeLayout isLoading={false} showNavBar={false}>
      <div className="min-h-screen bg-white">
        <div className="max-w-[500px] px-6 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[14px] mb-6">
            <button
              onClick={() => navigate('/settings')}
              className="text-[#6C6C6C] hover:text-[#344054] font-medium"
            >
              Settings
            </button>
            <span className="text-[#6C6C6C]">/</span>
            <button
              onClick={() => navigate('/settings', { state: { tab: 'business-settings' } })}
              className="text-[#6C6C6C] hover:text-[#344054] font-medium"
            >
              Business settings
            </button>
            <span className="text-[#6C6C6C]">/</span>
            <span className="text-[#101828] font-medium">Business address</span>
          </div>

          {/* Title */}
          <h1 className="text-[23px] font-bold text-[#0A0A0A] mb-8 tracking-tight font-[lora]">
            Store location
          </h1>

          <div className="space-y-7">
            {/* Location Selector */}
            <div>
              <label className="block text-[14px] font-medium text-[#344054] mb-2">
                Address
              </label>
              <div className={noFixedAddress ? 'opacity-50 pointer-events-none' : ''}>
                <LocationSelector
                  onLocationSelect={(loc: Location) => setSelectedLocation(loc)}
                  placeholder="Address"
                />
              </div>

              {/* Selected location pill */}
              {selectedLocation && !noFixedAddress && (
                <div className="mt-3 flex items-start gap-2 px-4 py-3 bg-[#FAFAFA] rounded-xl border border-[#F0F0F0]">
                  <svg className="w-4 h-4 text-[#6C6C6C] mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-[14px] font-medium text-[#101828]">{selectedLocation.address}, {selectedLocation.name}</p>
                    <p className="text-[13px] text-[#6C6C6C] font-medium mt-0.5">
                      {selectedLocation.city}{selectedLocation.state ? `, ${selectedLocation.state}` : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* No Fixed Address */}
            {/* <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={noFixedAddress}
                onChange={(e) => {
                  setNoFixedAddress(e.target.checked);
                  if (e.target.checked) setSelectedLocation(null);
                }}
                className="mt-0.5 h-4 w-4 rounded border-[#D0D5DD] accent-[#4C9A2A]"
              />
              <span className="text-[14px] font-medium text-[#344054]">
                No fixed business address — online / mobile services only
              </span>
            </label> */}

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={(!selectedLocation && !noFixedAddress) || isLoading}
              variant="default"
              size="full"
              loading={isLoading}
            >
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
};

export default BusinessAddress;
