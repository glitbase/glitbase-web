import React, { useState, useMemo, useEffect } from 'react';
import { useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import ServiceType from './ServiceType';
import SlotSelection from './SlotSelection';
import AddressDetails from './AddressDetails';
import ConfirmBookingDetails from './ConfirmBookingDetails';
import ReviewAndCheckout from './ReviewAndCheckout';
import BookingSuccess from './BookingSuccess';

type RouteParams = {
  storeId: string;
};

export interface BookingFormData {
  storeId: string;
  serviceType: string;
  serviceDate: string;
  serviceTime: string;
  // Contact info
  contactNotes?: string; // JSON string of {name, email, phoneNumber}
  // Additional info
  additionalNotes?: string;
  additionalImages?: string; // JSON string of image URLs array
  // Optional fields for home/pickDrop services
  contactAddress?: string;
  // Optional fields for pickDrop services
  pickupAddress?: string;
  pickupDate?: string;
  pickupNotes?: string;
  dropoffAddress?: string;
  dropoffDate?: string;
  dropoffNotes?: string;
}

interface BookingSuccessData {
  bookingReference: string;
  bookingId: string;
  userEmail: string;
  totalDuration: number;
}

type BookingStep = 'serviceType' | 'dateTime' | 'address' | 'confirmation' | 'review' | 'success';

const CreateBooking = () => {
  const route = useRoute();
  const { storeId } = route.params as RouteParams;
  const { store } = useSelector((state: RootState) => state.store);

  // Make storeIdToUse reactive - it will update when store loads
  const storeIdToUse = useMemo(() => {
    return storeId || store?.id;
  }, [storeId, store?.id]);

  // Get cart items to check if any service has isDelivery === true
  const cartItems = useSelector((state: RootState) => {
    const idToUse = storeId || store?.id;
    if (!idToUse || !state.cart.carts) return [];
    return state.cart.carts[idToUse] || [];
  });

  // Check if any service in cart has isDelivery === true
  const hasDeliveryService = cartItems.some(item => item.service.isDelivery === true);

  const [currentStep, setCurrentStep] = useState<BookingStep>('serviceType');
  const [formData, setFormData] = useState<BookingFormData>({
    storeId: storeIdToUse || '',
    serviceType: '',
    serviceDate: '',
    serviceTime: '',
  });
  const [successData, setSuccessData] = useState<BookingSuccessData | null>(null);

  // Update formData.storeId when storeIdToUse becomes available or changes
  useEffect(() => {
    if (storeIdToUse && formData.storeId !== storeIdToUse) {
      setFormData((prev) => ({ ...prev, storeId: storeIdToUse }));
    }
  }, [storeIdToUse]);

  const updateFormData = (data: Partial<BookingFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const goToNextStep = () => {
    // Navigate to next step based on current step
    switch (currentStep) {
      case 'serviceType':
        setCurrentStep('dateTime');
        break;
      case 'dateTime':
        // Show address step only if service.isDelivery === true, otherwise skip
        if (hasDeliveryService) {
          setCurrentStep('address');
        } else {
          setCurrentStep('confirmation');
        }
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
    // Navigate to previous step
    switch (currentStep) {
      case 'dateTime':
        setCurrentStep('serviceType');
        break;
      case 'address':
        setCurrentStep('dateTime');
        break;
      case 'confirmation':
        // Go back to address if hasDeliveryService, otherwise go to dateTime
        if (hasDeliveryService) {
          setCurrentStep('address');
        } else {
          setCurrentStep('dateTime');
        }
        break;
      case 'review':
        setCurrentStep('confirmation');
        break;
      default:
        break;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'serviceType':
        return (
          <ServiceType
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
          />
        );
      case 'dateTime':
        return (
          <SlotSelection
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 'address':
        return (
          <AddressDetails
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 'confirmation':
        return (
          <ConfirmBookingDetails
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 'review':
        return (
          <ReviewAndCheckout
            formData={formData}
            onBack={goToPreviousStep}
            onGoToStep={setCurrentStep}
            onSuccess={(data: BookingSuccessData) => {
              setSuccessData(data);
              setCurrentStep('success');
            }}
          />
        );
      case 'success':
        if (!successData) return null;

        // Parse addresses from formData
        const parseAddress = (jsonString?: string) => {
          if (!jsonString) return undefined;
          try {
            const parsed = JSON.parse(jsonString);
            const parts = [parsed.address, parsed.city].filter(Boolean);
            return parts.length > 0 ? parts.join(', ') : undefined;
          } catch {
            return undefined;
          }
        };

        return (
          <BookingSuccess
            bookingReference={successData.bookingReference}
            userEmail={successData.userEmail}
            serviceDate={formData.serviceDate}
            serviceTime={formData.serviceTime}
            totalDuration={successData.totalDuration}
            bookingId={successData.bookingId}
            serviceType={formData.serviceType}
            storeLocation={`${store?.location?.address}, ${store?.location?.city}, ${store?.location?.state}`}
            homeAddress={parseAddress(formData.contactAddress)}
            pickupAddress={parseAddress(formData.pickupAddress)}
            dropoffAddress={parseAddress(formData.dropoffAddress)}
          />
        );
      default:
        return null;
    }
  };

  return renderStep();
};

export default CreateBooking;