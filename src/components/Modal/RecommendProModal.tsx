/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogPanel } from '@headlessui/react';
import { IoClose } from 'react-icons/io5';
import { debounce } from 'lodash';
import { useModal } from './ModalProvider';
import { Input } from '@/components/Inputs/TextInput';
import { CustomSelect } from '@/components/Inputs/SelectInput';
import { Textarea } from '@/components/Inputs/TextAreaInput';
import { Button } from '@/components/Buttons';
import { useRecommendProviderMutation } from '@/redux/app';
import { sendMessage, handleError } from '@/utils/notify';

const googleCloudApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface RecommendProModalProps {
  modalId: string;
}

const RecommendProModal = ({ modalId }: RecommendProModalProps) => {
  const { modalStates, hideModal } = useModal();
  const isOpen = modalStates[modalId]?.isOpen || false;

  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    contact: '',
    city: '',
    location: '',
    reason: '',
  });

  const [cityPredictions, setCityPredictions] = useState<any[]>([]);
  const [locationPredictions, setLocationPredictions] = useState<any[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const autocompleteService =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const debouncedCitySearchRef = useRef<any>(null);
  const debouncedLocationSearchRef = useRef<any>(null);

  const [recommendProvider, { isLoading }] = useRecommendProviderMutation();

  const businessTypes = [
    { value: 'Services', label: 'Services' },
    { value: 'Products', label: 'Products' },
    { value: 'Services & Products', label: 'Services & Products' },
  ];

  // Load Google Maps script
  useEffect(() => {
    const initializeServices = () => {
      if (window.google?.maps?.places) {
        autocompleteService.current =
          new window.google.maps.places.AutocompleteService();
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

  const searchPlaces = (query: string, type: 'city' | 'location') => {
    if (!query.trim() || !autocompleteService.current) {
      if (type === 'city') {
        setCityPredictions([]);
        setShowCityDropdown(false);
      }
      if (type === 'location') {
        setLocationPredictions([]);
        setShowLocationDropdown(false);
      }
      return;
    }

    const request: google.maps.places.AutocompletionRequest = {
      input: query,
      componentRestrictions: { country: ['ng', 'gb'] },
    };

    if (type === 'city') {
      request.types = ['(cities)'];
    }

    autocompleteService.current.getPlacePredictions(
      request,
      (predictions, status) => {
        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          predictions
        ) {
          if (type === 'city') {
            setCityPredictions(predictions);
            setShowCityDropdown(true);
          } else {
            setLocationPredictions(predictions);
            setShowLocationDropdown(true);
          }
        } else {
          if (type === 'city') {
            setCityPredictions([]);
            setShowCityDropdown(false);
          }
          if (type === 'location') {
            setLocationPredictions([]);
            setShowLocationDropdown(false);
          }
        }
      }
    );
  };

  // Initialize debounced search functions
  useEffect(() => {
    debouncedCitySearchRef.current = debounce((query: string) => {
      searchPlaces(query, 'city');
    }, 500);

    debouncedLocationSearchRef.current = debounce((query: string) => {
      searchPlaces(query, 'location');
    }, 500);

    return () => {
      debouncedCitySearchRef.current?.cancel();
      debouncedLocationSearchRef.current?.cancel();
    };
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === 'city') {
      debouncedCitySearchRef.current?.(value);
    } else if (field === 'location') {
      debouncedLocationSearchRef.current?.(value);
    }
  };

  const handlePlaceSelect = (place: any, type: 'city' | 'location') => {
    if (type === 'city') {
      setFormData((prev) => ({
        ...prev,
        city: place.structured_formatting?.main_text || place.description,
      }));
      setShowCityDropdown(false);
      setCityPredictions([]);
    } else {
      setFormData((prev) => ({ ...prev, location: place.description }));
      setShowLocationDropdown(false);
      setLocationPredictions([]);
    }
  };

  const handleSubmit = async () => {
    try {
      await recommendProvider({
        businessName: formData.businessName,
        businessType: formData.businessType,
        contact: formData.contact,
        city: formData.city,
        location: formData.location,
        reason: formData.reason,
      }).unwrap();

      sendMessage('Pro recommended successfully!', 'success');
      handleClose();
    } catch (error: any) {
      handleError(error?.data?.message || 'Failed to recommend pro');
    }
  };

  const handleClose = () => {
    setFormData({
      businessName: '',
      businessType: '',
      contact: '',
      city: '',
      location: '',
      reason: '',
    });
    setCityPredictions([]);
    setLocationPredictions([]);
    setShowCityDropdown(false);
    setShowLocationDropdown(false);
    hideModal(modalId);
  };

  const isFormValid =
    formData.businessName.trim() &&
    formData.businessType &&
    formData.contact.trim() &&
    formData.city.trim() &&
    formData.location.trim() &&
    formData.reason.trim();

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto max-w-[520px] w-full bg-white rounded-2xl p-6 max-h-[95vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[18px] md:text-[22px] font-semibold tracking-tight text-[#1D2739] font-[lora]">
              Recommend a pro
            </h2>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <IoClose size={24} className="text-[#1D2739]" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Business Name */}
            <div>
              <label className="text-[14px] font-medium text-[#1D2739] mb-2 block">
                Pro's business name
              </label>
              <Input
                placeholder="Pro's business name"
                value={formData.businessName}
                onChange={(e) =>
                  handleInputChange('businessName', e.target.value)
                }
                className="!bg-[#F9FAFB] !border-none !rounded-lg"
              />
            </div>

            {/* Business Type */}
            <div>
              <label className="text-[14px] font-medium text-[#1D2739] mb-2 block">
                Business type
              </label>
              <CustomSelect
                options={businessTypes}
                value={
                  businessTypes.find(
                    (type) => type.value === formData.businessType
                  ) || null
                }
                onChange={(selectedOption: any) =>
                  handleInputChange('businessType', selectedOption?.value || '')
                }
                placeholder="Business type"
              />
            </div>

            {/* Contact */}
            <div>
              <label className="text-[14px] font-medium text-[#1D2739] mb-2 block">
                Socials, website or whatsapp
              </label>
              <Input
                placeholder="Socials, website or whatsapp"
                value={formData.contact}
                onChange={(e) => handleInputChange('contact', e.target.value)}
                className="!bg-[#F9FAFB] !border-none !rounded-lg"
              />
            </div>

            {/* City */}
            <div className="relative">
              <label className="text-[14px] font-medium text-[#1D2739] mb-2 block">
                City
              </label>
              <Input
                placeholder="City"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                onFocus={() => {
                  if (cityPredictions.length > 0) {
                    setShowCityDropdown(true);
                  }
                }}
                onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
                className="!bg-[#F9FAFB] !border-none !rounded-lg"
              />
              {showCityDropdown && cityPredictions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-[#E4E7EC] rounded-lg shadow-xl max-h-60 overflow-auto">
                  {cityPredictions.map((prediction) => (
                    <button
                      key={prediction.place_id}
                      onClick={() => handlePlaceSelect(prediction, 'city')}
                      className="w-full text-left px-4 py-3 hover:bg-[#F9FAFB] text-[14px] text-[#1D2739] border-b border-[#F0F2F5] last:border-b-0 transition-colors"
                    >
                      <div className="font-medium">
                        {prediction.structured_formatting?.main_text ||
                          prediction.description}
                      </div>
                      {prediction.structured_formatting?.secondary_text && (
                        <div className="text-[12px] text-[#6C6C6C] mt-0.5">
                          {prediction.structured_formatting.secondary_text}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Location */}
            <div className="relative">
              <label className="text-[14px] font-medium text-[#1D2739] mb-2 block">
                Location
              </label>
              <Input
                placeholder="Location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                onFocus={() => {
                  if (locationPredictions.length > 0) {
                    setShowLocationDropdown(true);
                  }
                }}
                onBlur={() =>
                  setTimeout(() => setShowLocationDropdown(false), 200)
                }
                className="!bg-[#F9FAFB] !border-none !rounded-lg"
              />
              {showLocationDropdown && locationPredictions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-[#E4E7EC] rounded-lg shadow-xl max-h-60 overflow-auto">
                  {locationPredictions.map((prediction) => (
                    <button
                      key={prediction.place_id}
                      onClick={() => handlePlaceSelect(prediction, 'location')}
                      className="w-full text-left px-4 py-3 hover:bg-[#F9FAFB] text-[14px] text-[#1D2739] border-b border-[#F0F2F5] last:border-b-0 transition-colors"
                    >
                      <div className="font-medium">
                        {prediction.structured_formatting?.main_text ||
                          prediction.description}
                      </div>
                      {prediction.structured_formatting?.secondary_text && (
                        <div className="text-[12px] text-[#6C6C6C] mt-0.5">
                          {prediction.structured_formatting.secondary_text}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="text-[14px] font-medium text-[#1D2739] mb-2 block">
                Why do you love their work?
              </label>
              <Textarea
                placeholder="Tell us what makes them special - quality, reliability, customer service..."
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                rows={4}
                className="!bg-[#F9FAFB] !border-none !rounded-lg"
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || isLoading}
              className={`!w-full !rounded-full !py-4 !font-semibold !text-[14px] mt-6 ${
                isFormValid && !isLoading
                  ? '!bg-[#4C9A2A] !text-white hover:!bg-[#3d7b22]'
                  : '!bg-gray-200 !text-gray-400 !cursor-not-allowed'
              }`}
            >
              {isLoading ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default RecommendProModal;
