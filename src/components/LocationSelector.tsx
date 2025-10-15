/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';

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
}

declare global {
  interface Window {
    google: any;
  }
}

const LocationSelector = ({
  onLocationSelect,
  placeholder = 'Search for location',
}: LocationSelectorProps) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Load Google Maps API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    }&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Clean up
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    // Initialize autocomplete
    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ['address'],
      }
    );

    // Add place changed listener
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();

      if (!place.geometry || !place.geometry.location) {
        return;
      }

      const addressComponents = place.address_components || [];
      const getComponent = (type: string) => {
        const component = addressComponents.find((c: any) =>
          c.types.includes(type)
        );
        return component?.long_name || '';
      };

      const location: Location = {
        name: place.name || place.formatted_address,
        address: place.formatted_address || '',
        city: getComponent('locality') || getComponent('postal_town'),
        state: getComponent('administrative_area_level_1'),
        zipcode: getComponent('postal_code'),
        coordinates: {
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
        },
      };

      onLocationSelect(location);
      setInputValue(place.formatted_address || '');
    });

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(
          autocompleteRef.current
        );
      }
    };
  }, [isLoaded, onLocationSelect]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        disabled={!isLoaded}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CC5A88] focus:border-transparent disabled:bg-gray-100 disabled:cursor-wait"
      />
      {!isLoaded && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#CC5A88]"></div>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
