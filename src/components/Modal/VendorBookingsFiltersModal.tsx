import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { Button } from "../Buttons";

export interface VendorBookingsFilterRequest {
  sortBy?: string;
  serviceType?: string;
  minDuration?: number;
  maxDuration?: number;
  minValue?: number;
  maxValue?: number;
}

interface VendorBookingsFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: VendorBookingsFilterRequest) => void;
  currentFilters: VendorBookingsFilterRequest;
}

const SORT_OPTIONS = [
  { label: "Newest first", value: "newest" },
  { label: "Oldest first", value: "oldest" },
  { label: "Customer name (A-Z)", value: "customerName" },
];

const BOOKING_TYPES = [
  { label: "Normal service", value: "normal" },
  { label: "Home service", value: "home" },
  { label: "Drop-off & pick-up", value: "pickDrop" },
];

const DURATION_OPTIONS = [
  { label: "Under 30 min", minDuration: 0, maxDuration: 30 },
  { label: "30-60 min", minDuration: 30, maxDuration: 60 },
  { label: "1-2 hours", minDuration: 60, maxDuration: 120 },
  { label: "3-4 hours", minDuration: 180, maxDuration: 240 },
  { label: "5+ hours", minDuration: 300, maxDuration: undefined },
];

const VALUE_OPTIONS_NG = [
  { label: "Under ₦20,000", minValue: 0, maxValue: 20000 },
  { label: "₦20,000 - ₦100,000", minValue: 20000, maxValue: 100000 },
  { label: "₦100,000 - ₦500,000", minValue: 100000, maxValue: 500000 },
  { label: "₦500,000 - ₦1,000,000", minValue: 500000, maxValue: 1000000 },
  { label: "Over ₦1,000,000", minValue: 1000000, maxValue: undefined },
];

const VALUE_OPTIONS_UK = [
  { label: "Under £25", minValue: 0, maxValue: 25 },
  { label: "£25 - £100", minValue: 25, maxValue: 100 },
  { label: "£100 - £500", minValue: 100, maxValue: 500 },
  { label: "£500 - £1,000", minValue: 500, maxValue: 1000 },
  { label: "Over £1,000", minValue: 1000, maxValue: undefined },
];

const VendorBookingsFiltersModal = ({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
}: VendorBookingsFiltersModalProps) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [filters, setFilters] = useState<VendorBookingsFilterRequest>(currentFilters);

  const isNG = user?.countryCode === "NG";
  const valueOptions = isNG ? VALUE_OPTIONS_NG : VALUE_OPTIONS_UK;

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const hasActiveFilters = !!(
    filters.sortBy ||
    filters.serviceType ||
    filters.minDuration !== undefined ||
    filters.maxDuration !== undefined ||
    filters.minValue !== undefined ||
    filters.maxValue !== undefined
  );

  const handleReset = () => {
    setFilters({});
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  if (!isOpen) return null;

  const renderSection = (title: string, children: React.ReactNode) => (
    <div className="mb-6">
      <h3 className="text-[15px] font-semibold text-[#101828] mb-3">{title}</h3>
      {children}
    </div>
  );

  const optionBtn = (
    label: string,
    selected: boolean,
    onClick: () => void,
    vertical = false
  ) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      className={`text-[13px] font-medium transition-colors ${
        vertical
          ? `w-full flex items-center justify-between py-3.5 pr-2 ${
              selected ? "text-[#4C9A2A]" : "text-[#101828]"
            }`
          : `px-4 py-2 rounded-full ${
              selected
                ? "bg-[#101828] text-white"
                : "bg-[#F5F5F5] text-[#6C6C6C] hover:bg-[#EBEBEB]"
            }`
      }`}
    >
      {label}
      {vertical && selected && (
        <span className="w-5 h-5 rounded-full border-2 border-[#4C9A2A] bg-[#4C9A2A] flex items-center justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
        </span>
      )}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-[18px] font-semibold text-[#101828] font-[lora]">
            Filter
          </h2>
          <button
            type="button"
            onClick={handleReset}
            disabled={!hasActiveFilters}
            className="text-[14px] font-medium text-[#4C9A2A] disabled:text-[#9D9D9D] disabled:cursor-not-allowed"
          >
            Reset
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {/* Sort by */}
          {renderSection(
            "Sort by",
            <div className="flex flex-col gap-0 pb-2">
              {SORT_OPTIONS.map((opt) =>
                optionBtn(
                  opt.label,
                  filters.sortBy === opt.value,
                  () =>
                    setFilters((p) => ({
                      ...p,
                      sortBy: filters.sortBy === opt.value ? undefined : opt.value,
                    })),
                  true
                )
              )}
            </div>
          )}

          {/* Booking type */}
          {renderSection(
            "Booking type",
            <div className="flex flex-wrap gap-2">
              {BOOKING_TYPES.map((opt) =>
                optionBtn(
                  opt.label,
                  filters.serviceType === opt.value,
                  () =>
                    setFilters((p) => ({
                      ...p,
                      serviceType:
                        filters.serviceType === opt.value ? undefined : opt.value,
                    }))
                )
              )}
            </div>
          )}

          {/* Appointment duration */}
          {renderSection(
            "Appointment duration",
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((opt) => {
                const selected =
                  filters.minDuration === opt.minDuration &&
                  filters.maxDuration === opt.maxDuration;
                return optionBtn(
                  opt.label,
                  selected,
                  () =>
                    setFilters((p) => ({
                      ...p,
                      minDuration: selected ? undefined : opt.minDuration,
                      maxDuration: selected ? undefined : opt.maxDuration,
                    }))
                );
              })}
            </div>
          )}

          {/* Booking value */}
          {renderSection(
            "Booking value",
            <div className="flex flex-col gap-0 pb-2">
              {valueOptions.map((opt) => {
                const selected =
                  filters.minValue === opt.minValue &&
                  filters.maxValue === opt.maxValue;
                return optionBtn(
                  opt.label,
                  selected,
                  () =>
                    setFilters((p) => ({
                      ...p,
                      minValue: selected ? undefined : opt.minValue,
                      maxValue: selected ? undefined : opt.maxValue,
                    })),
                  true
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#E5E7EB] px-6 py-4 bg-white">
          <Button onClick={handleApply} className="w-full">Apply Filters</Button>
        </div>
      </div>
    </div>
  );
};

export default VendorBookingsFiltersModal;
