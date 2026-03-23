import { useState, useEffect } from 'react';
import { IoClose } from 'react-icons/io5';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { Button } from '@/components/Buttons';
import { currencySymbol } from '@/pages/home/vendorHome/components/utils';

export interface VendorServicesFilterRequest {
  durationInMinutes?: number;
  maxPrice?: number;
}

interface VendorServicesFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: VendorServicesFilterRequest) => void;
  currentFilters: VendorServicesFilterRequest;
}

const durationOptions = [
  { label: 'Under 30 min', durationInMinutes: 30 },
  { label: '30-60 min', durationInMinutes: 60 },
  { label: '1-2 hours', durationInMinutes: 120 },
  { label: '3-4 hours', durationInMinutes: 240 },
  { label: '5+ hours', durationInMinutes: 300 },
];

const VendorServicesFiltersModal = ({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
}: VendorServicesFiltersModalProps) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [filters, setFilters] = useState<VendorServicesFilterRequest>(currentFilters);

  const MAX_PRICE = user?.countryCode === 'NG' ? 1000000 : 1000;
  const CURRENCY = user?.countryCode === 'NG' ? 'NGN' : 'GBP';

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters, isOpen]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const hasFiltersApplied = !!(
    filters.durationInMinutes !== undefined ||
    (filters.maxPrice !== undefined && filters.maxPrice > 0)
  );

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const formatPriceLabel = (value: number) => {
    if (value === 0) return 'Any price';
    if (value >= MAX_PRICE) return `${currencySymbol(CURRENCY)}${MAX_PRICE.toLocaleString()}+`;
    return `Up to ${currencySymbol(CURRENCY)}${value.toLocaleString()}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[85vh] flex flex-col">
        <div className="sticky top-0 bg-white border-b border-[#F0F0F0] px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-[19px] font-semibold text-[#101828] font-[lora] tracking-tight">Filter</h2>
          <button
            onClick={handleClearFilters}
            disabled={!hasFiltersApplied}
            className={`text-[14px] font-semibold ${hasFiltersApplied ? 'text-primary' : 'text-[#B8B8B8]'}`}
          >
            Reset
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 pt-6 pb-4 space-y-6">
          {/* Appointment duration */}
          <div>
            <h3 className="text-[16px] font-semibold text-[#101828] mb-3">Appointment duration</h3>
            <div className="flex flex-col gap-0 border-b border-[#F0F0F0] pb-2">
              {durationOptions.map((opt) => {
                const isSelected = filters.durationInMinutes === opt.durationInMinutes;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        durationInMinutes: isSelected ? undefined : opt.durationInMinutes,
                      }))
                    }
                    className="flex items-center justify-between py-3.5 text-left"
                  >
                    <span className="text-[15px] font-medium text-[#101828]">{opt.label}</span>
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-primary' : 'border-[#E5E5E5]'
                      }`}
                    >
                      {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price range */}
          <div>
            <h3 className="text-[16px] font-semibold text-[#101828] mb-3">Price range</h3>
            <div className="space-y-3">
              <p className="text-[15px] font-medium text-[#6C6C6C]">
                {formatPriceLabel(filters.maxPrice ?? 0)}
              </p>
              <input
                type="range"
                min={0}
                max={MAX_PRICE}
                value={filters.maxPrice ?? 0}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, maxPrice: Number(e.target.value) }))
                }
                className="w-full h-2 appearance-none bg-[#F0F0F0] rounded-full accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
              />
            </div>
          </div>
        </div>

        <div className="p-6 pt-4 border-t border-[#F0F0F0]">
          <Button className="w-full" onClick={handleApply}>
            Apply filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VendorServicesFiltersModal;
