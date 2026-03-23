import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, Pressable, ScrollView, TouchableOpacity } from "react-native";
import { useSelector } from "react-redux";
import Text from "../../../../components/Text";
import Button from "../../../../components/Button";
import CustomModal from "../../../../components/Modal";
import { useToast } from "../../../../contexts/ToastContext";
import GoBack from "../../../../components/GoBack";
import Header from "../../../../components/Header";
import { colors } from "../../../../utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { BookingFormData } from "./index";
import { RootState } from "../../../../store/store";

interface SlotSelectionProps {
  formData: BookingFormData;
  updateFormData: (data: Partial<BookingFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const SlotSelection: React.FC<SlotSelectionProps> = ({ formData, updateFormData, onNext, onBack }) => {
  const { showToast } = useToast();

  // Initialize from formData if available
  const initialDate = formData.serviceDate ? new Date(formData.serviceDate) : null;
  const initialTime = formData.serviceTime || null;

  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate);
  const [selectedTime, setSelectedTime] = useState<string | null>(initialTime);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);

  // Get cart items to calculate total duration
  const cartItems = useSelector((state: RootState) => {
    if (!formData.storeId || !state.cart.carts) return [];
    return state.cart.carts[formData.storeId] || [];
  });

  // Get store data for opening hours
  const { store } = useSelector((state: RootState) => state.store);

  // Calculate total duration from all services in cart including add-ons
  const totalDurationInMinutes = cartItems.reduce((total, item) => {
    const serviceDuration = item.service.durationInMinutes || 0;
    const addOnsDuration = (item.selectedAddOns || []).reduce((addOnSum, addOn) => {
      const duration = addOn.duration ? (addOn.duration.hours * 60 + addOn.duration.minutes) : 0;
      return addOnSum + duration;
    }, 0);
    return total + serviceDuration + addOnsDuration;
  }, 0);


  // Get month and year
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonth = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  // Days of the week
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Get calendar days
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();

    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Previous month's days to fill the first week
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevMonthDays = Array.from(
      { length: startingDayOfWeek },
      (_, i) => prevMonthLastDay - startingDayOfWeek + i + 1
    );

    // Current month's days
    const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Next month's days to fill the last week
    const remainingDays = 42 - (prevMonthDays.length + currentMonthDays.length);
    const nextMonthDays = Array.from({ length: remainingDays }, (_, i) => i + 1);

    return { prevMonthDays, currentMonthDays, nextMonthDays };
  };

  const { prevMonthDays, currentMonthDays, nextMonthDays } = getCalendarDays();

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const isCurrentMonth = () => {
    const today = new Date();
    return (
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const handleDateSelect = (day: number) => {
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(selected);
    setSelectedTime(null); // Reset time when date changes
    // Format as YYYY-MM-DD to avoid timezone shift
    const dateString = `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, '0')}-${String(selected.getDate()).padStart(2, '0')}`;
    updateFormData({ serviceDate: dateString, serviceTime: '' });
  };

  const showTimePicker = () => {
    const timeToUse = selectedTime || getDefaultStartTime();
    const [time, period] = timeToUse.split(" ");
    const [hours, minutes] = time.split(":").map(Number);
    let hour24 = hours;
    if (period === "PM" && hours !== 12) hour24 += 12;
    if (period === "AM" && hours === 12) hour24 = 0;
    setSelectedHour(hour24);
    setSelectedMinute(minutes);
    setTimePickerVisible(true);
  };

  const hideTimePicker = () => {
    setTimePickerVisible(false);
  };

  const handleTimeConfirm = () => {
    // Validate that the selected time is valid before confirming
    const selectedTimeMinutes = selectedHour * 60 + selectedMinute;
    const endTimeMinutes = selectedTimeMinutes + totalDurationInMinutes;

    const dayName = selectedDate ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][selectedDate.getDay()] : null;
    const dayInfo = dayName && store?.openingHours ? store.openingHours.find(h => h.day === dayName) : null;

    if (dayInfo?.closingTime) {
      const [closeHour, closeMin] = dayInfo.closingTime.split(':').map(Number);
      const closingMinutes = closeHour * 60 + closeMin;

      if (endTimeMinutes > closingMinutes) {
        showToast({
          message: 'Selected time would end past store closing time. Please adjust your selection.',
          type: 'error'
        });
        return;
      }
    }

    const period = selectedHour >= 12 ? "PM" : "AM";
    const hour12 = selectedHour === 0 ? 12 : selectedHour > 12 ? selectedHour - 12 : selectedHour;
    const timeString = `${String(hour12).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")} ${period}`;

    setSelectedTime(timeString);
    updateFormData({ serviceTime: timeString });
    hideTimePicker();
  };

  // Calculate end time based on start time and total duration
  const calculateEndTime = (startTime: string) => {
    if (!startTime) return "";

    const [time, period] = startTime.split(" ");
    const [hours, minutes] = time.split(":").map(Number);

    let hour24 = hours;
    if (period === "PM" && hours !== 12) hour24 += 12;
    if (period === "AM" && hours === 12) hour24 = 0;

    const totalMinutes = hour24 * 60 + minutes + totalDurationInMinutes;
    const endHour24 = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;

    const endPeriod = endHour24 >= 12 ? "PM" : "AM";
    const endHour12 = endHour24 === 0 ? 12 : endHour24 > 12 ? endHour24 - 12 : endHour24;

    return `${String(endHour12).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")} ${endPeriod}`;
  };


  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  const renderTimeSelection = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    const defaultStartTime = getDefaultStartTime();
    const [time, period] = defaultStartTime.split(" ");
    const [defaultHours] = time.split(":").map(Number);
    let defaultHour24 = defaultHours;
    if (period === "PM" && defaultHours !== 12) defaultHour24 += 12;
    if (period === "AM" && defaultHours === 12) defaultHour24 = 0;

    // Calculate latest hour based on closing time and service duration
    const dayName = selectedDate ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][selectedDate.getDay()] : null;
    const dayInfo = dayName && store?.openingHours ? store.openingHours.find(h => h.day === dayName) : null;
    let latestHour24 = 23;

    if (dayInfo?.closingTime) {
      const [closeHour, closeMin] = dayInfo.closingTime.split(':').map(Number);
      const closingMinutes = closeHour * 60 + closeMin;
      const latestMinutes = closingMinutes - totalDurationInMinutes;
      latestHour24 = Math.floor(latestMinutes / 60);
    }

    return (
      <View style={styles.timeWheels}>
        <View style={styles.timeWheel}>
          <ScrollView
            ref={hourScrollRef}
            style={styles.wheelScroll}
            showsVerticalScrollIndicator={false}
            onLayout={() => {
              // Scroll to selected hour when modal opens
              const itemHeight = 44; // paddingVertical: 12 * 2 + fontSize: ~20
              hourScrollRef.current?.scrollTo({ y: selectedHour * itemHeight, animated: false });
            }}
          >
            {hours.map(hour => {
              const isInvalidHour = hour < defaultHour24 || hour > latestHour24;
              return (
                <TouchableOpacity
                  key={hour}
                  style={[
                    styles.timeOption,
                    selectedHour === hour && styles.selectedTimeOption,
                    isInvalidHour && styles.disabledTimeOption
                  ]}
                  onPress={isInvalidHour ?
                      () => showToast({
                          message: 'Time selected falls outside of stores open times',
                          type: 'error'
                      })
                      :
                      () => setSelectedHour(hour)}
                >
                  <Text weight='medium' style={[
                    styles.timeOptionText,
                    selectedHour === hour && styles.selectedTimeOptionText,
                    isInvalidHour && styles.disabledTimeOptionText
                  ]}>
                    {hour.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.timeWheel}>
          <ScrollView
            ref={minuteScrollRef}
            style={styles.wheelScroll}
            showsVerticalScrollIndicator={false}
            onLayout={() => {
              // Scroll to selected minute when modal opens
              const itemHeight = 44;
              minuteScrollRef.current?.scrollTo({ y: selectedMinute * itemHeight, animated: false });
            }}
          >
            {minutes.map(minute => {
              const selectedTimeMinutes = selectedHour * 60 + minute;
              const endTimeMinutes = selectedTimeMinutes + totalDurationInMinutes;
              const closingMinutes = dayInfo?.closingTime ? (() => {
                const [closeHour, closeMin] = dayInfo.closingTime.split(':').map(Number);
                return closeHour * 60 + closeMin;
              })() : 24 * 60;
              const isInvalidTime = endTimeMinutes > closingMinutes || selectedTimeMinutes < defaultHour24 * 60;

              return (
                <TouchableOpacity
                  key={minute}
                  style={[
                    styles.timeOption,
                    selectedMinute === minute && styles.selectedTimeOption,
                    isInvalidTime && styles.disabledTimeOption
                  ]}
                  onPress={isInvalidTime ?
                    () => showToast({
                      message: 'Time selected falls outside of stores open times',
                      type: 'error'
                    })
                    :
                    () => setSelectedMinute(minute)}
                >
                  <Text weight='medium' style={[
                    styles.timeOptionText,
                    selectedMinute === minute && styles.selectedTimeOptionText,
                    isInvalidTime && styles.disabledTimeOptionText
                  ]}>
                    {minute.toString().padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isPastDate = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return checkDate < today;
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isDayOpen = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];

    if (!store?.openingHours) return true; // If no opening hours data, allow all days

    const dayInfo = store.openingHours.find(h => h.day === dayName);
    return dayInfo?.isOpen !== false; // Return true if day is open or undefined
  };

  const getDefaultStartTime = () => {
    if (!selectedDate || !store?.openingHours) return "09:00 AM";

    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][selectedDate.getDay()];
    const dayInfo = store.openingHours.find(h => h.day === dayName);

    if (!dayInfo?.openingTime) return "09:00 AM";

    // Convert 24-hour format (e.g., "07:00") to 12-hour format with AM/PM
    const [hours, minutes] = dayInfo.openingTime.split(':').map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

    return `${String(hour12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
  };

  const handleContinue = () => {
    if (!selectedDate) {
      showToast({
        message: "Please select a date to continue",
        type: "error",
      });
      return;
    }

    if (!selectedTime) {
      showToast({
        message: "Please select a time slot to continue",
        type: "error",
      });
      return;
    }

    onNext();
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <GoBack goBack={onBack} />
          <View />
        </View>
        <Header style={styles.title} weight="bold">
        Select date and time
        </Header>
        <Text style={styles.info} weight="medium" color={colors.textGray}>
        Choose your preferred date and time from our available appointments
        </Text>

        {/* Calendar Header */}
        <View style={styles.calendarHeader}>
          <Text weight="semiBold" style={styles.monthText}>
            {currentMonth} {currentYear}
          </Text>
          <View style={styles.navigationButtons}>
            <Pressable
              disabled={isCurrentMonth()}
              onPress={goToPreviousMonth}
              style={[styles.navButton, isCurrentMonth() && styles.disabledButton]}
            >
              <Ionicons name="chevron-back" size={20} color={isCurrentMonth() ? "#CECECE" : colors.textDark} />
            </Pressable>
            <Pressable onPress={goToNextMonth} style={styles.navButton}>
              <Ionicons name="chevron-forward" size={20} color={colors.textDark} />
            </Pressable>
          </View>
        </View>

        {/* Days of Week */}
        <View style={styles.daysOfWeekRow}>
          {daysOfWeek.map((day) => (
            <View key={day} style={styles.dayOfWeekCell}>
              <Text weight="medium" style={styles.dayOfWeekText}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {/* Previous month days */}
          {prevMonthDays.map((day, index) => (
            <View key={`prev-${index}`} style={styles.dayCell}>
              <Text style={styles.inactiveDay}>{day}</Text>
            </View>
          ))}

          {/* Current month days */}
          {currentMonthDays.map((day) => {
            const dayOpen = isDayOpen(day);
            const isPast = isPastDate(day);
            const isDisabled = !dayOpen || isPast;
            return (
              <Pressable
                key={`current-${day}`}
                style={[
                  styles.dayCell,
                  isSelected(day) && styles.selectedDay,
                  isToday(day) && !isSelected(day) && styles.todayDay,
                ]}
                onPress={() => !isDisabled && handleDateSelect(day)}
                disabled={isDisabled}
              >
                <Text
                  weight={isSelected(day) ? "semiBold" : "medium"}
                  style={[
                    styles.currentDay,
                    isSelected(day) && styles.selectedDayText,
                    isToday(day) && !isSelected(day) && styles.todayDayText,
                    isDisabled && styles.closedDay,
                  ]}
                >
                  {day}
                </Text>
              </Pressable>
            );
          })}

          {/* Next month days */}
          {nextMonthDays.map((day, index) => (
            <View key={`next-${index}`} style={styles.dayCell}>
              <Text style={styles.inactiveDay}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Time Selection */}
        {selectedDate && (
          <View style={styles.timeSlotsContainer}>
            <Text style={[styles.title, {marginTop: 5, fontSize: 18}]} weight="lora">
            Open Slots - {selectedDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
            <Text style={styles.info} weight="medium" color={colors.textGray}>
            Select your preferred time from the available options.
            </Text>

            <View style={styles.timeRow}>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={showTimePicker}
              >
                <Text weight="medium" style={styles.timeValue}>
                  {selectedTime || getDefaultStartTime()}
                </Text>
              </TouchableOpacity>

              <Text style={styles.timeSeparator}>-</Text>

              <View style={styles.timeButton}>
                <Text weight="medium" style={styles.timeValue}>
                  {calculateEndTime(selectedTime || getDefaultStartTime())}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={handleContinue}
          style={{ marginTop: 12 }}
          disabled={!selectedDate || !selectedTime}
        />
      </View>

      <CustomModal
        visible={timePickerVisible}
        onClose={hideTimePicker}
        position="bottom"
      >
        <View style={styles.timePickerContainer}>
          <View style={styles.timeSelectionContainer}>
            {renderTimeSelection()}
          </View>

          <View style={styles.timePickerActions}>
            <Button title='Save' onPress={handleTimeConfirm} />
          </View>
        </View>
      </CustomModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
    paddingTop: 100,
  },
  headerRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    marginBottom: 12,
    letterSpacing: -0.5,
    marginTop: 25,
  },
  info: {
    fontSize: 17,
    marginBottom: 30,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  monthText: {
    fontSize: 17,
    color: colors.textDark,
  },
  navigationButtons: {
    flexDirection: "row",
    gap: 8,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
  },
  daysOfWeekRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  dayOfWeekCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  dayOfWeekText: {
    fontSize: 15,
    color: colors.darkGray,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  inactiveDay: {
    fontSize: 15,
    color: "#CECECE",
  },
  currentDay: {
    fontSize: 15,
    color: colors.textDark,
  },
  selectedDay: {
    backgroundColor: colors.secondaryAlt,
    borderRadius: 100,
  },
  selectedDayText: {
    color: colors.textLight,
  },
  todayDay: {
    // backgroundColor: colors.secondaryLight,
    borderRadius: 8,
  },
  todayDayText: {
    color: colors.secondary,
  },
  closedDay: {
    color: "#CECECE",
    textDecorationLine: "line-through",
  },
  footer: {
    paddingTop: 20,
    paddingBottom: 30,
  },
  timeSlotsContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeButton: {
    flex: 1,
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    padding: 15,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.darkGray,
  },
  timeSeparator: {
    paddingHorizontal: 8,
    fontSize: 14,
    color: colors.textGray,
  },
  timePickerContainer: {
    paddingVertical: 20,
  },
  timeSelectionContainer: {
    marginBottom: 24,
  },
  timeWheels: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  timeWheel: {
    flex: 1,
    alignItems: 'center',
  },
  wheelScroll: {
    height: 250,
    width: 80,
  },
  timeOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
    alignItems: 'center',
  },
  selectedTimeOption: {
    backgroundColor: colors.primary,
  },
  timeOptionText: {
    fontSize: 16,
    color: colors.textDark,
    fontWeight: '500',
  },
  selectedTimeOptionText: {
    color: colors.textLight,
  },
  disabledTimeOption: {
    opacity: 0.3,
  },
  disabledTimeOptionText: {
    color: colors.textGray,
  },
  timePickerActions: {
  },
});

export default SlotSelection;
