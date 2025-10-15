import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogPanel } from '@headlessui/react';
import { FaLocationDot } from 'react-icons/fa6';
import { IoClose, IoChevronDown } from 'react-icons/io5';
import { debounce } from 'lodash';
import {
  useUpdateUserProfileMutation,
  useUserProfileQuery,
} from '@/redux/auth';
import { useAppSelector } from '@/hooks/redux-hooks';
import { Input } from '@/components/Inputs/TextInput';

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
  onLocationChange?: (locationData: LocationData) => void;
}

interface LocationData {
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
  const autocompleteService =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);

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

  // Load Google Maps script
  useEffect(() => {
    const initializeServices = () => {
      if (window.google?.maps?.places) {
        autocompleteService.current =
          new window.google.maps.places.AutocompleteService();
        // Create a dummy div for PlacesService (it requires a map or div element)
        const dummyDiv = document.createElement('div');
        placesService.current = new window.google.maps.places.PlacesService(
          dummyDiv
        );
      }
    };

    // Check if Google Maps is already loaded
    if (window.google?.maps?.places) {
      initializeServices();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]'
    );

    if (existingScript) {
      // Script already exists, wait for it to load
      existingScript.addEventListener('load', initializeServices);
      return;
    }

    // Load the script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleCloudApiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = initializeServices;
    document.head.appendChild(script);
  }, []);

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

    if (!autocompleteService.current) {
      console.error('Autocomplete service not initialized');
      return;
    }

    setIsLoading(true);
    try {
      autocompleteService.current.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: ['ng', 'gb'] },
        },
        (
          predictions: google.maps.places.AutocompletePrediction[] | null,
          status: google.maps.places.PlacesServiceStatus
        ) => {
          setIsLoading(false);
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            const results: PlaceResult[] = predictions
              .slice(0, 8)
              .map((prediction) => ({
                place_id: prediction.place_id,
                description: prediction.description,
                structured_formatting: {
                  main_text: prediction.structured_formatting.main_text,
                  secondary_text:
                    prediction.structured_formatting.secondary_text,
                },
              }));
            setSearchResults(results);
          } else {
            setSearchResults([]);
          }
        }
      );
    } catch (error) {
      console.error('Error searching places:', error);
      setIsLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      searchPlaces(query);
    }, 500),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        setIsGettingLocation(false);
        return;
      }

      if (!window.google) {
        alert('Google Maps is still loading. Please try again.');
        setIsGettingLocation(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Use Google Maps Geocoder for reverse geocoding
          const geocoder = new window.google.maps.Geocoder();
          const latlng = { lat: latitude, lng: longitude };

          geocoder.geocode(
            { location: latlng },
            (
              results: google.maps.GeocoderResult[] | null,
              status: google.maps.GeocoderStatus
            ) => {
              if (status === 'OK' && results && results.length > 0) {
                const result = results[0];
                const formattedAddress = result.formatted_address;

                // Create a place result object
                const currentLocationPlace: PlaceResult = {
                  place_id: `current_${Date.now()}`,
                  description: formattedAddress,
                  structured_formatting: {
                    main_text:
                      result.address_components?.[0]?.long_name ||
                      formattedAddress,
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
                  .map((part: string) => part.trim());
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
                updateUserLocation(currentLocationPlace, {
                  latitude,
                  longitude,
                });
              } else {
                alert('Could not get current location address');
              }
              setIsGettingLocation(false);
            }
          );
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

  const getPlaceDetails = async (
    placeId: string
  ): Promise<google.maps.places.PlaceResult | null> => {
    return new Promise((resolve) => {
      if (!placesService.current) {
        console.error('Places service not initialized');
        resolve(null);
        return;
      }

      placesService.current.getDetails(
        {
          placeId: placeId,
          fields: ['geometry', 'address_components', 'formatted_address'],
        },
        (
          result: google.maps.places.PlaceResult | null,
          status: google.maps.places.PlacesServiceStatus
        ) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            result
          ) {
            resolve(result);
          } else {
            console.error('Error getting place details:', status);
            resolve(null);
          }
        }
      );
    });
  };

  const parseLocationDetails = (
    addressComponents: google.maps.GeocoderAddressComponent[],
    formattedAddress: string
  ) => {
    let address = '';
    let city = '';
    let state = '';
    let zipcode = '';

    addressComponents.forEach((component) => {
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
      let locationData: LocationData;

      if (coordinates) {
        // For current location, we already have coordinates
        const addressParts = place.description
          .split(',')
          .map((part: string) => part.trim());
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
          placeDetails.address_components || [],
          placeDetails.formatted_address || ''
        );

        const placeName = place.structured_formatting?.main_text || address;

        // Extract lat/lng from place details
        let latitude = 0;
        let longitude = 0;

        if (placeDetails.geometry?.location) {
          const location = placeDetails.geometry.location;
          // Handle both LatLng and LatLngLiteral types
          if (typeof location.lat === 'function') {
            latitude = location.lat();
            longitude = location.lng();
          } else {
            latitude = (location as unknown as google.maps.LatLngLiteral).lat;
            longitude = (location as unknown as google.maps.LatLngLiteral).lng;
          }
        }

        locationData = {
          name: placeName,
          address,
          city,
          state,
          zipcode: zipcode || '111111',
          coordinates: {
            latitude,
            longitude,
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
          <FaLocationDot size={14} className="text-[#12B76A]" />
          <span className="text-[#1D2739] font-medium text-[14px] max-w-[150px] truncate">
            {selectedLocation}
          </span>
          <IoChevronDown size={16} className="text-[#6C6C6C]" />
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
          <IoChevronDown size={16} className="text-[#6C6C6C]" />
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
                  Select location
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <IoClose size={24} className="text-[#1D2739]" />
                </button>
              </div>

              <div className="mb-4">
                <Input
                  placeholder="Enter a new location"
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    debouncedSearch(e.target.value);
                  }}
                  className="!shadow-none !border-none !bg-[#FAFAFA] rounded-lg"
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
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect width="32" height="32" rx="16" fill="#F2FFEC" />
                    <g clip-path="url(#clip0_80_73471)">
                      <path
                        d="M22.0331 10.0351C20.5811 8.47141 9.65896 12.302 9.66797 13.7005C9.6782 15.2864 13.9334 15.7743 15.1128 16.1052C15.822 16.3042 16.012 16.5081 16.1755 17.2519C16.9162 20.6202 17.288 22.2955 18.1356 22.3329C19.4865 22.3926 23.4502 11.5612 22.0331 10.0351Z"
                        fill="#4C9A2A"
                        stroke="#4C9A2A"
                        stroke-width="1.5"
                      />
                      <path
                        d="M15.668 16.9998L16.8346 15.8332L18.0013 14.6665"
                        stroke="#F2FFEC"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_80_73471">
                        <rect
                          width="16"
                          height="16"
                          fill="white"
                          transform="translate(8 8)"
                        />
                      </clipPath>
                    </defs>
                  </svg>
                )}
                <span className="font-semibold text-[#4C9A2A] text-[16px]">
                  {isGettingLocation
                    ? 'Getting location...'
                    : 'Use current location'}
                </span>
              </button>

              {!searchText.trim() && recentSearches.length > 0 && (
                <h3 className="text-[14px] text-[#0A0A0A] font-medium mb-2">
                  Recent searches
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
                    {displayResults.map((item) => {
                      console.log('item', item);
                      return (
                        <button
                          key={item.place_id}
                          onClick={() => handlePlaceSelect(item)}
                          className="flex items-center gap-3 py-3 px-2 hover:bg-gray-50 rounded-lg transition-colors w-full text-left "
                        >
                          <div className="bg-[#F0F2F5] rounded-full p-2">
                            <FaLocationDot
                              size={16}
                              className="text-[#6C6C6C]"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-[#0A0A0A] text-[16px] truncate max-w-[250px]">
                              {item.description ||
                                item.structured_formatting?.main_text}
                            </p>
                            {item.structured_formatting?.secondary_text && (
                              <p className="text-[14px] text-[#6C6C6C] mt-0.5">
                                {item.structured_formatting.secondary_text}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-[#6C6C6C] py-8 text-[16px]">
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
