import React from "react";
import { View, StyleSheet, ScrollView, Image, Pressable, Alert } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import Text from "../../../../components/Text";
import Button from "../../../../components/Button";
import GoBack from "../../../../components/GoBack";
import PaystackWebView from "../../../../components/PaystackWebView";
import { bookingTypes, colors } from "../../../../utils/constants";
import { BookingFormData } from "./index";
import { RootState } from "../../../../store/store";
import { formatDuration } from "../../../../utils/helper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { removeFromCart, clearCart } from "../../../../store/cartSlice";
import { useGetPaymentCardsQuery, useInitiatePaymentMutation, useCompletePaymentMutation } from "../../../../services/paymentApi";
import { useCalculatePricingMutation } from "../../../../services/bookingsApi";
import { useToast } from "../../../../contexts/ToastContext";
import { useStripe } from "@stripe/stripe-react-native";

type RootStackParamList = {
  Home: undefined;
  Store: { storeId: string };
};

interface BookingSuccessData {
  bookingReference: string;
  bookingId: string;
  userEmail: string;
  totalDuration: number;
}

interface ReviewAndCheckoutProps {
  formData: BookingFormData;
  onBack: () => void;
  onGoToStep: (step: 'serviceType' | 'dateTime' | 'address' | 'confirmation' | 'review') => void;
  onSuccess: (data: BookingSuccessData) => void;
}

const ReviewAndCheckout: React.FC<ReviewAndCheckoutProps> = ({ formData, onBack, onGoToStep, onSuccess }) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [selectedPaymentTerm, setSelectedPaymentTerm] = React.useState<'deposit' | 'full'>('full');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<string>('');
  const [useNewCard, setUseNewCard] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [paystackWebViewVisible, setPaystackWebViewVisible] = React.useState(false);
  const [paystackAuthUrl, setPaystackAuthUrl] = React.useState('');
  const [currentPaymentReference, setCurrentPaymentReference] = React.useState('');
  const [pricing, setPricing] = React.useState<any>(null);
  const [isCalculatingPricing, setIsCalculatingPricing] = React.useState(false);

  // Fetch payment cards
  const { data: paymentCardsData, isLoading: isLoadingCards } = useGetPaymentCardsQuery();
  const paymentCards = React.useMemo(() => paymentCardsData?.data?.paymentCards || [], [paymentCardsData]);

  // Payment mutations
  const [initiatePayment] = useInitiatePaymentMutation();
  const [completePayment] = useCompletePaymentMutation();
  const [calculatePricing] = useCalculatePricingMutation();

  // Set default payment method when cards are loaded
  React.useEffect(() => {
    if (paymentCards.length > 0 && !selectedPaymentMethod && !useNewCard) {
      const defaultCard = paymentCards.find(card => card.isDefault) || paymentCards[0];
      setSelectedPaymentMethod(defaultCard.id);
    }
  }, [paymentCards, selectedPaymentMethod, useNewCard]);

  // Get card image URL based on card brand
  const getCardImageUrl = (cardBrand: string) => {
    switch (cardBrand.toLowerCase()) {
      case 'visa':
        return 'https://cdn-icons-png.flaticon.com/128/349/349221.png';
      case 'mastercard':
        return 'https://cdn-icons-png.flaticon.com/128/16174/16174534.png';
      case 'amex':
      case 'american express':
        return 'https://cdn-icons-png.flaticon.com/128/179/179431.png';
      case 'discover':
        return 'https://cdn-icons-png.flaticon.com/128/349/349230.png';
      case 'verve':
        return 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Verve_Image.png/1200px-Verve_Image.png';
      default:
        return 'https://cdn-icons-png.flaticon.com/128/349/349221.png';
    }
  };

  // Get store data for opening hours
  const { store } = useSelector((state: RootState) => state.store);

  const cartItems = useSelector((state: RootState) => {
    if (!formData.storeId || !state.cart.carts) return [];
    return state.cart.carts[formData.storeId] || [];
  });

  const hasDeliveryService = cartItems.some(item => item.service.isDelivery === true);
  const showHomeAddressOnReview =
    hasDeliveryService && formData.serviceType === 'home';

  const handleRemoveItem = (serviceId: string, serviceName: string) => {
    Alert.alert(
      "Remove Service",
      `Are you sure you want to remove "${serviceName}" from your booking?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            dispatch(removeFromCart({ storeId: formData.storeId, serviceId }));

            // If cart is now empty, navigate back to the store
            if (cartItems.length === 1) {
              navigation.navigate('Store', { storeId: formData.storeId });
            }
          }
        }
      ]
    );
  };

  // Calculate pricing when component mounts or cart changes
  React.useEffect(() => {
    const calculatePricingData = async () => {
      if (!cartItems.length || !store) return;
      
      setIsCalculatingPricing(true);
      try {
        const cartItemsForApi = cartItems.map(item => ({
          serviceId: item.service.id,
          quantity: item.quantity,
          addOnIds: (item.selectedAddOns || []).map(addOn => addOn._id || addOn.id).filter((id): id is string => typeof id === 'string')
        }));

        const result = await calculatePricing({
          storeId: store.id,
          cartItems: cartItemsForApi,
          paymentTerm: selectedPaymentTerm
        }).unwrap();

        setPricing(result.data);
      } catch (error) {
        console.error('Pricing calculation failed:', error);
        showToast({
          message: 'Failed to calculate pricing. Please try again.',
          type: 'error',
        });
      } finally {
        setIsCalculatingPricing(false);
      }
    };

    calculatePricingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems, selectedPaymentTerm, store]);

  // Fallback calculations for display
  const totalPrice = pricing?.subtotal || cartItems.reduce((sum, item) => {
    const itemPrice = item.service.pricingType === 'free' ? 0 : item.service.price;
    const addOnsPrice = (item.selectedAddOns || []).reduce((addOnSum, addOn) => addOnSum + addOn.price, 0);
    return sum + (itemPrice + addOnsPrice) * item.quantity;
  }, 0);

  const totalDuration = pricing?.totalDuration || cartItems.reduce((sum, item) => {
    const addOnsDuration = (item.selectedAddOns || []).reduce((addOnSum, addOn) => {
      const duration = addOn.duration ? (addOn.duration.hours * 60 + addOn.duration.minutes) : 0;
      return addOnSum + duration;
    }, 0);
    return sum + (item.service.durationInMinutes + addOnsDuration) * item.quantity;
  }, 0);

  const currency = pricing?.currency || cartItems[0]?.service.currency || 'NGN';
  const currencySymbol = currency === 'NGN' ? '₦' : currency === 'GBP' ? '£' : '$';

  // Calculate deposit amount based on store policy (fallback)
  const calculateDepositAmount = () => {
    if (!store?.policies?.payment) return totalPrice;

    const { depositType, amount } = store.policies.payment;
    if (depositType === 'fixed') {
      return amount;
    } else if (depositType === 'percentage') {
      return (totalPrice * amount) / 100;
    }
    return totalPrice;
  };

  const depositAmount = calculateDepositAmount();

  // Use API pricing data or fallback to manual calculation
  const amountToPay = pricing?.amountToPay || totalPrice;
  const remainingBalance = pricing?.remainingBalance || 0;
  const hasDepositOption = pricing ? pricing.paymentTerm === 'deposit' : store?.policies?.payment && (store.policies.payment.depositType === 'fixed' ? store.policies.payment.amount < totalPrice : (totalPrice * store.policies.payment.amount / 100) < totalPrice);

  // Determine payment gateway based on currency
  const getPaymentGateway = () => {
    if (currency === 'NGN') {
      return 'paystack';
    }
    return 'stripe';
  };

  const paymentGateway = getPaymentGateway();

  // Handle payment term change
  const handlePaymentTermChange = (term: 'deposit' | 'full') => {
    setSelectedPaymentTerm(term);
  };

  const handleConfirmBooking = async () => {
    try {
      // Validation - only check for payment method if cards exist and not using new card
      if (paymentCards.length > 0 && !selectedPaymentMethod && !useNewCard) {
        showToast({
          message: 'Please select a payment method',
          type: 'error',
        });
        return;
      }

      setIsProcessing(true);

      // Use API pricing data if available, otherwise fallback to manual calculation
      const finalAmountToPay = pricing?.totalWithServiceCharge || (hasDepositOption && selectedPaymentTerm === 'deposit' ? depositAmount : totalPrice);
      const finalRemainingBalance = pricing?.remainingBalance || (hasDepositOption && selectedPaymentTerm === 'deposit' ? totalPrice - depositAmount : 0);

      // Prepare metadata with booking data
      const metadata: any = {
        // storeId: formData.storeId,
        storeId: store?.id,
        serviceType: formData.serviceType,
        serviceDate: formData.serviceDate,
        serviceTime: formData.serviceTime,
        cartItems: cartItems.map(item => ({
          serviceId: item.service.id,
          quantity: item.quantity,
          addOnIds: item.selectedAddOns?.map(addOn => addOn._id || addOn.id).filter((id): id is string => id !== undefined) || [],
        })),
        pricing: {
          paymentTerm: selectedPaymentTerm,
          subtotal: pricing?.subtotal || totalPrice,
          totalDuration: pricing?.totalDuration || totalDuration,
          amountToPay: finalAmountToPay,
          remainingBalance: finalRemainingBalance,
        },
        contactInfo: formData.contactNotes ? JSON.parse(formData.contactNotes) : null,
        additionalInfo: {
          notes: formData.additionalNotes || null,
          images: formData.additionalImages ? JSON.parse(formData.additionalImages) : [],
        },
      };

      console.log('METADATA', metadata);

      // Add optional fields based on service type
      if (formData.serviceType === 'home') {
        if (formData.contactAddress) {
          metadata.homeServiceAddress = JSON.parse(formData.contactAddress);
        }
      }

      if (formData.serviceType === 'pickDrop') {
        if (formData.pickupAddress) {
          metadata.pickupInfo = {
            address: JSON.parse(formData.pickupAddress),
            date: formData.serviceDate, // Use service date for pickup
          };
        }
        if (formData.dropoffAddress) {
          metadata.dropoffInfo = {
            address: JSON.parse(formData.dropoffAddress),
            date: formData.serviceDate, // Use service date for dropoff
          };
        }
      }

      // Prepare payment request
      const paymentRequest: any = {
        paymentType: 'booking',
        paymentMethod: 'card',
        paymentGateway: paymentGateway,
        amount: finalAmountToPay,
        currency: currency,
        metadata: metadata,
      };

      // Add payment card ID if user has selected one (not using new card)
      if (selectedPaymentMethod && !useNewCard) {
        paymentRequest.paymentCardId = selectedPaymentMethod;
      }

      // Initiate payment which creates the booking
      const paymentResponse = await initiatePayment(paymentRequest).unwrap();

      console.log('PAYMENT RESPONSE', paymentResponse);

      // For saved card: Backend charges and creates booking immediately
      if (paymentResponse.data.payment.status === 'completed') {
        const booking = paymentResponse.data.booking;

        // Clear cart after successful booking
        dispatch(clearCart(formData.storeId));

        // Parse contact notes to get email
        const contactNotes = formData.contactNotes ? JSON.parse(formData.contactNotes) : null;

        // Navigate to success screen
        onSuccess({
          bookingReference: booking?.bookingReference || 'N/A',
          bookingId: booking?.id || '',
          userEmail: contactNotes?.email || '',
          totalDuration: totalDuration,
        });
      } else if (paymentResponse.data.payment.status === 'pending') {
        // For new card payment - handle based on gateway
        if (paymentGateway === 'paystack') {
          // Paystack flow: Open WebView with authorization URL
          const payment = paymentResponse.data.payment as any;
          const { authorizationUrl, paymentReference } = payment;

          if (!authorizationUrl) {
            showToast({
              message: 'Failed to initialize Paystack payment',
              type: 'error',
            });
            return;
          }

          // Set state to show Paystack WebView
          setCurrentPaymentReference(paymentReference);
          setPaystackAuthUrl(authorizationUrl);
          setPaystackWebViewVisible(true);
        } else {
          // Stripe flow: Use Stripe SDK
          const { clientSecret, paymentReference } = paymentResponse.data.payment;

          if (!clientSecret) {
            showToast({
              message: 'Failed to initialize Stripe payment',
              type: 'error',
            });
            return;
          }

          // Initialize payment sheet
          const { error: initError } = await initPaymentSheet({
            merchantDisplayName: store?.name || 'Glitbase',
            paymentIntentClientSecret: clientSecret,
            defaultBillingDetails: {
              name: '', // Can be filled from user profile
            },
          });

          if (initError) {
            console.error('Error initializing payment sheet:', initError);
            showToast({
              message: 'Failed to initialize payment. Please try again.',
              type: 'error',
            });
            return;
          }

          // Present payment sheet
          const { error: presentError } = await presentPaymentSheet();

          if (presentError) {
            console.error('Error presenting payment sheet:', presentError);
            showToast({
              message: presentError.message || 'Payment cancelled',
              type: 'error',
            });
            return;
          }

          // Payment successful, complete the payment on backend
          const completeResponse = await completePayment({
            paymentReference: paymentReference,
          }).unwrap();

          if (completeResponse.data.payment.status === 'completed') {
            const booking = completeResponse.data.booking;

            console.log('COMPLETE RESPONSE', completeResponse);

            // Clear cart after successful booking
            dispatch(clearCart(formData.storeId));

            // Parse contact notes to get email
            const contactNotes = formData.contactNotes ? JSON.parse(formData.contactNotes) : null;

            // Navigate to success screen
            onSuccess({
              bookingReference: booking?.bookingReference || 'N/A',
              bookingId: booking?.id || '',
              userEmail: contactNotes?.email || '',
              totalDuration: totalDuration,
            });
          }
        }
      } else {
        showToast({
          message: 'Unexpected payment status. Please contact support.',
          type: 'error',
        });
      }

    } catch (error: any) {
      console.error('PAYMENT ERROR:', error);
      showToast({
        message: error?.data?.message || 'Booking failed. Please try again.',
        type: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Format date and time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatTimeRange = (startTime: string, durationMinutes: number) => {
    if (!startTime) return 'Not selected';

    // Parse the start time
    const [time, period] = startTime.split(' ');
    const [hours, minutes] = time.split(':').map(Number);

    // Convert to 24-hour format
    let startHours = hours;
    if (period?.toLowerCase() === 'pm' && hours !== 12) {
      startHours += 12;
    } else if (period?.toLowerCase() === 'am' && hours === 12) {
      startHours = 0;
    }

    // Calculate end time
    const totalMinutes = startHours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;

    // Format end time
    const endPeriod = endHours >= 12 ? ' PM' : ' AM';
    const endHours12 = endHours === 0 ? 12 : endHours > 12 ? endHours - 12 : endHours;
    const formattedEndTime = `${endHours12}:${endMinutes.toString().padStart(2, '0')}${endPeriod}`;

    return `${startTime} - ${formattedEndTime}`;
  };

  // Paystack WebView handlers
  const handlePaystackSuccess = async () => {
    try {
      setPaystackWebViewVisible(false);
      setIsProcessing(true);

      // Complete the payment on backend
      const completeResponse = await completePayment({
        paymentReference: currentPaymentReference,
      }).unwrap();

      if (completeResponse.data.payment.status === 'completed') {
        const booking = completeResponse.data.booking;

        // Clear cart after successful booking
        dispatch(clearCart(formData.storeId));

        // Parse contact notes to get email
        const contactNotes = formData.contactNotes ? JSON.parse(formData.contactNotes) : null;

        // Navigate to success screen
        onSuccess({
          bookingReference: booking?.bookingReference || 'N/A',
          bookingId: booking?.id || '',
          userEmail: contactNotes?.email || '',
          totalDuration: totalDuration,
        });
      } else {
        showToast({
          message: 'Payment verification failed. Please contact support.',
          type: 'error',
        });
      }
    } catch (error: any) {
      console.error('PAYSTACK COMPLETE ERROR:', error);
      showToast({
        message: error?.data?.message || 'Payment verification failed',
        type: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaystackCancel = () => {
    setPaystackWebViewVisible(false);
    showToast({ 
      message: 'Payment cancelled',
      type: 'error',
    });
  };

  const handlePaystackError = (error: string) => {
    setPaystackWebViewVisible(false);
    showToast({
      message: error || 'Payment failed',
      type: 'error',
    });
  };

  const returnToOriginalBooking = () => {
    navigation.navigate('Store', { storeId: formData.storeId });
    t
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.headerRow}>
          <GoBack goBack={onBack} />
          <Text weight="lora" style={styles.headerTitle}>
            Review & Checkout
          </Text>
          <View />
        </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Store Details */}
        {store && (
          <View style={styles.storeSection}>
            <View style={styles.storeContent}>
              <Image
                source={{ uri: store.bannerImageUrl }}
                style={styles.storeBanner}
              />
              <View style={styles.storeInfo}>
                <Text weight="medium" style={styles.storeName}>
                  {store.name}
                </Text>
                <View style={styles.storeRating}>
                  <Image
                    source={{
                      uri: "https://cdn-icons-png.flaticon.com/128/2099/2099156.png",
                    }}
                    style={styles.starIcon}
                    resizeMode="contain"
                  />
                  <Text weight="semiBold" style={styles.ratingText}>
                    {store.rating || '0.0'}{" "}
                    <Text weight="semiBold" style={[styles.ratingText, { color: colors.primary }]}>
                      ({store.reviewCount || 0})
                    </Text>
                  </Text>
                </View>
                <View style={styles.storeLocation}>
                  <Image
                    source={{
                      uri: "https://cdn-icons-png.flaticon.com/128/16002/16002329.png",
                    }}
                    style={styles.locationIcon}
                    resizeMode="contain"
                  />
                  <Text weight="medium" style={styles.locationText} numberOfLines={1}>
                    {store.location?.address || 'Address not available'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Appointment Details Section */}
        <View style={styles.section}>
          <View style={styles.detailItem}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar-outline" size={17} color={colors.darkGray} />
            </View>
            <View style={styles.detailContent}>
              <Text weight="medium" style={styles.detailLabel}>
                Date
              </Text>
              <Text weight="medium" style={styles.detailValue}>
                {formData.serviceDate ? formatDate(formData.serviceDate) : 'Not selected'}
              </Text>
            </View>
            <Pressable onPress={() => onGoToStep('dateTime')} style={styles.editButton}>
            <Image
              source={{
                uri: "https://cdn-icons-png.flaticon.com/128/16972/16972938.png",
              }}
              style={styles.optionIcon}
            />
            </Pressable>
          </View>

          <View style={styles.detailItem}>
            <View style={styles.iconCircle}>
              <Ionicons name="time-outline" size={18} color={colors.darkGray} />
            </View>
            <View style={styles.detailContent}>
              <Text weight="medium" style={styles.detailLabel}>
                Time
              </Text>
              <Text weight="medium" style={styles.detailValue}>
                {formatTimeRange(formData.serviceTime, totalDuration)}
              </Text>
            </View>
            <Pressable onPress={() => onGoToStep('dateTime')} style={styles.editButton}>
            <Image
              source={{
                uri: "https://cdn-icons-png.flaticon.com/128/16972/16972938.png",
              }}
              style={styles.optionIcon}
            />
            </Pressable>
          </View>

          <View style={styles.detailItem}>
            <View style={styles.iconCircle}>
              <Ionicons name="cog-outline" size={20} color={colors.darkGray} />
            </View>
            <View style={styles.detailContent}>
              <Text weight="medium" style={styles.detailLabel}>
                Service Type
              </Text>
              <Text weight="medium" style={[styles.detailValue, {maxWidth: '85%'}]}>
                {bookingTypes?.find(i => i.value === formData.serviceType)?.label || 'Not selected'} {!hasDeliveryService ? "(At provider's address)" : ''}
              </Text>
            </View>
            <Pressable onPress={() => onGoToStep('serviceType')} style={styles.editButton}>
            <Image
              source={{
                uri: "https://cdn-icons-png.flaticon.com/128/16972/16972938.png",
              }}
              style={styles.optionIcon}
            />
            </Pressable>
          </View>

          {/* Address — home service only (pickup/drop-off step removed) */}
          {showHomeAddressOnReview && (
            <View style={styles.detailItem}>
              <View style={styles.iconCircle}>
                <Ionicons name="location-outline" size={20} color={colors.darkGray} />
              </View>
              <View style={styles.detailContent}>
                <Text weight="medium" style={styles.detailLabel}>
                  Address
                </Text>
                <Text weight="medium" style={styles.detailValue}>
                  {formData.contactAddress ? JSON.parse(formData.contactAddress).address : 'Not set'}
                </Text>
              </View>
              <Pressable onPress={() => onGoToStep('address')} style={styles.editButton}>
                <Image
                  source={{
                    uri: "https://cdn-icons-png.flaticon.com/128/16972/16972938.png",
                  }}
                  style={styles.optionIcon}
                />
              </Pressable>
            </View>
          )}
        </View>

        {/* Services Section */}
        <View style={styles.section}>
          <Text weight="medium" style={[styles.sectionTitle, {marginBottom: 24}]}>
            Service details
          </Text>
          {cartItems.map((item, index) => {
            const itemPrice = item.service.pricingType === 'free' ? 0 : item.service.price;
            const addOnsTotal = (item.selectedAddOns || []).reduce((sum, addOn) => sum + addOn.price, 0);
            const totalItemPrice = itemPrice + addOnsTotal;
            const hasAddOns = item.selectedAddOns && item.selectedAddOns.length > 0;

            // Calculate total duration including add-ons
            const addOnsDuration = (item.selectedAddOns || []).reduce((sum, addOn) => {
              const duration = addOn.duration ? (addOn.duration.hours * 60 + addOn.duration.minutes) : 0;
              return sum + duration;
            }, 0);
            const totalItemDuration = item.service.durationInMinutes + addOnsDuration;

            return (
            <View key={index} style={styles.serviceItem}>
              <Image
                source={{ uri: item.service.imageUrl }}
                style={styles.serviceImage}
              />
              <View style={styles.serviceInfo}>
                <Text weight="medium" style={styles.serviceName}>
                  {item.service.name}
                </Text>
                <Text weight="semiBold" style={styles.servicePrice}>
                  {currencySymbol}{totalItemPrice.toLocaleString()}
                </Text>
                <View style={styles.durationRow}>
                  <Text weight="medium" style={styles.serviceDuration}>
                    {formatDuration(totalItemDuration)}
                  </Text>
                  {hasAddOns && (
                    <Text weight="medium" style={styles.addOnIndicator}>
                      • Includes {item.selectedAddOns.length} add-on{item.selectedAddOns.length > 1 ? 's' : ''}
                    </Text>
                  )}
                </View>
              </View>
              <Pressable
                style={styles.deleteButton}
                onPress={() => handleRemoveItem(item.service.id, item.service.name)}
              >
                <Ionicons name="trash-outline" size={18} color="#FF3B30" />
              </Pressable>
            </View>
            );
          })}
        </View>

        {/* Payment Terms Section */}
        {hasDepositOption && (
          <View style={styles.section}>
            <Text weight="medium" style={[styles.sectionTitle, {marginBottom: 24}]}>
              Payment terms
            </Text>

            {/* Deposit Option */}
            <Pressable
              onPress={() => handlePaymentTermChange('deposit')}
              style={[
                styles.paymentTerm,
                {
                  backgroundColor: selectedPaymentTerm === 'deposit' ? colors.secondaryLight : "#FAFAFA",
                },
              ]}
            >
              <View style={styles.paymentTermContent}>
                {selectedPaymentTerm === 'deposit' ? (
                  <Ionicons
                    color={colors.secondary}
                    size={23}
                    name="radio-button-on"
                    style={{marginTop: 2}}
                  />
                ) : (
                  <Ionicons
                    color={"#E0E0E0"}
                    size={23}
                    name="radio-button-off"
                    style={{marginTop: 2}}
                  />
                )}
                <View style={styles.paymentTermText}>
                  <Text weight="medium" style={styles.paymentTermLabel}>
                    Pay deposit
                  </Text>
                  <Text weight="medium" style={styles.paymentTermDescription}>
                    {store.policies.payment.depositType === 'percentage' ? `${store.policies.payment.amount}%` : currencySymbol + store.policies.payment.amount} deposit before appointment
                  </Text>
                </View>
              </View>
              <Text weight="medium" style={styles.paymentTermAmount}>
                {currencySymbol}{depositAmount.toLocaleString()}
              </Text>
            </Pressable>

            {/* Full Payment Option */}
            <Pressable
              onPress={() => handlePaymentTermChange('full')}
              style={[
                styles.paymentTerm,
                {
                  backgroundColor: selectedPaymentTerm === 'full' ? colors.secondaryLight : "#FAFAFA",
                },
              ]}
            >
              <View style={styles.paymentTermContent}>
                {selectedPaymentTerm === 'full' ? (
                  <Ionicons
                    color={colors.secondary}
                    size={23}
                    name="radio-button-on"
                    style={{marginTop: 2}}
                  />
                ) : (
                  <Ionicons
                    color={"#E0E0E0"}
                    size={23}
                    name="radio-button-off"
                    style={{marginTop: 2}}
                  />
                )}
                <View style={styles.paymentTermText}>
                  <Text weight="medium" style={styles.paymentTermLabel}>
                  Pay in full
                  </Text>
                  <Text weight="medium" style={styles.paymentTermDescription}>
                  Pay 100% upfront and you&apos;re all set
                  </Text>
                </View>
              </View>
              <Text weight="medium" style={styles.paymentTermAmount}>
                {currencySymbol}{pricing?.totalWithServiceCharge || totalPrice.toLocaleString()}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Payment Methods Section */}
        {paymentCards.length > 0 && (
          <View style={styles.section}>
            <Text weight="medium" style={[styles.sectionTitle, {marginBottom: 24}]}>
              Payment methods
            </Text>

            {paymentCards.map((card) => (
              <Pressable
                key={card.id}
                onPress={() => {
                  setSelectedPaymentMethod(card.id);
                  setUseNewCard(false);
                }}
                style={[
                  styles.paymentMethod,
                  {
                    backgroundColor: selectedPaymentMethod === card.id && !useNewCard ? colors.secondaryLight : "#FAFAFA",
                  },
                ]}
              >
                <View style={styles.paymentMethodContent}>
                  {selectedPaymentMethod === card.id && !useNewCard ? (
                    <Ionicons
                      color={colors.secondary}
                      size={23}
                      name="radio-button-on"
                      style={{marginTop: 2}}
                    />
                  ) : (
                    <Ionicons
                      color={"#E0E0E0"}
                      size={23}
                      name="radio-button-off"
                      style={{marginTop: 2}}
                    />
                  )}
                  <View style={styles.paymentMethodText}>
                    <Text weight="medium" style={styles.paymentMethodLabel}>
                      {card.cardBrand.charAt(0).toUpperCase() + card.cardBrand.slice(1)}
                    </Text>
                    <Text weight="medium" style={styles.paymentMethodNumber}>
                      **** {card.last4Digits}
                    </Text>
                  </View>
                </View>
                <Image
                  source={{ uri: getCardImageUrl(card.cardBrand) }}
                  style={styles.cardIcon}
                  resizeMode="contain"
                />
              </Pressable>
            ))}

            <Pressable
              onPress={() => {
                if (useNewCard) {
                  // If already selected, deselect and select the first card
                  setUseNewCard(false);
                  if (paymentCards.length > 0) {
                    const defaultCard = paymentCards.find(card => card.isDefault) || paymentCards[0];
                    setSelectedPaymentMethod(defaultCard.id);
                  }
                } else {
                  // Select new card option
                  setUseNewCard(true);
                  setSelectedPaymentMethod('');
                }
              }}
              style={styles.useNewCardButton}
            >
              <View style={styles.useNewCardContent}>
                {useNewCard ? (
                  <Ionicons
                    color={colors.secondary}
                    size={23}
                    name="checkbox"
                  />
                ) : (
                  <Ionicons
                    color={"#E0E0E0"}
                    size={23}
                    name="square-outline"
                  />
                )}
                <Text weight="medium" style={styles.useNewCardText}>
                  Use a new card
                </Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* Summary Section */}
        <View style={styles.summarySection}>
          {isCalculatingPricing ? (
            <View style={styles.summaryRow}>
              <Text weight="medium" style={styles.summaryLabel}>
                Calculating pricing...
              </Text>
              <Text weight="medium" style={styles.summaryValue}>
                Please wait
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.summaryRow}>
                <Text weight="medium" style={styles.summaryLabel}>
                  Subtotal ({cartItems?.length} {cartItems?.length > 1 ? 'Items' : 'Item'})
                </Text>
                <Text weight="medium" style={styles.summaryValue}>
                  {currencySymbol}{totalPrice.toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text weight="medium" style={styles.summaryLabel}>
                  Total Duration
                </Text>
                <Text weight="medium" style={styles.summaryValue}>
                  {formatDuration(totalDuration)}
                </Text>
              </View>
              {pricing && (
                <>
                  <View style={styles.summaryRow}>
                    <Text weight="medium" style={styles.summaryLabel}>
                      Service Charge
                    </Text>
                    <Text weight="medium" style={styles.summaryValue}>
                      {currencySymbol}{pricing.serviceChargeAmount.toLocaleString()}
                    </Text>
                  </View>
                </>
              )}
              {hasDepositOption && selectedPaymentTerm === 'deposit' && (
                <View style={styles.summaryRow}>
                  <Text weight="medium" style={styles.summaryLabel}>
                    Remaining Balance
                  </Text>
                  <Text weight="medium" style={styles.summaryValue}>
                    {currencySymbol}{remainingBalance.toLocaleString()}
                  </Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text weight="medium" style={styles.summaryLabel}>
                  Taxes
                </Text>
                <Text weight="medium" style={styles.summaryValue}>
                  {currencySymbol}0.00
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow, {marginBottom: 0}]}>
                <Text weight="semiBold" style={styles.totalLabel}>
                  {hasDepositOption && selectedPaymentTerm === 'deposit' ? 'Total due now' : 'Total'}
                </Text>
                <Text weight="semiBold" style={styles.totalValue}>
                  {currencySymbol}{pricing?.totalWithServiceCharge || amountToPay.toLocaleString()}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Additional Terms and Conditions */}
        {(store?.policies?.booking?.cancellation || store?.policies?.booking?.rescheduling) && (
          <View style={styles.termsSection}>
            <Text weight="semiBold" style={styles.termsTitle}>
              Additional terms and conditions
            </Text>
            {store?.policies?.booking?.cancellation && (
              <Text weight="medium" style={styles.termText}>
                By booking, you agree to our {store.policies.booking.cancellation}
              </Text>
            )}
            {store?.policies?.booking?.rescheduling && (
              <Text weight="medium" style={[styles.termText, store?.policies?.booking?.cancellation && { marginTop: 12 }]}>
                {store.policies.booking.rescheduling}
              </Text>
            )}
          </View>
        )}

        <View style={styles.termsSection}>
            <Text weight="semiBold" style={styles.termsTitle}>
              Booking & Cancellation Policy
            </Text>
              <Text weight="medium" style={styles.termText}>
                By confirming, you agree to the provider&apos;s and Glitbase&apos;s terms - lateness policies are set by providers.
              </Text>
              <Text weight="medium" style={[styles.termText, {marginTop: 12}]}>
                Cancellations made within 24hours of the appointment will incur a fee based on the provider&apos;s set deposit amount.
              </Text>
        </View>
        
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={isProcessing ? "Processing..." : "Confirm booking"}
          onPress={handleConfirmBooking}
          style={{ marginTop: 12 }}
          disabled={isProcessing || isLoadingCards}
          loading={isProcessing}
        />
        <Button
          title="Back to home"
          onPress={() => navigation.navigate('Home')}
          variant="ghostgray"
          style={{ marginTop: 12 }}
        />
      </View>

      {/* Paystack WebView Modal */}
      <PaystackWebView
        visible={paystackWebViewVisible}
        authorizationUrl={paystackAuthUrl}
        onSuccess={handlePaystackSuccess}
        onCancel={handlePaystackCancel}
        onError={handlePaystackError}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 180,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
    paddingHorizontal: 16,
    marginTop: 10
  },
  headerTitle: {
    fontSize: 20,
    letterSpacing: -0.5,
  },
  storeSection: {
    marginBottom: 24,
  },
  storeContent: {
    flexDirection: "row",
    gap: 12,
  },
  storeBanner: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.lightGray,
  },
  storeInfo: {
    flex: 1,
    justifyContent: "center",
  },
  storeName: {
    fontSize: 17,
    color: colors.textDark,
    marginBottom: 6,
  },
  storeRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  starIcon: {
    width: 11,
    height: 11,
    marginTop: 1
  },
  ratingText: {
    fontSize: 14,
    color: colors.textDark,
  },
  storeLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8
  },
  locationIcon: {
    width: 14,
    height: 14,
  },
  locationText: {
    fontSize: 15,
    color: colors.mediumGray,
    flex: 1,
  },
  section: {
    marginTop: 12,
    paddingBottom: 12,
    // borderBottomWidth: 1,
    // borderBottomColor: colors.lightGray,
  },
  sectionTitle: {
    fontSize: 17,
    color: colors.textDark,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 26,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FAFAFA',
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textGray,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 16,
    color: colors.textDark,
  },
  editButton: {
    padding: 8,
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  serviceImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.lightGray,
    marginRight: 2
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    color: colors.darkGray,
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 15,
    color: colors.textDark,
    marginBottom: 2,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  serviceDuration: {
    fontSize: 15,
    color: colors.textGray,
  },
  addOnIndicator: {
    fontSize: 13,
    color: colors.primary,
  },
  deleteButton: {
    padding: 8,
    marginTop: -40
  },
  paymentTerm: {
    paddingVertical: 19,
    paddingHorizontal: 15,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "flex-start",
    marginBottom: 12,
    borderRadius: 15,
  },
  paymentTermContent: {
    display: "flex",
    flexDirection: "row",
    gap: 16,
    alignItems: 'flex-start',
    flex: 1,
  },
  paymentTermText: {
    flex: 1,
  },
  paymentTermLabel: {
    fontSize: 15,
    color: colors.textDark,
  },
  paymentTermDescription: {
    marginTop: 5,
    fontSize: 15,
    color: colors.textGray,
    letterSpacing: -0.4,
  },
  paymentTermAmount: {
    fontSize: 15,
    color: colors.textDark,
  },
  paymentMethod: {
    paddingVertical: 19,
    paddingHorizontal: 15,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
    marginBottom: 12,
    borderRadius: 15,
  },
  paymentMethodContent: {
    display: "flex",
    flexDirection: "row",
    gap: 16,
    alignItems: 'flex-start',
    flex: 1,
  },
  paymentMethodText: {
    flex: 1,
  },
  paymentMethodLabel: {
    fontSize: 15,
    color: colors.textDark,
  },
  paymentMethodNumber: {
    marginTop: 5,
    fontSize: 15,
    color: colors.textGray,
    letterSpacing: -0.4,
  },
  cardIcon: {
    width: 40,
    height: 26,
  },
  useNewCardButton: {
    paddingVertical: 6,
  },
  useNewCardContent: {
    display: "flex",
    flexDirection: "row",
    gap: 8,
    alignItems: 'flex-start',
    flex: 1,
  },
  useNewCardText: {
    fontSize: 15,
    color: colors.textDark,
    marginTop: 2
  },
  addCardButton: {
    paddingVertical: 6,
  },
  addCardText: {
    fontSize: 15,
    color: colors.secondaryAlt,
  },
  summarySection: {
    marginTop: 8,
    backgroundColor: colors.lightGray,
    padding: 16,
    borderRadius: 12
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  summaryLabel: {
    fontSize: 15,
    color: colors.darkGray,
  },
  summaryValue: {
    fontSize: 15,
    color: colors.textDark,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  totalLabel: {
    color: colors.textDark,
  },
  totalValue: {
    color: colors.textDark,
  },
  termsSection: {
    marginTop: 30,
  },
  termsTitle: {
    fontSize: 17,
    color: colors.textDark,
    marginBottom: 16,
  },
  termText: {
    fontSize: 15,
    color: colors.darkGray,
    lineHeight: 20,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    padding: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  optionIcon: {
    width: 21,
    height: 21,
  },
});

export default ReviewAndCheckout;
