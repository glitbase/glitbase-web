/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react';
import { IoClose, IoSearch } from 'react-icons/io5';
import { FaLocationDot } from 'react-icons/fa6';
import { debounce } from 'lodash';
import { MapPin } from 'lucide-react';
import { Input } from './Inputs/TextInput';

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

interface LocationSelectorProps {
  onLocationSelect: (location: Location) => void;
  placeholder?: string;
  value?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

const RECENT_LOCATIONS_KEY = 'glitbase_recent_locations';

interface RecentLocation {
  name: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  displayText: string; // For displaying in the list
}

const LocationSelector = ({
  onLocationSelect,
  placeholder = 'Search for location',
  value,
}: LocationSelectorProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [recentLocations, setRecentLocations] = useState<RecentLocation[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);

  // Load recent locations from localStorage
  useEffect(() => {
    const loadRecentLocations = () => {
      try {
        const stored = localStorage.getItem(RECENT_LOCATIONS_KEY);
        if (stored) {
          const locations = JSON.parse(stored);
          setRecentLocations(locations);
        }
      } catch (error) {
        console.error('Error loading recent locations:', error);
      }
    };
    loadRecentLocations();
  }, []);

  // Initialize Google Maps services
  useEffect(() => {
    const initializeServices = () => {
      if (window.google?.maps?.places) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        const dummyDiv = document.createElement('div');
        placesService.current = new window.google.maps.places.PlacesService(dummyDiv);
        setIsLoaded(true);
      }
    };

    if (window.google?.maps?.places) {
      initializeServices();
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', initializeServices);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    }&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = initializeServices;
    document.head.appendChild(script);
  }, []);

  const searchPlaces = async (query: string) => {
    if (!query.trim() || !autocompleteService.current) {
      setSearchResults([]);
      setIsLoading(false);
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
            setSearchResults(predictions.slice(0, 8));
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

  // Create debounced search function
  const debouncedSearchRef = useRef(
    debounce((query: string) => {
      searchPlaces(query);
    }, 500)
  );

  const getPlaceDetails = async (
    placeId: string
  ): Promise<google.maps.places.PlaceResult | null> => {
    return new Promise((resolve) => {
      if (!placesService.current) {
        resolve(null);
        return;
      }

      placesService.current.getDetails(
        {
          placeId: placeId,
          fields: ['geometry', 'address_components', 'formatted_address', 'name'],
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
            resolve(null);
          }
        }
      );
    });
  };

  const saveRecentLocation = (location: Location) => {
    try {
      const displayText = location.city
        ? `${location.name || location.address}, ${location.city}`
        : location.name || location.address;

      const recentLocation: RecentLocation = {
        ...location,
        displayText,
      };

      // Remove duplicate if exists and add to beginning
      const updated = [
        recentLocation,
        ...recentLocations.filter(
          (loc) => loc.address !== location.address
        ),
      ].slice(0, 10); // Keep only last 10

      setRecentLocations(updated);
      localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving recent location:', error);
    }
  };

  const handlePlaceSelect = async (prediction: google.maps.places.AutocompletePrediction) => {
    const placeDetails = await getPlaceDetails(prediction.place_id);
    if (!placeDetails) return;

    const addressComponents = placeDetails.address_components || [];
    const getComponent = (type: string) => {
      const component = addressComponents.find((c: any) =>
        c.types.includes(type)
      );
      return component?.long_name || '';
    };

    const location: Location = {
      name: placeDetails.name || placeDetails.formatted_address || '',
      address: placeDetails.formatted_address || '',
      city: getComponent('locality') || getComponent('postal_town'),
      state: getComponent('administrative_area_level_1'),
      zipcode: getComponent('postal_code'),
      coordinates: {
        latitude: placeDetails.geometry?.location?.lat() || 0,
        longitude: placeDetails.geometry?.location?.lng() || 0,
      },
    };

    saveRecentLocation(location);
    onLocationSelect(location);
    setIsModalOpen(false);
    setSearchText('');
    setSearchResults([]);
  };

  const handleRecentLocationSelect = (recentLocation: RecentLocation) => {
    const location: Location = {
      name: recentLocation.name,
      address: recentLocation.address,
      city: recentLocation.city,
      state: recentLocation.state,
      zipcode: recentLocation.zipcode,
      coordinates: recentLocation.coordinates,
    };

    // Move selected location to top of recent list
    const updated = [
      recentLocation,
      ...recentLocations.filter(
        (loc) => loc.address !== recentLocation.address
      ),
    ];
    setRecentLocations(updated);
    localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(updated));

    onLocationSelect(location);
    setIsModalOpen(false);
    setSearchText('');
    setSearchResults([]);
  };

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        setIsGettingLocation(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
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
                const addressComponents = result.address_components || [];
                const getComponent = (type: string) => {
                  const component = addressComponents.find((c: any) =>
                    c.types.includes(type)
                  );
                  return component?.long_name || '';
                };

                const location: Location = {
                  name: result.formatted_address,
                  address: result.formatted_address,
                  city: getComponent('locality') || getComponent('postal_town'),
                  state: getComponent('administrative_area_level_1'),
                  zipcode: getComponent('postal_code'),
                  coordinates: { latitude, longitude },
                };

                saveRecentLocation(location);
                onLocationSelect(location);
                setIsModalOpen(false);
                setSearchText('');
                setSearchResults([]);
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
      setIsGettingLocation(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="w-full px-4 h-[50px] rounded-lg pl-12 bg-[#FAFAFA] text-left focus:outline-none focus:ring-0 focus:ring-0 focus:border-transparent transition-colors relative"
      >
        <MapPin size={20} className="text-[#9D9D9D] absolute left-4 top-1/2 transform -translate-y-1/2 z-10" />
        <span className={value ? 'text-gray-900 font-medium text-[14px]' : 'text-gray-400 font-medium text-[14px]'}>
          {value || placeholder}
        </span>
      </button>

      <Dialog
        open={isModalOpen}
        as="div"
        className="relative z-50 focus:outline-none"
        onClose={() => setIsModalOpen(false)}
      >
        <DialogBackdrop className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center">
            <DialogPanel
              transition
              className="w-full max-w-lg rounded-xl bg-white p-2 md:p-6 shadow-lg"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[22px] font-bold text-[#0A0A0A] font-[lora]">
                  Select locationbb
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 bg-[#F0F0F0] rounded-full transition-colors"
                >
                  <IoClose size={16} className="text-[#0A0A0A]" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="mb-4 relative">
                <IoSearch
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6C6C6C] z-10"
                />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Enter a new location"
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    debouncedSearchRef.current(e.target.value);
                  }}
                  className="w-full pl-10 pr-10 py-3 bg-[#FAFAFA] border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C9A2A]/20 text-[#1D2739] placeholder:text-[#98A2B3] text-sm"
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

              {/* Use Current Location */}
              <button
                onClick={getCurrentLocation}
                disabled={isGettingLocation || !isLoaded}
                className="flex items-center gap-3 py-3 px-2 mb-2  rounded-lg transition-colors w-full disabled:opacity-70"
              >
                {isGettingLocation ? (
                  <div className="w-6 h-6 border-2 border-[#4C9A2A] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="32" height="32" rx="16" fill="#F2FFEC"/>
                  <g clip-path="url(#clip0_85_145228)">
                  <path d="M22.0292 10.0356C20.5772 8.4719 9.65505 12.3025 9.66407 13.701C9.67429 15.2869 13.9295 15.7748 15.1089 16.1057C15.8181 16.3047 16.0081 16.5086 16.1716 17.2524C16.9123 20.6206 17.2841 22.296 18.1317 22.3334C19.4826 22.3931 23.4463 11.5617 22.0292 10.0356Z" fill="#4C9A2A" stroke="#4C9A2A" stroke-width="1.5"/>
                  <path d="M15.6641 17.0003L16.8307 15.8337L17.9974 14.667" stroke="#F2FFEC" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </g>
                  <defs>
                  <clipPath id="clip0_85_145228">
                  <rect width="16" height="16" fill="white" transform="translate(8 8)"/>
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

              {/* Search Results */}
              <div className="max-h-[300px] overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-[#4C9A2A] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : searchText.trim() ? (
                  searchResults.length > 0 ? (
                    <div className="space-y-0">
                      {searchResults.map((prediction) => (
                        <button
                          key={prediction.place_id}
                          onClick={() => handlePlaceSelect(prediction)}
                          className="flex items-center gap-3 py-3 px-2 hover:bg-[#F9FAFB] rounded-lg transition-colors w-full text-left"
                        >
                          <div className="bg-[#FAFAFA] rounded-full p-2 flex-shrink-0">
                            <FaLocationDot size={16} className="text-[#3B3B3B]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#0A0A0A] text-[16px] truncate">
                              {prediction.structured_formatting?.main_text ||
                                prediction.description}
                            </p>
                            {prediction.structured_formatting?.secondary_text && (
                              <p className="text-[14px] text-[#6C6C6C] mt-0.5 truncate font-medium">
                                {prediction.structured_formatting.secondary_text}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <h3 className="font-semibold text-[#0A0A0A] text-[22px] tracking-tight mb-2 font-[lora]">
                        No results found
                      </h3>
                      <p className="text-[#6C6C6C] text-[14px] max-w-[280px] font-medium">
                        We couldn't locate this address. Please check your
                        spelling or try a different address
                      </p>
                    </div>
                  )
                ) : recentLocations.length > 0 ? (
                  <>
                    <h3 className="text-[14px] text-[#0A0A0A] font-medium mb-2 mt-4">
                      Recent searches
                    </h3>
                    <div className="space-y-0">
                      {recentLocations.map((location, index) => (
                        <button
                          key={`${location.address}-${index}`}
                          onClick={() => handleRecentLocationSelect(location)}
                          className="flex items-center gap-3 py-3 px-2 hover:bg-[#F9FAFB] rounded-lg transition-colors w-full text-left"
                        >
                          <div className="bg-[#FAFAFA] rounded-full p-2 flex-shrink-0">
                            <FaLocationDot size={16} className="text-[#3B3B3B]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#0A0A0A] text-[16px] truncate">
                              {location.displayText || location.name || location.address}
                            </p>
                            {location.city && (
                              <p className="text-[14px] text-[#6C6C6C] mt-0.5 truncate font-medium">
                                {location.city}{location.state ? `, ${location.state}` : ''}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default LocationSelector;
