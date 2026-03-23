import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, Image, Animated, Pressable, RefreshControl } from 'react-native';
import Text from '../../components/Text';
import { bookingTypes, colors } from '../../utils/constants';
import { useRoute, useNavigation, RouteProp, NavigationProp } from '@react-navigation/native';
import { useGetBookingByReferenceQuery, useCompleteBookingCustomerMutation, useCancelBookingMutation } from '../../services/bookingsApi';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../../contexts/ToastContext';
import GoBack from '../../components/GoBack';
import Button from '../../components/Button';
import { CalendarDays, MapPin } from 'lucide-react-native';
import { getCurrencySymbol } from '../../utils/helper';
import CustomModal from '../../components/Modal';

type BookingDetailsRouteProp = RouteProp<{ params: { bookingReference: string } }, 'params'>;

type RootStackParamList = {
  BookingRating: { bookingReference: string; store: any };
};

const BookingDetails = () => {
  const route = useRoute<BookingDetailsRouteProp>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { bookingReference } = route.params;
  const { showToast } = useToast();

  const { data, isLoading, error, refetch, isFetching } = useGetBookingByReferenceQuery(bookingReference, {
    refetchOnMountOrArgChange: true,
  });
  const booking = data?.data?.booking;

  const [completeBookingCustomer, { isLoading: isCompleting }] = useCompleteBookingCustomerMutation();
  const [cancelBooking, { isLoading: isCancelling }] = useCancelBookingMutation();

  const [isAdditionalInfoExpanded, setIsAdditionalInfoExpanded] = useState(false);
  const accordionAnimation = useRef(new Animated.Value(0)).current;
  const shimmerAnimation = useRef(new Animated.Value(0)).current;
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const timelineScrollRef = useRef<any>(null);
  const timelineStepRefs = useRef<any>({});

  const handleGoBack = () => {
    (navigation as any).navigate('Activity');
  };

  const handleCompleteBooking = async () => {
    try {
      await completeBookingCustomer(bookingReference).unwrap();
      showToast({
        message: 'Service completion confirmed',
        type: 'success',
      });
      navigation.navigate('BookingRating', { bookingReference, store: booking?.store });
    } catch (err: any) {
      showToast({
        message: err?.data?.message || 'Failed to confirm completion',
        type: 'error',
      });
    }
  };

  const handleCancelBooking = async () => {
    try {
      await cancelBooking({
        bookingId: bookingReference,
        reason: 'No longer needed'
      }).unwrap();
      showToast({
        message: 'Booking cancelled successfully',
        type: 'success',
      });
      setCancelModalVisible(false);
      // Navigate back to bookings list
      (navigation as any).navigate('Activity');
    } catch (err: any) {
      showToast({
        message: err?.data?.message || 'Failed to cancel booking',
        type: 'error',
      });
    }
  };

  const toggleAdditionalInfo = () => {
    const toValue = isAdditionalInfoExpanded ? 0 : 1;
    Animated.timing(accordionAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsAdditionalInfoExpanded(!isAdditionalInfoExpanded);
  };

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isLoading, shimmerAnimation]);

  const shimmerOpacity = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTimelineDate = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();

    // Check if it's today
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
      // Format as time (e.g., "2:45pm")
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).toLowerCase();
    } else {
      // Format as date
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}hr`;
    }
    return `${hours}hr ${remainingMinutes}min`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#D4AF37';
      case 'confirmed':
        return '#4CAF50';
      case 'in_progress':
        return '#2196F3';
      case 'completed':
        return '#8BC34A';
      case 'cancelled':
      case 'rejected':
        return '#F44336';
      case 'refunded':
        return '#9E9E9E';
      default:
        return colors.textGray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Awaiting Confirmation';
      case 'confirmed':
        return 'Confirmed';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'rejected':
        return 'Rejected';
      case 'refunded':
        return 'Refunded';
      default:
        return status;
    }
  };

  const getTimelineSteps = () => {
    if (!booking) return [];

    const serviceType = booking.serviceType;
    const stage = booking.bookingStage || 'pending';
    const stageHistory = booking.stageHistory || [];

    // Helper function to get timestamp from stageHistory
    const getStageTimestamp = (stageName: string) => {
      const historyEntry = stageHistory.find(h => h.stage === stageName);
      return historyEntry?.timestamp || null;
    };

    // Calculate these once for all service types
    const serviceDateStr = booking.serviceDate.split('T')[0]; // YYYY-MM-DD
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

    const isToday = serviceDateStr === todayStr;
    const isPastServiceDate = serviceDateStr < todayStr;
    const isWithin24Hours = !isPastServiceDate; // Show if today or in the future
    const isRejected = booking.status === 'rejected';
    const isCancelled = booking.status === 'cancelled';


    // Handle 'normal' service type as in-store
    if (serviceType === 'normal') {

      return [
        {
          label: 'Pending',
          subtitle: 'Booking is awaiting confirmation',
          stage: 'pending',
          date: getStageTimestamp('pending') || booking.createdAt,
          completed: true
        },
        ...(isRejected ? [{
          label: 'Booking rejected',
          subtitle: 'Your appointment has been rejected',
          stage: 'rejected',
          date: getStageTimestamp('rejected') || booking.updatedAt,
          completed: true,
          isRejected: true
        }] : isCancelled ? [{
          label: 'Booking cancelled',
          subtitle: 'You cancelled this appointment',
          stage: 'cancelled',
          date: getStageTimestamp('cancelled') || booking.updatedAt,
          completed: true,
          isCancelled: true
        }] : [{
          label: 'Booking confirmed',
          subtitle: 'Your appointment has been accepted',
          stage: 'confirmed',
          date: getStageTimestamp('confirmed'),
          completed: ['confirmed', 'readyToServe', 'inProgress', 'completed'].includes(stage)
        }]),
        {
          label: 'Preparation reminder',
          subtitle: 'Your provider is getting ready',
          stage: 'preparation',
          date: null,
          completed: ['confirmed', 'readyToServe', 'inProgress', 'completed'].includes(stage)
        },
        {
          label: 'Day of service',
          subtitle: 'Your appointment is today!',
          stage: 'dayOfService',
          date: null,
          completed: ['confirmed', 'readyToServe', 'inProgress', 'completed'].includes(stage) && (isToday || isPastServiceDate)
        },
        {
          label: 'Ready to serve',
          subtitle: "We're all set! Please check in at arrival",
          stage: 'readyToServe',
          date: getStageTimestamp('readyToServe'),
          completed: ['readyToServe', 'inProgress', 'completed'].includes(stage)
        },
        {
          label: 'Service in progress',
          subtitle: 'Your service is currently underway',
          stage: 'inProgress',
          date: getStageTimestamp('inProgress'),
          completed: ['inProgress', 'completed'].includes(stage)
        },
        {
          label: 'Service completed',
          subtitle: 'Your service has been completed',
          stage: 'completed',
          date: getStageTimestamp('completed') || booking.completedAt,
          completed: stage === 'completed'
        },
      ];
    } else if (serviceType === 'home') {
      return [
        {
          label: 'Pending',
          subtitle: 'Awaiting confirmation',
          stage: 'pending',
          date: getStageTimestamp('pending') || booking.createdAt,
          completed: true
        },
        ...(isRejected ? [{
          label: 'Booking rejected',
          subtitle: 'Your booking was not accepted',
          stage: 'rejected',
          date: getStageTimestamp('rejected') || booking.updatedAt,
          completed: true,
          isRejected: true
        }] : isCancelled ? [{
          label: 'Booking cancelled',
          subtitle: 'You cancelled this booking',
          stage: 'cancelled',
          date: getStageTimestamp('cancelled') || booking.updatedAt,
          completed: true,
          isCancelled: true
        }] : [{
          label: 'Confirmed',
          subtitle: 'Your appointment has been accepted',
          stage: 'confirmed',
          date: getStageTimestamp('confirmed'),
          completed: ['confirmed', 'vendorEnroute', 'vendorArrived', 'inProgress', 'completed'].includes(stage)
        }]),
        {
          label: 'Preparation reminder',
          subtitle: 'Your provider is getting ready',
          stage: 'preparation',
          date: null,
          completed: ['confirmed', 'vendorEnroute', 'vendorArrived', 'inProgress', 'completed'].includes(stage)
        },
        {
          label: 'Day of service',
          subtitle: 'Your appointment is today!',
          stage: 'dayOfService',
          date: null,
          completed: ['confirmed', 'vendorEnroute', 'vendorArrived', 'inProgress', 'completed'].includes(stage) && (isToday || isPastServiceDate)
        },
        {
          label: 'Vendor Enroute',
          subtitle: 'Your provider is on the way',
          stage: 'vendorEnroute',
          date: getStageTimestamp('vendorEnroute'),
          completed: ['vendorEnroute', 'vendorArrived', 'inProgress', 'completed'].includes(stage)
        },
        {
          label: 'Vendor Arrived',
          subtitle: 'Your provider has arrived',
          stage: 'vendorArrived',
          date: getStageTimestamp('vendorArrived'),
          completed: ['vendorArrived', 'inProgress', 'completed'].includes(stage)
        },
        {
          label: 'In Progress',
          subtitle: 'Your service is currently underway',
          stage: 'inProgress',
          date: getStageTimestamp('inProgress'),
          completed: ['inProgress', 'completed'].includes(stage)
        },
        {
          label: 'Completed',
          subtitle: 'Your service has been completed',
          stage: 'completed',
          date: getStageTimestamp('completed') || booking.completedAt,
          completed: stage === 'completed'
        },
      ];
    } else if (serviceType === 'pickDrop') {
      return [
        {
          label: 'Pending',
          subtitle: 'Awaiting confirmation',
          stage: 'pending',
          date: getStageTimestamp('pending') || booking.createdAt,
          completed: true
        },
        ...(isRejected ? [{
          label: 'Booking rejected',
          subtitle: 'Your booking was not accepted',
          stage: 'rejected',
          date: getStageTimestamp('rejected') || booking.updatedAt,
          completed: true,
          isRejected: true
        }] : isCancelled ? [{
          label: 'Booking cancelled',
          subtitle: 'You cancelled this booking',
          stage: 'cancelled',
          date: getStageTimestamp('cancelled') || booking.updatedAt,
          completed: true,
          isCancelled: true
        }] : [{
          label: 'Drop-off scheduled',
          subtitle: 'Your drop-off appointment is confirmed',
          stage: 'confirmed',
          date: getStageTimestamp('confirmed'),
          completed: ['confirmed', 'itemReceived', 'inProgress', 'readyForPickup', 'completed'].includes(stage)
        }]),
        {
          label: 'Preparation reminder',
          subtitle: 'Your provider is getting ready',
          stage: 'preparation',
          date: null,
          completed: ['confirmed', 'itemReceived', 'inProgress', 'readyForPickup', 'completed'].includes(stage)
        },
        {
          label: 'Day of service',
          subtitle: 'Your appointment is today!',
          stage: 'dayOfService',
          date: null,
          completed: ['confirmed', 'itemReceived', 'inProgress', 'readyForPickup', 'completed'].includes(stage) && (isToday || isPastServiceDate)
        },
        {
          label: 'Item received',
          subtitle: "We've received your items and work has begun",
          stage: 'itemReceived',
          date: getStageTimestamp('itemReceived'),
          completed: ['itemReceived', 'inProgress', 'readyForPickup', 'completed'].includes(stage)
        },
        {
          label: 'Work in progress',
          subtitle: 'Your items are being processed.',
          stage: 'inProgress',
          date: getStageTimestamp('inProgress'),
          completed: ['inProgress', 'readyForPickup', 'completed'].includes(stage)
        },
        {
          label: 'Ready for collection',
          subtitle: 'Collect during your scheduled pickup slot.',
          stage: 'readyForPickup',
          date: getStageTimestamp('readyForPickup'),
          completed: ['readyForPickup', 'completed'].includes(stage)
        },
        {
          label: 'Service completed',
          subtitle: 'Items collected successfully',
          stage: 'completed',
          date: getStageTimestamp('completed') || booking.completedAt,
          completed: stage === 'completed'
        },
      ];
    }

    return [];
  };

  // Auto-scroll timeline to last active step
  useEffect(() => {
    if (!booking) return;

    const timelineSteps = getTimelineSteps();
    const lastActiveIndex = timelineSteps.reduce((lastIndex, step, index) => {
      return step.completed ? index : lastIndex;
    }, 0);

    if (timelineScrollRef.current && timelineStepRefs.current[lastActiveIndex]) {
      setTimeout(() => {
        timelineStepRefs.current[lastActiveIndex]?.measureLayout(
          timelineScrollRef.current,
          (x: number, y: number) => {
            timelineScrollRef.current?.scrollTo({ y: Math.max(0, y - 50), animated: true });
          },
          () => {}
        );
      }, 300);
    }
  }, [booking?.bookingStage]);

  const renderTimeline = () => {
    if (!booking) {
      return null;
    }

    const timelineSteps = getTimelineSteps();

    if (timelineSteps.length === 0) {
      return null;
    }

    return (
      <ScrollView ref={timelineScrollRef} style={styles.timelineContainer} showsVerticalScrollIndicator={false}>
        {timelineSteps.map((step, index) => {
          return (
            <View
              key={index}
              ref={(ref) => (timelineStepRefs.current[index] = ref)}
              style={styles.timelineStep}>
              <View style={styles.timelineIndicator}>
                <View style={[
                  index === 0 ? styles.timelineLineTopFirst : styles.timelineLineTop,
                  step.completed && styles.timelineLineCompleted,
                  step.isRejected && styles.timelineLineRejected,
                  step.isCancelled && styles.timelineLineCancelled
                ]} />
                <View style={[styles.timelineDot, step.completed && styles.timelineDotCompleted, step.isRejected && styles.timelineDotRejected, step.isCancelled && styles.timelineDotCancelled]}>
                  {step.completed && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                </View>
              </View>
            <View style={[styles.timelineContent, {paddingTop: index === 0 ? 19 : 2, borderBottomWidth: index === timelineSteps.length - 1 ? 0 : 1, borderColor: '#F0F0F0', paddingBottom: index === timelineSteps.length - 1 ? 8 : 20,}]}>
              <View style={styles.timelineTextContainer}>
                <View>
                  <Text weight="medium" style={[styles.timelineLabel, step.completed && styles.timelineLabelCompleted, step.isRejected && styles.timelineLabelRejected, step.isCancelled && styles.timelineLabelCancelled]}>
                    {step.label}
                  </Text>
                  <Text weight="medium" style={[styles.timelineSubtitle, step.completed && styles.timelineSubtitleCompleted]}>
                    {step.subtitle}
                  </Text>
                </View>
                {step.date && (
                  <Text weight="medium" style={styles.timelineDate}>
                    {formatTimelineDate(step.date)}
                  </Text>
                )}
              </View>
            </View>
          </View>
          );
        })}
      </ScrollView>
    );
  };

  const SkeletonBox = ({ width, height, style }: { width: number | string; height: number; style?: any }) => (
    <Animated.View
      style={[
        styles.skeletonBox,
        { width, height, opacity: shimmerOpacity },
        style,
      ]}
    />
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header Skeleton */}
          <View style={styles.header}>
            <GoBack goBack={handleGoBack} />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
              <View style={{ flex: 1 }}>
                <SkeletonBox width="70%" height={20} style={{ marginBottom: 10 }} />
                <SkeletonBox width="40%" height={16} />
              </View>
              <SkeletonBox width={50} height={50} style={{ borderRadius: 8 }} />
            </View>
          </View>

          {/* Store Section Skeleton */}
          <View style={styles.storeSection}>
            <SkeletonBox width={100} height={100} style={{ borderRadius: 16, marginBottom: 16 }} />
            <SkeletonBox width="60%" height={24} style={{ marginBottom: 8 }} />
            <SkeletonBox width={120} height={32} style={{ borderRadius: 20 }} />
          </View>

          {/* Booking Info Skeleton */}
          <View style={styles.section}>
            <SkeletonBox width="40%" height={20} style={{ marginBottom: 16 }} />
            <View style={{ marginBottom: 12 }}>
              <SkeletonBox width="100%" height={16} />
            </View>
            <View style={{ marginBottom: 12 }}>
              <SkeletonBox width="100%" height={16} />
            </View>
            <View style={{ marginBottom: 12 }}>
              <SkeletonBox width="100%" height={16} />
            </View>
          </View>

          {/* Timeline Skeleton */}
          <View style={styles.section}>
            <SkeletonBox width="40%" height={20} style={{ marginBottom: 16 }} />
            {[1, 2, 3, 4].map((item) => (
              <View key={item} style={{ flexDirection: 'row', marginBottom: 20 }}>
                <SkeletonBox width={24} height={24} style={{ borderRadius: 12, marginRight: 16 }} />
                <View style={{ flex: 1 }}>
                  <SkeletonBox width="50%" height={16} style={{ marginBottom: 6 }} />
                  <SkeletonBox width="30%" height={14} />
                </View>
              </View>
            ))}
          </View>

          {/* Services Skeleton */}
          <View style={styles.section}>
            <SkeletonBox width="40%" height={20} style={{ marginBottom: 16 }} />
            {[1, 2].map((item) => (
              <View key={item} style={{ marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.lightGray }}>
                <SkeletonBox width="70%" height={16} style={{ marginBottom: 8 }} />
                <SkeletonBox width="50%" height={14} />
              </View>
            ))}
          </View>

          {/* Payment Details Skeleton */}
          <View style={styles.section}>
            <SkeletonBox width="40%" height={20} style={{ marginBottom: 16 }} />
            <View style={{ marginBottom: 12 }}>
              <SkeletonBox width="100%" height={16} />
            </View>
            <View style={{ marginBottom: 12 }}>
              <SkeletonBox width="100%" height={16} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error || !booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text weight="lora" style={styles.errorTitle}>Booking Not Found</Text>
          <Text weight="medium" style={styles.errorText}>Unable to load booking details.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const onRefresh = () => {
    refetch();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <GoBack goBack={handleGoBack} />
          <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 20}}>
            <View>
              <Text weight="semiBold" style={styles.headerTitle}>Booking with {booking.store.name}</Text>
              <Text weight="medium" style={styles.headerSubtitle}>#{booking.bookingReference}</Text>
            </View>
            <Image
              source={require('../../../assets/pngs/icon.png')}
              style={styles.headerImage}
            />
          </View>
        </View>

        {/* Timeline */}
        <View style={[styles.section, {borderTopWidth: 1, borderBottomWidth: 1, borderTopColor: '#F0F0F0', borderBottomColor: '#F0F0F0', marginTop: 6}]}>
          {renderTimeline()}
        </View>

        {(!booking.customerMarkedComplete && booking.status === 'completed') &&
          <View style={{marginTop: 24, paddingHorizontal: 16}}>
            <Button
              title='Confirm service completion'
              onPress={handleCompleteBooking}
              loading={isCompleting}
              disabled={isCompleting}
              style={{ paddingHorizontal: 16, paddingVertical: 8 }}
            />
          </View>
          }

        {/* Service type & Location */}
        <View style={styles.serviceLocationSection}>
          <View style={styles.serviceLocationContent}>
            <Text weight='medium' style={[styles.serviceTypeText, {marginBottom: 16}]}>{bookingTypes?.find(i => i?.value === booking.serviceType)?.label}</Text>
            <View style={styles.locationRow}>
            <CalendarDays size={15} color={colors.secondary} strokeWidth={3} style={{marginRight: 7, marginTop: 1}} />
            <Text weight='medium' style={styles.locationText} numberOfLines={1}>
                {formatDate(booking.serviceDate)} • {booking.serviceTime}
              </Text>
            </View>
            <View style={[styles.locationRow, {marginTop: 16}]}>
            <MapPin size={16} color={colors.secondary} strokeWidth={3} style={{marginRight: 6, marginTop: 1}} />
              {booking?.serviceType === 'normal' ?
              <Text weight='medium' style={styles.locationText} numberOfLines={2}>
                {booking?.store.location?.address}, {booking?.store.location?.city}.
              </Text>
              :
              booking?.serviceType === 'home' ?
              <Text weight='medium' style={styles.locationText} numberOfLines={2}>
                {booking?.homeServiceAddress?.apartment && booking?.homeServiceAddress?.apartment}, {booking?.homeServiceAddress?.address}, {booking?.homeServiceAddress?.city}.
              </Text>
              :
              booking?.pickupInfo?.address?.address ?
              <>
                <Text weight='medium' style={styles.locationText} numberOfLines={2}>
                  Pick-up: {booking?.pickupInfo?.address?.apartment && `${booking?.pickupInfo?.address?.apartment}, `} {booking?.pickupInfo?.address?.address}, {booking?.pickupInfo?.address?.city}.
                </Text>
                <Text weight='medium' style={styles.locationText} numberOfLines={2}>
                  Drop-off: {booking?.dropoffInfo?.address?.apartment && `${booking?.dropoffInfo?.address?.apartment}, `} {booking?.dropoffInfo?.address?.address}, {booking?.pickupInfo?.address?.city}.
                </Text>
              </>
              :
              <Text weight='medium' style={styles.locationText} numberOfLines={2}>{booking?.store.location?.address}, {booking?.store.location?.city}.</Text>
              }
            
            </View>
          </View>
          {(() => {
            // Parse dates without timezone shift
            const serviceDateStr = booking.serviceDate.split('T')[0]; // YYYY-MM-DD
            const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
            const isBeforeServiceDate = todayStr < serviceDateStr;
            const canCancel = (isBeforeServiceDate || booking.status === 'pending') && !['cancelled', 'rejected', 'completed'].includes(booking.status);

            return canCancel && (
              <View>
                <Button title='Cancel' onPress={() => setCancelModalVisible(true)} variant='dangerAlt' width='auto' style={{ paddingHorizontal: 16, paddingVertical: 8 }} />
              </View>
            );
          })()}
          {(booking.customerMarkedComplete && booking.vendorMarkedComplete && booking.status === 'completed') &&
          <View>
            <Button
              title='Rate service'
              onPress={() => (navigation as any).navigate('BookingRating', { bookingReference: booking.bookingReference, store: booking.store })}
              variant='ghostgray'
              width='auto'
              style={{ paddingHorizontal: 16, paddingVertical: 8 }}
            />
          </View>
          }
        </View>

        {/* Services */}
        <View style={[styles.section, { marginTop: 6 }]}>
          <Text weight="medium" style={styles.serviceTypeText}>Service details</Text>
          {booking.items.map((item, index) => (
            <View key={index} style={styles.serviceItem}>
              {/* Service Image */}
              <View style={styles.serviceImageContainer}>
                {item.service.imageUrl ? (
                  <Image
                    source={{ uri: item.service.imageUrl }}
                    style={styles.serviceImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.serviceImagePlaceholder}>
                    <Ionicons name="cube-outline" size={20} color={colors.textGray} />
                  </View>
                )}
              </View>

              <View style={styles.serviceInfo}>
                <Text weight="medium" style={styles.serviceName}>{item.service.name}</Text>
                <Text weight="medium" style={styles.serviceDetail}>
                  {formatDuration(item.totalDuration)}
                </Text>
                {item.addOns && item.addOns.length > 0 && (
                  <View style={styles.addOnsContainer}>
                    {/* <Text weight="medium" style={styles.addOnsLabel}>Add-ons:</Text> */}
                    {item.addOns.map((addOn, idx) => (
                      <Text key={idx} weight="medium" style={styles.addOnText}>
                        + {addOn.name}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
              <Text weight="semiBold" style={styles.servicePrice}>
                {getCurrencySymbol(booking.pricing.currency)}{item.subtotal.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* Address */}
        {booking.homeServiceAddress && (
          <View style={[styles.section, { marginBottom: 12, marginTop: 12 }]}>
            <Text weight="medium" style={styles.serviceTypeText}>Service Address</Text>
            <Text weight="medium" style={styles.addressText}>
              {booking.homeServiceAddress.apartment && `${booking.homeServiceAddress.apartment}, `}
              {booking.homeServiceAddress.address}, {booking.homeServiceAddress.city}.
            </Text>
            {booking.homeServiceAddress.additionalDirections && (
              <Text weight="medium" style={styles.directionsText}>
                {booking.homeServiceAddress.additionalDirections}
              </Text>
            )}
          </View>
        )}

        {/* Additional Information Accordion */}
        {(booking.additionalInfo?.notes || (booking.additionalInfo?.images && booking.additionalInfo.images.length > 0)) && (
          <View style={styles.accordionSection}>
            <Pressable
              style={styles.accordionHeader}
              onPress={toggleAdditionalInfo}
            >
              <Text weight="medium" style={styles.serviceTypeText}>Additional Information</Text>
              <Animated.View
                style={{
                  transform: [{
                    rotate: accordionAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '180deg'],
                    }),
                  }],
                }}
              >
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={colors.textDark}
                  style={{marginTop: -6}}
                />
              </Animated.View>
            </Pressable>

            <Animated.View
              style={[
                styles.accordionContent,
                {
                  maxHeight: accordionAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1000],
                  }),
                  opacity: accordionAnimation,
                  overflow: 'hidden',
                  paddingBottom: isAdditionalInfoExpanded ? 16 : 0,
                },
              ]}
            >
              {/* Additional Notes */}
              {booking.additionalInfo?.notes && (
                <Text weight="medium" style={styles.notesText}>{booking.additionalInfo.notes}</Text>
              )}

              {/* Additional Images */}
              {booking.additionalInfo?.images && booking.additionalInfo.images.length > 0 && (
                <View style={[styles.imagesGrid, booking.additionalInfo?.notes && { marginTop: 16 }]}>
                  {booking.additionalInfo.images.map((imageUrl, index) => (
                    <Image
                      key={index}
                      source={{ uri: imageUrl }}
                      style={styles.additionalImage}
                      resizeMode="cover"
                    />
                  ))}
                </View>
              )}
            </Animated.View>
          </View>
        )}

        {/* Pricing */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text weight="medium" style={styles.summaryLabel}>
              Subtotal ({booking.items?.length} {booking.items?.length > 1 ? 'Items' : 'Item'})
            </Text>
            <Text weight="medium" style={styles.summaryValue}>
              {getCurrencySymbol(booking.pricing.currency)}{booking.pricing.subtotal.toLocaleString()}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text weight="medium" style={styles.summaryLabel}>
              Total Duration
            </Text>
            <Text weight="medium" style={styles.summaryValue}>
              {formatDuration(booking.pricing.totalDuration)}
            </Text>
          </View>
          {booking.pricing.remainingBalance > 0 && (
            <View style={styles.summaryRow}>
              <Text weight="medium" style={styles.summaryLabel}>
                Remaining Balance
              </Text>
              <Text weight="medium" style={styles.summaryValue}>
                {getCurrencySymbol(booking.pricing.currency)}{booking.pricing.remainingBalance.toLocaleString()}
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text weight="medium" style={styles.summaryLabel}>
              Taxes
            </Text>
            <Text weight="medium" style={styles.summaryValue}>
              {getCurrencySymbol(booking.pricing.currency)}0.00
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow, { marginBottom: 0 }]}>
            <Text weight="semiBold" style={styles.totalLabel}>
              Total Paid
            </Text>
            <Text weight="semiBold" style={styles.totalValue}>
              {getCurrencySymbol(booking.pricing.currency)}{booking.pricing.amountPaid.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Contact Info */}
        {/* {booking.contactInfo && (
          <View style={styles.section}>
            <Text weight="lora" style={styles.sectionTitle}>Contact Information</Text>
            <View style={styles.infoRow}>
              <Text weight="medium" style={styles.infoLabel}>Name</Text>
              <Text weight="semiBold" style={styles.infoValue}>{booking.contactInfo.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text weight="medium" style={styles.infoLabel}>Email</Text>
              <Text weight="semiBold" style={styles.infoValue}>{booking.contactInfo.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text weight="medium" style={styles.infoLabel}>Phone</Text>
              <Text weight="semiBold" style={styles.infoValue}>{booking.contactInfo.phoneNumber}</Text>
            </View>
          </View>
        )} */}
      </ScrollView>

      <CustomModal visible={cancelModalVisible} onClose={() => setCancelModalVisible(false)} position="bottom">
        <View style={styles.modalContent}>
          <Text weight="lora" style={styles.modalTitle}>Cancel booking?</Text>
          <Text weight="medium" style={styles.modalSubtitle}>This action cannot be undone. The booking will be cancelled and any payment will be refunded.</Text>
          <Button 
            title="Cancel booking" 
            variant="danger" 
            style={{marginTop: 12}} 
            onPress={handleCancelBooking}
            loading={isCancelling}
            disabled={isCancelling}
          />
          {/* <Button title="Reschedule instead" variant='ghostgray' style={{marginTop: 12}} onPress={() => setCancelModalVisible(false)} /> */}
        </View>
      </CustomModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.textLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    color: colors.textDark,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: colors.textGray,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    color: colors.textDark,
  },
  headerSubtitle: {
    color: colors.textGray,
    marginTop: 8
  },
  headerImage: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
    marginLeft: 'auto',
  },
  storeSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  storeBanner: {
    width: 100,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerPlaceholderText: {
    fontSize: 36,
    color: colors.textGray,
  },
  storeName: {
    fontSize: 24,
    color: colors.textDark,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
  },
  statusText: {
    fontSize: 14,
  },
  section: {
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: colors.textDark,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textGray,
  },
  infoValue: {
    fontSize: 14,
    color: colors.textDark,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  timelineContainer: {
    paddingHorizontal: 8,
    height: 400,
  },
  timelineStep: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 10,
  },
  timelineIndicator: {
    alignItems: 'center',
    marginRight: 16,
    paddingTop: -12,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 12,
    borderWidth: 1.6,
    borderColor: '#CECECE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineDotCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  timelineDotRejected: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  timelineDotCancelled: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  timelineLineTop: {
    width: 1.6,
    height: 50,
    backgroundColor: "#F0F0F0",
    marginBottom: 4,
    marginTop: -40
  },
  timelineLineTopFirst: {
    width: 1.6,
    height: 30,
    backgroundColor: colors.lightGray,
    marginBottom: 4,
  },
  timelineLineCompleted: {
    backgroundColor: colors.success,
  },
  timelineLineRejected: {
    backgroundColor: colors.error,
  },
  timelineLineCancelled: {
    backgroundColor: colors.error,
  },
  timelineContent: {
    flex: 1,
    marginBottom: 8,
  },
  timelineTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  timelineLabel: {
    fontSize: 17,
    color: colors.textGray,
    marginBottom: 4,
  },
  timelineLabelCompleted: {
    color: colors.success,
  },
  timelineLabelRejected: {
    color: colors.error,
  },
  timelineLabelCancelled: {
    color: colors.error,
  },
  timelineSubtitle: {
    fontSize: 15,
    color: colors.mediumGray,
    marginTop: 2,
  },
  timelineSubtitleCompleted: {
    color: colors.darkGray,
  },
  timelineDate: {
    fontSize: 15,
    color: colors.mediumGray,
  },
  serviceLocationSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  serviceLocationContent: {
    flex: 1,
    marginRight: 16,
  },
  serviceTypeText: {
    fontSize: 17,
    color: colors.textDark,
    marginBottom: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationText: {
    fontSize: 15,
    color: colors.textDark,
    flex: 1,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    marginTop: 8,
    paddingBottom: 16,
  },
  serviceImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  serviceImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
    marginRight: 16,
  },
  serviceName: {
    fontSize: 15,
    color: colors.textDark,
    marginBottom: 4,
  },
  serviceDetail: {
    fontSize: 15,
    color: colors.mediumGray,
  },
  addOnsContainer: {
    marginTop: 4,
  },
  addOnsLabel: {
    fontSize: 13,
    color: colors.textGray,
    marginBottom: 4,
  },
  addOnText: {
    fontSize: 12,
    color: colors.textGray,
  },
  servicePrice: {
    fontSize: 14,
    color: colors.textDark,
    marginTop: -20
  },
  addressText: {
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 20,
  },
  directionsText: {
    fontSize: 13,
    color: colors.textGray,
    marginTop: 8,
    fontStyle: 'italic',
  },
  notesText: {
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 20,
  },
  accordionSection: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  accordionContent: {
    paddingBottom: 0,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  additionalImage: {
    width: '15%',
    height: 60,
    borderRadius: 12,
    backgroundColor: colors.lightGray,
  },
  summarySection: {
    marginTop: 8,
    marginHorizontal: 16,
    backgroundColor: colors.lightGray,
    padding: 16,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    borderTopColor: '#F0F0F0',
  },
  totalLabel: {
    color: colors.textDark,
  },
  totalValue: {
    color: colors.textDark,
  },
  skeletonBox: {
    backgroundColor: colors.lightGray,
    borderRadius: 4,
  },
  modalContent: {
    padding: 0,
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: 24,
    color: colors.textDark,
    textAlign: 'center',
    letterSpacing: -0.5
  },
  modalSubtitle: {
    fontSize: 16,
    color: colors.textGray,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
});

export default BookingDetails;
