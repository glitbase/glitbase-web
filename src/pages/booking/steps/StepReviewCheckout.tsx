/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Pencil, Trash2, Star, MapPin, ArrowLeft, Calendar, Clock, Settings } from "lucide-react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "react-toastify";
import { removeFromCart } from "@/redux/cart/cartSlice";
import {
  useCalculatePricingMutation,
  useGetPaymentCardsQuery,
  useInitiatePaymentMutation,
  useCompletePaymentMutation,
} from "@/redux/booking";
import {
  BookingFormData,
  BookingSuccessData,
  BookingStep,
} from "../CreateBooking";
import { cartHasDeliveryServiceForBooking } from "../bookingUtils";
import { Button } from "@/components/Buttons";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const BOOKING_TYPES: Record<string, string> = {
  normal: "Normal service",
  walkIn: "Walk-in service",
  home: "Home service",
  virtual: "Virtual service",
  pickDrop: "Drop-off & pick-up",
};

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function addMinutes(timeStr: string, minutesToAdd: number): string {
  const [time, period] = timeStr.split(" ");
  const [h, m] = time.split(":").map(Number);
  let h24 = h;
  if (period === "PM" && h !== 12) h24 += 12;
  if (period === "AM" && h === 12) h24 = 0;
  const total = h24 * 60 + m + minutesToAdd;
  const nh = Math.floor((total % (24 * 60)) / 60);
  const nm = total % 60;
  const np = nh >= 12 ? "PM" : "AM";
  const nh12 = nh === 0 ? 12 : nh > 12 ? nh - 12 : nh;
  return `${String(nh12).padStart(2, "0")}:${String(nm).padStart(2, "0")} ${np}`;
}

function getCardBrandIcon(brand: string) {
  switch (brand?.toLowerCase()) {
    case "visa":
      return "💳 Visa";
    case "mastercard":
      return "💳 Mastercard";
    case "amex":
      return "💳 Amex";
    default:
      return "💳 Card";
  }
}

// ────────────────────────────────────────────────────────────
// Stripe inner payment form (must be rendered inside <Elements>)
// ────────────────────────────────────────────────────────────
interface StripeFormProps {
  amount: number;
  currencySymbol: string;
  paymentReference: string;
  onSuccess: (booking: any) => void;
  onClose: () => void;
  completePayment: (payload: any) => any;
}

const StripePaymentForm: React.FC<StripeFormProps> = ({
  amount,
  currencySymbol,
  paymentReference,
  onSuccess,
  onClose,
  completePayment,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setProcessing(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: "if_required",
      });

      if (error) {
        toast.error(error.message || "Payment failed");
        return;
      }
      if (paymentIntent?.status === "succeeded") {
        const res = await completePayment({ paymentReference }).unwrap();
        if (res?.payment?.status === "completed") {
          onSuccess(res?.booking);
        }
      }
    } catch (e: any) {
      toast.error(e?.data?.message || "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full max-w-md space-y-4 max-h-[min(92dvh,640px)] overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] sm:pb-6 my-auto sm:my-0">
        <div className="flex items-center justify-between gap-3 min-w-0">
          <h3 className="text-base md:text-[20px] font-bold text-[#0A0A0A] truncate pr-2 font-[lora] tracking-tight">
            Complete Payment
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 shrink-0 rounded-full bg-gray-100 flex items-center justify-center touch-manipulation hover:bg-gray-200"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <p className="text-xs md:text-[15px] text-[#6C6C6C] font-medium break-words">
          Pay {currencySymbol}
          {amount.toLocaleString()} to confirm your booking
        </p>
        <PaymentElement />
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <Button variant='cancel' onClick={onClose} disabled={processing} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handlePay} disabled={processing} loading={processing} className="flex-1">
            Pay now
          </Button>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Main step component
// ────────────────────────────────────────────────────────────
interface Props {
  formData: BookingFormData;
  onBack: () => void;
  onGoToStep: (step: BookingStep) => void;
  onSuccess: (data: BookingSuccessData) => void;
}

const StepReviewCheckout: React.FC<Props> = ({
  formData,
  onBack,
  onGoToStep,
  onSuccess,
}) => {
  const dispatch = useDispatch();
  const store = useSelector((state: any) => state.vendorStore?.store);
  const cartItems = useSelector((state: any) => {
    if (!formData.storeId || !state.cart?.carts) return [];
    return state.cart.carts[formData.storeId] || [];
  });

  const showHomeAddressOnReview =
    cartHasDeliveryServiceForBooking(cartItems) &&
    formData.serviceType === 'home';

  const [selectedPaymentTerm, setSelectedPaymentTerm] = useState<
    "deposit" | "full"
  >("full");
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [useNewCard, setUseNewCard] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(
    null,
  );
  const [stripePaymentRef, setStripePaymentRef] = useState<string>("");
  const [pricing, setPricing] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);

  const { data: paymentCardsData } = useGetPaymentCardsQuery(undefined, {
    skip: false,
  });
  const [calculatePricing] = useCalculatePricingMutation();
  const [initiatePayment] = useInitiatePaymentMutation();
  const [completePayment] = useCompletePaymentMutation();

  const savedCards = useMemo(
    () => paymentCardsData?.paymentCards || [],
    [paymentCardsData],
  );

  // Auto-select default card
  useEffect(() => {
    if (savedCards.length > 0 && !selectedCardId && !useNewCard) {
      const def = savedCards.find((c: any) => c.isDefault) || savedCards[0];
      if (def) setSelectedCardId(def.id);
    }
  }, [savedCards, selectedCardId, useNewCard]);

  // Currency & symbol
  const currency = useMemo(
    () => cartItems[0]?.service.currency || "NGN",
    [cartItems],
  );
  const currencySymbol = useMemo(
    () => ({ NGN: "₦", USD: "$", GBP: "£" })[currency] || currency,
    [currency],
  );
  const paymentGateway = currency === "NGN" ? "paystack" : "stripe";

  // Cart totals (fallback before pricing API)
  const cartSubtotal = useMemo(
    () =>
      cartItems.reduce((sum: number, item: any) => {
        const base =
          item.service.pricingType === "free" ? 0 : item.service.price;
        const addOns = (item.selectedAddOns || []).reduce(
          (s: number, a: any) => s + a.price,
          0,
        );
        return sum + (base + addOns) * item.quantity;
      }, 0),
    [cartItems],
  );

  const cartTotalDuration = useMemo(
    () =>
      cartItems.reduce((sum: number, item: any) => {
        const addOnsDur = (item.selectedAddOns || []).reduce(
          (s: number, a: any) => {
            const d = a.duration
              ? a.duration.hours * 60 + (a.duration.minutes || 0)
              : a.durationInMinutes || 0;
            return s + d;
          },
          0,
        );
        return (
          sum + (item.service.durationInMinutes + addOnsDur) * item.quantity
        );
      }, 0),
    [cartItems],
  );

  const subtotal = pricing?.subtotal ?? cartSubtotal;
  const totalDuration = pricing?.totalDuration ?? cartTotalDuration;
  const serviceChargeAmount = pricing?.serviceChargeAmount ?? 0;
  const amountToPay = pricing?.amountToPay ?? subtotal;
  const totalWithCharge = pricing?.totalWithServiceCharge ?? subtotal;
  const remainingBalance = pricing?.remainingBalance ?? 0;

  // Deposit calculation
  const depositAmount = useMemo(() => {
    if (!store?.policies?.payment) return subtotal;
    const { depositType, amount } = store.policies.payment;
    return depositType === "fixed"
      ? Math.min(amount, subtotal)
      : (subtotal * amount) / 100;
  }, [store?.policies?.payment, subtotal]);

  const hasDepositOption = store?.policies?.payment?.depositType;
  // pricing
  //   ? pricing.paymentTerm === 'deposit'
  //   : !!(store?.policies?.payment?.depositType && depositAmount < subtotal);

  // Recalculate pricing when relevant data changes
  useEffect(() => {
    if (!formData.storeId || !cartItems.length || !store) return;
    setIsCalculating(true);
    calculatePricing({
      storeId: formData.storeId,
      cartItems: cartItems.map((item: any) => ({
        serviceId: item.service.id,
        quantity: item.quantity,
        addOnIds: (item.selectedAddOns || [])
          .map((a: any) => a._id || a.id)
          .filter(Boolean),
      })),
      paymentTerm: selectedPaymentTerm,
    })
      .unwrap()
      .then((data: any) => setPricing(data))
      .catch(() => {
        /* silently use fallback */
      })
      .finally(() => setIsCalculating(false));
  }, [cartItems, selectedPaymentTerm, formData.storeId, store]);

  const handleRemoveItem = (serviceId: string) => {
    dispatch(removeFromCart({ storeId: formData.storeId, serviceId }));
    setRemoveConfirmId(null);
    if (cartItems.length === 1) onBack();
  };

  const handlePaymentSuccess = (bookingData: any) => {
    // Do not clearCart here — CreateBooking clears the cart after switching to the
    // success step. Clearing first empties the cart while still on "review", which
    // triggers navigate(-1) and skips the success screen (saved card / instant capture).
    const contactNotes = formData.contactNotes
      ? (() => {
          try {
            return JSON.parse(formData.contactNotes!);
          } catch {
            return null;
          }
        })()
      : null;
    onSuccess({
      bookingReference: bookingData?.bookingReference || "N/A",
      bookingId: bookingData?.id || bookingData?._id || "",
      userEmail: contactNotes?.email || "",
      totalDuration,
    });
  };

  const handleConfirmBooking = async () => {
    if (savedCards.length > 0 && !selectedCardId && !useNewCard) {
      toast.error("Please select a payment method");
      return;
    }

    setIsProcessing(true);
    try {
      const contactNotes = formData.contactNotes
        ? (() => {
            try {
              return JSON.parse(formData.contactNotes!);
            } catch {
              return null;
            }
          })()
        : null;

      const finalAmount =
        hasDepositOption && selectedPaymentTerm === "deposit"
          ? (pricing?.amountToPay ?? depositAmount)
          : totalWithCharge;

      const metadata: any = {
        storeId: formData.storeId,
        serviceType: formData.serviceType,
        serviceDate: formData.serviceDate,
        serviceTime: formData.serviceTime,
        cartItems: cartItems.map((item: any) => ({
          serviceId: item.service.id,
          quantity: item.quantity,
          addOnIds: (item.selectedAddOns || [])
            .map((a: any) => a._id || a.id)
            .filter(Boolean),
        })),
        pricing: {
          paymentTerm: selectedPaymentTerm,
          subtotal,
          totalDuration,
          amountToPay: finalAmount,
          remainingBalance,
        },
        contactInfo: contactNotes,
        additionalInfo: {
          notes: formData.additionalNotes || null,
          images: formData.additionalImages
            ? (() => {
                try {
                  return JSON.parse(formData.additionalImages!);
                } catch {
                  return [];
                }
              })()
            : [],
        },
      };

      if (formData.serviceType === "home" && formData.contactAddress) {
        try {
          metadata.homeServiceAddress = JSON.parse(formData.contactAddress);
        } catch {
          /* skip */
        }
      }
      if (formData.serviceType === "pickDrop") {
        if (formData.pickupAddress) {
          try {
            metadata.pickupInfo = {
              address: JSON.parse(formData.pickupAddress),
              date: formData.serviceDate,
            };
          } catch {
            /* skip */
          }
        }
        if (formData.dropoffAddress) {
          try {
            metadata.dropoffInfo = {
              address: JSON.parse(formData.dropoffAddress),
              date: formData.serviceDate,
            };
          } catch {
            /* skip */
          }
        }
      }

      const paymentRequest: any = {
        paymentType: "booking",
        paymentMethod: "card",
        paymentGateway,
        amount: finalAmount,
        currency,
        metadata,
      };

      if (selectedCardId && !useNewCard)
        paymentRequest.paymentCardId = selectedCardId;

      const res = await initiatePayment(paymentRequest).unwrap();

      if (res?.payment?.status === "completed") {
        handlePaymentSuccess(res?.booking);
      } else if (res?.payment?.status === "pending") {
        const payment = res.payment as any;
        if (paymentGateway === "paystack") {
          const { authorizationUrl, paymentReference } = payment;
          if (!authorizationUrl) {
            toast.error("Failed to initialize Paystack payment");
            return;
          }
          sessionStorage.setItem("pendingPaymentReference", paymentReference);
          if (formData.storeId) {
            sessionStorage.setItem("pendingPaystackStoreId", formData.storeId);
          }
          window.location.href = authorizationUrl;
        } else {
          const { clientSecret, paymentReference } = payment;
          if (!clientSecret) {
            toast.error("Failed to initialize Stripe payment");
            return;
          }
          setStripePaymentRef(paymentReference);
          setStripeClientSecret(clientSecret);
        }
      }
    } catch (e: any) {
      toast.error(e?.data?.message || "Booking failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Parse addresses for display
  const parseAddr = (json?: string) => {
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  };

  const homeAddr = parseAddr(formData.contactAddress);

  return (
    <div className="min-h-full w-full min-w-0 flex flex-col mt-4 sm:mt-6 lg:mt-8 pb-8">
      {/* Page header — full width, always above columns */}
      <div className="flex flex-col mb-5 sm:mb-6 lg:mb-8 gap-3 sm:gap-4 w-full min-w-0 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 self-start -ml-1 p-1 rounded-lg hover:bg-gray-50 touch-manipulation"
          aria-label="Go back"
        >
          <ArrowLeft size={20} strokeWidth={2} color="#3B3B3B" className="shrink-0" />
          <span className="text-sm font-medium text-[#3B3B3B] sm:hidden">Back</span>
        </button>
        <span className="font-bold text-xl sm:text-2xl lg:text-[24px] text-[#0A0A0A] font-[lora] tracking-tight break-words">
          Review & Checkout
        </span>
        <p className="text-sm sm:text-[16px] text-[#6C6C6C] font-medium leading-relaxed">
          Review order details and complete payment to finish your purchase
        </p>
      </div>

      {/* Mobile: summary card first; lg+: payment | summary. Header always above. */}
      <div className="flex flex-col-reverse lg:flex-row gap-6 lg:gap-10 xl:gap-16 min-w-0 flex-1">
        <div className="flex-1 min-w-0">
        {/* Payment terms */}
        {hasDepositOption && (
          <div className="min-w-0">
            <p className="font-semibold text-sm sm:text-[16px] text-[#0A0A0A] mb-3 sm:mb-4">
              Payment terms
            </p>
            <div className="space-y-3">
              {/* Deposit */}
              <button
                type="button"
                onClick={() => setSelectedPaymentTerm("deposit")}
                className={`relative w-full text-left rounded-2xl px-3 sm:px-4 py-3 sm:py-4 transition-colors flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3 touch-manipulation min-w-0 ${
                  selectedPaymentTerm === "deposit"
                    ? "bg-[#FFF0F7]"
                    : "bg-[#FAFAFA]"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="mt-0.5">
                    {selectedPaymentTerm === "deposit" ? (
                      <div className="w-5 h-5 rounded-full border-2 border-[#F175B4] flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#F175B4]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-[#D9D9D9]" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-[14px] text-[#0A0A0A]">
                      Pay deposit
                    </p>
                    <p className="text-[12px] text-[#6C6C6C] font-medium mt-0.5">
                      {store?.policies?.payment?.depositType === "percentage"
                        ? `${store.policies.payment.amount}%`
                        : `${currencySymbol}${store?.policies?.payment?.amount}`}{" "}
                      deposit before appointment
                    </p>
                  </div>
                </div>
                <span className="font-medium text-sm sm:text-[14px] text-[#0A0A0A] absolute top-4 right-3 shrink-0 tabular-nums">
                  {currencySymbol}
                  {depositAmount.toLocaleString()}
                </span>
              </button>

              {/* Full payment */}
              <button
                type="button"
                onClick={() => setSelectedPaymentTerm("full")}
                className={`relative w-full text-left rounded-2xl px-3 sm:px-4 py-3 sm:py-4 transition-colors flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3 touch-manipulation min-w-0 ${
                  selectedPaymentTerm === "full"
                    ? "bg-[#FFF0F7]"
                    : "bg-[#FAFAFA]"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="mt-0.5">
                    {selectedPaymentTerm === "full" ? (
                      <div className="w-5 h-5 rounded-full border-2 border-[#F175B4] flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#F175B4]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-[#D9D9D9]" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-[14px] text-[#0A0A0A]">
                      Pay in full
                    </p>
                    <p className="text-[12px] text-[#6C6C6C] font-medium mt-0.5">
                      Pay 100% upfront and you&apos;re all set
                    </p>
                  </div>
                </div>
                <span className="font-medium text-sm sm:text-[14px] text-[#0A0A0A] absolute top-4 right-3 shrink-0 tabular-nums">
                  {currencySymbol}
                  {totalWithCharge.toLocaleString()}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Payment methods */}
        {savedCards.length > 0 && (
          <div className="min-w-0">
            <p className="font-semibold text-sm sm:text-[16px] text-[#0A0A0A] mb-3 sm:mb-4 mt-8 sm:mt-10">
              Payment method
            </p>
            <div className="space-y-2">
              {savedCards.map((card: any) => (
                <button
                  type="button"
                  key={card.id}
                  onClick={() => {
                    setSelectedCardId(card.id);
                    setUseNewCard(false);
                  }}
                  className={`w-full text-left rounded-2xl px-3 sm:px-4 py-3 sm:py-4 transition-colors flex items-center justify-between gap-2 min-w-0 touch-manipulation ${
                    selectedCardId === card.id && !useNewCard
                      ? "bg-[#FFF0F7]"
                      : "bg-[#FAFAFA]"
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="shrink-0">
                      {selectedCardId === card.id && !useNewCard ? (
                        <div className="w-5 h-5 rounded-full border-2 border-[#F175B4] flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#F175B4]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-[#D9D9D9]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-[14px] text-[#0A0A0A] truncate">
                        {card.cardBrand.charAt(0).toUpperCase() +
                          card.cardBrand.slice(1)}
                      </p>
                      <p className="text-xs sm:text-[12px] text-[#6C6C6C] font-medium">
                        **** {card.last4Digits}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs sm:text-[13px] text-[#6C6C6C] font-medium shrink-0">
                    {getCardBrandIcon(card.cardBrand).split(" ")[1]}
                  </span>
                </button>
              ))}

              {/* Use new card */}
              <button
                type="button"
                onClick={() => {
                  if (useNewCard) {
                    setUseNewCard(false);
                    const def =
                      savedCards.find((c: any) => c.isDefault) || savedCards[0];
                    if (def) setSelectedCardId(def.id);
                  } else {
                    setUseNewCard(true);
                    setSelectedCardId("");
                  }
                }}
                className="flex items-center gap-3 py-2 touch-manipulation"
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${
                    useNewCard
                      ? "bg-[#CC5A88] border-[#CC5A88]"
                      : "border-[#D0D0D0]"
                  }`}
                >
                  {useNewCard && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4L3.5 6.5L9 1"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span className="font-medium text-[14px] text-[#0A0A0A]">
                  Use a new card
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Terms */}
        {(store?.policies?.booking?.cancellation ||
            store?.policies?.booking?.rescheduling) && (
            <div className="min-w-0">
              <p className="font-semibold text-sm sm:text-[16px] text-[#0A0A0A] mb-2 mt-6 sm:mt-8">
                Additional terms and conditions
              </p>
              {store.policies.booking.cancellation && (
                <p className="text-sm sm:text-[14px] text-[#3B3B3B] font-medium mb-2 break-words">
                  By booking, you agree to our{" "}
                  {store.policies.booking.cancellation}
                </p>
              )}
              {store.policies.booking.rescheduling && (
                <p className="text-sm sm:text-[14px] text-[#3B3B3B] font-medium break-words">
                  {store.policies.booking.rescheduling}
                </p>
              )}
            </div>
          )}

          <div className="min-w-0">
            <p className="font-semibold text-sm sm:text-[16px] text-[#0A0A0A] mb-2 mt-6">
              Booking & Cancellation Policy
            </p>
            <p className="text-sm sm:text-[14px] text-[#3B3B3B] font-medium mb-2 break-words">
              By confirming, you agree to the provider&apos;s and
              Glitbase&apos;s terms - lateness policies are set by providers.
            </p>
            <p className="text-sm sm:text-[14px] text-[#3B3B3B] font-medium break-words">
              Cancellations made within 24 hours of the appointment will incur a
              fee based on the provider&apos;s set deposit amount.
            </p>
          </div>
        
        <Button disabled={isProcessing || isCalculating} onClick={handleConfirmBooking} loading={isProcessing} className="w-full mt-6 sm:mt-8 min-h-[48px] touch-manipulation">Confirm booking</Button>
        </div>

        <div className="flex-1 min-w-0 border border-[#F0F0F0] rounded-xl p-3 sm:p-4 h-fit lg:sticky lg:top-4 lg:self-start">
        {/* Store details */}
        {store && (
            <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6 min-w-0">
              {store.bannerImageUrl && (
                <img
                  src={store.bannerImageUrl}
                  alt={store.name}
                  className="w-14 h-14 sm:w-[70px] sm:h-[70px] rounded-xl object-cover bg-gray-100 flex-shrink-0"
                />
              )}
              <div className="flex flex-col justify-center min-w-0 flex-1">
                <p className="font-medium text-sm sm:text-[15px] text-[#0A0A0A] mb-1 break-words">
                  {store.name}
                </p>
                {store.rating !== undefined && (
                  <div className="flex items-center gap-1 mb-1">
                    <Star size={11} className="text-[#F5A623] fill-[#F5A623]" />
                    <span className="text-[13px] font-semibold text-[#0A0A0A]">
                      {store.rating}
                    </span>
                    <span className="text-[13px] text-[#4C9A2A] font-semibold">
                      ({store.reviewCount || 0})
                    </span>
                  </div>
                )}
                {store.location?.address && (
                  <div className="flex items-start gap-1 min-w-0">
                    <MapPin size={13} className="text-[#9D9D9D] shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-[14px] text-[#9D9D9D] font-medium min-w-0 truncate">
                      {store.location.address}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Appointment details */}
        <div className="space-y-3 sm:space-y-4 min-w-0">
          {/* Date */}
          <div className="flex items-start gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#F5F5F5] flex items-center justify-center flex-shrink-0">
              <Calendar size={16} className="text-[#3B3B3B]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] sm:text-[12px] font-medium text-[#6C6C6C]">Date</p>
              <p className="text-sm sm:text-[15px] font-medium text-[#0A0A0A] break-words">
                {formData.serviceDate ? formatDate(formData.serviceDate) : "—"}
              </p>
            </div>
            <button type="button" onClick={() => onGoToStep("dateTime")} className="p-2 shrink-0 touch-manipulation rounded-lg hover:bg-gray-50" aria-label="Edit date">
              <Pencil size={14} className="text-[#6C6C6C]" />
            </button>
          </div>

          {/* Time */}
          <div className="flex items-start gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#F5F5F5] flex items-center justify-center flex-shrink-0">
              <Clock size={16} className="text-[#3B3B3B]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] sm:text-[12px] font-medium text-[#6C6C6C]">Time</p>
              <p className="text-sm sm:text-[15px] font-medium text-[#0A0A0A] break-words">
                {formData.serviceTime
                  ? `${formData.serviceTime} – ${addMinutes(formData.serviceTime, totalDuration)}`
                  : "—"}
              </p>
            </div>
            <button type="button" onClick={() => onGoToStep("dateTime")} className="p-2 shrink-0 touch-manipulation rounded-lg hover:bg-gray-50" aria-label="Edit time">
              <Pencil size={14} className="text-[#6C6C6C]" />
            </button>
          </div>

          {/* Service type */}
          <div className="flex items-start gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#F5F5F5] flex items-center justify-center flex-shrink-0">
              <Settings size={16} className="text-[#3B3B3B]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] sm:text-[12px] font-medium text-[#6C6C6C]">Service Type</p>
              <p className="text-sm sm:text-[15px] font-medium text-[#0A0A0A] break-words">
                {BOOKING_TYPES[formData.serviceType] || formData.serviceType}
              </p>
            </div>
            <button type="button" onClick={() => onGoToStep("serviceType")} className="p-2 shrink-0 touch-manipulation rounded-lg hover:bg-gray-50" aria-label="Edit service type">
              <Pencil size={14} className="text-[#6C6C6C]" />
            </button>
          </div>

          {/* Address — home service only (pickup/drop-off step removed from flow) */}
          {showHomeAddressOnReview && (
            <div className="flex items-start gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#F5F5F5] flex items-center justify-center flex-shrink-0">
                <MapPin size={16} className="text-[#3B3B3B]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] sm:text-[12px] font-medium text-[#6C6C6C]">Address</p>
                <p className="text-sm sm:text-[15px] font-medium text-[#0A0A0A] break-words">
                  {homeAddr?.address || "Not set"}
                </p>
              </div>
              <button type="button" onClick={() => onGoToStep("address")} className="p-2 shrink-0 touch-manipulation rounded-lg hover:bg-gray-50" aria-label="Edit address">
                <Pencil size={14} className="text-[#6C6C6C]" />
              </button>
            </div>
          )}
        </div>

        {/* Services */}
        <div className="min-w-0">
          <p className="font-medium text-sm sm:text-[15px] text-[#0A0A0A] mb-3 sm:mb-4 mt-6 sm:mt-8">
            Service details
          </p>
          <div className="space-y-3 sm:space-y-4">
            {cartItems.map((item: any, idx: number) => {
              const base =
                item.service.pricingType === "free" ? 0 : item.service.price;
              const addOnsTotal = (item.selectedAddOns || []).reduce(
                (s: number, a: any) => s + a.price,
                0,
              );
              const itemPrice = base + addOnsTotal;
              const addOnsDur = (item.selectedAddOns || []).reduce(
                (s: number, a: any) => {
                  const d = a.duration
                    ? a.duration.hours * 60 + (a.duration.minutes || 0)
                    : a.durationInMinutes || 0;
                  return s + d;
                },
                0,
              );
              const itemDur = item.service.durationInMinutes + addOnsDur;

              return (
                <div key={idx} className="flex items-start gap-2 sm:gap-3 min-w-0">
                  {item.service.imageUrl && (
                    <img
                      src={item.service.imageUrl}
                      alt={item.service.name}
                      className="w-12 h-12 sm:w-[60px] sm:h-[60px] rounded-xl object-cover bg-gray-100 flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-[13px] text-[#0A0A0A] font-medium mb-0.5 break-words">
                      {item.service.name}
                    </p>
                    <p className="font-semibold text-sm sm:text-[14px] text-[#0A0A0A] mb-1 tabular-nums">
                      {currencySymbol}
                      {itemPrice.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[12px] text-[#9D9D9D] font-medium">
                        {formatDuration(itemDur)}
                      </span>
                      {item.selectedAddOns?.length > 0 && (
                        <span className="text-[11px] text-[#4C9A2A]">
                          • {item.selectedAddOns.length} add-on
                          {item.selectedAddOns.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRemoveConfirmId(item.service.id)}
                    className="p-2 flex-shrink-0 touch-manipulation rounded-lg hover:bg-red-50"
                    aria-label={`Remove ${item.service.name}`}
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-w-0 overflow-y-auto space-y-6 pb-4">

          {/* Summary */}
          <div className="bg-[#F5F5F5] rounded-xl p-3 sm:p-4 space-y-2.5 sm:space-y-3 mt-6 sm:mt-8 min-w-0">
            {isCalculating ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#4C9A2A]" />
                <span className="ml-2 text-[13px] text-[#888]">
                  Calculating pricing...
                </span>
              </div>
            ) : (
              <>
                <div className="flex justify-between gap-3 min-w-0">
                  <span className="text-xs sm:text-[13px] text-[#3B3B3B] font-medium min-w-0 pr-2">
                    Subtotal ({cartItems.length}{" "}
                    {cartItems.length > 1 ? "Items" : "Item"})
                  </span>
                  <span className="text-xs sm:text-[13px] text-[#0A0A0A] font-medium shrink-0 tabular-nums">
                    {currencySymbol}
                    {subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between gap-3 min-w-0">
                  <span className="text-xs sm:text-[13px] text-[#3B3B3B] font-medium">
                    Total Duration
                  </span>
                  <span className="text-xs sm:text-[13px] text-[#0A0A0A] font-medium shrink-0">
                    {formatDuration(totalDuration)}
                  </span>
                </div>
                {serviceChargeAmount > 0 && (
                  <div className="flex justify-between gap-3 min-w-0">
                    <span className="text-xs sm:text-[13px] text-[#3B3B3B] font-medium">
                      Service Charge
                    </span>
                    <span className="text-xs sm:text-[13px] text-[#0A0A0A] font-medium shrink-0 tabular-nums">
                      {currencySymbol}
                      {serviceChargeAmount.toLocaleString()}
                    </span>
                  </div>
                )}
                {hasDepositOption &&
                  selectedPaymentTerm === "deposit" &&
                  remainingBalance > 0 && (
                    <div className="flex justify-between gap-3 min-w-0">
                      <span className="text-xs sm:text-[13px] text-[#3B3B3B] font-medium">
                        Remaining Balance
                      </span>
                      <span className="text-xs sm:text-[13px] text-[#0A0A0A] font-medium shrink-0 tabular-nums">
                        {currencySymbol}
                        {remainingBalance.toLocaleString()}
                      </span>
                    </div>
                  )}
                <div className="flex justify-between gap-3 min-w-0">
                  <span className="text-xs sm:text-[13px] text-[#3B3B3B] font-medium">Taxes</span>
                  <span className="text-xs sm:text-[13px] text-[#0A0A0A] font-medium shrink-0 tabular-nums">
                    {currencySymbol}0.00
                  </span>
                </div>
                <div className="border-t border-[#E0E0E0] pt-3 flex justify-between gap-3 min-w-0 items-baseline">
                  <span className="font-semibold text-sm sm:text-[14px] text-[#0A0A0A] min-w-0 pr-2">
                    {hasDepositOption && selectedPaymentTerm === "deposit"
                      ? "Total due now"
                      : "Total"}
                  </span>
                  <span className="font-semibold text-sm sm:text-[14px] text-[#0A0A0A] shrink-0 tabular-nums">
                    {currencySymbol}
                    {(hasDepositOption && selectedPaymentTerm === "deposit"
                      ? (pricing?.amountToPay ?? depositAmount)
                      : totalWithCharge
                    ).toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </div>

          
        </div>
        </div>
      </div>

      {/* Remove item confirmation */}
      {removeConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full max-w-sm space-y-4 max-h-[90dvh] overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] sm:pb-6 my-auto sm:my-0">
            <h3 className="font-bold font-[lora] tracking-tight text-base sm:text-[17px] text-[#0A0A0A]">
              Remove service?
            </h3>
            <p className="text-sm sm:text-[14px] text-[#3B3B3B] font-medium break-words">
              Are you sure you want to remove &quot;
              {
                cartItems.find((i: any) => i.service.id === removeConfirmId)
                  ?.service.name
              }
              &quot; from your booking?
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setRemoveConfirmId(null)}
                className="flex-1 rounded-full border border-gray-200 py-3 font-semibold text-sm sm:text-[14px] text-[#555] touch-manipulation min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRemoveItem(removeConfirmId)}
                className="flex-1 rounded-full bg-red-500 text-white py-3 font-semibold text-sm sm:text-[14px] hover:bg-red-600 touch-manipulation min-h-[44px]"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stripe payment modal */}
      {stripeClientSecret && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret: stripeClientSecret,
            appearance: {
              theme: "stripe",
              variables: { colorPrimary: "#4C9A2A", borderRadius: "8px" },
            },
          }}
        >
          <StripePaymentForm
            amount={
              hasDepositOption && selectedPaymentTerm === "deposit"
                ? (pricing?.amountToPay ?? depositAmount)
                : totalWithCharge
            }
            currencySymbol={currencySymbol}
            paymentReference={stripePaymentRef}
            onSuccess={handlePaymentSuccess}
            onClose={() => setStripeClientSecret(null)}
            completePayment={completePayment}
          />
        </Elements>
      )}
    </div>
  );
};

export default StepReviewCheckout;
