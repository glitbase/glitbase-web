import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, FlatList, Image, TouchableOpacity, ScrollView, Animated, Dimensions, RefreshControl } from 'react-native';
import Text from '../../../components/Text';
import { colors } from '../../../utils/constants';
import { useLazyGetVendorBookingsQuery } from '../../../services/bookingsApi';
import type { Booking } from '../../../services/bookingsApi';
import { useNavigation } from '@react-navigation/native';
import { getCurrencySymbol } from '../../../utils/helper';
import { CalendarDays, Settings2 } from 'lucide-react-native';
import GoBack from '../../../components/GoBack';
import Input from '../../../components/Input';
import CustomModal from '../../../components/Modal';
import VendorBookingsFilters, { VendorBookingsFilterRequest } from './VendorBookingsFilters';

const tabStatusMap = [undefined, 'pending', 'completed', 'cancelled', 'rejected'];

const VendorBookings = () => {
  const [activeTab, setActiveTab] = useState(0);
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<VendorBookingsFilterRequest>({});
  const [initialLoad, setInitialLoad] = useState(true);
  const [getVendorBookings, { data, isLoading, isFetching, error }] = useLazyGetVendorBookingsQuery();

  // Debounce search and fetch bookings
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params: any = {
        ...(tabStatusMap[activeTab] && { status: tabStatusMap[activeTab] }),
        ...(searchQuery && { search: searchQuery }),
        ...(appliedFilters.sortBy && { sortBy: appliedFilters.sortBy }),
        ...(appliedFilters.serviceType && { serviceType: appliedFilters.serviceType }),
        ...(appliedFilters.minDuration !== undefined && { minDuration: appliedFilters.minDuration }),
        ...(appliedFilters.maxDuration !== undefined && { maxDuration: appliedFilters.maxDuration }),
        ...(appliedFilters.minValue !== undefined && { minValue: appliedFilters.minValue }),
        ...(appliedFilters.maxValue !== undefined && { maxValue: appliedFilters.maxValue }),
      };

      console.log('Fetching vendor bookings with params:', params);
      getVendorBookings(params).then(() => {
        if (initialLoad) setInitialLoad(false);
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, appliedFilters, activeTab, initialLoad]);

  const handleApplyFilters = (filters: VendorBookingsFilterRequest) => {
    setAppliedFilters(filters);
  };

  const onRefresh = () => {
    const params: any = {
      ...(tabStatusMap[activeTab] && { status: tabStatusMap[activeTab] }),
      ...(searchQuery && { search: searchQuery }),
      ...(appliedFilters.sortBy && { sortBy: appliedFilters.sortBy }),
      ...(appliedFilters.serviceType && { serviceType: appliedFilters.serviceType }),
      ...(appliedFilters.minDuration !== undefined && { minDuration: appliedFilters.minDuration }),
      ...(appliedFilters.maxDuration !== undefined && { maxDuration: appliedFilters.maxDuration }),
      ...(appliedFilters.minValue !== undefined && { minValue: appliedFilters.minValue }),
      ...(appliedFilters.maxValue !== undefined && { maxValue: appliedFilters.maxValue }),
    };
    getVendorBookings(params);
  };

  const hasActiveFilters = !!(
    appliedFilters.sortBy ||
    appliedFilters.serviceType ||
    appliedFilters.minDuration ||
    appliedFilters.maxDuration ||
    appliedFilters.minValue ||
    appliedFilters.maxValue
  );

  const getActiveFiltersCount = () => {
    let count = 0;
    // Section 1: Sort by
    if (appliedFilters.sortBy) count++;
    // Section 2: Booking type
    if (appliedFilters.serviceType) count++;
    // Section 3: Appointment duration (count as one section if either min or max is set)
    if (appliedFilters.minDuration !== undefined || appliedFilters.maxDuration !== undefined) count++;
    // Section 4: Booking value (count as one section if either min or max is set)
    if (appliedFilters.minValue !== undefined || appliedFilters.maxValue !== undefined) count++;
    return count;
  };

  const bookings = data?.data?.bookings || [];
  const showLoading = initialLoad || isLoading || (isFetching && !data);

  const tabs = [
    { title: 'All Bookings', type: 'all' as const },
    { title: 'Pending', type: 'pending' as const },
    { title: 'Fulfilled', type: 'completed' as const },
    { title: 'Cancelled', type: 'cancelled' as const },
    { title: 'Rejected', type: 'rejected' as const },
  ];

  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showLoading) {
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
  }, [showLoading, shimmerAnimation]);

  const shimmerOpacity = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const renderEmptyState = (type: 'all' | 'pending' | 'completed' | 'cancelled' | 'rejected') => {
    const emptyStateConfig = {
      all: {
        title: 'No appointments yet',
        subtitle: 'Customer appointments will appear here once they book your available time slots.',
      },
      pending: {
        title: 'No pending bookings',
        subtitle: 'Pending customer bookings will appear here',
      },
      completed: {
        title: 'No fulfilled bookings',
        subtitle: 'Completed bookings will be displayed here',
      },
      cancelled: {
        title: 'No cancelled bookings',
        subtitle: 'Cancelled bookings will appear here',
      },
      rejected: {
        title: 'No rejected bookings',
        subtitle: 'Rejected bookings will appear here',
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}hr`;
    return `${hours}hr ${mins}min`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: '#8A6703', bg: '#FFF8E6' };
      case 'ongoing':
        return { text: '#8A6703', bg: '#FFF8E6' };
      case 'completed':
        return { text: '#3D7B22', bg: '#EBFEE3' };
      case 'cancelled':
        return { text: '#BB0A0A', bg: '#FFF0F0' };
      case 'rejected':
        return { text: '#BB0A0A', bg: '#FFF0F0' };
      case 'confirmed':
        return { text: '#2196F3', bg: '#E3F2FD' };
      default:
        return { text: colors.textGray, bg: colors.lightGray };
    }
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
        <View style={styles.bookingInfo}>
          <SkeletonBox width="60%" height={18} style={{ marginBottom: 8 }} />
          <SkeletonBox width="40%" height={14} style={{ marginBottom: 4 }} />
          <SkeletonBox width="50%" height={14} />
        </View>
      </View>
    </View>
  );

  const renderBookingItem = ({ item }: { item: Booking }) => {
    const handlePress = () => {
      (navigation as any).navigate('VendorBookingDetails', { bookingReference: item.bookingReference });
    };

    const getServicesText = () => {
      if (item.items.length === 0) return 'No services';
      const firstName = item.items[0].service.name;
      if (item.items.length === 1) return firstName;
      return `${firstName}, and ${item.items.length - 1} other${item.items.length - 1 > 1 ? 's' : ''}`;
    };

    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={handlePress}
      >
        <View style={styles.bookingContent}>
          <View style={styles.bookingInfo}>
            <View style={styles.nameRow}>
              <Text weight="semiBold" style={styles.bookingReference} numberOfLines={1}>
                {item.contactInfo?.name || 'Customer'}
              </Text>
              <Text weight="semiBold" style={styles.price}>
                {getCurrencySymbol(item.pricing.currency)}{item.pricing.vendorPayout.toLocaleString()}
              </Text>
            </View>
            <Text weight="medium" style={styles.customerInfo}>
              {getServicesText()}
            </Text>
            <Text weight="medium" style={styles.serviceTime}>
              {formatDate(item.serviceDate)} • {item.serviceTime} • {formatDuration(item.pricing.totalDuration)}
            </Text>
            <View style={[styles.statusPill, { backgroundColor: getStatusColor(item.status).bg }]}>
              <Text weight="medium" style={[styles.statusText, { color: getStatusColor(item.status).text }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTabs = () => (
    <>
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

  if (showLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <GoBack />
          <Text weight="lora" style={styles.headerTitle}>
            Bookings
          </Text>
          <CalendarDays size={22} color={colors.darkGray} />
        </View>

        {/* Search and Filter */}
        <View style={styles.searchFilterContainer}>
          <View style={styles.searchContainer}>
            <Input
              placeholder="Search bookings"
              value={searchQuery}
              onChangeText={setSearchQuery}
              showSearchIcon={true}
              clearable={true}
              style={styles.searchInput}
            />
          </View>
          <TouchableOpacity
            style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
            onPress={() => setShowFiltersModal(true)}
          >
            <Settings2
              size={22}
              color={hasActiveFilters ? colors.primary : colors.darkGray}
            />
            {hasActiveFilters && (
              <View style={styles.filterIndicator}>
                <Text weight='semiBold' style={styles.filterCount}>{getActiveFiltersCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <FlatList
          ListHeaderComponent={renderTabs}
          data={[1, 2, 3, 4, 5]}
          renderItem={renderSkeletonItem}
          keyExtractor={(_, index) => `skeleton-${index}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <GoBack />
        <Text weight="lora" style={styles.headerTitle}>
          Bookings
        </Text>
        <CalendarDays size={22} color={colors.darkGray} />
      </View>

      {/* Search and Filter */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchContainer}>
          <Input
            placeholder="Search bookings"
            value={searchQuery}
            onChangeText={setSearchQuery}
            showSearchIcon={true}
            clearable={true}
            style={styles.searchInput}
          />
        </View>
        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          onPress={() => setShowFiltersModal(true)}
        >
          <Settings2
            size={22}
            color={hasActiveFilters ? colors.primary : colors.darkGray}
          />
          {hasActiveFilters && (
            <View style={styles.filterIndicator}>
              <Text style={styles.filterCount}>{getActiveFiltersCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        ListHeaderComponent={renderTabs}
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />

      {/* Filters Modal */}
      <CustomModal
        visible={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        position="bottom"
      >
        <View style={styles.modalContent}>
          <VendorBookingsFilters
            onApplyFilters={handleApplyFilters}
            currentFilters={appliedFilters}
            onClose={() => setShowFiltersModal(false)}
          />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    color: colors.textDark,
    letterSpacing: -0.5,
    flex: 1,
    textAlign: 'center',
  },
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 6,
    marginTop: 16
  },
  searchContainer: {
    flex: 1,
  },
  searchInput: {
    marginBottom: 0,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: colors.lightGray,
  },
  filterButtonActive: {
  },
  filterIndicator: {
    position: 'absolute',
    top: -3,
    right: -1,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterCount: {
    fontSize: 12,
    color: 'white',
  },
  modalContent: {
    flex: 1,
    height: Dimensions.get('window').height * 0.81,
  },
  tabsScrollView: {
    backgroundColor: 'transparent',
  },
  tabsContainer: {
    alignItems: 'center',
    gap: 24,
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  bookingCard: {
    backgroundColor: colors.textLight,
    borderRadius: 12,
    paddingVertical: 16,
  },
  bookingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookingInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bookingReference: {
    fontSize: 16,
    color: colors.textDark,
    flex: 1,
  },
  customerInfo: {
    fontSize: 14,
    color: colors.textGray,
    marginBottom: 4,
  },
  serviceTime: {
    fontSize: 14,
    color: colors.textGray,
    marginBottom: 8,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  price: {
    fontSize: 16,
    color: colors.textDark,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    marginTop: 200,
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
});

export default VendorBookings;
