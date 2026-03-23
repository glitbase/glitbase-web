/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from 'react';
import { BookingItem, ServiceType } from '@/redux/booking/bookingSlice';
import { MapPin, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/Buttons';

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
  onRemoveItem?: (serviceId: string) => void;
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
    onRemoveItem,
  } = props;
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const currencySymbol = useMemo(() => {
    const symbols: Record<string, string> = { NGN: '₦', USD: '$', GBP: '£' };
    return symbols[currency] || currency;
  }, [currency]);

  if (!items.length) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#F0F0F0] p-4 sticky top-28">
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
        <div className="flex-1">
          <p className="font-[500] text-[14px] text-[#0A0A0A] ">{store?.name}</p>
          {store?.rating && (
            <p className="text-xs text-[#9D9D9D] flex items-center gap-1 font-medium mb-1">
              <Star size={12} fill="#0A0A0A" color="#0A0A0A" />
              {store.rating}{' '}
              <span className="text-[#4C9A2A] text-xs font-[500] font-semibold">
                ({store.reviewCount || 0})
              </span>
            </p>
          )}
          <p className="text-[11px] text-[#9D9D9D] flex items-center gap-1 font-medium">
            <MapPin size={11} color="#9D9D9D" />
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

      <div className="space-y-4 mt-8">
        <h4 className="font-medium text-gray-900 text-[14px]">Service details</h4>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.serviceId}>
              <div className="flex space-x-3">
                <div className="w-[70px] h-[70px] bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
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
                  <div className="flex items-start justify-between">
                    <p className="font-medium text-[#0A0A0A] text-[14px] mb-1">{item.name}</p>
                    {onRemoveItem && (
                      <button
                        onClick={() => setConfirmRemoveId(item.serviceId)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2"
                        aria-label="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[14px] text-[#0A0A0A] mb-2">
                    {currencySymbol}
                    {item.price.toLocaleString()}
                  </p>
                  <p className="text-[12px] font-medium text-[#9D9D9D]">
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
              {/* Inline remove confirmation */}
              {confirmRemoveId === item.serviceId && (
                <div className="mt-2 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-xs text-red-600 flex-1 font-medium">Remove this service?</p>
                  <button
                    onClick={() => setConfirmRemoveId(null)}
                    className="text-xs text-gray-500 font-medium hover:text-gray-700 px-2 py-1 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onRemoveItem!(item.serviceId);
                      setConfirmRemoveId(null);
                    }}
                    className="text-xs text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg"
                  >
                    Remove
                  </button>
                </div>
              )}
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

        <div className='!mt-24'>
          {showCTA && (
          <Button size="full" onClick={onBookNow}>
            Book now
          </Button>
        )}
        </div>
        
      </div>
    </div>
  );
};

export default BookingSummaryCard;
