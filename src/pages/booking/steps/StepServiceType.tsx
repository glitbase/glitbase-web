import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ArrowLeft, ChevronLeft } from 'lucide-react';
import { BookingFormData } from '../CreateBooking';
import { Button } from '@/components/Buttons';

interface RootState {
  cart: { carts: Record<string, any[]> };
}

const ALL_BOOKING_TYPES = [
  { label: 'Normal service', value: 'normal', description: 'Standard appointment' },
  { label: 'Walk-in service', value: 'walkIn', description: 'Join virtual queue' },
  { label: 'Home service', value: 'home', description: 'Service at your location' },
  { label: 'Virtual service', value: 'virtual', description: 'Online appointment' },
  { label: 'Drop-off & pick-up', value: 'pickDrop', description: 'Convenient collection and return' },
];

interface Props {
  formData: BookingFormData;
  updateFormData: (data: Partial<BookingFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const StepServiceType: React.FC<Props> = ({ formData, updateFormData, onNext, onBack }) => {
  const [selected, setSelected] = useState(formData.serviceType || '');

  const cartItems = useSelector((state: RootState) => {
    if (!formData.storeId || !state.cart.carts) return [];
    return state.cart.carts[formData.storeId] || [];
  });

  // Derive available types from cart items
  const availableTypes = Array.from(
    new Set(cartItems.flatMap((item: any) => item.service.type || []))
  ) as string[];

  const serviceTypes = availableTypes.length
    ? ALL_BOOKING_TYPES.filter((t) => availableTypes.includes(t.value))
    : ALL_BOOKING_TYPES;

  useEffect(() => {
    if (selected) updateFormData({ serviceType: selected });
  }, [selected]);

  const handleContinue = () => {
    if (!selected) return;
    onNext();
  };

  return (
    <div className="flex flex-col min-h-full mt-12">
      {/* Back arrow - above heading, aligned with content */}
      <button
        onClick={onBack}
        className="flex items-center w-fit text-[#6B7280] hover:text-[#0A0A0A] transition-colors mb-6 -ml-1"
        aria-label="Go back"
      >
        <ArrowLeft size={20} strokeWidth={2} color="#3B3B3B" />
      </button>

      {/* Title */}
      <h2 className="text-[24px] font-bold text-[#0A0A0A] mb-2 leading-tight font-[lora] tracking-tight">
        Choose your service type
      </h2>
      <p className="text-[17px] text-[#6C6C6C] mb-6 font-medium">
        Select where you&apos;d like to receive your service.
      </p>

      {/* Service type options */}
      <div className="space-y-3 flex-1 mt-4">
        {serviceTypes.map(({ label, value, description }) => {
          const isSelected = selected === value;
          return (
            <button
              key={value}
              onClick={() => setSelected(value)}
              className={`w-full text-left rounded-2xl px-4 py-5 transition-colors ${
                isSelected ? 'bg-[#FFF0F7]' : 'bg-[#FAFAFA] hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Radio */}
                <div className="mt-0.5 flex-shrink-0">
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full border-2 border-[#F175B4] flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#F175B4]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-[#D9D9D9]" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-[15px] text-[#0A0A0A]">{label}</p>
                  <p className="text-[15px] text-[#6C6C6C] mt-1 font-medium">{description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Continue button */}
      <div className="">
        <Button
          onClick={handleContinue}
          disabled={!selected}
          className="w-full"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default StepServiceType;
