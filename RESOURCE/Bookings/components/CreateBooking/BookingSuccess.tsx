import React from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
// import * as Calendar from 'expo-calendar';
import Text from "../../../../components/Text";
import Button from "../../../../components/Button";
import { colors } from "../../../../utils/constants";
import { Ionicons } from "@expo/vector-icons";

type RootStackParamList = {
  Home: undefined;
  BookingDetails: { bookingReference: string };
};

interface BookingSuccessProps {
  bookingReference: string;
  userEmail: string;
  serviceDate: string;
  serviceTime: string;
  totalDuration: number;
  bookingId: string;
  serviceType: string;
  storeLocation?: string;
  homeAddress?: string;
  pickupAddress?: string;
  dropoffAddress?: string;
}

const BookingSuccess: React.FC<BookingSuccessProps> = ({
  bookingReference,
  userEmail,
  serviceDate,
  serviceTime,
  totalDuration,
  bookingId,
  serviceType,
  storeLocation,
  homeAddress,
  pickupAddress,
  dropoffAddress,
}) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Format time range
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

  const handleViewBookingDetails = () => {
    navigation.navigate('BookingDetails', { bookingReference });
  };

  const handleAddToCalendar = async () => {
    try {
      // Request calendar permissions
      // const { status } = await Calendar.requestCalendarPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Calendar permission is required to add this booking to your calendar.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get the default calendar
      // const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      // const defaultCalendar = calendars.find((cal: Calendar.Calendar) => cal.isPrimary) || calendars[0];

      // if (!defaultCalendar) {
      //   Alert.alert('Error', 'No calendar found on this device.');
      //   return;
      // }

      // Parse the start time and calculate end time
      const [time, period] = serviceTime.split(' ');
      const [hours, minutes] = time.split(':').map(Number);

      let startHours = hours;
      if (period?.toLowerCase() === 'pm' && hours !== 12) {
        startHours += 12;
      } else if (period?.toLowerCase() === 'am' && hours === 12) {
        startHours = 0;
      }

      // Create start date
      const startDate = new Date(serviceDate);
      startDate.setHours(startHours, minutes, 0, 0);

      // Create end date
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + totalDuration);

      // Prepare event details
      let eventLocation = '';
      if (serviceType === 'normal' && storeLocation) {
        eventLocation = storeLocation;
      } else if (serviceType === 'home' && homeAddress) {
        eventLocation = homeAddress;
      } else if (serviceType === 'pickDrop' && pickupAddress) {
        eventLocation = pickupAddress;
      }

      // Create calendar event
      // const eventId = await Calendar.createEventAsync(defaultCalendar.id, {
      //   title: `Booking #${bookingReference}`,
      //   startDate: startDate,
      //   endDate: endDate,
      //   location: eventLocation,
      //   notes: `Booking confirmation sent to ${userEmail}`,
      //   timeZone: 'UTC',
      //   alarms: [{ relativeOffset: -60 }], // 1 hour before
      // });

      // if (eventId) {
      //   Alert.alert(
      //     'Success',
      //     'Your booking has been added to your calendar!',
      //     [{ text: 'OK' }]
      //   );
      // }
    } catch (error) {
      console.error('Error adding to calendar:', error);
      Alert.alert(
        'Error',
        'Failed to add booking to calendar. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={60} color="#FFFFFF" />
          </View>
        </View>

        {/* Success Title */}
        <Text weight="lora" style={styles.title}>
          Booking scheduled!
        </Text>

        {/* Success Message */}
        <Text weight="medium" style={styles.message}>
          Your booking #{bookingReference} has been successfully scheduled and complete details have been sent to {userEmail}
        </Text>

        {/* Booking Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailItem}>
            <View style={styles.detailIconCircle}>
              <Ionicons name="calendar-outline" size={17} color={colors.darkGray} />
            </View>
            <View style={styles.detailContent}>
              <Text weight="medium" style={styles.detailLabel}>
                Date
              </Text>
              <Text weight="medium" style={styles.detailValue}>
                {formatDate(serviceDate)}
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <View style={styles.detailIconCircle}>
              <Ionicons name="time-outline" size={18} color={colors.darkGray} />
            </View>
            <View style={styles.detailContent}>
              <Text weight="medium" style={styles.detailLabel}>
                Time
              </Text>
              <Text weight="medium" style={styles.detailValue}>
                {formatTimeRange(serviceTime, totalDuration)}
              </Text>
            </View>
          </View>

          {/* Location based on service type */}
          {serviceType === 'normal' && storeLocation && (
            <View style={styles.detailItem}>
              <View style={styles.detailIconCircle}>
                <Ionicons name="location-outline" size={20} color={colors.darkGray} />
              </View>
              <View style={styles.detailContent}>
                <Text weight="medium" style={styles.detailLabel}>
                Provider’s location
                </Text>
                <Text weight="medium" style={styles.detailValue}>
                  {storeLocation}
                </Text>
              </View>
            </View>
          )}

          {serviceType === 'home' && homeAddress && (
            <View style={styles.detailItem}>
              <View style={styles.detailIconCircle}>
                <Ionicons name="location-outline" size={20} color={colors.darkGray} />
              </View>
              <View style={styles.detailContent}>
                <Text weight="medium" style={styles.detailLabel}>
                  Address
                </Text>
                <Text weight="medium" style={styles.detailValue}>
                  {homeAddress}
                </Text>
              </View>
            </View>
          )}

          {serviceType === 'pickDrop' && (
            <>
              {pickupAddress && (
                <View style={styles.detailItem}>
                  <View style={styles.detailIconCircle}>
                    <Ionicons name="location-outline" size={20} color={colors.darkGray} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text weight="medium" style={styles.detailLabel}>
                      Pickup address
                    </Text>
                    <Text weight="medium" style={styles.detailValue}>
                      {pickupAddress}
                    </Text>
                  </View>
                </View>
              )}
              {dropoffAddress && (
                <View style={styles.detailItem}>
                  <View style={styles.detailIconCircle}>
                    <Ionicons name="location-outline" size={20} color={colors.darkGray} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text weight="medium" style={styles.detailLabel}>
                      Dropoff address
                    </Text>
                    <Text weight="medium" style={styles.detailValue}>
                      {dropoffAddress}
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <Button
          title="View booking details"
          onPress={handleViewBookingDetails}
          style={{ marginBottom: 12 }}
        />
        <Button
          title="Add to calendar"
          onPress={handleAddToCalendar}
          // onPress={() => {}}
          variant="ghostgray"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 160,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 30,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 60,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    color: colors.textDark,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.5
  },
  message: {
    fontSize: 17,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  detailsSection: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 20,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  detailIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
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
  footer: {
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
});

export default BookingSuccess;
