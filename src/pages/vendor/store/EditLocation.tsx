/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useUpdateStoreMutation } from '@/redux/vendor';
import { toast } from 'react-toastify';
import LocationSelector from '@/components/LocationSelector';

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

const EditLocation = () => {
  const navigate = useNavigate();
  const store = useSelector((state: RootState) => state.vendorStore.store);
  const [updateStore, { isLoading }] = useUpdateStoreMutation();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [noFixedAddress, setNoFixedAddress] = useState(false);

  // Initialize location from store
  useEffect(() => {
    if (store?.location) {
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
    } else if (store) {
      setSelectedLocation(null);
      setNoFixedAddress(true);
    }
  }, [store]);

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
  };

  const handleSaveLocation = async () => {
    if (!selectedLocation && !noFixedAddress) {
      toast.error('Please select a location or check the no fixed address option');
      return;
    }

    if (!store) {
      toast.error('Store not found');
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

      toast.success('Location updated successfully');
      navigate('/vendor/store');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update location');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b sticky top-0 bg-white z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-900"
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
            <h1 className="text-xl font-bold text-gray-900">Edit location</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-full font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLocation}
                disabled={(!selectedLocation && !noFixedAddress) || isLoading}
                className="px-6 py-2 bg-[#4C9A2A] text-white rounded-full font-medium hover:bg-[#3d7a22] disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Address */}
        <div className="mb-6">
          <label className="block text-base font-semibold text-gray-900 mb-3">
            Address
          </label>
          <div
            className={noFixedAddress ? 'opacity-50 pointer-events-none' : ''}
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
            className="mt-1 h-4 w-4 rounded border-gray-300 text-[#FF71AA] focus:ring-[#FF71AA]"
          />
          <label
            htmlFor="no-fixed-address"
            className="text-sm text-gray-700 cursor-pointer"
          >
            No fixed business address - online/mobile services only
          </label>
        </div>
      </div>
    </div>
  );
};

export default EditLocation;
