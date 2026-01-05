/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import HomeLayout from '@/layout/home/HomeLayout';
import BookingSummaryCard from '@/pages/vendor/store/components/BookingSummaryCard';
import {
  selectBookingState,
  selectBookingTotals,
  setServiceType,
  setServiceDate,
  setServiceTime,
  setContact,
  setNotes,
  setPaymentTerm,
  setPaymentMethod,
  setUseNewCard,
  setPricing,
  setPickupInfo,
  setDropoffInfo,
  resetBooking,
  updateQuantity,
  removeItem,
  ServiceType,
} from '@/redux/booking/bookingSlice';
import { useDispatch, useSelector } from 'react-redux';
import {
  useCalculatePricingMutation,
  useGetPaymentCardsQuery,
  useInitiatePaymentMutation,
  useCompletePaymentMutation,
} from '@/redux/booking';
import { toast } from 'react-toastify';
import { useAppSelector } from '@/hooks/redux-hooks';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const addMinutesToTime = (timeHHmm: string, minutesToAdd: number) => {
  const [h, m] = timeHHmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return timeHHmm;
  const total = h * 60 + m + minutesToAdd;
  const nh = Math.floor((total % (24 * 60)) / 60);
  const nm = total % 60;
  return `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}`;
};

// Card brand icons
const getCardBrandIcon = (brand: string) => {
  const brandLower = brand?.trim().toLowerCase() || '';
  switch (brandLower) {
    case 'visa':
      return (
        <svg width="32" height="20" viewBox="0 0 32 20" fill="none">
          <rect width="32" height="20" rx="2" fill="#1A1F71" />
          <path d="M13.5 14L14.5 6H16.5L15.5 14H13.5Z" fill="white" />
          <path
            d="M21 6L19.5 11.5L19 9C19 9 18.5 7 16.5 6.5L18.5 14H20.5L23 6H21Z"
            fill="white"
          />
          <path
            d="M11 6L9 14H11L11.5 12H13L12.5 14H14.5L12.5 6H11ZM11.5 10L12 8L12.5 10H11.5Z"
            fill="white"
          />
        </svg>
      );
    case 'mastercard':
      return (
        <svg width="32" height="20" viewBox="0 0 32 20" fill="none">
          <rect width="32" height="20" rx="2" fill="#000" />
          <circle cx="12" cy="10" r="6" fill="#EB001B" />
          <circle cx="20" cy="10" r="6" fill="#F79E1B" />
          <path
            d="M16 5.3C17.4 6.5 18.2 8.2 18.2 10C18.2 11.8 17.4 13.5 16 14.7C14.6 13.5 13.8 11.8 13.8 10C13.8 8.2 14.6 6.5 16 5.3Z"
            fill="#FF5F00"
          />
        </svg>
      );
    case 'amex':
    case 'american express':
      return (
        <svg width="32" height="20" viewBox="0 0 32 20" fill="none">
          <rect width="32" height="20" rx="2" fill="#006FCF" />
          <text x="4" y="13" fill="white" fontSize="8" fontWeight="bold">
            AMEX
          </text>
        </svg>
      );
    case 'verve':
      return (
        <svg width="32" height="20" viewBox="0 0 32 20" fill="none">
          <rect width="32" height="20" rx="2" fill="#00425F" />
          <text x="4" y="13" fill="white" fontSize="7" fontWeight="bold">
            VERVE
          </text>
        </svg>
      );
    default:
      return (
        <svg width="32" height="20" viewBox="0 0 32 20" fill="none">
          <rect width="32" height="20" rx="2" fill="#E0E0E0" />
          <rect x="4" y="6" width="24" height="2" fill="#9E9E9E" />
          <rect x="4" y="12" width="16" height="2" fill="#9E9E9E" />
        </svg>
      );
  }
};

const serviceTypeOptions: Array<{
  label: string;
  value: ServiceType;
  description: string;
}> = [
  {
    label: 'Normal service',
    value: 'normal',
    description: 'Standard appointment',
  },
  {
    label: 'Home service',
    value: 'home',
    description: 'Service at your location',
  },
  {
    label: 'Drop-off & pick-up',
    value: 'pickDrop',
    description: 'Convenient collection and return',
  },
];

const formatTimeLabel = (minutes: number) => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const suffix = hrs >= 12 ? 'PM' : 'AM';
  const normalized = hrs % 12 === 0 ? 12 : hrs % 12;
  return `${normalized}:${mins.toString().padStart(2, '0')} ${suffix}`;
};

const displayTime = (time?: string) => {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  return formatTimeLabel(h * 60 + m);
};

const parseTimeToMinutes = (time: string | undefined) => {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const generateSlots = (
  openingTime: string | undefined,
  closingTime: string | undefined,
  durationMinutes: number,
  stepMinutes = 15
) => {
  const start = parseTimeToMinutes(openingTime);
  const end = parseTimeToMinutes(closingTime);
  if (start === null || end === null || durationMinutes <= 0) return [];
  const latestStart = end - durationMinutes;
  if (latestStart < start) return [];
  const slots: { value: string; label: string }[] = [];
  for (let t = start; t <= latestStart; t += stepMinutes) {
    const value = `${Math.floor(t / 60)
      .toString()
      .padStart(2, '0')}:${(t % 60).toString().padStart(2, '0')}`;
    slots.push({ value, label: formatTimeLabel(t) });
  }
  return slots;
};

// Inner component that uses Stripe hooks
const CreateBookingInner = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const booking = useSelector(selectBookingState);
  const totals = useSelector(selectBookingTotals);
  const authUser = useAppSelector((state) => state.auth.user);
  const { data: paymentCards } = useGetPaymentCardsQuery(undefined, {
    skip: false,
  });
  const [calculatePricing, { isLoading: isCalculating }] =
    useCalculatePricingMutation();
  const [initiatePayment, { isLoading: isCreating }] =
    useInitiatePaymentMutation();
  const [completePayment] = useCompletePaymentMutation();

  const [showSuccess, setShowSuccess] = useState(false);
  const [bookingReference, setBookingReference] = useState<string>('');
  const [successDetails, setSuccessDetails] = useState<{
    bookingReference?: string;
    email?: string;
    dateLabel?: string;
    timeLabel?: string;
    addressTitle?: string;
    addressLabel?: string;
  } | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [removeItemId, setRemoveItemId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(
    null
  );
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const steps = useMemo(
    () =>
      booking.serviceType === 'home' || booking.serviceType === 'pickDrop'
        ? ['type', 'datetime', 'address', 'confirm', 'checkout']
        : ['type', 'datetime', 'confirm', 'checkout'],
    [booking.serviceType]
  );
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = steps[stepIndex] || 'type';

  const availableTypes = useMemo(() => {
    if (!booking.items.length) return serviceTypeOptions.map((t) => t.value);
    const allTypes = booking.items
      .map((i) => i.availableTypes || [])
      .filter((arr) => arr.length);
    if (!allTypes.length) return serviceTypeOptions.map((t) => t.value);
    return Array.from(new Set(allTypes.flat())) as ServiceType[];
  }, [booking.items]);

  const currency = useMemo(
    () => booking.items[0]?.currency || 'NGN',
    [booking.items]
  );

  const currencySymbol = useMemo(() => {
    const symbols: Record<string, string> = { NGN: '₦', USD: '$', GBP: '£' };
    return symbols[currency] || currency;
  }, [currency]);

  // Payment gateway based on currency (NGN = Paystack, USD/GBP = Stripe)
  const paymentGateway = useMemo(() => {
    return currency === 'NGN' ? 'paystack' : 'stripe';
  }, [currency]);

  // Calculate deposit amount based on store policy
  const depositAmount = useMemo(() => {
    if (!booking.storePaymentPolicy) return totals.total * 0.5;
    const { depositType, amount } = booking.storePaymentPolicy;
    if (depositType === 'fixed') {
      return Math.min(amount, totals.total);
    }
    return (totals.total * amount) / 100;
  }, [booking.storePaymentPolicy, totals.total]);

  const amountToPay = useMemo(() => {
    if (booking.pricing.amountToPay !== undefined) {
      return booking.pricing.amountToPay;
    }
    return booking.paymentTerm === 'deposit' ? depositAmount : totals.total;
  }, [
    booking.paymentTerm,
    booking.pricing.amountToPay,
    depositAmount,
    totals.total,
  ]);

  const remainingBalance = useMemo(() => {
    if (booking.pricing.remainingBalance !== undefined) {
      return booking.pricing.remainingBalance;
    }
    return booking.paymentTerm === 'deposit' ? totals.total - depositAmount : 0;
  }, [
    booking.paymentTerm,
    booking.pricing.remainingBalance,
    depositAmount,
    totals.total,
  ]);

  // Payment cards data - API returns { paymentCards: [...] }
  const savedCards = useMemo(() => {
    return paymentCards?.paymentCards || [];
  }, [paymentCards]);

  // Auto-select default card on load
  useEffect(() => {
    if (
      savedCards.length > 0 &&
      !booking.paymentMethodId &&
      !booking.useNewCard
    ) {
      const defaultCard =
        savedCards.find((card: any) => card.isDefault) || savedCards[0];
      if (defaultCard) {
        dispatch(setPaymentMethod(defaultCard.id || defaultCard.cardId));
      }
    }
  }, [savedCards, booking.paymentMethodId, booking.useNewCard, dispatch]);

  // Default payment term to 'full' if no deposit option or not set
  useEffect(() => {
    if (!booking.paymentTerm) {
      dispatch(setPaymentTerm('full'));
    }
  }, [booking.paymentTerm, dispatch]);

  // Handle quantity change
  const handleQuantityChange = useCallback(
    (serviceId: string, newQuantity: number) => {
      if (newQuantity < 1) return;
      dispatch(updateQuantity({ serviceId, quantity: newQuantity }));
    },
    [dispatch]
  );

  // Handle remove item
  const handleRemoveItem = useCallback(
    (serviceId: string) => {
      dispatch(removeItem(serviceId));
      setRemoveItemId(null);
      if (booking.items.length === 1) {
        navigate(-1);
      }
    },
    [dispatch, booking.items.length, navigate]
  );

  useEffect(() => {
    if (showSuccess) return;
    if (!booking.storeId || booking.items.length === 0) {
      navigate(-1);
    }
  }, [booking.storeId, booking.items.length, navigate, showSuccess]);

  useEffect(() => {
    // Prefill contact details from authenticated user once
    if (authUser && !booking.contact?.email) {
      dispatch(
        setContact({
          name: `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim(),
          email: authUser.email,
          phoneNumber: authUser.phoneNumber || '',
        })
      );
    }
  }, [authUser, booking.contact?.email, dispatch]);

  useEffect(() => {
    if (
      !booking.storeId ||
      !booking.serviceType ||
      !booking.serviceDate ||
      !booking.serviceTime ||
      !booking.items.length
    ) {
      return;
    }

    const payload = {
      storeId: booking.storeId,
      cartItems: booking.items.map((item) => ({
        serviceId: item.serviceId,
        quantity: item.quantity,
        addOnIds: item.addOns?.map((a) => a.id) || [],
      })),
      paymentTerm: booking.paymentTerm || 'full',
    };

    calculatePricing(payload)
      .unwrap()
      .then((data: any) => {
        dispatch(
          setPricing({
            subTotal: data?.subtotal ?? totals.subTotal,
            deliveryFee: data?.deliveryFee ?? 0,
            taxes: data?.taxes ?? 0,
            discount: data?.discount ?? 0,
            serviceChargeRate: data?.serviceChargeRate,
            serviceChargeAmount: data?.serviceChargeAmount,
            amountToPay: data?.amountToPay ?? data?.totalWithServiceCharge,
            remainingBalance: data?.remainingBalance ?? 0,
            currency: data?.currency,
          })
        );
      })
      .catch((error) => {
        console.error('Pricing calculation error:', error);
        // gracefully ignore pricing errors, keep computed totals
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    booking.storeId,
    booking.serviceType,
    booking.serviceDate,
    booking.serviceTime,
    booking.items,
    booking.paymentTerm,
  ]);

  useEffect(() => {
    dispatch(
      setPricing({
        subTotal: totals.subTotal,
      })
    );
  }, [totals.subTotal, dispatch]);

  const handleContinue = () => {
    if (currentStep === 'type' && !booking.serviceType) {
      toast.error('Select a service type to continue');
      return;
    }
    if (
      currentStep === 'datetime' &&
      (!booking.serviceDate || !booking.serviceTime)
    ) {
      toast.error('Select a date and time to continue');
      return;
    }
    if (currentStep === 'address') {
      if (booking.serviceType === 'home') {
        const addr = booking.pickupInfo?.address;
        if (!addr?.address || !addr.city || !addr.postalCode) {
          toast.error('Please complete your service address');
          return;
        }
      }
      if (booking.serviceType === 'pickDrop') {
        const p = booking.pickupInfo;
        const d = booking.dropoffInfo;
        if (!p?.address?.address || !p.address.city || !p.address.postalCode) {
          toast.error('Please complete pickup address');
          return;
        }
        if (!p.date) {
          toast.error('Please select a pickup date');
          return;
        }
        if (!d?.address?.address || !d.address.city || !d.address.postalCode) {
          toast.error('Please complete drop-off address');
          return;
        }
        if (!d.date) {
          toast.error('Please select a drop-off date');
          return;
        }
      }
      if (
        !booking.contact?.name ||
        !booking.contact?.email ||
        !booking.contact?.phoneNumber
      ) {
        toast.error('Please fill your contact information');
        return;
      }
    }
    if (currentStep === 'confirm') {
      if (
        !booking.contact?.name ||
        !booking.contact?.email ||
        !booking.contact?.phoneNumber
      ) {
        toast.error('Please fill your contact information');
        return;
      }
    }
    if (currentStep === 'checkout') {
      handleConfirmBooking();
      return;
    }
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleConfirmBooking = async () => {
    // Validation - if there are saved cards, user must select one OR choose new card
    // If no saved cards, automatically use new card flow
    if (
      savedCards.length > 0 &&
      !booking.paymentMethodId &&
      !booking.useNewCard
    ) {
      toast.error('Please select a payment method');
      return;
    }

    // If no saved cards, ensure useNewCard is set
    const useNewCardForPayment = savedCards.length === 0 || booking.useNewCard;
    if (savedCards.length === 0 && !booking.useNewCard) {
      dispatch(setUseNewCard(true));
    }

    setIsProcessingPayment(true);

    try {
      // Prepare metadata for the booking
      const metadata: any = {
        storeId: booking.storeId,
        serviceType: booking.serviceType,
        serviceDate: booking.serviceDate,
        serviceTime: booking.serviceTime,
        cartItems: booking.items.map((item) => ({
          serviceId: item.serviceId,
          quantity: item.quantity,
          addOnIds: item.addOns?.map((a) => a.id) || [],
        })),
        pricing: {
          paymentTerm: booking.paymentTerm || 'full',
          subtotal: totals.subTotal,
          totalDuration: totals.totalDuration,
          amountToPay: amountToPay,
          remainingBalance: remainingBalance,
        },
        contactInfo: booking.contact || null,
        additionalInfo: {
          notes: booking.notes || null,
          images: booking.additionalImages || [],
        },
      };

      // Add address fields based on service type
      if (booking.serviceType === 'home') {
        metadata.homeServiceAddress = booking.pickupInfo?.address || null;
      }

      if (booking.serviceType === 'pickDrop') {
        metadata.pickupInfo = {
          address: booking.pickupInfo?.address || null,
          date: booking.pickupInfo?.date || booking.serviceDate,
          notes: booking.pickupInfo?.notes || null,
        };
        metadata.dropoffInfo = {
          address: booking.dropoffInfo?.address || null,
          date: booking.dropoffInfo?.date || booking.serviceDate,
          notes: booking.dropoffInfo?.notes || null,
        };
      }

      // Prepare payment request
      const paymentRequest: any = {
        paymentType: 'booking',
        paymentMethod: 'card',
        paymentGateway: paymentGateway,
        amount: amountToPay,
        currency: currency,
        metadata: metadata,
      };

      // Add payment card ID if using saved card (not new card)
      if (booking.paymentMethodId && !useNewCardForPayment) {
        paymentRequest.paymentCardId = booking.paymentMethodId;
      }

      // Initiate payment (this creates the booking)
      const paymentResponse = await initiatePayment(paymentRequest).unwrap();

      console.log('Payment Response:', paymentResponse);

      // Handle response based on payment status
      if (paymentResponse?.payment?.status === 'completed') {
        // Saved card payment completed successfully
        handlePaymentSuccess(paymentResponse?.booking);
      } else if (paymentResponse?.payment?.status === 'pending') {
        // New card payment - need to process through gateway
        const payment = paymentResponse.payment;
        setPaymentReference(payment.paymentReference);

        if (paymentGateway === 'stripe') {
          // Stripe flow - use CardElement or Payment Sheet
          await handleStripePayment(payment);
        } else {
          // Paystack flow - use popup
          await handlePaystackPayment(payment);
        }
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      toast.error(
        error?.data?.message || 'Failed to create booking. Please try again.'
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handle Stripe payment for new cards
  const handleStripePayment = async (payment: any) => {
    if (!stripe || !elements) {
      toast.error('Payment system not loaded. Please refresh and try again.');
      return;
    }

    const { clientSecret, paymentReference } = payment;

    if (!clientSecret) {
      toast.error('Payment initialization failed');
      return;
    }

    setStripeClientSecret(clientSecret);
    setShowStripeModal(true);
  };

  // Complete Stripe payment after user confirms
  const confirmStripePayment = async () => {
    if (!stripe || !elements || !stripeClientSecret) {
      toast.error('Payment system error');
      return;
    }

    setIsProcessingPayment(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast.error(error.message || 'Payment failed');
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Complete payment on backend
        const completeResponse = await completePayment({
          paymentReference: paymentReference,
        }).unwrap();

        if (completeResponse?.payment?.status === 'completed') {
          setShowStripeModal(false);
          handlePaymentSuccess(completeResponse?.booking);
        }
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Payment completion failed');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handle Paystack payment
  const handlePaystackPayment = async (payment: any) => {
    const { authorizationUrl, paymentReference: ref } = payment;

    // If authorization URL is provided, redirect to it
    if (authorizationUrl) {
      // Store payment reference in session storage for verification after redirect
      sessionStorage.setItem('pendingPaymentReference', ref);
      window.location.href = authorizationUrl;
      return;
    }

    // For inline payment, use PaystackButton component approach
    // This shouldn't happen as Paystack typically returns authorizationUrl
    toast.error('Unable to initialize payment. Please try again.');
  };

  // Check for pending payment on component mount (for Paystack redirect flow)
  useEffect(() => {
    const pendingRef = sessionStorage.getItem('pendingPaymentReference');
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference') || urlParams.get('trxref');

    const refToUse = pendingRef || reference;

    if (refToUse) {
      // Complete the payment
      if (pendingRef) {
        sessionStorage.removeItem('pendingPaymentReference');
      }
      completePayment({ paymentReference: refToUse })
        .unwrap()
        .then((response: any) => {
          if (response?.payment?.status === 'completed') {
            handlePaymentSuccess(response?.booking);
          }
        })
        .catch(() => {
          toast.error('Payment verification failed. Please contact support.');
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle successful payment
  const handlePaymentSuccess = (bookingData: any) => {
    const ref = bookingData?.bookingReference || '';
    const email = booking.contact?.email || '';

    const dateLabel = booking.serviceDate
      ? new Date(booking.serviceDate).toLocaleDateString('en-US', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '';

    const startTime = booking.serviceTime || '';
    const endTime =
      startTime && totals.totalDuration
        ? addMinutesToTime(startTime, totals.totalDuration)
        : '';

    const timeLabel =
      startTime && endTime
        ? `${displayTime(startTime)} - ${displayTime(endTime)}`
        : startTime
        ? displayTime(startTime)
        : '';

    const addressTitle =
      booking.serviceType === 'pickDrop'
        ? 'Drop-off & pick-up address'
        : 'Address';

    const addressLabel =
      booking.serviceType === 'pickDrop'
        ? booking.dropoffInfo?.address?.address ||
          booking.pickupInfo?.address?.address ||
          ''
        : booking.pickupInfo?.address?.address || '';

    setBookingReference(ref);
    setSuccessDetails({
      bookingReference: ref,
      email,
      dateLabel,
      timeLabel,
      addressTitle,
      addressLabel,
    });
    setShowSuccess(true);
  };

  const renderStep = () => {
    if (currentStep === 'type') {
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            Choose your service type
          </h2>
          <p className="text-gray-600">
            Select where you’d like to receive your service.
          </p>
          <div className="grid md:grid-cols-1 gap-4">
            {serviceTypeOptions.map((option) => {
              const disabled = !availableTypes.includes(option.value);
              const isSelected = booking.serviceType === option.value;
              return (
                <button
                  key={option.value}
                  disabled={disabled}
                  onClick={() => dispatch(setServiceType(option.value))}
                  className={`text-left rounded-2xl  p-4 transition-colors ${
                    isSelected
                      ? 'border-[#F175B4] bg-[#F175B4]/10'
                      : 'bg-[#FAFAFA] hover:border-gray-300'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`mt-1 w-4 h-4 rounded-full border ${
                        isSelected
                          ? 'border-[#F175B4] bg-[#F175B4]'
                          : 'border-gray-300'
                      }`}
                    />
                    <div>
                      <p className="font-[500] text-[#0A0A0A]">
                        {option.label}
                      </p>
                      <p className="text-sm text-[#999999]">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (currentStep === 'datetime') {
      const today = new Date();
      const monthStart = currentMonth;
      const monthYearLabel = monthStart.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
      const daysInMonth = new Date(
        monthStart.getFullYear(),
        monthStart.getMonth() + 1,
        0
      ).getDate();
      const startWeekday = monthStart.getDay(); // 0-6

      const calendarCells: Array<Date | null> = [];
      for (let i = 0; i < startWeekday; i++) {
        calendarCells.push(null);
      }
      for (let d = 1; d <= daysInMonth; d++) {
        calendarCells.push(
          new Date(monthStart.getFullYear(), monthStart.getMonth(), d)
        );
      }

      const isDayEnabled = (date: Date) => {
        if (
          date <
          new Date(today.getFullYear(), today.getMonth(), today.getDate())
        ) {
          return false;
        }
        if (!booking.storeOpeningHours?.length) return true;
        const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
        const found = booking.storeOpeningHours.find(
          (d) => d.day?.toLowerCase() === weekday.toLowerCase()
        );
        return found ? found.isOpen : true;
      };

      const handlePrevMonth = () => {
        setCurrentMonth(
          new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1)
        );
      };

      const handleNextMonth = () => {
        setCurrentMonth(
          new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1)
        );
      };

      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Select date and time
            </h2>
            <p className="text-gray-600">
              Choose your preferred date and time from our available
              appointments.
            </p>
          </div>

          <div className="bg-white rounded-2xl border p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePrevMonth}
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-full"
                aria-label="Previous month"
              >
                ‹
              </button>
              <div className="text-lg font-semibold text-gray-900">
                {monthYearLabel}
              </div>
              <button
                onClick={handleNextMonth}
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-full"
                aria-label="Next month"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 text-center text-sm text-gray-500 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarCells.map((date, idx) => {
                if (!date) {
                  return <div key={idx} />;
                }
                const iso = date.toISOString().split('T')[0];
                const isSelected = booking.serviceDate === iso;
                const isEnabled = isDayEnabled(date);
                return (
                  <button
                    key={iso}
                    onClick={() => {
                      if (!isEnabled) return;
                      dispatch(setServiceDate(iso));
                      dispatch(setServiceTime(undefined));
                    }}
                    disabled={!isEnabled}
                    className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center text-sm transition-colors ${
                      isSelected
                        ? 'bg-[#CC4E7C] text-white font-semibold'
                        : isEnabled
                        ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          <TimeSlots
            booking={booking}
            totals={totals}
            onSelect={(slot) => dispatch(setServiceTime(slot))}
          />
        </div>
      );
    }

    if (currentStep === 'address') {
      const showHomeAddress = booking.serviceType === 'home';
      // pickDrop handled later; for now home only
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {showHomeAddress ? 'Enter your home address' : 'Enter address'}
            </h2>
            <p className="text-gray-600">
              Please provide your complete home address so our service provider
              can locate you
            </p>
          </div>

          {showHomeAddress && (
            <div className="space-y-4 bg-white rounded-2xl p-1">
              <div>
                <label className="text-sm text-gray-700">Home address</label>
                <input
                  type="text"
                  value={booking.pickupInfo?.address?.address || ''}
                  onChange={(e) =>
                    dispatch(
                      setPickupInfo({
                        ...booking.pickupInfo,
                        address: {
                          ...(booking.pickupInfo?.address || {
                            address: '',
                            city: '',
                            postalCode: '',
                          }),
                          address: e.target.value,
                        },
                      })
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3 py-3 text-gray-900"
                  placeholder="Home address"
                />
              </div>
              <div>
                <label className="text-sm text-gray-700">
                  Apartment, suite, etc. (optional)
                </label>
                <input
                  type="text"
                  value={booking.pickupInfo?.address?.apartment || ''}
                  onChange={(e) =>
                    dispatch(
                      setPickupInfo({
                        ...booking.pickupInfo,
                        address: {
                          ...(booking.pickupInfo?.address || {
                            address: '',
                            city: '',
                            postalCode: '',
                          }),
                          apartment: e.target.value,
                        },
                      })
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3 py-3 text-gray-900"
                  placeholder="Apartment, suite, etc."
                />
              </div>
              <div>
                <label className="text-sm text-gray-700">City</label>
                <input
                  type="text"
                  value={booking.pickupInfo?.address?.city || ''}
                  onChange={(e) =>
                    dispatch(
                      setPickupInfo({
                        ...booking.pickupInfo,
                        address: {
                          ...(booking.pickupInfo?.address || {
                            address: '',
                            city: '',
                            postalCode: '',
                          }),
                          city: e.target.value,
                        },
                      })
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3 py-3 text-gray-900"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="text-sm text-gray-700">Postal code</label>
                <input
                  type="text"
                  value={booking.pickupInfo?.address?.postalCode || ''}
                  onChange={(e) =>
                    dispatch(
                      setPickupInfo({
                        ...booking.pickupInfo,
                        address: {
                          ...(booking.pickupInfo?.address || {
                            address: '',
                            city: '',
                            postalCode: '',
                          }),
                          postalCode: e.target.value,
                        },
                      })
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3 py-3 text-gray-900"
                  placeholder="Postal code"
                />
              </div>
              <div>
                <label className="text-sm text-gray-700">
                  Additional Directions
                </label>
                <textarea
                  value={
                    booking.pickupInfo?.address?.additionalDirections || ''
                  }
                  onChange={(e) =>
                    dispatch(
                      setPickupInfo({
                        ...booking.pickupInfo,
                        address: {
                          ...(booking.pickupInfo?.address || {
                            address: '',
                            city: '',
                            postalCode: '',
                          }),
                          additionalDirections: e.target.value,
                        },
                      })
                    )
                  }
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] px-3 py-3 text-gray-900"
                  placeholder="Any landmarks or special directions to help us find you..."
                />
              </div>
            </div>
          )}

          {/* <div className="pt-2">
            <button
              onClick={handleContinue}
              className="bg-[#4C9A2A] w-full text-white rounded-full px-6 py-3 font-semibold hover:bg-[#3d7a22] disabled:opacity-50"
            >
              Continue
            </button>
          </div> */}
        </div>
      );
    }

    if (currentStep === 'confirm') {
      const showHomeAddress = booking.serviceType === 'home';
      const showPickDrop = booking.serviceType === 'pickDrop';
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Confirm your booking details
            </h2>
            <p className="text-gray-600">
              Fill in your information below to complete your booking.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 p-2 font-medium">
                Full name
              </label>
              <input
                type="text"
                value={booking.contact?.name || ''}
                disabled
                className="mt-1 w-full rounded-xl border-transparent bg-gray-50 text-gray-800 p-2"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 p-2 font-medium">
                Email address
              </label>
              <input
                type="email"
                value={booking.contact?.email || ''}
                disabled
                className="mt-1 w-full rounded-xl border-transparent bg-gray-50 text-gray-800 p-2"
                placeholder="janedoe@gmail.com"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 p-2 font-medium">
                Phone number
              </label>
              <input
                type="tel"
                value={booking.contact?.phoneNumber || ''}
                disabled
                className="mt-1 w-full rounded-xl border-transparent bg-gray-50 text-gray-800 p-2"
                placeholder="+44 8118087026"
              />
            </div>

            {/* {showHomeAddress && (
              <div className="space-y-3">
                <label className="text-sm text-gray-600 p-2">
                  <span className="font-medium">Service address</span>
                </label>
                <input
                  type="text"
                  value={booking.pickupInfo?.address?.address || ''}
                  onChange={(e) =>
                    dispatch(
                      setPickupInfo({
                        ...booking.pickupInfo,
                        address: {
                          ...(booking.pickupInfo?.address || {
                            address: '',
                            city: '',
                            postalCode: '',
                          }),
                          address: e.target.value,
                        },
                      })
                    )
                  }
                  className="mt-1 w-full rounded-xl border-gray-200 focus:border-[#4C9A2A] focus:ring-[#4C9A2A]"
                  placeholder="Street address"
                />
                <div className="grid md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={booking.pickupInfo?.address?.city || ''}
                    onChange={(e) =>
                      dispatch(
                        setPickupInfo({
                          ...booking.pickupInfo,
                          address: {
                            ...(booking.pickupInfo?.address || {
                              address: '',
                              city: '',
                              postalCode: '',
                            }),
                            city: e.target.value,
                          },
                        })
                      )
                    }
                    className="rounded-xl border-gray-200 focus:border-[#4C9A2A] focus:ring-[#4C9A2A]"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    value={booking.pickupInfo?.address?.postalCode || ''}
                    onChange={(e) =>
                      dispatch(
                        setPickupInfo({
                          ...booking.pickupInfo,
                          address: {
                            ...(booking.pickupInfo?.address || {
                              address: '',
                              city: '',
                              postalCode: '',
                            }),
                            postalCode: e.target.value,
                          },
                        })
                      )
                    }
                    className="rounded-xl border-gray-200 focus:border-[#4C9A2A] focus:ring-[#4C9A2A]"
                    placeholder="Postal code"
                  />
                </div>
              </div>
            )} */}

            {showPickDrop && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">
                    Pickup details
                  </h3>
                  <input
                    type="text"
                    value={booking.pickupInfo?.address?.address || ''}
                    onChange={(e) =>
                      dispatch(
                        setPickupInfo({
                          ...booking.pickupInfo,
                          address: {
                            ...(booking.pickupInfo?.address || {
                              address: '',
                              city: '',
                              postalCode: '',
                            }),
                            address: e.target.value,
                          },
                        })
                      )
                    }
                    className="w-full rounded-xl border-gray-200 focus:border-[#4C9A2A] focus:ring-[#4C9A2A]"
                    placeholder="Pickup street address"
                  />
                  <div className="grid md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={booking.pickupInfo?.address?.city || ''}
                      onChange={(e) =>
                        dispatch(
                          setPickupInfo({
                            ...booking.pickupInfo,
                            address: {
                              ...(booking.pickupInfo?.address || {
                                address: '',
                                city: '',
                                postalCode: '',
                              }),
                              city: e.target.value,
                            },
                          })
                        )
                      }
                      className="rounded-xl border-gray-200 focus:border-[#4C9A2A] focus:ring-[#4C9A2A]"
                      placeholder="City"
                    />
                    <input
                      type="text"
                      value={booking.pickupInfo?.address?.postalCode || ''}
                      onChange={(e) =>
                        dispatch(
                          setPickupInfo({
                            ...booking.pickupInfo,
                            address: {
                              ...(booking.pickupInfo?.address || {
                                address: '',
                                city: '',
                                postalCode: '',
                              }),
                              postalCode: e.target.value,
                            },
                          })
                        )
                      }
                      className="rounded-xl border-gray-200 focus:border-[#4C9A2A] focus:ring-[#4C9A2A]"
                      placeholder="Postal code"
                    />
                  </div>
                  <input
                    type="date"
                    value={booking.pickupInfo?.date || ''}
                    onChange={(e) =>
                      dispatch(
                        setPickupInfo({
                          ...booking.pickupInfo,
                          date: e.target.value,
                        })
                      )
                    }
                    className="rounded-xl border-gray-200 focus:border-[#4C9A2A] focus:ring-[#4C9A2A]"
                  />
                  <textarea
                    value={booking.pickupInfo?.notes || ''}
                    onChange={(e) =>
                      dispatch(
                        setPickupInfo({
                          ...booking.pickupInfo,
                          notes: e.target.value,
                        })
                      )
                    }
                    rows={3}
                    className="w-full rounded-xl border-gray-200 focus:border-[#4C9A2A] focus:ring-[#4C9A2A]"
                    placeholder="Pickup notes (optional)"
                  />
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">
                    Drop-off details
                  </h3>
                  <input
                    type="text"
                    value={booking.dropoffInfo?.address?.address || ''}
                    onChange={(e) =>
                      dispatch(
                        setDropoffInfo({
                          ...booking.dropoffInfo,
                          address: {
                            ...(booking.dropoffInfo?.address || {
                              address: '',
                              city: '',
                              postalCode: '',
                            }),
                            address: e.target.value,
                          },
                        })
                      )
                    }
                    className="w-full rounded-xl border-gray-200 focus:border-[#4C9A2A] focus:ring-[#4C9A2A]"
                    placeholder="Drop-off street address"
                  />
                  <div className="grid md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={booking.dropoffInfo?.address?.city || ''}
                      onChange={(e) =>
                        dispatch(
                          setDropoffInfo({
                            ...booking.dropoffInfo,
                            address: {
                              ...(booking.dropoffInfo?.address || {
                                address: '',
                                city: '',
                                postalCode: '',
                              }),
                              city: e.target.value,
                            },
                          })
                        )
                      }
                      className="rounded-xl border-gray-200 focus:border-[#4C9A2A] focus:ring-[#4C9A2A]"
                      placeholder="City"
                    />
                    <input
                      type="text"
                      value={booking.dropoffInfo?.address?.postalCode || ''}
                      onChange={(e) =>
                        dispatch(
                          setDropoffInfo({
                            ...booking.dropoffInfo,
                            address: {
                              ...(booking.dropoffInfo?.address || {
                                address: '',
                                city: '',
                                postalCode: '',
                              }),
                              postalCode: e.target.value,
                            },
                          })
                        )
                      }
                      className="rounded-xl border-gray-200 focus:border-[#4C9A2A] focus:ring-[#4C9A2A]"
                      placeholder="Postal code"
                    />
                  </div>
                  <input
                    type="date"
                    value={booking.dropoffInfo?.date || ''}
                    onChange={(e) =>
                      dispatch(
                        setDropoffInfo({
                          ...booking.dropoffInfo,
                          date: e.target.value,
                        })
                      )
                    }
                    className="rounded-xl border-gray-200 focus:border-[#4C9A2A] focus:ring-[#4C9A2A]"
                  />
                  <textarea
                    value={booking.dropoffInfo?.notes || ''}
                    onChange={(e) =>
                      dispatch(
                        setDropoffInfo({
                          ...booking.dropoffInfo,
                          notes: e.target.value,
                        })
                      )
                    }
                    rows={3}
                    className="w-full rounded-xl border-gray-200 focus:border-[#4C9A2A] focus:ring-[#4C9A2A]"
                    placeholder="Drop-off notes (optional)"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm text-gray-600 font-medium">
                Additional note (optional)
              </label>
              <textarea
                value={booking.notes || ''}
                onChange={(e) => dispatch(setNotes(e.target.value))}
                rows={4}
                className="mt-1 w-full rounded-xl border-gray-200 focus:border-[#4C9A2A] focus:ring-[#4C9A2A] outline-none bg-[#FAFAFA] p-2"
                placeholder="I prefer shorter layers..."
              />
            </div>
          </div>
        </div>
      );
    }

    // checkout
    const depositPercentage =
      booking.storePaymentPolicy?.depositType === 'percentage'
        ? booking.storePaymentPolicy.amount
        : null;

    // Check if vendor has deposit option enabled
    const hasDepositOption =
      booking.storePaymentPolicy &&
      (booking.storePaymentPolicy.depositType === 'fixed'
        ? booking.storePaymentPolicy.amount < totals.total
        : (totals.total * booking.storePaymentPolicy.amount) / 100 <
          totals.total);

    // Payment terms to show - only show deposit if vendor allows it
    const paymentTerms: ('deposit' | 'full')[] = hasDepositOption
      ? ['deposit', 'full']
      : ['full'];

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Review & checkout
          </h2>
          <p className="text-gray-600">
            Review order details and complete payment to finish your purchase.
          </p>
        </div>

        {/* Payment Terms */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Payment terms</h3>
          {paymentTerms.map((term) => {
            const termAmount =
              term === 'deposit' ? depositAmount : totals.total;
            const isSelected =
              booking.paymentTerm === term ||
              (!hasDepositOption && term === 'full');
            return (
              <label
                key={term}
                className={`flex items-center justify-between rounded-xl p-4 cursor-pointer transition-colors ${
                  isSelected
                    ? 'border border-[#F175B4] bg-[#F175B4]/5'
                    : 'bg-[#FAFAFA] hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    className="mt-1 w-5 h-5 accent-[#F175B4]"
                    checked={isSelected}
                    onChange={() => dispatch(setPaymentTerm(term))}
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {term === 'deposit' ? 'Pay deposit' : 'Pay in full'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {term === 'deposit'
                        ? `${
                            depositPercentage ? `${depositPercentage}%` : ''
                          } deposit before appointment`
                        : "Pay 100% upfront and you're all set"}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-gray-900">
                  {currencySymbol}
                  {termAmount.toLocaleString()}
                </span>
              </label>
            );
          })}
        </div>

        {/* Payment Method */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Payment method</h3>
          {!paymentCards && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#4C9A2A]"></div>
              <span className="ml-2 text-sm text-gray-500">
                Loading payment methods...
              </span>
            </div>
          )}
          {savedCards.length > 0 && (
            <div className="space-y-2">
              {savedCards.map((card: any) => {
                const cardId = card.id || card.cardId;
                const isSelected =
                  booking.paymentMethodId === cardId && !booking.useNewCard;
                const brandRaw = (
                  card.brand ||
                  card.cardBrand ||
                  'Card'
                ).trim();
                const brandName =
                  brandRaw.charAt(0).toUpperCase() + brandRaw.slice(1);
                return (
                  <label
                    key={cardId}
                    className={`flex items-center justify-between rounded-xl p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? 'border border-[#F175B4] bg-[#F175B4]/5'
                        : 'bg-[#FAFAFA] hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        className="w-5 h-5 accent-[#F175B4]"
                        checked={isSelected}
                        onChange={() => dispatch(setPaymentMethod(cardId))}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{brandName}</p>
                        <p className="text-sm text-gray-500">
                          **** {card.last4Digits || card.last4}
                        </p>
                      </div>
                    </div>
                    {getCardBrandIcon(card.brand || card.cardBrand)}
                  </label>
                );
              })}
            </div>
          )}
          {savedCards.length === 0 && paymentCards && (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">No saved payment methods</p>
              <p className="text-gray-400 text-xs">
                You'll add a card at checkout
              </p>
            </div>
          )}
          {/* Add new card option */}
          <label
            className={`flex items-center gap-3 font-medium w-full p-4 rounded-xl transition-colors ${
              booking.useNewCard
                ? 'border border-[#4C9A2A] bg-[#4C9A2A]/5 text-[#4C9A2A]'
                : 'text-[#4C9A2A] hover:bg-gray-50'
            }`}
          >
            <input
              type="checkbox"
              className="w-5 h-5 accent-[#4C9A2A]"
              checked={booking.useNewCard}
              onChange={(e) => {
                const checked = e.target.checked;
                dispatch(setUseNewCard(checked));
                if (checked) {
                  dispatch(setPaymentMethod(undefined));
                } else if (savedCards.length > 0) {
                  const defaultCard =
                    savedCards.find((card: any) => card.isDefault) ||
                    savedCards[0];
                  if (defaultCard) {
                    dispatch(
                      setPaymentMethod(defaultCard.id || defaultCard.cardId)
                    );
                  }
                }
              }}
            />
            <span>Use a new card</span>
            {booking.useNewCard && (
              <span className="ml-auto text-xs bg-[#4C9A2A] text-white px-2 py-1 rounded-full">
                Selected
              </span>
            )}
          </label>
          {booking.useNewCard && (
            <p className="text-sm text-gray-500 mt-2">
              You'll enter your card details after clicking "Confirm booking"
            </p>
          )}
        </div>

        {/* Booking Policy */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">
            Booking & cancellation policy
          </h3>
          <p className="text-sm text-gray-600">
            By confirming, you agree to the provider's and Glitbase's terms —
            lateness policies are set by providers.
          </p>
          <p className="text-sm text-gray-600">
            {booking.storeBookingPolicy?.cancellation ||
              "Cancellations made within 24 hours of the appointment will incur a fee based on the provider's set deposit amount."}
          </p>
        </div>
      </div>
    );
  };

  return (
    <HomeLayout isLoading={false} showNavBar>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-6">
          <button
            onClick={() => setStepIndex((prev) => Math.max(prev - 1, 0))}
            className="text-gray-600 hover:text-gray-800 flex items-center space-x-2"
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 30 30"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 14.9998L25 14.9998"
                stroke="#3B3B3B"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M11.25 21.25C11.25 21.25 5.00001 16.6469 5 15C4.99999 13.353 11.25 8.75 11.25 8.75"
                stroke="#3B3B3B"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
          <div className="space-y-8">
            {/* <div className="flex items-center space-x-3 text-sm text-gray-500">
              <span
                className={`font-semibold ${
                  step >= 1 ? 'text-[#4C9A2A]' : 'text-gray-500'
                }`}
              >
                Service type
              </span>
              <span>›</span>
              <span
                className={`font-semibold ${
                  step >= 2 ? 'text-[#4C9A2A]' : 'text-gray-500'
                }`}
              >
                Date & time
              </span>
              <span>›</span>
              <span
                className={`font-semibold ${
                  step >= 3 ? 'text-[#4C9A2A]' : 'text-gray-500'
                }`}
              >
                Details
              </span>
              <span>›</span>
              <span
                className={`font-semibold ${
                  step >= 4 ? 'text-[#4C9A2A]' : 'text-gray-500'
                }`}
              >
                Checkout
              </span>
            </div> */}

            <div className="bg-white rounded-2xl  py-6 ">
              {renderStep()}

              <div className="mt-8 flex justify-between">
                <button
                  onClick={handleContinue}
                  disabled={isCreating || isCalculating || isProcessingPayment}
                  className="bg-[#4C9A2A] w-full text-white rounded-full px-6 py-3 font-semibold hover:bg-[#3d7a22] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {(isCreating || isProcessingPayment) && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  )}
                  {currentStep === 'checkout'
                    ? isProcessingPayment
                      ? 'Processing...'
                      : 'Confirm booking'
                    : 'Continue'}
                </button>
              </div>
            </div>
          </div>

          <div>
            <BookingSummaryCard
              store={{
                name: booking.storeName,
                location: { name: booking.storeLocation },
                bannerImageUrl: booking.storeBannerImageUrl,
                reviewCount: booking.storeReviewCount,
                rating: booking.storeRating
                  ? parseFloat(booking.storeRating)
                  : undefined,
              }}
              items={booking.items}
              totals={totals}
              currency={booking.items[0]?.currency || 'USD'}
              onBookNow={() => handleContinue()}
              showCTA={false}
              showBreakdown={currentStep === 'checkout'}
              showCheckoutDetails={currentStep === 'checkout'}
              serviceType={booking.serviceType}
              serviceDate={booking.serviceDate}
              serviceTime={booking.serviceTime}
              pickupTime={booking.pickupInfo?.date
                ?.split('T')[1]
                ?.substring(0, 5)}
              dropoffTime={booking.dropoffInfo?.date
                ?.split('T')[1]
                ?.substring(0, 5)}
              address={booking.pickupInfo?.address?.address}
              pickupAddress={booking.pickupInfo?.address?.address}
              dropoffAddress={booking.dropoffInfo?.address?.address}
              onEditDate={() => {
                const dateStepIdx = steps.findIndex((s) => s === 'datetime');
                if (dateStepIdx !== -1) setStepIndex(dateStepIdx);
              }}
              onEditTime={() => {
                const timeStepIdx = steps.findIndex((s) => s === 'datetime');
                if (timeStepIdx !== -1) setStepIndex(timeStepIdx);
              }}
              onEditAddress={() => {
                const addressStepIdx = steps.findIndex(
                  (s) => s === 'address' || s === 'pickDropAddress'
                );
                if (addressStepIdx !== -1) setStepIndex(addressStepIdx);
              }}
            />
          </div>
        </div>
      </div>

      {/* Remove Item Confirmation Modal */}
      {removeItemId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Remove service?
            </h3>
            <p className="text-gray-600">
              Are you sure you want to remove "
              {booking.items.find((i) => i.serviceId === removeItemId)?.name}"
              from your booking?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRemoveItemId(null)}
                className="flex-1 rounded-full border border-gray-300 py-3 font-semibold text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveItem(removeItemId)}
                className="flex-1 rounded-full bg-red-500 text-white py-3 font-semibold hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stripe Payment Modal */}
      {showStripeModal && stripeClientSecret && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                Complete Payment
              </h3>
              <button
                onClick={() => {
                  setShowStripeModal(false);
                  setStripeClientSecret(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="#6B7280"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <p className="text-gray-600 text-sm">
              Enter your card details to complete your booking of{' '}
              <span className="font-semibold">
                {currencySymbol}
                {amountToPay.toLocaleString()}
              </span>
            </p>
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: stripeClientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#4C9A2A',
                    borderRadius: '8px',
                  },
                },
              }}
            >
              <PaymentElement />
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => {
                    setShowStripeModal(false);
                    setStripeClientSecret(null);
                  }}
                  className="flex-1 rounded-full border border-gray-300 py-3 font-semibold text-gray-800"
                  disabled={isProcessingPayment}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStripePayment}
                  disabled={isProcessingPayment}
                  className="flex-1 rounded-full bg-[#4C9A2A] text-white py-3 font-semibold hover:bg-[#3d7a22] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessingPayment && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  )}
                  {isProcessingPayment ? 'Processing...' : 'Pay Now'}
                </button>
              </div>
            </Elements>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full relative">
            <button
              onClick={() => {
                setShowSuccess(false);
                setSuccessDetails(null);
                dispatch(resetBooking());
                navigate('/');
              }}
              className="absolute right-4 top-4 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="#111827"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto flex items-center justify-center">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <path
                    d="M32 4C47.464 4 60 16.536 60 32C60 47.464 47.464 60 32 60C16.536 60 4 47.464 4 32C4 16.536 16.536 4 32 4Z"
                    fill="#4C9A2A"
                    fillOpacity="0.12"
                  />
                  <path
                    d="M32 10C44.15 10 54 19.85 54 32C54 44.15 44.15 54 32 54C19.85 54 10 44.15 10 32C10 19.85 19.85 10 32 10Z"
                    fill="#4C9A2A"
                  />
                  <path
                    d="M26.2 32.4L30.3 36.5L38.7 28.1"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <h3 className="text-3xl font-semibold text-gray-900">
                Booking confirmed!
              </h3>
              <p className="text-gray-600">
                Your booking{' '}
                <span className="font-semibold text-gray-900">
                  {successDetails?.bookingReference
                    ? `#${successDetails.bookingReference}`
                    : bookingReference
                    ? `#${bookingReference}`
                    : ''}
                </span>{' '}
                has been successfully confirmed and complete details have been
                sent to{' '}
                <span className="font-semibold text-gray-900">
                  {successDetails?.email || booking.contact?.email || ''}
                </span>
              </p>
            </div>

            <div className="mt-6 max-w-md mx-auto space-y-4">
              {/* Date */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M6 1.5V3.75M12 1.5V3.75M2.25 7.5H15.75M3.75 3H14.25C15.0784 3 15.75 3.67157 15.75 4.5V15C15.75 15.8284 15.0784 16.5 14.25 16.5H3.75C2.92157 16.5 2.25 15.8284 2.25 15V4.5C2.25 3.67157 2.92157 3 3.75 3Z"
                      stroke="#111827"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="text-base font-semibold text-gray-900">
                    {successDetails?.dateLabel || ''}
                  </p>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M9 4.5V9L12 10.5M16.5 9C16.5 13.1421 13.1421 16.5 9 16.5C4.85786 16.5 1.5 13.1421 1.5 9C1.5 4.85786 4.85786 1.5 9 1.5C13.1421 1.5 16.5 4.85786 16.5 9Z"
                      stroke="#111827"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="text-base font-semibold text-gray-900">
                    {successDetails?.timeLabel || ''}
                  </p>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M10.2133 16.0252C9.88804 16.3298 9.45329 16.5 9.00084 16.5C8.54839 16.5 8.11364 16.3298 7.78837 16.0252C4.80977 13.2195 0.818072 10.0852 2.7647 5.53475C3.81723 3.07437 6.34376 1.5 9.00084 1.5C11.6579 1.5 14.1845 3.07437 15.237 5.53475C17.1811 10.0795 13.1993 13.2292 10.2133 16.0252Z"
                      stroke="#111827"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M11.625 8.25C11.625 9.69975 10.4497 10.875 9 10.875C7.55025 10.875 6.375 9.69975 6.375 8.25C6.375 6.80025 7.55025 5.625 9 5.625C10.4497 5.625 11.625 6.80025 11.625 8.25Z"
                      stroke="#111827"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {successDetails?.addressTitle || 'Address'}
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {successDetails?.addressLabel || ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 max-w-md mx-auto space-y-3">
              <button
                onClick={() => {
                  dispatch(resetBooking());
                  navigate('/home/profile');
                }}
                className="w-full rounded-full bg-[#4C9A2A] text-white py-3 font-semibold hover:bg-[#3d7a22] transition-colors"
              >
                View booking details
              </button>
              <button
                onClick={() => {
                  // placeholder: calendar integration can be added later
                  toast.info('Calendar integration coming soon');
                }}
                className="w-full rounded-full bg-gray-100 text-gray-900 py-3 font-semibold hover:bg-gray-200 transition-colors"
              >
                Add to calendar
              </button>
            </div>
          </div>
        </div>
      )}
    </HomeLayout>
  );
};

// Main component wrapped with Stripe Elements provider
const CreateBooking = () => {
  return (
    <Elements stripe={stripePromise}>
      <CreateBookingInner />
    </Elements>
  );
};

export default CreateBooking;

const TimeSlots = ({
  booking,
  totals,
  onSelect,
}: {
  booking: any;
  totals: any;
  onSelect: (value: string) => void;
}) => {
  const selectedDate = useMemo(
    () => (booking.serviceDate ? new Date(booking.serviceDate) : null),
    [booking.serviceDate]
  );
  const weekday = selectedDate
    ? selectedDate.toLocaleDateString('en-US', { weekday: 'long' })
    : null;

  const schedule = useMemo(() => {
    if (!weekday) return null;
    return booking.storeOpeningHours?.find(
      (d: any) => d.day?.toLowerCase() === weekday.toLowerCase()
    );
  }, [booking.storeOpeningHours, weekday]);

  const durationMinutes =
    totals.totalDuration ||
    booking.items?.reduce(
      (acc: number, item: any) =>
        acc +
        (item.durationInMinutes || 0) * (item.quantity || 1) +
        (item.addOns || []).reduce(
          (s: number, a: any) => s + (a.durationInMinutes || 0),
          0
        ),
      0
    ) ||
    60;

  const slots = useMemo(() => {
    if (!selectedDate || !schedule?.isOpen) return [];
    return generateSlots(
      schedule.openingTime,
      schedule.closingTime,
      durationMinutes
    );
  }, [selectedDate, schedule, durationMinutes]);

  const dateLabel = selectedDate
    ? selectedDate.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <div>
      <p className="font-semibold text-gray-900 mb-2">
        {dateLabel ? `Open Slots - ${dateLabel}` : 'Open Slots'}
      </p>
      {slots.length === 0 ? (
        <p className="text-sm text-gray-600">
          {schedule?.isOpen === false
            ? 'Store closed for the selected day.'
            : 'No available slots for the selected day.'}
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {slots.map((slot) => {
            const isSelected = booking.serviceTime === slot.value;
            return (
              <button
                key={slot.value}
                onClick={() => onSelect(slot.value)}
                className={`rounded-xl bg-[#FAFAFA] py-2 px-3 text-sm transition-colors ${
                  isSelected
                    ? 'bg-[#FFF4FD] text-[#AE3670] font-[500]'
                    : 'bg-[#FAFAFA] hover:bg-[#F175B4]/10 text-[#3B3B3B] font-[500]'
                }`}
              >
                {slot.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
