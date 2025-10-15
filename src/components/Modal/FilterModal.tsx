/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { useFetchMarketplaceCategoriesQuery } from '@/redux/app';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    sortBy?: 'latest' | 'highest_rating' | 'lowest_rating';
    bookingType?: string[];
    category?: string;
    storeAvailability?: string;
    maxPrice?: number;
    duration?: string;
    distance?: number;
  };
  onFilterChange: (key: string, value: any) => void;
  onClearFilters: () => void;
  onApplyFilters: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onClearFilters,
  onApplyFilters,
}) => {
  const [priceValue, setPriceValue] = useState(filters.maxPrice || 0);

  // Fetch categories
  const { data: categoriesData } = useFetchMarketplaceCategoriesQuery({
    limit: 50,
    type: 'service',
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    setPriceValue(filters.maxPrice || 0);
  }, [filters.maxPrice]);

  if (!isOpen) return null;

  const hasActiveFilters = Object.values(filters).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== 0;
  });

  const handleBookingTypeToggle = (type: string) => {
    const currentTypes = filters.bookingType || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];
    onFilterChange('bookingType', newTypes.length > 0 ? newTypes : undefined);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setPriceValue(value);
    onFilterChange('maxPrice', value > 0 ? value : undefined);
  };

  const formatPrice = (value: number) => {
    if (value === 0) return 'Any price';
    if (value >= 1000000) return '£1,000,000+';
    return `£${value.toLocaleString()}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-[24px] font-semibold text-[#1D2739] font-[lora]">
            Filters
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <IoClose size={24} className="text-[#1D2739]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Sort By */}
          <div>
            <label className="block text-[16px] font-semibold text-[#1D2739] mb-4">
              Sort By
            </label>
            <div className="flex gap-3">
              {[
                { value: 'highest_rating', label: 'Highest rating' },
                { value: 'lowest_rating', label: 'Lowest rating' },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="sortBy"
                    checked={filters.sortBy === option.value}
                    onChange={() => onFilterChange('sortBy', option.value)}
                    className="w-5 h-5 text-[#4C9A2A] focus:ring-[#4C9A2A]"
                  />
                  <span className="text-[14px] text-[#1D2739]">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Booking Type */}
          <div>
            <label className="block text-[16px] font-semibold text-[#1D2739] mb-4">
              Booking type
            </label>
            <div className="flex flex-wrap gap-3">
              {[
                { value: 'normal', label: 'Normal service' },
                { value: 'home', label: 'Home service' },
                { value: 'drop-off', label: 'Drop-off & pick-up' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleBookingTypeToggle(option.value)}
                  className={`px-4 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${
                    filters.bookingType?.includes(option.value)
                      ? 'bg-[#4C9A2A] text-white'
                      : 'bg-[#F5F5F5] text-[#1D2739] hover:bg-[#E8E8E8]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Service Category */}
          <div>
            <label className="block text-[16px] font-semibold text-[#1D2739] mb-4">
              Service category
            </label>
            <div className="flex flex-wrap gap-3">
              {categoriesData?.categories?.map((cat: any) => (
                <button
                  key={cat.name}
                  onClick={() =>
                    onFilterChange(
                      'category',
                      filters.category === cat.name ? undefined : cat.name
                    )
                  }
                  className={`px-4 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${
                    filters.category === cat.name
                      ? 'bg-[#4C9A2A] text-white'
                      : 'bg-[#F5F5F5] text-[#1D2739] hover:bg-[#E8E8E8]'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-[16px] font-semibold text-[#1D2739] mb-4">
              Availability
            </label>
            <div className="space-y-3">
              {[
                { value: 'available', label: 'Available today' },
                { value: 'booked', label: 'Fully booked' },
                { value: 'busy', label: 'Currently busy' },
                { value: 'offline', label: 'Offline' },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span className="text-[14px] text-[#1D2739]">
                    {option.label}
                  </span>
                  <input
                    type="radio"
                    name="availability"
                    checked={filters.storeAvailability === option.value}
                    onChange={() =>
                      onFilterChange('storeAvailability', option.value)
                    }
                    className="w-5 h-5 text-[#4C9A2A] focus:ring-[#4C9A2A]"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Distance */}
          <div>
            <label className="block text-[16px] font-semibold text-[#1D2739] mb-4">
              Distance
            </label>
            <div className="flex flex-wrap gap-3">
              {[
                { value: 5, label: 'Within 5km' },
                { value: 10, label: 'Within 10km' },
                { value: 15, label: 'Within 15km' },
                { value: 999, label: '15km +' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    onFilterChange(
                      'distance',
                      filters.distance === option.value
                        ? undefined
                        : option.value
                    )
                  }
                  className={`px-4 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${
                    filters.distance === option.value
                      ? 'bg-[#4C9A2A] text-white'
                      : 'bg-[#F5F5F5] text-[#1D2739] hover:bg-[#E8E8E8]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Appointment Duration */}
          <div>
            <label className="block text-[16px] font-semibold text-[#1D2739] mb-4">
              Appointment duration
            </label>
            <div className="flex flex-wrap gap-3">
              {[
                { value: 'under_30m', label: 'Under 30 min' },
                { value: '30_60m', label: '30-60 min' },
                { value: '1_2h', label: '1-2 hours' },
                { value: '3_4h', label: '3-4 hours' },
                { value: '5h_up', label: '5+ hours' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    onFilterChange(
                      'duration',
                      filters.duration === option.value
                        ? undefined
                        : option.value
                    )
                  }
                  className={`px-4 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${
                    filters.duration === option.value
                      ? 'bg-[#4C9A2A] text-white'
                      : 'bg-[#F5F5F5] text-[#1D2739] hover:bg-[#E8E8E8]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-[16px] font-semibold text-[#1D2739] mb-4">
              Price range
            </label>
            <div className="space-y-4">
              <div className="text-[14px] font-medium text-[#1D2739]">
                {formatPrice(priceValue)}
              </div>
              <input
                type="range"
                min="0"
                max="1000000"
                step="10000"
                value={priceValue}
                onChange={handlePriceChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#4C9A2A]"
                style={{
                  background: `linear-gradient(to right, #4C9A2A 0%, #4C9A2A ${
                    (priceValue / 1000000) * 100
                  }%, #E5E7EB ${(priceValue / 1000000) * 100}%, #E5E7EB 100%)`,
                }}
              />
              <div className="flex justify-between text-[12px] text-[#6C6C6C]">
                <span>Any price</span>
                <span>£1,000,000+</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between rounded-b-2xl">
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-[14px] font-medium text-[#6C6C6C] hover:text-[#1D2739] transition-colors"
            >
              Clear all filters
            </button>
          )}
          {!hasActiveFilters && <div />}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-lg text-[14px] font-medium text-[#1D2739] bg-[#F5F5F5] hover:bg-[#E8E8E8] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onApplyFilters();
                onClose();
              }}
              className="px-6 py-3 rounded-lg text-[14px] font-medium text-white bg-[#4C9A2A] hover:bg-[#3d7b22] transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
