import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useCompletePaymentMutation } from '@/redux/booking';
import { clearCart } from '@/redux/cart/cartSlice';
import { toast } from 'react-toastify';

import StepServiceType from './steps/StepServiceType';
import StepSlotSelection from './steps/StepSlotSelection';
import StepAddressDetails from './steps/StepAddressDetails';
import StepConfirmDetails from './steps/StepConfirmDetails';
import StepReviewCheckout from './steps/StepReviewCheckout';
import StepSuccess from './steps/StepSuccess';
import Logo from '@/assets/images/green-logo.svg';
import { cartHasDeliveryServiceForBooking } from './bookingUtils';
// ── Shared types ──────────────────────────────────────────────────────────────

export interface BookingFormData {
  storeId: string;
  serviceType: string;
  serviceDate: string;
  serviceTime: string;
  /** JSON string: { name, email, phoneNumber } */
  contactNotes?: string;
  additionalNotes?: string;
  /** JSON string: string[] of image URLs */
  additionalImages?: string;
  /** JSON string of AddressData (home service) */
  contactAddress?: string;
  /** JSON string of AddressData (pickDrop pickup) */
  pickupAddress?: string;
  /** JSON string of AddressData (pickDrop dropoff) */
  dropoffAddress?: string;
}

export interface BookingSuccessData {
  bookingReference: string;
  bookingId: string;
  userEmail: string;
  totalDuration: number;
}

export type BookingStep =
  | 'serviceType'
  | 'dateTime'
  | 'address'
  | 'confirmation'
  | 'review'
  | 'success';

// ── Main component ────────────────────────────────────────────────────────────

const CreateBooking: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { storeId: storeIdParam } = useParams<{ storeId?: string }>();

  const store = useSelector((state: any) => state.vendorStore?.store);

  // Prefer URL param, fall back to store in Redux
  const storeId = useMemo(
    () => storeIdParam || store?.id || '',
    [storeIdParam, store?.id]
  );

  const cartItems = useSelector((state: any) => {
    if (!storeId || !state.cart?.carts) return [];
    return state.cart.carts[storeId] || [];
  });

  // If cart is empty (and not showing success), go back
  const [currentStep, setCurrentStep] = useState<BookingStep>('serviceType');

  useEffect(() => {
    if (currentStep !== 'success' && cartItems.length === 0 && storeId) {
      navigate(-1);
    }
  }, [cartItems.length, storeId, currentStep, navigate]);

  const [formData, setFormData] = useState<BookingFormData>({
    storeId,
    serviceType: '',
    serviceDate: '',
    serviceTime: '',
  });

  // Pickup & drop-off address step is disabled — only home-service address collection when applicable
  const needsAddressStep = useMemo(
    () =>
      cartHasDeliveryServiceForBooking(cartItems) &&
      formData.serviceType === 'home',
    [cartItems, formData.serviceType]
  );

  // Keep storeId in formData in sync
  useEffect(() => {
    if (storeId && formData.storeId !== storeId) {
      setFormData((prev) => ({ ...prev, storeId }));
    }
  }, [storeId]);

  const [successData, setSuccessData] = useState<BookingSuccessData | null>(null);

  // Clear cart only after we're on the success screen so the "empty cart" guard
  // doesn't fire while still on review (instant payments / saved card).
  useEffect(() => {
    if (currentStep !== 'success' || !successData || !storeId) return;
    dispatch(clearCart(storeId));
  }, [currentStep, successData, storeId, dispatch]);

  const updateFormData = (data: Partial<BookingFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  // ── Step navigation ──────────────────────────────────────────────────────────
  const goToNextStep = () => {
    switch (currentStep) {
      case 'serviceType':
        setCurrentStep('dateTime');
        break;
      case 'dateTime':
        setCurrentStep(needsAddressStep ? 'address' : 'confirmation');
        break;
      case 'address':
        setCurrentStep('confirmation');
        break;
      case 'confirmation':
        setCurrentStep('review');
        break;
      default:
        break;
    }
  };

  const goToPreviousStep = () => {
    switch (currentStep) {
      case 'dateTime':
        setCurrentStep('serviceType');
        break;
      case 'address':
        setCurrentStep('dateTime');
        break;
      case 'confirmation':
        setCurrentStep(needsAddressStep ? 'address' : 'dateTime');
        break;
      case 'review':
        setCurrentStep('confirmation');
        break;
      default:
        navigate(-1);
        break;
    }
  };

  // ── Paystack redirect return handling ────────────────────────────────────────
  const [completePayment] = useCompletePaymentMutation();

  useEffect(() => {
    const pendingRef = sessionStorage.getItem('pendingPaymentReference');
    const urlParams = new URLSearchParams(window.location.search);
    const urlRef = urlParams.get('reference') || urlParams.get('trxref');
    const refToUse = pendingRef || urlRef;

    if (!refToUse) return;
    if (pendingRef) sessionStorage.removeItem('pendingPaymentReference');

    completePayment({ paymentReference: refToUse })
      .unwrap()
      .then((res: any) => {
        if (res?.payment?.status === 'completed') {
          const booking = res?.booking;
          setSuccessData({
            bookingReference: booking?.bookingReference || 'N/A',
            bookingId: booking?.id || booking?._id || '',
            userEmail: formData.contactNotes
              ? (() => { try { return JSON.parse(formData.contactNotes!).email || ''; } catch { return ''; } })()
              : '',
            totalDuration: 0,
          });
          setCurrentStep('success');
        }
      })
      .catch(() => {
        toast.error('Payment verification failed. Please contact support.');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (currentStep) {
      case 'serviceType':
        return (
          <StepServiceType
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
            onBack={() => navigate(-1)}
          />
        );
      case 'dateTime':
        return (
          <StepSlotSelection
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 'address':
        return (
          <StepAddressDetails
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 'confirmation':
        return (
          <StepConfirmDetails
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 'review':
        return (
          <StepReviewCheckout
            formData={formData}
            onBack={goToPreviousStep}
            onGoToStep={setCurrentStep}
            onSuccess={(data) => {
              setSuccessData(data);
              setCurrentStep('success');
            }}
          />
        );
      case 'success': {
        if (!successData) return null;

        const parseAddrStr = (json?: string) => {
          if (!json) return undefined;
          try {
            const p = JSON.parse(json);
            const parts = [p.address, p.city].filter(Boolean);
            return parts.length ? parts.join(', ') : undefined;
          } catch {
            return undefined;
          }
        };

        return (
          <StepSuccess
            bookingReference={successData.bookingReference}
            userEmail={successData.userEmail}
            serviceDate={formData.serviceDate}
            serviceTime={formData.serviceTime}
            totalDuration={successData.totalDuration}
            bookingId={successData.bookingId}
            serviceType={formData.serviceType}
            storeLocation={
              store
                ? [store.location?.address, store.location?.city, store.location?.state]
                    .filter(Boolean)
                    .join(', ')
                : undefined
            }
            homeAddress={parseAddrStr(formData.contactAddress)}
          />
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Full-width top bar: logo left, X right */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-[#F0F0F0]">
        <img src={Logo} alt="Glitbase" className="w-6 object-contain" onClick={() => navigate('/')} />
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5L5 15M5 5l10 10" />
          </svg>
        </button>
      </header>

      {/* Centered content - no card, no shadow */}
      <main className="flex justify-center px-6 pb-8 pt-4">
        <div className={`w-full ${currentStep === 'review' ? 'max-w-[1100px]' : 'max-w-md'}`}>
          {renderStep()}
        </div>
      </main>
    </div>
  );
};

export default CreateBooking;
