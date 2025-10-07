import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogPanel } from '@headlessui/react';
import { FaLocationDot } from 'react-icons/fa6';
import { IoClose, IoChevronDown, IoLocate } from 'react-icons/io5';
import { debounce } from 'lodash';
import {
  useUpdateUserProfileMutation,
  useUserProfileQuery,
} from '@/redux/auth';
import { useAppSelector } from '@/hooks/redux-hooks';
import { Input } from '@/components/Inputs/TextInput';
import { Button } from '@/components/Buttons';

const googleCloudApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface PlaceResult {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

interface LocationSelectorProps {
  onLocationChange?: (locationData: any) => void;
}

const LocationSelector = ({ onLocationChange }: LocationSelectorProps) => {
  const user = useAppSelector((state) => state.auth.user);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<PlaceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [updateProfile] = useUpdateUserProfileMutation();
  const { refetch } = useUserProfileQuery(undefined, {});

  useEffect(() => {
    loadRecentSearches();
    // Load user's preferred location if available
    if (user?.preferredLocation?.name) {
      const displayLocation = user.preferredLocation.city
        ? `${user.preferredLocation.name}, ${user.preferredLocation.city}`
        : user.preferredLocation.name;
      setSelectedLocation(displayLocation);
    }
  }, [user]);

  const loadRecentSearches = async () => {
    try {
      const stored = localStorage.getItem('recent_location_searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const saveRecentSearch = async (place: PlaceResult) => {
    try {
      const updated = [
        place,
        ...recentSearches.filter((p) => p.place_id !== place.place_id),
      ].slice(0, 10);
      localStorage.setItem('recent_location_searches', JSON.stringify(updated));
      setRecentSearches(updated);
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  const searchPlaces = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Restrict search to Nigeria (NG) and United Kingdom (GB)
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&components=country:ng|country:gb&key=${googleCloudApiKey}`
      );
      const data = await response.json();
      setSearchResults((data.predictions || []).slice(0, 8));
    } catch (error) {
      console.error('Error searching places:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((query: string) => searchPlaces(query), 500),
    []
  );

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Reverse geocode to get readable address
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleCloudApiKey}`
          );
          const data = await response.json();

          if (data.results && data.results.length > 0) {
            const result = data.results[0];
            const formattedAddress = result.formatted_address;

            // Create a place result object
            const currentLocationPlace: PlaceResult = {
              place_id: `current_${Date.now()}`,
              description: formattedAddress,
              structured_formatting: {
                main_text:
                  result.address_components?.[0]?.long_name || formattedAddress,
                secondary_text: formattedAddress
                  .split(',')
                  .slice(1)
                  .join(',')
                  .trim(),
              },
            };

            // Update location with coordinates
            const addressParts = formattedAddress
              .split(',')
              .map((part) => part.trim());
            const fullLocation = `${addressParts[0]}, ${
              addressParts[1] || ''
            }, ${addressParts[2] || ''}`
              .replace(/,\s*,/g, ',')
              .replace(/,\s*$/, '');

            setSelectedLocation(fullLocation);
            saveRecentSearch(currentLocationPlace);
            setModalVisible(false);
            setSearchText('');
            setSearchResults([]);

            // Update user's preferred location in backend with coordinates
            await updateUserLocation(currentLocationPlace, {
              latitude,
              longitude,
            });
          } else {
            alert('Could not get current location address');
          }
          setIsGettingLocation(false);
        },
        (error) => {
          console.error('Error getting current location:', error);
          alert('Failed to get current location');
          setIsGettingLocation(false);
        }
      );
    } catch (error) {
      console.error('Error getting current location:', error);
      alert('Failed to get current location');
      setIsGettingLocation(false);
    }
  };

  const getPlaceDetails = async (placeId: string) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,address_components,formatted_address&key=${googleCloudApiKey}`
      );
      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  };

  const parseLocationDetails = (
    addressComponents: any[],
    formattedAddress: string
  ) => {
    let address = '';
    let city = '';
    let state = '';
    let zipcode = '';

    addressComponents.forEach((component: any) => {
      const types = component.types;

      if (types.includes('street_number') || types.includes('route')) {
        address += component.long_name + ' ';
      }

      if (
        types.includes('locality') ||
        types.includes('administrative_area_level_2')
      ) {
        city = component.long_name;
      }

      if (types.includes('administrative_area_level_1')) {
        state = component.long_name;
      }

      if (types.includes('postal_code')) {
        zipcode = component.long_name;
      }
    });

    return {
      address:
        address.trim() ||
        formattedAddress.split(',')[0]?.trim() ||
        formattedAddress,
      city,
      state,
      zipcode,
    };
  };

  const updateUserLocation = async (
    place: PlaceResult,
    coordinates?: { latitude: number; longitude: number }
  ) => {
    try {
      let locationData: {
        name: string;
        address: string;
        city: string;
        state: string;
        zipcode: string;
        coordinates: {
          latitude: number;
          longitude: number;
        };
      };

      if (coordinates) {
        // For current location, we already have coordinates
        const addressParts = place.description
          .split(',')
          .map((part) => part.trim());
        const placeName =
          place.structured_formatting?.main_text ||
          addressParts[0] ||
          place.description;
        locationData = {
          name: placeName,
          address: addressParts[0] || place.description,
          city: addressParts[1] || '',
          state: addressParts[2] || '',
          zipcode: '',
          coordinates,
        };
      } else {
        // For selected places, get detailed information
        const placeDetails = await getPlaceDetails(place.place_id);
        if (!placeDetails) return;

        const { address, city, state, zipcode } = parseLocationDetails(
          placeDetails.address_components,
          placeDetails.formatted_address
        );

        const placeName = place.structured_formatting?.main_text || address;

        locationData = {
          name: placeName,
          address,
          city,
          state,
          zipcode: zipcode || '111111',
          coordinates: {
            latitude: placeDetails.geometry?.location?.lat || 0,
            longitude: placeDetails.geometry?.location?.lng || 0,
          },
        };
      }

      // Update profile
      await updateProfile({
        preferredLocation: locationData,
      }).unwrap();

      // Refetch user profile
      await refetch();

      // Call callback to trigger refetch
      if (onLocationChange) {
        onLocationChange(locationData);
      }
    } catch (error) {
      console.error('Error updating user location:', error);
    }
  };

  const handlePlaceSelect = async (place: PlaceResult) => {
    // Use the main text (place name) as the display name, with secondary text for context
    const mainText =
      place.structured_formatting?.main_text || place.description;
    const secondaryText = place.structured_formatting?.secondary_text || '';
    const displayLocation = secondaryText
      ? `${mainText}, ${secondaryText}`
      : mainText;

    setSelectedLocation(displayLocation);
    saveRecentSearch(place);
    setModalVisible(false);
    setSearchText('');
    setSearchResults([]);

    // Update user's preferred location in backend
    await updateUserLocation(place);
  };

  const handleCloseModal = () => {
    if (selectedLocation) {
      setModalVisible(false);
      setSearchText('');
      setSearchResults([]);
    }
  };

  const displayResults = searchText.trim() ? searchResults : recentSearches;

  return (
    <div className="relative">
      {selectedLocation ? (
        <button
          onClick={() => setModalVisible(true)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <FaLocationDot size={20} className="text-[#12B76A]" />
          <span className="text-[#1D2739] font-medium text-[16px] max-w-[200px] truncate">
            {selectedLocation}
          </span>
          <IoChevronDown size={16} className="text-[#667185]" />
        </button>
      ) : (
        <button
          onClick={() => setModalVisible(true)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <FaLocationDot size={20} className="text-[#12B76A]" />
          <span className="text-[#1D2739] font-medium text-[16px]">
            Select Location
          </span>
          <IoChevronDown size={16} className="text-[#667185]" />
        </button>
      )}

      <Dialog
        open={modalVisible}
        as="div"
        className="relative z-50 focus:outline-none"
        onClose={handleCloseModal}
      >
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel className="w-full max-w-md rounded-xl bg-white p-6 backdrop-blur-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-[lora] text-[22px] text-[#1D2739] tracking-tight">
                  Select Location
                </h2>
                {selectedLocation && (
                  <button
                    onClick={handleCloseModal}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <IoClose size={24} className="text-[#1D2739]" />
                  </button>
                )}
              </div>

              <div className="mb-4">
                <Input
                  placeholder="Search for a location..."
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    debouncedSearch(e.target.value);
                  }}
                  className="!rounded-3xl"
                />
              </div>

              <button
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="flex items-center gap-2 py-3 mb-4 hover:bg-gray-50 rounded-lg transition-colors w-full"
              >
                {isGettingLocation ? (
                  <div className="w-5 h-5 border-2 border-[#12B76A] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <IoLocate size={20} className="text-[#12B76A]" />
                )}
                <span className="font-semibold text-[#12B76A] text-[16px]">
                  {isGettingLocation
                    ? 'Getting location...'
                    : 'Use current location'}
                </span>
              </button>

              {!searchText.trim() && recentSearches.length > 0 && (
                <h3 className="text-[14px] text-[#667185] font-medium mb-2">
                  Recent Searches
                </h3>
              )}

              <div className="max-h-[300px] overflow-y-auto">
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 py-3 border-b border-[#E4E7EC]"
                      >
                        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : displayResults.length > 0 ? (
                  <div className="space-y-1">
                    {displayResults.map((item) => (
                      <button
                        key={item.place_id}
                        onClick={() => handlePlaceSelect(item)}
                        className="flex items-center gap-3 py-3 px-2 hover:bg-gray-50 rounded-lg transition-colors w-full text-left border-b border-[#E4E7EC] last:border-b-0"
                      >
                        <div className="bg-[#F0F2F5] rounded-full p-2">
                          <FaLocationDot size={16} className="text-[#667185]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-[#1D2739] text-[16px]">
                            {item.structured_formatting?.main_text ||
                              item.description}
                          </p>
                          {item.structured_formatting?.secondary_text && (
                            <p className="text-[14px] text-[#667185] mt-0.5">
                              {item.structured_formatting.secondary_text}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-[#667185] py-8 text-[16px]">
                    {searchText.trim()
                      ? 'No results found'
                      : 'No recent searches'}
                  </p>
                )}
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default LocationSelector;
