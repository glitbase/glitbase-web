/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import {
  addToCart,
  updateCartAddOns,
  clearCart,
  CartAddOn,
  CartService,
} from '@/redux/cart/cartSlice';
import { toast } from 'react-toastify';
import { Button } from '@/components/Buttons';
import { cartServiceIsDeliveryExplicitTrue } from '@/pages/booking/bookingUtils';

interface ServiceDetailsDrawerProps {
  service: any | null;
  storeId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ServiceDetailsDrawer = ({
  service,
  storeId,
  isOpen,
  onClose,
}: ServiceDetailsDrawerProps) => {
  const dispatch = useDispatch();
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

  const cartItems = useSelector((state: RootState) => {
    if (!storeId || !state.cart.carts) return [];
    return state.cart.carts[storeId] || [];
  });

  const cartItem = service
    ? cartItems.find((i) => i.service.id === (service.id || service._id))
    : null;
  const isInCart = !!cartItem;

  const carts = useSelector((state: RootState) => state.cart.carts);
  const allCartStoreIds = useMemo(() => Object.keys(carts || {}), [carts]);

  const addOns: Array<CartAddOn & { id: string }> = useMemo(() => {
    if (!service?.addOns || !Array.isArray(service.addOns)) return [];
    return service.addOns.map((addon: any) => {
      const id = addon.id || addon._id || addon.name;
      return {
        id,
        _id: addon._id,
        name: addon.name,
        description: addon.description,
        price: addon.price || 0,
        duration: addon.duration,
        durationInMinutes: addon.duration
          ? addon.duration.hours * 60 + (addon.duration.minutes || 0)
          : undefined,
      };
    });
  }, [service]);

  useEffect(() => {
    if (service && cartItem?.selectedAddOns) {
      const ids = cartItem.selectedAddOns
        .map((a) => a._id || a.id)
        .filter(Boolean) as string[];
      setSelectedAddOns(ids);
    } else {
      setSelectedAddOns([]);
    }
  }, [service?.id, cartItem?.selectedAddOns]);

  const toggleAddOn = (addOnId: string) => {
    const newSelected = selectedAddOns.includes(addOnId)
      ? selectedAddOns.filter((x) => x !== addOnId)
      : [...selectedAddOns, addOnId];
    setSelectedAddOns(newSelected);

    if (isInCart && storeId && service) {
      const addOnObjects = addOns
        .filter((a) => newSelected.includes(a.id))
        .map(({ id, _id, ...rest }) => ({ ...rest, id, _id }));
      dispatch(
        updateCartAddOns({
          storeId,
          serviceId: service.id || service._id,
          selectedAddOns: addOnObjects,
        })
      );
    }
  };

  const formatPrice = (price: number, currency: string) => {
    const symbols: Record<string, string> = { NGN: '₦', USD: '$', GBP: '£' };
    return `${symbols[currency] || currency}${price.toLocaleString()}`;
  };

  const toCartService = (): CartService => ({
    id: service.id || service._id,
    name: service.name,
    description: service.description,
    imageUrl: service.imageUrl,
    price: service.price || 0,
    currency: service.currency || 'USD',
    durationInMinutes: service.durationInMinutes || 0,
    pricingType: service.pricingType || 'fixed',
    type: service.type,
    isDelivery: cartServiceIsDeliveryExplicitTrue(service),
    addOns: addOns,
  });

  const handleAddService = () => {
    if (!service || !storeId) return;

    const addOnObjects = addOns
      .filter((a) => selectedAddOns.includes(a.id))
      .map(({ id, _id, ...rest }) => ({ ...rest, id, _id }));

    const hasDifferentVendorCart = allCartStoreIds.some(
      (cid) => String(cid) !== String(storeId)
    );

    if (hasDifferentVendorCart) {
      const ok = window.confirm(
        'You have services from a different provider in your cart. Would you like to clear your cart and add this service?'
      );
      if (!ok) return;
      dispatch(clearCart());
    }

    dispatch(
      addToCart({
        storeId,
        service: toCartService(),
        selectedAddOns: addOnObjects,
      })
    );
    toast.success(isInCart ? 'Cart updated' : 'Service added to cart');
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
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20.9995 6.02529L20 6.02276C16.2634 6.01331 14.3951 6.00859 13.0817 6.95266C12.6452 7.26639 12.2622 7.64845 11.9474 8.08412C11 9.39515 11 11.2634 11 15M20.9995 6.02529C21.0062 5.86266 20.9481 5.69906 20.8251 5.55333C20.0599 4.64686 18.0711 3 18.0711 3M20.9995 6.02529C20.9934 6.17112 20.9352 6.31616 20.8249 6.44681C20.0596 7.3531 18.0711 9 18.0711 9"
                stroke="#0A0A0A"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className="px-5 pb-32">
          {service.imageUrl && (
            <img
              src={service.imageUrl}
              alt={service.name}
              className="w-full h-52 object-cover rounded-2xl mb-6"
            />
          )}

          {/* Main service details */}
          <div>
            <h3 className="font-medium text-[#3B3B3B] leading-tight">
              {service.name}
            </h3>
            <p className="mt-2 text-[14px]">
              <span className="font-semibold text-[#0A0A0A]">
                {service.pricingType === 'free'
                  ? 'Free'
                  : service.pricingType === 'from'
                  ? `From ${formatPrice(service.price || 0, service.currency)}`
                  : formatPrice(service.price || 0, service.currency)}
              </span>
              <span className="text-[#888888] mx-1">.</span>
              <span className="font-medium text-[#6C6C6C] text-[14px]">
                {Math.floor((service.durationInMinutes || 0) / 60)}hr{' '}
                {(service.durationInMinutes || 0) % 60}min
              </span>
            </p>
            {service.description && (
              <p className="mt-4 text-[15px] font-medium text-[#3B3B3B] leading-[1.5]">
                {service.description}
              </p>
            )}
          </div>

          {addOns.length > 0 && (
            <div className="mt-10">
              <h4 className="text-[15px] font-[lora] tracking-tight font-bold text-[#0A0A0A]">
                Select add-ons
              </h4>
              <div className="mt-5">
                {addOns.map((addon) => {
                  const isSelected = selectedAddOns.includes(addon.id);
                  return (
                    <label
                      key={addon.id}
                      className="flex items-start gap-4 py-5 cursor-pointer border-b border-gray-200 last:border-b-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-[#0A0A0A]">
                          {addon.name}
                        </p>
                        {addon.description && (
                          <p className="mt-1 text-[14px] font-medium text-[#6C6C6C] leading-snug line-clamp-2">
                            {addon.description}
                          </p>
                        )}
                        <p className="mt-4 text-[12px]">
                          <span className="font-semibold text-[#0A0A0A]">
                            {addon.price === 0
                              ? 'Free'
                              : service.pricingType === 'from'
                              ? `From ${formatPrice(addon.price || 0, service.currency || 'USD')}`
                              : formatPrice(addon.price || 0, service.currency || 'USD')}
                          </span>
                          <span className="text-[#888888] mx-1">.</span>
                          <span className="font-medium text-[#6C6C6C] text-[13px]">
                            {addon.durationInMinutes
                              ? `${Math.floor(addon.durationInMinutes / 60)}hr ${
                                  addon.durationInMinutes % 60
                                }min`
                              : 'Same duration'}
                          </span>
                        </p>
                      </div>
                      <div className="flex-shrink-0 pt-0.5">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={isSelected}
                          onChange={() => toggleAddOn(addon.id)}
                          aria-checked={isSelected}
                        />
                        <span
                          className={`flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0 transition-all ${
                            isSelected
                              ? 'border border-[#FF69B4] bg-white'
                              : 'border border-gray-300 bg-white'
                          }`}
                        >
                          {isSelected && (
                            <span className="block w-2.5 h-2.5 rounded-full bg-[#FF69B4]" />
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
          <Button variant="default" size="full" onClick={handleAddService}>
            {isInCart ? 'Update' : 'Add service'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailsDrawer;
