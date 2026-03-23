/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { ChevronLeft } from 'lucide-react';
import { useUpdateStoreMutation } from '@/redux/vendor';
import { toast } from 'react-toastify';
import LocationSelector from '@/components/LocationSelector';
import { Button } from '@/components/Buttons';
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

const EditLocation = () => {
  const navigate = useNavigate();
  const store = useSelector((state: RootState) => state.vendorStore.store);
  const [updateStore, { isLoading }] = useUpdateStoreMutation();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [noFixedAddress, setNoFixedAddress] = useState(false);

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

  const handleSave = async () => {
    if (!selectedLocation && !noFixedAddress) {
      toast.error('Please select a location or check the no fixed address option');
      return;
    }
    if (!store) { toast.error('Store not found'); return; }

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
      navigate(-1);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update location');
    }
  };

  return (
    <HomeLayout isLoading={false} showNavBar={false}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#F0F0F0] px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="w-5 h-5 text-[#101828]" />
        </button>
        <h1 className="text-[17px] font-semibold text-[#101828] font-[lora] tracking-tight">
          Edit location
        </h1>
      </header>

      {/* Content */}
      <div className="max-w-[500px] px-6 py-8 space-y-7">
        <h2 className="text-[23px] font-bold text-[#0A0A0A] tracking-tight font-[lora]">
          Store location
        </h2>

        {/* Address */}
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

          {selectedLocation && !noFixedAddress && (
            <div className="mt-3 flex items-start gap-2 px-4 py-3 bg-[#FAFAFA] rounded-xl border border-[#F0F0F0]">
              <svg className="w-4 h-4 text-[#6C6C6C] mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-[14px] font-medium text-[#101828]">
                  {selectedLocation.address}{selectedLocation.name ? `, ${selectedLocation.name}` : ''}
                </p>
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

        <Button
          variant="default"
          size="full"
          onClick={handleSave}
          disabled={(!selectedLocation && !noFixedAddress) || isLoading}
          loading={isLoading}
        >
          Save changes
        </Button>
      </div>
    </HomeLayout>
  );
};

export default EditLocation;
