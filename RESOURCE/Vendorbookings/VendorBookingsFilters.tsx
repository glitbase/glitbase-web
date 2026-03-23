import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import Text from '../../../components/Text';
import { colors } from '../../../utils/constants';
import Button from '../../../components/Button';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';

export interface VendorBookingsFilterRequest {
  query?: string;
  sortBy?: string;
  serviceType?: string;
  minDuration?: number;
  maxDuration?: number;
  minValue?: number;
  maxValue?: number;
}

interface VendorBookingsFiltersProps {
  onApplyFilters: (filters: VendorBookingsFilterRequest) => void;
  currentFilters: VendorBookingsFilterRequest;
  onClose: () => void;
}

const VendorBookingsFilters: React.FC<VendorBookingsFiltersProps> = ({
  onApplyFilters,
  currentFilters,
  onClose,
}) => {
  const [filters, setFilters] = useState<VendorBookingsFilterRequest>(currentFilters);
  const { user } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  const sortOptions = [
    { label: 'Newest first', value: 'newest' },
    { label: 'Oldest first', value: 'oldest' },
    { label: 'Customer name (A-Z)', value: 'customerName' },
  ];

  const bookingTypes = [
    { label: 'Normal service', value: 'normal' },
    { label: 'Home service', value: 'home' },
    { label: 'Drop-off & pick-up', value: 'pickDrop' },
  ];

  const durationOptions = [
    { label: 'Under 30 min', minDuration: 0, maxDuration: 30 },
    { label: '30-60 min', minDuration: 30, maxDuration: 60 },
    { label: '1-2 hours', minDuration: 60, maxDuration: 120 },
    { label: '3-4 hours', minDuration: 180, maxDuration: 240 },
    { label: '5+ hours', minDuration: 300, maxDuration: undefined },
  ];

  const bookingValueOptions = user?.countryCode === 'NG' ? [
    { label: 'Under ₦20,000', minValue: 0, maxValue: 20000 },
    { label: '₦20,000 - ₦100,000', minValue: 20000, maxValue: 100000 },
    { label: '₦100,000 - ₦500,000', minValue: 100000, maxValue: 500000 },
    { label: '₦500,000 - ₦1,000,000', minValue: 500000, maxValue: 1000000 },
    { label: 'Over ₦1,000,000', minValue: 1000000, maxValue: undefined },
  ] : [
    { label: 'Under £25', minValue: 0, maxValue: 25 },
    { label: '£25 - £100', minValue: 25, maxValue: 100 },
    { label: '£100 - £500', minValue: 100, maxValue: 500 },
    { label: '£500 - £1,000', minValue: 500, maxValue: 1000 },
    { label: 'Over £1,000', minValue: 1000, maxValue: undefined },
  ];

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClearFilters = () => {
    const clearedFilters: VendorBookingsFilterRequest = {
      query: currentFilters.query, // Keep the search query
    };
    setFilters(clearedFilters);
  };

  const hasFiltersApplied = !!(
    filters.sortBy ||
    filters.serviceType ||
    filters.minDuration ||
    filters.maxDuration ||
    filters.minValue ||
    filters.maxValue
  );

  const renderFilterSection = (title: string, children: React.ReactNode) => (
    <View style={styles.filterSection}>
      <Text weight="semiBold" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );

  const renderOptionButtons = (
    options: { label: string; value?: string }[],
    selectedValue: string | undefined,
    onSelect: (value: string | undefined) => void,
    isVertical = false
  ) => (
    <View style={isVertical ? styles.verticalOptionsContainer : styles.optionsContainer}>
      {options.map((option, index) => {
        const key = option.value || option.label;
        const isSelected = selectedValue === key;
        return (
          <Pressable
            key={key}
            style={[
              isVertical ? styles.verticalOptionButton : styles.optionButton,
              isSelected && (isVertical ? styles.verticalOptionButtonSelected : styles.optionButtonSelected),
            ]}
            onPress={() => {
              if (isSelected) {
                onSelect(undefined); // Deselect if already selected
              } else {
                onSelect(key);
              }
            }}
          >
            <Text
              weight="medium"
              style={[
                isVertical ? styles.verticalOptionButtonText : styles.optionButtonText,
                isSelected && (isVertical ? styles.verticalOptionButtonTextSelected : styles.optionButtonTextSelected),
              ]}
            >
              {option.label}
            </Text>
            {isVertical && (
              <View style={[
                styles.radioButton,
                isSelected && styles.radioButtonSelected
              ]}>
                {isSelected && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );

  const renderDurationButtons = (
    options: { label: string; minDuration: number; maxDuration?: number }[],
    selectedMinDuration: number | undefined,
    selectedMaxDuration: number | undefined,
    onSelect: (minDuration?: number, maxDuration?: number) => void
  ) => (
    <View style={styles.optionsContainer}>
      {options.map((option) => {
        const isSelected = selectedMinDuration === option.minDuration && selectedMaxDuration === option.maxDuration;
        return (
          <Pressable
            key={option.label}
            style={[
              styles.optionButton,
              isSelected && styles.optionButtonSelected,
            ]}
            onPress={() => {
              if (isSelected) {
                onSelect(undefined, undefined);
              } else {
                onSelect(option.minDuration, option.maxDuration);
              }
            }}
          >
            <Text
              weight="medium"
              style={[
                styles.optionButtonText,
                isSelected && styles.optionButtonTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const renderValueButtons = (
    options: { label: string; minValue: number; maxValue?: number }[],
    selectedMinValue: number | undefined,
    selectedMaxValue: number | undefined,
    onSelect: (minValue?: number, maxValue?: number) => void,
    isVertical = false
  ) => (
    <View style={isVertical ? styles.verticalOptionsContainer : styles.optionsContainer}>
      {options.map((option) => {
        const isSelected = selectedMinValue === option.minValue && selectedMaxValue === option.maxValue;
        return (
          <Pressable
            key={option.label}
            style={[
              isVertical ? styles.verticalOptionButton : styles.optionButton,
              isSelected && (isVertical ? styles.verticalOptionButtonSelected : styles.optionButtonSelected),
            ]}
            onPress={() => {
              if (isSelected) {
                onSelect(undefined, undefined);
              } else {
                onSelect(option.minValue, option.maxValue);
              }
            }}
          >
            <Text
              weight="medium"
              style={[
                isVertical ? styles.verticalOptionButtonText : styles.optionButtonText,
                isSelected && (isVertical ? styles.verticalOptionButtonTextSelected : styles.optionButtonTextSelected),
              ]}
            >
              {option.label}
            </Text>
            {isVertical && (
              <View style={[
                styles.radioButton,
                isSelected && styles.radioButtonSelected
              ]}>
                {isSelected && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View />
        <Text weight="lora" style={styles.title}>
          Filter
        </Text>
        <Pressable onPress={handleClearFilters} disabled={!hasFiltersApplied}>
          <Text weight="semiBold" style={[styles.reset, !hasFiltersApplied && styles.resetDisabled]}>
            Reset
          </Text>
        </Pressable>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Sort By */}
        {renderFilterSection(
          'Sort by',
          renderOptionButtons(
            sortOptions,
            filters.sortBy,
            (value) => setFilters({ ...filters, sortBy: value }),
            true
          )
        )}

        {/* Booking Type */}
        {renderFilterSection(
          'Booking type',
          renderOptionButtons(
            bookingTypes,
            filters.serviceType,
            (value) => setFilters({ ...filters, serviceType: value })
          )
        )}

        {/* Appointment Duration */}
        {renderFilterSection(
          'Appointment duration',
          renderDurationButtons(
            durationOptions,
            filters.minDuration,
            filters.maxDuration,
            (minDuration, maxDuration) => setFilters({ ...filters, minDuration, maxDuration })
          )
        )}

        {/* Booking Value */}
        {renderFilterSection(
          'Booking value',
          renderValueButtons(
            bookingValueOptions,
            filters.minValue,
            filters.maxValue,
            (minValue, maxValue) => setFilters({ ...filters, minValue, maxValue }),
            true
          )
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button title="Apply Filters" onPress={handleApplyFilters} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.textLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
    backgroundColor: colors.textLight,
  },
  title: {
    fontSize: 19,
    color: colors.textDark,
    letterSpacing: -0.5
  },
  reset: {
    color: colors.secondaryAlt,
    letterSpacing: -0.5
  },
  resetDisabled: {
    color: "#B8B8B8",
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingTop: 20,
    paddingBottom: 0,
  },
  filterSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    color: colors.textDark,
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    marginBottom: 12
  },
  verticalOptionsContainer: {
    flexDirection: 'column',
    gap: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingBottom: 6
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.lightGray,
    backgroundColor: colors.lightGray,
  },
  verticalOptionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 14,
  },
  optionButtonSelected: {
    backgroundColor: colors.charcoal,
    borderColor: colors.charcoal,
  },
  verticalOptionButtonSelected: {
    backgroundColor: 'transparent',
  },
  optionButtonText: {
    fontSize: 15,
    color: colors.darkGray,
  },
  verticalOptionButtonText: {
    fontSize: 15,
    color: colors.textDark,
  },
  optionButtonTextSelected: {
    color: colors.textLight,
  },
  verticalOptionButtonTextSelected: {
    color: colors.textDark,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderGray,
    backgroundColor: colors.textLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.secondary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.secondary,
  },
  footer: {
    paddingTop: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    gap: 12,
    backgroundColor: colors.textLight,
  },
});

export default VendorBookingsFilters;
