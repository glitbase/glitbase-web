import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Text from '../../components/Text';
import Button from '../../components/Button';
import Skeleton from '../../components/Skeleton';
import { colors } from '../../utils/constants';
import { 
  useGetActiveSubscriptionPlansQuery, 
  useAcceptSubscriptionMutation,
  useCreateSubscriptionMutation,
  SubscriptionPlan 
} from '../../services/paymentApi';
import { useToast } from '../../contexts/ToastContext';
import { RootState } from '../../store/store';
import { useSelector, useDispatch } from 'react-redux';
import { useStripe } from '@stripe/stripe-react-native';
import { useGetProfileQuery } from '../../services/authApi';
import { updateUser } from '../../store/userSlice';

type RootStackParamList = {
  StoreLive: undefined;
};

type SubscriptionSetupNavigationProp = StackNavigationProp<RootStackParamList>;

const SubscriptionSetup = () => {
  const navigation = useNavigation<SubscriptionSetupNavigationProp>();
  const { showToast } = useToast();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const dispatch = useDispatch();
  
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const { user } = useSelector((state: RootState) => state.user);
  const userCountryCode = user?.countryCode as 'NG' | 'GB';

  // Fetch subscription plans
  const { 
    data: plansData, 
    isLoading: isLoadingPlans, 
    error: plansError 
  } = useGetActiveSubscriptionPlansQuery();

  // Fetch profile
  const { refetch: refetchProfile } = useGetProfileQuery(undefined);

  console.log('plansData', plansData);

  const [acceptSubscription, { isLoading: isAcceptingSubscription }] = useAcceptSubscriptionMutation();
  const [createSubscription, { isLoading: isCreatingSubscription }] = useCreateSubscriptionMutation();

  // Set default selected plan when plans are loaded
  useEffect(() => {
    if (plansData?.data && plansData.data.length > 0) {
      const monthlyPlan = plansData.data.find(plan => plan.type.toLowerCase() === 'monthly');
      if (monthlyPlan) {
        setSelectedPlan(monthlyPlan);
      }
    }
  }, [plansData]);

  const refetchAndUpdateProfile = async () => {
    const result = await refetchProfile();
    if (result.data?.data?.user) {
      dispatch(updateUser(result.data.data.user));
    }
  };

  const handleStartTrial = async () => {

    try {
      // For now, we'll use a placeholder payment method ID
      // In a real implementation, this would come from a payment method selection
      const paymentMethodId = 'pm_placeholder_1234567890';

      const payload = userCountryCode === 'GB' ? {
        subscriptionType: selectedPlan.type,
        planId: selectedPlan._id,
        paymentMethodId: paymentMethodId
      } : {
        subscriptionType: "commission",
      }
      console.log(payload)
      await acceptSubscription({
        ...payload
      }).unwrap();

      await refetchAndUpdateProfile();
      showToast({ message: 'Subscription activated successfully!', type: 'success' });
      navigation.navigate('StoreLive');
    } catch (error: any) {
      console.error('Subscription error:', error);
      showToast({ 
        message: error?.data?.message || 'Failed to activate subscription. Please try again.', 
        type: 'error' 
      });
    }
  };

  const subscribeToPlan = async () => {
    if (!selectedPlan) {
      showToast({ 
        message: 'Please select a subscription plan', 
        type: 'error' 
      });
      return;
    }

    try {
      // For UK vendors, create subscription directly - backend will handle payment collection
      if (userCountryCode === 'GB') {
        const subscriptionData = {
          subscriptionType: selectedPlan.type as "Monthly" | "Yearly",
          planId: selectedPlan.id,
          // paymentMethod: {
          //   paymentMethodId: 'new_card'
          // },
        };

        const result = await createSubscription(subscriptionData).unwrap();
        
        console.log('Subscription result:', result);
        
        if (result.status) {
          // Handle 3D Secure if clientSecret is provided
          if (result.data.clientSecret) {
            console.log('Client secret received:', result.data.clientSecret);
            
            try {
              // Check if it's a setup intent or payment intent
              const isSetupIntent = result.data.clientSecret.startsWith('seti_');
              const isPaymentIntent = result.data.clientSecret.startsWith('pi_');
              
              console.log('Client secret type:', isSetupIntent ? 'Setup Intent' : isPaymentIntent ? 'Payment Intent' : 'Unknown');
              
              // Initialize payment sheet for 3D Secure
              const { error: initError } = await initPaymentSheet({
                merchantDisplayName: 'Glitbase',
                ...(isSetupIntent ? {
                  setupIntentClientSecret: result.data.clientSecret,
                } : {
                  paymentIntentClientSecret: result.data.clientSecret,
                }),
                defaultBillingDetails: {
                  name: user?.fullName || '',
                  email: user?.email || '',
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

              console.log('Payment sheet initialized successfully');

              // Present payment sheet for 3D Secure authentication
              const { error: presentError } = await presentPaymentSheet();

              if (presentError) {
                console.error('Error presenting payment sheet:', presentError);
                showToast({
                  message: presentError.message || 'Payment authentication cancelled',
                  type: 'error',
                });
                return;
              }

              console.log('Payment sheet presented successfully');

              // 3D Secure authentication successful
              await refetchAndUpdateProfile();
              showToast({ 
                message: 'Subscription created successfully!', 
                type: 'success' 
              });
              navigation.navigate('StoreLive');
            } catch (stripeError) {
              console.error('Stripe error:', stripeError);
              showToast({
                message: 'Payment authentication failed. Please try again.',
                type: 'error',
              });
              return;
            }
          } else {
            console.log('No client secret provided, subscription created without payment');
            // No 3D Secure required, subscription created successfully
            await refetchAndUpdateProfile();
            showToast({ 
              message: 'Subscription created successfully!', 
              type: 'success' 
            });
            navigation.navigate('StoreLive');
          }
        }
      } else {
        // For non-UK vendors, use the existing commission flow
        await handleStartTrial();
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      showToast({ 
        message: error?.data?.message || 'Failed to create subscription. Please try again.', 
        type: 'error' 
      });
    }
  }

  const renderCheckmark = () => (
    <View style={styles.checkmark}>
      <Text style={styles.checkmarkText}>✓</Text>
    </View>
  );

  const renderPricingCardSkeleton = () => (
    <View style={styles.pricingOption}>
      <Skeleton width={80} height={20} style={{ marginBottom: 8 }} />
      <Skeleton width={120} height={24} />
    </View>
  );

  const formatPrice = (price: number, currency: string) => {
    const formattedPrice = (price / 100).toFixed(2); // Assuming price is in cents
    return `${currency === 'NGN' ? '₦' : '£'} ${formattedPrice}`;
  };

  const renderPricingCards = () => {
    if (isLoadingPlans) {
      return (
        <View style={styles.pricingContainer}>
          {renderPricingCardSkeleton()}
          {renderPricingCardSkeleton()}
        </View>
      );
    }

    if (plansError || !plansData?.data || plansData.data.length === 0) {
      return (
        <View style={styles.pricingContainer}>
          <Text style={styles.errorText}>Failed to load subscription plans</Text>
        </View>
      );
    }

    const plans = plansData.data;
    const monthlyPlan = plans.find(plan => plan.type.toLowerCase() === 'monthly');
    const yearlyPlan = plans.find(plan => plan.type.toLowerCase() === 'yearly');

    return (
      <View style={styles.pricingContainer}>
        {monthlyPlan && (
          <Pressable
            style={[
              styles.pricingOption,
              selectedPlan?.id === monthlyPlan.id ? styles.selectedPricingOption : null
            ]}
            onPress={() => setSelectedPlan(monthlyPlan)}
          >
            <Text weight="medium" style={styles.pricingLabel}>Monthly</Text>
            <Text weight="semiBold" style={styles.pricingAmount}>
              {formatPrice(monthlyPlan.price, monthlyPlan.currency)} / month
            </Text>
          </Pressable>
        )}

        {yearlyPlan && (
          <Pressable
            style={[
              styles.pricingOption,
              selectedPlan?.id === yearlyPlan.id ? styles.selectedPricingOption : null
            ]}
            onPress={() => setSelectedPlan(yearlyPlan)}
          >
            <View style={styles.savingsBadge}>
              <Text weight='semiBold' style={styles.savingsText}>Save 20%</Text>
            </View>
            <Text weight="medium" style={styles.pricingLabel}>Yearly</Text>
            <Text weight="semiBold" style={styles.pricingAmount}>
              {formatPrice(yearlyPlan.price, yearlyPlan.currency)} / year
            </Text>
          </Pressable>
        )}
      </View>
    );
  };


  const renderMonthlyYearlyTemplate = () => (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text weight='lora' style={styles.title}>Choose the perfect plan to grow Your business</Text>

        {/* Features */}
        <View style={{marginTop: 20}} />
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            {renderCheckmark()}
            <View style={styles.featureContent}>
              <Text weight="medium" style={styles.featureTitle}>Unlimited bookings & scheduling</Text>
              <Text weight="medium" style={styles.featureDescription}>
                Handle all appointments with ease. Calendar integration, automated reminders, and flexible scheduling options.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            {renderCheckmark()}
            <View style={styles.featureContent}>
              <Text weight="medium" style={styles.featureTitle}>Real-time analytics and insights</Text>
              <Text weight="medium" style={styles.featureDescription}>
                Track what matters most. Revenue insights, booking trends, and customer data in easy-to-read reports.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            {renderCheckmark()}
            <View style={styles.featureContent}>
              <Text weight="medium" style={styles.featureTitle}>Glitfinder discovery platform</Text>
              <Text weight="medium" style={styles.featureDescription}>
                Get discovered by new customers. Upload your work, gain followers, and drive traffic to your business.
              </Text>
            </View>
          </View>
        </View>

        {/* Pricing Options */}
        {renderPricingCards()}

      </ScrollView>
      
      {/* Fixed CTA Button */}
      <View style={styles.fixedButtonContainer}>
        <Button
          title={"Start a 7-day free trial"}
          onPress={subscribeToPlan}
          style={styles.ctaButton}
          disabled={!selectedPlan}
          loading={userCountryCode === 'GB' ? isCreatingSubscription : isAcceptingSubscription}
        />
      </View>
    </SafeAreaView>
  );

  const renderCommissionTemplate = () => (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Commission Details */}
        <View style={styles.commissionContainer}>
          <Text weight='semiBold' style={styles.commissionTitle}>Commission details</Text>
          <Text weight='medium' style={styles.commissionDescription}>
            After your trial ends, a small commission of 5%-12% per transaction based on your category is applied
          </Text>
          <View style={styles.commissionDetails}>
            <Text weight='medium' style={styles.commissionDetail}>Billed after every earning</Text>
            {/* <Text weight='medium' style={styles.commissionDetail}>Renew on July 25, 2026</Text> */}
          </View>
        </View>

        {/* Main Pricing Proposition */}
        <View style={styles.pricingProposition}>
         <Text weight="lora" style={styles.pricingTitle}>No monthly fees. Only pay when you earn.</Text>
          <Text weight="medium" style={styles.pricingDescription}>
            Try Glitbase with 0% commission for 30 days. After that, we take a small cut — only 5-12% per booking or sale, depending on your service type.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            {renderCheckmark()}
            <View style={styles.featureContent}>
              <Text weight="medium" style={styles.featureTitle}>Unlimited bookings & scheduling</Text>
              <Text weight="medium" style={styles.featureDescription}>
                Handle all appointments with ease. Calendar integration, automated reminders, and flexible scheduling options.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            {renderCheckmark()}
            <View style={styles.featureContent}>
              <Text weight="medium" style={styles.featureTitle}>Real-time analytics and insights</Text>
              <Text weight="medium" style={styles.featureDescription}>
                Track what matters most. Revenue insights, booking trends, and customer data in easy-to-read reports.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            {renderCheckmark()}
            <View style={styles.featureContent}>
              <Text weight="medium" style={styles.featureTitle}>Glitfinder discovery platform</Text>
              <Text weight="medium" style={styles.featureDescription}>
              Get discovered by new customers. Upload your work, gain followers, and drive traffic to your business.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={{paddingBottom: 40}} />
      
      {/* Fixed CTA Button */}
      <View style={styles.fixedButtonContainer}>
        <Button
          title="Start free - 0% commission for 30 days"
          onPress={handleStartTrial}
          style={styles.ctaButton}
          disabled={!selectedPlan}
          loading={isAcceptingSubscription}
        />
        <Text weight="medium" style={styles.ctaSubtext}>Pay only when you earn.</Text>
      </View>
    </SafeAreaView>
  );

  return userCountryCode === 'GB' ? renderMonthlyYearlyTemplate() : renderCommissionTemplate();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  restoreButton: {
    padding: 8,
  },
  restoreText: {
    fontSize: 16,
    color: colors.secondary,
    fontWeight: '500',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 100, // Add padding to prevent content from being hidden behind fixed button
  },
  title: {
    fontSize: 28,
    color: colors.textDark,
    marginBottom: 12,
    letterSpacing: -0.7,
    maxWidth: '90%',
    lineHeight: 34,
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  checkmarkText: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: 'bold',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 17,
    color: colors.textGray,
    lineHeight: 24,
  },
  pricingContainer: {
    flexDirection: 'row',
    marginBottom: 40,
    marginTop: 20,
    gap: 16,
  },
  pricingOption: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    backgroundColor: colors.lightGray,
    position: 'relative',
  },
  selectedPricingOption: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondaryLight,
    borderWidth: 2,
  },
  savingsBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsText: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: 'bold',
  },
  pricingLabel: {
    fontSize: 16,
    color: colors.darkGray,
    marginBottom: 8,
  },
  pricingAmount: {
    fontSize: 20,
    color: colors.darkGray,
  },
  commissionContainer: {
    marginBottom: 32,
  },
  commissionTitle: {
    fontSize: 21,
    color: colors.textDark,
    marginBottom: 12,
  },
  commissionDescription: {
    fontSize: 17,
    maxWidth: '90%',
    color: colors.textDark,
    lineHeight: 24,
    marginBottom: 16,
  },
  commissionDetails: {
    gap: 4,
    marginTop: 16,
  },
  commissionDetail: {
    fontSize:17,
    color: colors.textGray,
  },
  pricingProposition: {
    marginBottom: 32,
  },
  pricingTitle: {
    fontSize: 28,
    color: colors.textDark,
    marginBottom: 12,
    letterSpacing: -0.7,
    maxWidth: '90%',
    lineHeight: 34,
  },
  pricingDescription: {
    fontSize:17,
    color: colors.textGray,
    lineHeight: 24,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 34,
  },
  ctaButton: {
    marginBottom: 12,
  },
  ctaSubtext: {
    fontSize: 16,
    color: colors.textDark,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default SubscriptionSetup;
