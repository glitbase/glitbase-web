import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, FlatList, Image, TouchableOpacity, ScrollView, Animated } from 'react-native';
import Text from '../../components/Text';
import ProgressBar from '../../components/ProgressBar';
import { colors } from '../../utils/constants';
import { useGetUserBookingsQuery } from '../../services/bookingsApi';
import type { Booking } from '../../services/bookingsApi';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { addToCart, updateCartItemQuantity } from '../../store/cartSlice';
import type { Service, ServiceAddOn } from '../../services/servicesApi';

const Bookings = () => {
  const [activeTab, setActiveTab] = useState(0);
  const navigation = useNavigation();
  const dispatch = useDispatch();

  // Fetch bookings based on active tab
  const tabStatusMap: Record<number, string | undefined> = {
    0: undefined, // All bookings
    1: 'pending',
    2: 'ongoing',
    3: 'completed',
    4: 'rejected',
  };

  const { data, isLoading, error } = useGetUserBookingsQuery(
    {
      ...(tabStatusMap[activeTab] && { status: tabStatusMap[activeTab] }),
    },
    {
      refetchOnMountOrArgChange: true,
    }
  );

  const bookings = data?.data?.bookings || [];

  const tabs = [
    { title: 'All bookings', type: 'all' as const },
    { title: 'Pending', type: 'pending' as const },
    { title: 'Ongoing', type: 'ongoing' as const },
    { title: 'Completed', type: 'completed' as const },
    { title: 'Rejected', type: 'rejected' as const },
  ];

  const shimmerAnimation = useRef(new Animated.Value(0)).current;

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

  const renderEmptyState = (type: 'all' | 'pending' | 'ongoing' | 'completed' | 'rejected') => {
    const emptyStateConfig = {
      all: {
        title: 'No bookings yet',
        subtitle: 'Your bookings will appear here once you schedule your first service.',
      },
      pending: {
        title: 'No pending bookings',
        subtitle: 'Your booking requests will appear here once you schedule your first service.',
      },
      ongoing: {
        title: 'No ongoing bookings',
        subtitle: 'Bookings currently in progress will show up here',
      },
      completed: {
        title: 'No completed bookings',
        subtitle: 'Your booking history will be displayed here',
      },
      rejected: {
        title: 'No rejected bookings',
        subtitle: 'Cancelled or rejected bookings will appear here',
      },
    };

    const config = emptyStateConfig[type];

    return (
      <View style={styles.emptyContainer}>
        <Text weight="lora" style={styles.emptyTitle}>
          {config.title}
        </Text>
        <Text weight="medium" style={styles.emptySubtitle}>
          {config.subtitle}
        </Text>
      </View>
    );
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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

  const renderSkeletonItem = () => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingContent}>
        <SkeletonBox width={80} height={80} style={{ borderRadius: 12, marginRight: 12 }} />
        <View style={styles.storeInfo}>
          <SkeletonBox width="70%" height={18} style={{ marginBottom: 12 }} />
          <SkeletonBox width="50%" height={14} />
        </View>
      </View>
    </View>
  );

  const getBookingStageText = (stage: string) => {
    const stageMap: Record<string, string> = {
      pending: 'Awaiting confirmation',
      confirmed: 'Booking confirmed',
      readyToServe: 'Ready to serve',
      vendorEnroute: 'Vendor en route',
      vendorArrived: 'Vendor arrived',
      itemReceived: 'Item received',
      inProgress: 'In progress',
      readyForPickup: 'Ready for pickup',
      completed: 'Completed',
    };
    return stageMap[stage] || stage;
  };

  const getBookingStageProgress = (stage: string) => {
    const progressMap: Record<string, number> = {
      pending: 10,
      confirmed: 20,
      readyToServe: 30,
      vendorEnroute: 40,
      vendorArrived: 50,
      itemReceived: 60,
      inProgress: 70,
      readyForPickup: 85,
      completed: 100,
    };
    return progressMap[stage] || 0;
  };

  const renderBookingItem = ({ item }: { item: Booking }) => {
    const handlePress = () => {
      (navigation as any).navigate('BookingDetails', { bookingReference: item.bookingReference });
    };

    const handleRebook = () => {
      // Add booking services to cart
      if (item.items && item.items.length > 0) {
        item.items.forEach((bookingItem) => {
          // Map booking item service to Service type
          const service: Service = {
            id: bookingItem.service.id,
            name: bookingItem.service.name,
            description: bookingItem.service.description,
            type: item.serviceType ? [item.serviceType] : [],
            category: bookingItem.service.category || '',
            imageUrl: bookingItem.service.imageUrl || '',
            pricingType: 'fixed',
            maxBookingPerTimeSlot: 1,
            price: bookingItem.service.price,
            currency: bookingItem.service.currency as 'NGN' | 'GBP' | 'USD',
            durationInMinutes: bookingItem.service.durationInMinutes,
            addOns: bookingItem.addOns?.map(addOn => ({
              id: addOn.id,
              name: addOn.name,
              description: addOn.description,
              price: addOn.price,
              duration: addOn.durationInMinutes ? {
                hours: Math.floor(addOn.durationInMinutes / 60),
                minutes: addOn.durationInMinutes % 60
              } : undefined
            })) || [],
            status: 'approved',
            createdAt: '',
            updatedAt: ''
          };

          // Map addOns
          const selectedAddOns: ServiceAddOn[] = bookingItem.addOns?.map(addOn => ({
            id: addOn.id,
            name: addOn.name,
            description: addOn.description,
            price: addOn.price,
            duration: addOn.durationInMinutes ? {
              hours: Math.floor(addOn.durationInMinutes / 60),
              minutes: addOn.durationInMinutes % 60
            } : undefined
          })) || [];

          // Add service to cart
          dispatch(addToCart({ 
            storeId: item.store.id, 
            service,
            selectedAddOns 
          }));

          // Update quantity to match booking quantity
          if (bookingItem.quantity > 1) {
            dispatch(updateCartItemQuantity({
              storeId: item.store.id,
              serviceId: service.id,
              quantity: bookingItem.quantity
            }));
          }
        });
      }

      // Navigate to Store page
      (navigation as any).navigate('Store', { storeId: item.store.id });
    };

    const showProgressBar = !['pending', 'completed', 'rejected', 'cancelled'].includes(item.bookingStage);
    const showSimpleStatus = ['pending', 'completed'].includes(item.bookingStage) || item.status === 'rejected' || item.status === 'cancelled';
    const showRebookButton = item.status === 'completed';

    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={handlePress}
      >
      <View style={styles.bookingContent}>
        {/* Store Banner */}
        <View style={styles.storeBanner}>
          {item.store.bannerImageUrl ? (
            <Image
              source={{ uri: item.store.bannerImageUrl }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.bannerPlaceholder}>
              <Text weight="medium" style={styles.bannerPlaceholderText}>
                {item.store.name.charAt(0)}
              </Text>
            </View>
          )}
        </View>

        {/* Store Info */}
        <View style={styles.storeInfo}>
          <Text weight="semiBold" style={styles.storeName} numberOfLines={1}>
            {item.store.name}
          </Text>
          <View style={styles.dateTimeRow}>
            <Text weight="medium" style={styles.serviceTime}>
              {formatDate(item.serviceDate)} • {item.serviceTime}
            </Text>
            {showProgressBar && (
              <Text weight="medium" style={styles.stageText}>
                • {getBookingStageText(item.bookingStage)}
              </Text>
            )}
          </View>

          {showProgressBar && (
            <View style={styles.progressBarContainer}>
              <ProgressBar
                progress={getBookingStageProgress(item.bookingStage)}
                width={160}
                fillColor={colors.primary}
                trackColor="#FAFAFA"
              />
            </View>
          )}

          {showSimpleStatus && (
            <>
              {item.status === 'pending' && (
                <Text weight="medium" style={styles.statusPending}>
                  Awaiting confirmation
                </Text>
              )}
              {item.status === 'completed' && (
                <Text weight="medium" style={styles.statusCompleted}>
                  Completed
                </Text>
              )}
              {item.status === 'rejected' && (
                <Text weight="medium" style={styles.statusRejected}>
                  Rejected
                </Text>
              )}
              {item.status === 'cancelled' && (
                <Text weight="medium" style={styles.statusCancelled}>
                  Cancelled
                </Text>
              )}
            </>
          )}
        </View>

        {/* Rebook Button - Only for completed bookings */}
        {showRebookButton && (
          <TouchableOpacity
            style={styles.rebookButton}
            onPress={handleRebook}
          >
            <Text weight="semiBold" style={styles.rebookButtonText}>
              Rebook
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text weight="lora" style={styles.headerTitle}>
          Bookings
        </Text>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
        style={styles.tabsScrollView}
      >
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setActiveTab(index)}
            style={[
              styles.tab,
              activeTab === index && styles.activeTab
            ]}
          >
            <Text
              weight="semiBold"
              style={[
                styles.tabText,
                activeTab === index && styles.activeTabText
              ]}
            >
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  );

  const renderEmptyComponent = () => {
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text weight="lora" style={styles.emptyTitle}>
            Something went wrong
          </Text>
          <Text weight="medium" style={styles.emptySubtitle}>
            Unable to load bookings. Please try again.
          </Text>
        </View>
      );
    }

    return renderEmptyState(tabs[activeTab].type);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <FlatList
          ListHeaderComponent={renderHeader}
          data={[1, 2, 3, 4, 5]}
          renderItem={renderSkeletonItem}
          keyExtractor={(_, index) => `skeleton-${index}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ListHeaderComponent={renderHeader}
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyComponent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.textLight,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 25,
    color: colors.textDark,
    letterSpacing: -0.5,
  },
  tabsScrollView: {
    backgroundColor: 'transparent',
  },
  tabsContainer: {
    alignItems: 'center',
    gap: 20,
    marginTop: 16,
    marginBottom: 16,
    justifyContent: 'space-between',
    flexGrow: 1,
  },
  tab: {
    paddingVertical: 10,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.mediumGray,
    fontWeight: 'bold',
  },
  activeTabText: {
    color: colors.charcoal,
  },
  listContainer: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  bookingCard: {
    backgroundColor: colors.textLight,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 4,
  },
  bookingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeBanner: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
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
    fontSize: 24,
    color: colors.textGray,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 18,
    color: colors.textDark,
    marginBottom: 4,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
    marginTop: 2
  },
  serviceTime: {
    fontSize: 14,
    color: colors.textGray,
    marginRight: 3
  },
  stageText: {
    fontSize: 14,
    color: colors.textGray,
  },
  progressBarContainer: {
    marginTop: 12,
  },
  statusPending: {
    fontSize: 13,
    color: '#D4AF37',
    marginTop: 4,
  },
  statusConfirmed: {
    fontSize: 13,
    color: '#2196F3',
    marginTop: 4,
  },
  statusOngoing: {
    fontSize: 13,
    color: '#FF9800',
    marginTop: 4,
  },
  statusCompleted: {
    fontSize: 13,
    color: '#3D7B22',
    marginTop: 4,
  },
  statusRejected: {
    fontSize: 13,
    color: '#BB0A0A',
    marginTop: 4,
  },
  statusCancelled: {
    fontSize: 13,
    color: '#BB0A0A',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    marginTop: 200
  },
  emptyTitle: {
    fontSize: 24,
    color: colors.textDark,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textGray,
    textAlign: 'center',
    lineHeight: 22,
  },
  skeletonBox: {
    backgroundColor: colors.lightGray,
    borderRadius: 4,
  },
  rebookButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rebookButtonText: {
    color: colors.darkGray,
    fontSize: 14,
  },
});

export default Bookings;
