/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { BookingAddOn, BookingItem } from '@/redux/booking/bookingSlice';

interface ServiceDetailsDrawerProps {
  service: any | null;
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: BookingItem) => void;
}

const ServiceDetailsDrawer = ({
  service,
  isOpen,
  onClose,
  onAdd,
}: ServiceDetailsDrawerProps) => {
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

  useEffect(() => {
    setSelectedAddOns([]);
  }, [service?.id]);

  const addOns: BookingAddOn[] = useMemo(() => {
    if (!service?.addOns || !Array.isArray(service.addOns)) return [];
    return service.addOns.map((addon: any) => ({
      id: addon.id || addon._id || addon.name,
      name: addon.name,
      description: addon.description,
      price: addon.price || 0,
      durationInMinutes:
        addon.duration?.hours * 60 + (addon.duration?.minutes || 0),
    }));
  }, [service]);

  const toggleAddOn = (id: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const formatPrice = (price: number, currency: string) => {
    const symbols: Record<string, string> = { NGN: '₦', USD: '$', GBP: '£' };
    return `${symbols[currency] || currency}${price.toLocaleString()}`;
  };

  const handleAddService = () => {
    if (!service) return;
    const addOnObjects = addOns.filter((a) => selectedAddOns.includes(a.id));
    onAdd({
      serviceId: service.id || service._id,
      name: service.name,
      description: service.description,
      pricingType: service.pricingType || 'fixed',
      price: service.price || 0,
      currency: service.currency || 'USD',
      durationInMinutes: service.durationInMinutes || 0,
      imageUrl: service.imageUrl,
      addOns: addOnObjects,
      quantity: 1,
      availableTypes: service.type,
    });
    onClose();
  };

  if (!isOpen || !service) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto relative">
        <div className="p-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-700"
            aria-label="Close service details"
          >
            ✕
          </button>
          <div className="flex items-center space-x-2 text-gray-500 text-sm">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.1002 3C7.45057 3.00657 5.53942 3.09617 4.31806 4.31754C3 5.63559 3 7.75698 3 11.9997C3 16.2425 3 18.3639 4.31806 19.6819C5.63611 21 7.7575 21 12.0003 21C16.243 21 18.3644 21 19.6825 19.6819C20.9038 18.4606 20.9934 16.5494 21 12.8998"
                stroke="#0A0A0A"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M20.9995 6.02529L20 6.02276C16.2634 6.01331 14.3951 6.00859 13.0817 6.95266C12.6452 7.26639 12.2622 7.64845 11.9474 8.08412C11 9.39515 11 11.2634 11 15M20.9995 6.02529C21.0062 5.86266 20.9481 5.69906 20.8251 5.55333C20.0599 4.64686 18.0711 3 18.0711 3M20.9995 6.02529C20.9934 6.17112 20.9352 6.31616 20.8249 6.44681C20.0596 7.3531 18.0711 9 18.0711 9"
                stroke="#0A0A0A"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {service.imageUrl && (
            <img
              src={service.imageUrl}
              alt={service.name}
              className="w-full h-52 object-cover rounded-2xl"
            />
          )}

          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {service.name}
            </h3>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {service.pricingType === 'free'
                ? 'Free'
                : service.pricingType === 'from'
                ? `From ${formatPrice(service.price || 0, service.currency)}`
                : formatPrice(service.price || 0, service.currency)}
            </p>
            <p className="text-sm text-gray-500">
              {Math.floor((service.durationInMinutes || 0) / 60)}hr{' '}
              {(service.durationInMinutes || 0) % 60}min
            </p>
            {service.description && (
              <p className="text-gray-700 mt-2 text-sm leading-6">
                {service.description}
              </p>
            )}
          </div>

          {addOns.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Select add-ons</h4>
              <div className="space-y-3">
                {addOns.map((addon) => {
                  const isSelected = selectedAddOns.includes(addon.id);
                  return (
                    <label
                      key={addon.id}
                      className="flex items-center space-x-3 rounded-xl  p-3 hover:box-shadow-md cursor-pointer transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {addon.name}
                        </p>
                        {addon.description && (
                          <p className="text-sm text-gray-600">
                            {addon.description}
                          </p>
                        )}
                        <p className="text-sm text-gray-700 font-semibold">
                          {formatPrice(
                            addon.price || 0,
                            service.currency || 'USD'
                          )}{' '}
                          •{' '}
                          {addon.durationInMinutes
                            ? `${Math.floor(addon.durationInMinutes / 60)}hr ${
                                addon.durationInMinutes % 60
                              }min`
                            : 'Same duration'}
                        </p>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={isSelected}
                          onChange={() => toggleAddOn(addon.id)}
                          aria-checked={isSelected}
                        />
                        <span
                          className={`w-6 h-6 rounded-full border-2 transition-all duration-150 flex items-center justify-center ${
                            isSelected
                              ? 'border-[#FF71AA] bg-[#FFE6F1]'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isSelected && (
                            <span className="w-3 h-3 rounded-full bg-[#FF71AA]" />
                          )}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-white absolute bottom-0 left-0 right-0">
          <button
            onClick={handleAddService}
            className="w-full bg-[#4C9A2A] text-white rounded-full py-3 font-semibold hover:bg-[#3d7a22] transition-colors"
          >
            Add service
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailsDrawer;
