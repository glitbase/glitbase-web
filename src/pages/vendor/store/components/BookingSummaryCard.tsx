/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react';
import { BookingItem, ServiceType } from '@/redux/booking/bookingSlice';

interface BookingSummaryCardProps {
  store?: {
    name?: string;
    location?: { name?: string };
    rating?: number;
    reviewCount?: number;
    bannerImageUrl?: string;
  };
  items: BookingItem[];
  totals: {
    subTotal: number;
    deliveryFee: number;
    taxes: number;
    discount: number;
    total: number;
    totalDuration?: number;
  };
  currency?: string;
  onBookNow: () => void;
  showBreakdown?: boolean;
  showCTA?: boolean;
  // Checkout mode props
  showCheckoutDetails?: boolean;
  serviceType?: ServiceType;
  serviceDate?: string;
  serviceTime?: string;
  pickupTime?: string;
  dropoffTime?: string;
  address?: string;
  // pickupAddress is kept for API compatibility but not displayed in current UI
  pickupAddress?: string;
  dropoffAddress?: string;
  onEditDate?: () => void;
  onEditTime?: () => void;
  onEditAddress?: () => void;
}

const formatTimeLabel = (time?: string) => {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const normalized = h % 12 === 0 ? 12 : h % 12;
  return `${normalized}:${m.toString().padStart(2, '0')} ${suffix}`;
};

const formatDateLabel = (dateStr?: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const BookingSummaryCard = (props: BookingSummaryCardProps) => {
  const {
    store,
    items,
    totals,
    currency = 'USD',
    onBookNow,
    showBreakdown = true,
    showCTA = true,
    showCheckoutDetails = false,
    serviceType,
    serviceDate,
    serviceTime,
    pickupTime,
    dropoffTime,
    address,
    dropoffAddress,
    onEditDate,
    onEditTime,
    onEditAddress,
  } = props;
  const currencySymbol = useMemo(() => {
    const symbols: Record<string, string> = { NGN: '₦', USD: '$', GBP: '£' };
    return symbols[currency] || currency;
  }, [currency]);

  if (!items.length) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-4 sticky top-28">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden">
          {store?.bannerImageUrl ? (
            <img
              src={store.bannerImageUrl}
              alt={store.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              🏪
            </div>
          )}
        </div>
        <div className="flex-1 space-y-1">
          <p className="font-[500] text-[#0A0A0A]">{store?.name}</p>
          {store?.rating && (
            <p className="text-xs text-[#9D9D9D] flex items-center gap-1">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clip-path="url(#clip0_80_67427)">
                  <path
                    d="M9.15241 2.29677L10.3256 4.66257C10.4856 4.9919 10.9122 5.30779 11.2722 5.36827L13.3986 5.72449C14.7585 5.953 15.0784 6.94771 14.0985 7.92898L12.4454 9.59579C12.1654 9.87808 12.0121 10.4225 12.0987 10.8123L12.572 12.8756C12.9453 14.5089 12.0854 15.1406 10.6522 14.2871L8.65913 13.0974C8.29917 12.8824 7.7059 12.8824 7.33928 13.0974L5.34616 14.2871C3.91965 15.1406 3.05308 14.5021 3.42637 12.8756L3.89966 10.8123C3.98631 10.4225 3.833 9.87808 3.55303 9.59579L1.89988 7.92898C0.926651 6.94771 1.23995 5.953 2.5998 5.72449L4.72623 5.36827C5.07953 5.30779 5.50615 4.9919 5.66613 4.66257L6.83933 2.29677C7.47926 1.01306 8.51915 1.01306 9.15241 2.29677Z"
                    fill="#0A0A0A"
                    stroke="#0A0A0A"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_80_67427">
                    <rect width="16" height="16" fill="white" />
                  </clipPath>
                </defs>
              </svg>
              {store.rating}{' '}
              <span className="text-[#4C9A2A] font-[500]">
                ({store.reviewCount || 0})
              </span>
            </p>
          )}
          <p className="text-sm text-[#9D9D9D] flex items-center gap-1">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10.2133 16.0252C9.88804 16.3298 9.45329 16.5 9.00084 16.5C8.54839 16.5 8.11364 16.3298 7.78837 16.0252C4.80977 13.2195 0.818072 10.0852 2.7647 5.53475C3.81723 3.07437 6.34376 1.5 9.00084 1.5C11.6579 1.5 14.1845 3.07437 15.237 5.53475C17.1811 10.0795 13.1993 13.2292 10.2133 16.0252Z"
                stroke="#9D9D9D"
                stroke-width="1.5"
              />
              <path
                d="M11.625 8.25C11.625 9.69975 10.4497 10.875 9 10.875C7.55025 10.875 6.375 9.69975 6.375 8.25C6.375 6.80025 7.55025 5.625 9 5.625C10.4497 5.625 11.625 6.80025 11.625 8.25Z"
                stroke="#9D9D9D"
                stroke-width="1.5"
              />
            </svg>

            {store?.location?.name}
          </p>
        </div>
      </div>

      {/* Checkout Details Section */}
      {showCheckoutDetails && (
        <div className="mb-4 space-y-3">
          {/* Date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 1.5V3.75M12 1.5V3.75M2.25 7.5H15.75M3.75 3H14.25C15.0784 3 15.75 3.67157 15.75 4.5V15C15.75 15.8284 15.0784 16.5 14.25 16.5H3.75C2.92157 16.5 2.25 15.8284 2.25 15V4.5C2.25 3.67157 2.92157 3 3.75 3Z"
                  stroke="#6B7280"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDateLabel(serviceDate) || 'Select a date'}
                </p>
              </div>
            </div>
            {onEditDate && (
              <button
                onClick={onEditDate}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M11.334 2.00004C11.5091 1.82494 11.7169 1.68605 11.9457 1.59129C12.1745 1.49653 12.4197 1.44775 12.6673 1.44775C12.915 1.44775 13.1602 1.49653 13.389 1.59129C13.6178 1.68605 13.8256 1.82494 14.0007 2.00004C14.1758 2.17513 14.3147 2.383 14.4094 2.61178C14.5042 2.84055 14.553 3.08575 14.553 3.33337C14.553 3.58099 14.5042 3.82619 14.4094 4.05497C14.3147 4.28374 14.1758 4.49161 14.0007 4.66671L5.00065 13.6667L1.33398 14.6667L2.33398 11L11.334 2.00004Z"
                    stroke="#9D9D9D"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* For pickDrop: separate Pick-up time and Drop-off time rows */}
          {serviceType === 'pickDrop' ? (
            <>
              {/* Pick-up time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 4.5V9L12 10.5M16.5 9C16.5 13.1421 13.1421 16.5 9 16.5C4.85786 16.5 1.5 13.1421 1.5 9C1.5 4.85786 4.85786 1.5 9 1.5C13.1421 1.5 16.5 4.85786 16.5 9Z"
                      stroke="#6B7280"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500">Pick-up time</p>
                    <p className="text-sm font-medium text-gray-900">
                      {pickupTime ? formatTimeLabel(pickupTime) : 'Set time'}{' '}
                      {serviceTime && `- ${formatTimeLabel(serviceTime)}`}
                    </p>
                  </div>
                </div>
                {onEditTime && (
                  <button
                    onClick={onEditTime}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M11.334 2.00004C11.5091 1.82494 11.7169 1.68605 11.9457 1.59129C12.1745 1.49653 12.4197 1.44775 12.6673 1.44775C12.915 1.44775 13.1602 1.49653 13.389 1.59129C13.6178 1.68605 13.8256 1.82494 14.0007 2.00004C14.1758 2.17513 14.3147 2.383 14.4094 2.61178C14.5042 2.84055 14.553 3.08575 14.553 3.33337C14.553 3.58099 14.5042 3.82619 14.4094 4.05497C14.3147 4.28374 14.1758 4.49161 14.0007 4.66671L5.00065 13.6667L1.33398 14.6667L2.33398 11L11.334 2.00004Z"
                        stroke="#9D9D9D"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Drop-off time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 4.5V9L12 10.5M16.5 9C16.5 13.1421 13.1421 16.5 9 16.5C4.85786 16.5 1.5 13.1421 1.5 9C1.5 4.85786 4.85786 1.5 9 1.5C13.1421 1.5 16.5 4.85786 16.5 9Z"
                      stroke="#6B7280"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500">Drop-off time</p>
                    <p className="text-sm font-medium text-gray-900">
                      {dropoffTime ? formatTimeLabel(dropoffTime) : 'Set time'}{' '}
                      {serviceTime && `- ${formatTimeLabel(serviceTime)}`}
                    </p>
                  </div>
                </div>
                {onEditTime && (
                  <button
                    onClick={onEditTime}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M11.334 2.00004C11.5091 1.82494 11.7169 1.68605 11.9457 1.59129C12.1745 1.49653 12.4197 1.44775 12.6673 1.44775C12.915 1.44775 13.1602 1.49653 13.389 1.59129C13.6178 1.68605 13.8256 1.82494 14.0007 2.00004C14.1758 2.17513 14.3147 2.383 14.4094 2.61178C14.5042 2.84055 14.553 3.08575 14.553 3.33337C14.553 3.58099 14.5042 3.82619 14.4094 4.05497C14.3147 4.28374 14.1758 4.49161 14.0007 4.66671L5.00065 13.6667L1.33398 14.6667L2.33398 11L11.334 2.00004Z"
                        stroke="#9D9D9D"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Drop-off address */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10.2133 16.0252C9.88804 16.3298 9.45329 16.5 9.00084 16.5C8.54839 16.5 8.11364 16.3298 7.78837 16.0252C4.80977 13.2195 0.818072 10.0852 2.7647 5.53475C3.81723 3.07437 6.34376 1.5 9.00084 1.5C11.6579 1.5 14.1845 3.07437 15.237 5.53475C17.1811 10.0795 13.1993 13.2292 10.2133 16.0252Z"
                      stroke="#6B7280"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M11.625 8.25C11.625 9.69975 10.4497 10.875 9 10.875C7.55025 10.875 6.375 9.69975 6.375 8.25C6.375 6.80025 7.55025 5.625 9 5.625C10.4497 5.625 11.625 6.80025 11.625 8.25Z"
                      stroke="#6B7280"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500">Drop-off address</p>
                    <p className="text-sm font-medium text-gray-900">
                      {dropoffAddress || 'Set address'}
                    </p>
                  </div>
                </div>
                {onEditAddress && (
                  <button
                    onClick={onEditAddress}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M11.334 2.00004C11.5091 1.82494 11.7169 1.68605 11.9457 1.59129C12.1745 1.49653 12.4197 1.44775 12.6673 1.44775C12.915 1.44775 13.1602 1.49653 13.389 1.59129C13.6178 1.68605 13.8256 1.82494 14.0007 2.00004C14.1758 2.17513 14.3147 2.383 14.4094 2.61178C14.5042 2.84055 14.553 3.08575 14.553 3.33337C14.553 3.58099 14.5042 3.82619 14.4094 4.05497C14.3147 4.28374 14.1758 4.49161 14.0007 4.66671L5.00065 13.6667L1.33398 14.6667L2.33398 11L11.334 2.00004Z"
                        stroke="#9D9D9D"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Time - for normal and home */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 4.5V9L12 10.5M16.5 9C16.5 13.1421 13.1421 16.5 9 16.5C4.85786 16.5 1.5 13.1421 1.5 9C1.5 4.85786 4.85786 1.5 9 1.5C13.1421 1.5 16.5 4.85786 16.5 9Z"
                      stroke="#6B7280"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500">Time</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatTimeLabel(serviceTime) || 'Select a time'}
                    </p>
                  </div>
                </div>
                {onEditTime && (
                  <button
                    onClick={onEditTime}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M11.334 2.00004C11.5091 1.82494 11.7169 1.68605 11.9457 1.59129C12.1745 1.49653 12.4197 1.44775 12.6673 1.44775C12.915 1.44775 13.1602 1.49653 13.389 1.59129C13.6178 1.68605 13.8256 1.82494 14.0007 2.00004C14.1758 2.17513 14.3147 2.383 14.4094 2.61178C14.5042 2.84055 14.553 3.08575 14.553 3.33337C14.553 3.58099 14.5042 3.82619 14.4094 4.05497C14.3147 4.28374 14.1758 4.49161 14.0007 4.66671L5.00065 13.6667L1.33398 14.6667L2.33398 11L11.334 2.00004Z"
                        stroke="#9D9D9D"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Address - shown for home service */}
              {serviceType === 'home' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10.2133 16.0252C9.88804 16.3298 9.45329 16.5 9.00084 16.5C8.54839 16.5 8.11364 16.3298 7.78837 16.0252C4.80977 13.2195 0.818072 10.0852 2.7647 5.53475C3.81723 3.07437 6.34376 1.5 9.00084 1.5C11.6579 1.5 14.1845 3.07437 15.237 5.53475C17.1811 10.0795 13.1993 13.2292 10.2133 16.0252Z"
                        stroke="#6B7280"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M11.625 8.25C11.625 9.69975 10.4497 10.875 9 10.875C7.55025 10.875 6.375 9.69975 6.375 8.25C6.375 6.80025 7.55025 5.625 9 5.625C10.4497 5.625 11.625 6.80025 11.625 8.25Z"
                        stroke="#6B7280"
                        strokeWidth="1.5"
                      />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-sm font-medium text-gray-900">
                        {address || 'Add your address'}
                      </p>
                    </div>
                  </div>
                  {onEditAddress && (
                    <button
                      onClick={onEditAddress}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M11.334 2.00004C11.5091 1.82494 11.7169 1.68605 11.9457 1.59129C12.1745 1.49653 12.4197 1.44775 12.6673 1.44775C12.915 1.44775 13.1602 1.49653 13.389 1.59129C13.6178 1.68605 13.8256 1.82494 14.0007 2.00004C14.1758 2.17513 14.3147 2.383 14.4094 2.61178C14.5042 2.84055 14.553 3.08575 14.553 3.33337C14.553 3.58099 14.5042 3.82619 14.4094 4.05497C14.3147 4.28374 14.1758 4.49161 14.0007 4.66671L5.00065 13.6667L1.33398 14.6667L2.33398 11L11.334 2.00004Z"
                          stroke="#9D9D9D"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Service details</h4>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.serviceId} className="flex space-x-3">
              <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    💇
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-sm font-medium text-gray-900">
                  {currencySymbol}
                  {item.price.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  {Math.floor(item.durationInMinutes / 60)}hr{' '}
                  {item.durationInMinutes % 60}min
                </p>
                {item.addOns?.length ? (
                  <p className="text-xs text-gray-500 mt-1">
                    Add-ons: {item.addOns.map((a) => a.name).join(', ')}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {showBreakdown && (
          <div className="border-t pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Sub-Total ({items.length} Items)</span>
              <span className="text-gray-900">
                {currencySymbol}
                {totals.subTotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Fee</span>
              <span className="text-gray-900">
                {currencySymbol}
                {totals.deliveryFee.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Taxes</span>
              <span className="text-gray-900">
                {currencySymbol}
                {totals.taxes.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Discount</span>
              <span className="text-[#F175B4]">
                -{currencySymbol}
                {Math.abs(totals.discount).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t">
              <span>Total</span>
              <span>
                {currencySymbol}
                {totals.total.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {showCTA && (
          <button
            onClick={onBookNow}
            className="w-full bg-[#4C9A2A] text-white rounded-full py-3 font-semibold hover:bg-[#3d7a22] transition-colors"
          >
            Book now
          </button>
        )}
      </div>
    </div>
  );
};

export default BookingSummaryCard;
