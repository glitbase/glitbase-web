import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogPanel } from '@headlessui/react';
import { FaLocationDot } from 'react-icons/fa6';
import { IoClose, IoChevronDown, IoSearch } from 'react-icons/io5';
import { debounce } from 'lodash';
import {
  useUpdateUserProfileMutation,
  useUserProfileQuery,
} from '@/redux/auth';
import { useAppSelector } from '@/hooks/redux-hooks';
import { Input } from '@/components/Inputs/TextInput';

const googleCloudApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const SELECTED_LOCATION_KEY = 'selected_location';
const RECENT_SEARCHES_KEY = 'recent_location_searches';

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

    // First, try to load from session storage
    const storedLocation = sessionStorage.getItem(SELECTED_LOCATION_KEY);
    if (storedLocation) {
      setSelectedLocation(storedLocation);
    } else if (user?.preferredLocation?.name) {
      // Fallback to user's preferred location if no session storage
      const displayLocation = user.preferredLocation.city
        ? `${user.preferredLocation.name}, ${user.preferredLocation.city}`
        : user.preferredLocation.name;
      setSelectedLocation(displayLocation);
      // Save to session storage
      sessionStorage.setItem(SELECTED_LOCATION_KEY, displayLocation);
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
      const stored = sessionStorage.getItem(RECENT_SEARCHES_KEY);
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
      sessionStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
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
                // Save to session storage
                sessionStorage.setItem(SELECTED_LOCATION_KEY, fullLocation);
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
    // Save to session storage
    sessionStorage.setItem(SELECTED_LOCATION_KEY, displayLocation);
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

              <div className="mb-4 relative">
                <IoSearch
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6C6C6C]"
                />
                <input
                  type="text"
                  placeholder="Enter a new location"
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    debouncedSearch(e.target.value);
                  }}
                  className="w-full pl-10 pr-10 py-3 bg-[#FAFAFA] border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C9A2A]/20 text-[#1D2739] placeholder:text-[#98A2B3]"
                />
                {searchText && (
                  <button
                    onClick={() => {
                      setSearchText('');
                      setSearchResults([]);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6C6C6C] hover:text-[#1D2739]"
                  >
                    <IoClose size={20} />
                  </button>
                )}
              </div>

              <button
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="flex items-center gap-3 py-3 px-2 mb-4 hover:bg-[#F9FAFB] rounded-lg transition-colors w-full disabled:opacity-70"
              >
                {isGettingLocation ? (
                  <div className="w-8 h-8 border-2 border-[#4C9A2A] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M17.0249 7.52632C16.1858 6.60249 7.49422 9.22632 7.50093 10.2754C7.50865 11.4648 10.4501 11.8307 11.3346 12.0789C11.8665 12.2281 12.009 12.3811 12.1316 12.9389C12.6872 15.4651 12.966 16.7216 13.6017 16.7497C14.6149 16.7945 17.5877 8.67092 17.0249 7.52632Z"
                      fill="#4C9A2A"
                    />
                    <path
                      d="M11.751 13L12.626 12.125L13.501 11.25"
                      stroke="white"
                      stroke-width="1.2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
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
                  <div className="space-y-0">
                    {displayResults.map((item) => {
                      return (
                        <button
                          key={item.place_id}
                          onClick={() => handlePlaceSelect(item)}
                          className="flex items-center gap-3 py-3 px-2 hover:bg-[#F9FAFB] rounded-lg transition-colors w-full text-left"
                        >
                          <div className="bg-[#F0F2F5] rounded-full p-2 flex-shrink-0">
                            <FaLocationDot
                              size={16}
                              className="text-[#6C6C6C]"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#0A0A0A] text-[16px] truncate">
                              {item.description ||
                                item.structured_formatting?.main_text}
                            </p>
                            {item.structured_formatting?.secondary_text && (
                              <p className="text-[14px] text-[#6C6C6C] mt-0.5 truncate">
                                {item.structured_formatting.secondary_text}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : searchText.trim() ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <h3 className="font-semibold text-[#0A0A0A] text-[18px] mb-2">
                      No results found
                    </h3>
                    <p className="text-[#6C6C6C] text-[14px] max-w-[280px]">
                      We couldn't locate this address. Please check your
                      spelling or try a different address
                    </p>
                  </div>
                ) : (
                  <p className="text-center text-[#6C6C6C] py-8 text-[14px]">
                    No recent searches
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
