/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useGetMyStoreQuery, useUpdateStoreMutation } from '@/redux/vendor';
import LocationSelector from '@/components/LocationSelector';
import HomeLayout from '@/layout/home/HomeLayout';

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

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [noFixedAddress, setNoFixedAddress] = useState(false);

  // Load store location when available
  useEffect(() => {
    if (store) {
      if (store.location) {
        // Convert from API format (geoPoint.coordinates: [lng, lat]) to our format
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

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
  };

  const handleSaveChanges = async () => {
    if (!selectedLocation && !noFixedAddress) {
      toast.error(
        'Please select a location or check the no fixed address option'
      );
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
    <HomeLayout
      isLoading={false}
      showNavBar={false}
      onSearch={() => {}}
      onLocationChange={() => {}}
    >
      <div className="min-h-screen bg-white">
        <div className="max-w-[600px] mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[14px] text-[#667085] mb-6">
            <button
              onClick={() => navigate('/settings')}
              className="hover:text-[#101828]"
            >
              Settings
            </button>
            <span>/</span>
            <button
              onClick={() =>
                navigate('/settings', { state: { tab: 'business-settings' } })
              }
              className="hover:text-[#101828]"
            >
              Business settings
            </button>
            <span>/</span>
            <span className="text-[#101828]">Business address</span>
          </div>

          {/* Header */}
          <h1 className="text-[28px] font-semibold text-[#101828] mb-2">
            Store location
          </h1>

          {/* Form */}
          <div className="space-y-6 mt-6">
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

            {/* Save Button */}
            <div className="mt-8">
              <button
                onClick={handleSaveChanges}
                disabled={(!selectedLocation && !noFixedAddress) || isLoading}
                className="w-full px-4 py-3 text-[16px] font-medium text-white bg-[#3D7B22] rounded-full hover:bg-[#2d5c19] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
};

export default BusinessAddress;
