import { useState, useEffect } from 'react';
import { IoClose } from 'react-icons/io5';

export interface GlitfinderFilterParams {
  glitType?: 'personal' | 'verified_pro';
  glitboardSize?: '1_25' | '26_100' | '101_500' | '500_plus';
  followerCount?: 'under_1k' | '1k_10k' | '10k_100k' | '100k_plus';
}

interface GlitfinderFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: GlitfinderFilterParams) => void;
  currentFilters: GlitfinderFilterParams;
  resultCount?: number;
}

const GLIT_TYPE_OPTIONS: { label: string; value: GlitfinderFilterParams['glitType'] }[] = [
  { label: 'Personal (user-created content)', value: 'personal' },
  { label: 'Verified pro', value: 'verified_pro' },
];

const GLITBOARD_SIZE_OPTIONS: { label: string; value: GlitfinderFilterParams['glitboardSize'] }[] = [
  { label: '1 - 25 glits', value: '1_25' },
  { label: '26 - 100 glits', value: '26_100' },
  { label: '101 - 500 glits', value: '101_500' },
  { label: '500+ glits', value: '500_plus' },
];

const FOLLOWER_COUNT_OPTIONS: { label: string; value: GlitfinderFilterParams['followerCount'] }[] = [
  { label: 'Under 1k followers', value: 'under_1k' },
  { label: '1k - 10k followers', value: '1k_10k' },
  { label: '10k - 100k followers', value: '10k_100k' },
  { label: '100k+ followers', value: '100k_plus' },
];

const GlitfinderFiltersModal = ({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
  resultCount = 0,
}: GlitfinderFiltersModalProps) => {
  const [filters, setFilters] = useState<GlitfinderFilterParams>(currentFilters);

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const hasActiveFilters = () =>
    Object.values(filters).some((v) => v !== undefined && v !== '');

  const handleReset = () => setFilters({});

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const renderSection = (
    title: string,
    options: { label: string; value: string | undefined }[],
    key: keyof GlitfinderFilterParams,
    value: string | undefined
  ) => (
    <div className="mb-5">
      <h3 className="text-[16px] font-semibold text-[#1D2739] mb-3">{title}</h3>
      <div className="flex flex-col gap-0 pb-2">
        {options.map((opt, index) => (
          <label
            key={opt.value ?? 'none'}
            className="flex items-center justify-between py-3.5 cursor-pointer"
          >
            <span className="text-[15px] text-[#1D2739] font-medium">{opt.label}</span>
            <input
              type="radio"
              name={key}
              checked={value === opt.value}
              onChange={() =>
                setFilters((prev) => ({
                  ...prev,
                  [key]: value === opt.value ? undefined : (opt.value as any),
                }))
              }
              className="w-5 h-5 text-[#4C9A2A] focus:ring-[#4C9A2A]"
            />
          </label>
        ))}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-[19px] font-semibold text-[#1D2739] font-[lora]">Filter</h2>
          <button
            type="button"
            onClick={handleReset}
            disabled={!hasActiveFilters()}
            className="text-[15px] font-medium text-[#4C9A2A] disabled:text-[#9D9D9D]"
          >
            Reset
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {renderSection('By glit type', GLIT_TYPE_OPTIONS, 'glitType', filters.glitType)}
          {renderSection('By glitboard size', GLITBOARD_SIZE_OPTIONS, 'glitboardSize', filters.glitboardSize)}
          {renderSection('Follower count', FOLLOWER_COUNT_OPTIONS, 'followerCount', filters.followerCount)}
        </div>
        <div className="border-t border-[#E5E7EB] px-6 py-4 bg-white">
          <button
            type="button"
            onClick={handleApply}
            className="w-full py-3 rounded-lg text-[15px] font-semibold text-white bg-[#4C9A2A] hover:bg-[#3d7b22]"
          >
            Show results
            {/* all {resultCount > 0 ? `${resultCount.toLocaleString()}+` : ''}   results */}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlitfinderFiltersModal;
