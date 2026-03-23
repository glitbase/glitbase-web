import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/redux/store';
import { formatDuration } from '@/pages/booking/bookingUtils';

interface CartSummaryProps {
  storeId: string;
  onPress?: () => void;
  onCartClick?: () => void;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
};

const CartSummary = ({ storeId, onPress, onCartClick }: CartSummaryProps) => {
  const navigate = useNavigate();
  const items = useSelector((state: RootState) =>
    storeId && state.cart?.carts ? state.cart.carts[storeId] || [] : []
  );

  const totalServices = items.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = items.reduce((sum, item) => {
    const itemPrice =
      item.service.pricingType === 'free' ? 0 : item.service.price;
    const addOnsPrice = (item.selectedAddOns || []).reduce(
      (addOnSum, addOn) => addOnSum + addOn.price,
      0
    );
    return sum + (itemPrice + addOnsPrice) * item.quantity;
  }, 0);

  const totalDuration = items.reduce((sum, item) => {
    const addOnsDuration = (item.selectedAddOns || []).reduce(
      (addOnSum, addOn) => {
        const duration = addOn.duration
          ? addOn.duration.hours * 60 + addOn.duration.minutes
          : addOn.durationInMinutes || 0;
        return addOnSum + duration;
      },
      0
    );
    return (
      sum + (item.service.durationInMinutes + addOnsDuration) * item.quantity
    );
  }, 0);

  const currency = items[0]?.service?.currency || 'NGN';
  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;

  if (items.length === 0) return null;

  const handleBookNow = () => {
    if (onPress) {
      onPress();
    } else {
      navigate(`/store/${storeId}/booking/create`);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between bg-white px-5 py-4 shadow-[0_-4px_8px_rgba(0,0,0,0.05)] border-t border-gray-200">
      <button
        type="button"
        onClick={onCartClick}
        disabled={!onCartClick}
        className="flex-1 text-left disabled:cursor-default"
      >
        <p className="text-[18px] font-semibold text-[#0A0A0A]">
          {currencySymbol}
          {totalPrice.toLocaleString()}
        </p>
        <div className="flex items-center gap-1.5 text-[14px] font-medium text-[#6C6C6C]">
          <span>
            {totalServices} service{totalServices > 1 ? 's' : ''}
          </span>
          <span>•</span>
          <span>{formatDuration(totalDuration)}</span>
        </div>
      </button>

      <button
        type="button"
        onClick={handleBookNow}
        className="bg-[#4C9A2A] text-white px-6 py-3 rounded-full font-semibold text-[16px] hover:bg-[#3d7a22] transition-colors"
      >
        Book now
      </button>
    </div>
  );
};

export default CartSummary;
