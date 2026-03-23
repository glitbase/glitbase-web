import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootState } from "../store/store";
import Text from "./Text";
import { colors } from "../utils/constants";
import { formatDuration } from "../utils/helper";

type RootStackParamList = {
  CreateBooking: { storeId: string };
};

interface CartSummaryProps {
  storeId: string;
  onPress?: () => void;
  onCartClick?: () => void; // New prop for opening cart modal
}

const CartSummary: React.FC<CartSummaryProps> = ({ storeId, onPress, onCartClick }) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const items = useSelector((state: RootState) => state.cart.carts[storeId] || []);

  // Calculate totals
  const totalServices = items.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = items.reduce((sum, item) => {
    const itemPrice = item.service.pricingType === 'free' ? 0 : item.service.price;
    const addOnsPrice = (item.selectedAddOns || []).reduce((addOnSum, addOn) => addOnSum + addOn.price, 0);
    return sum + (itemPrice + addOnsPrice) * item.quantity;
  }, 0);

  const totalDuration = items.reduce((sum, item) => {
    const addOnsDuration = (item.selectedAddOns || []).reduce((addOnSum, addOn) => {
      const duration = addOn.duration ? (addOn.duration.hours * 60 + addOn.duration.minutes) : 0;
      return addOnSum + duration;
    }, 0);
    return sum + (item.service.durationInMinutes + addOnsDuration) * item.quantity;
  }, 0);

  // Get currency from first item (all items should be from same store)
  const currency = items[0]?.service.currency || 'NGN';
  const currencySymbol = currency === 'NGN' ? '₦' : '£';

  // Don't render if cart is empty
  if (items.length === 0) {
    return null;
  }

  const handleBookNow = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate("CreateBooking", { storeId });
    }
  };

  return (
    <View style={styles.container}>
      <Pressable 
        style={styles.leftSection} 
        onPress={onCartClick}
        disabled={!onCartClick}
      >
        <Text weight="semiBold" style={styles.priceText}>
          {currencySymbol}{totalPrice.toLocaleString()}
        </Text>
        <View style={styles.detailsRow}>
          <Text weight="medium" style={styles.detailText}>
            {totalServices} service{totalServices > 1 ? 's' : ''}
          </Text>
          <Text weight="medium" style={styles.separator}>
            •
          </Text>
          <Text weight="medium" style={styles.detailText}>
            {formatDuration(totalDuration)}
          </Text>
        </View>
      </Pressable>

      <Pressable style={styles.button} onPress={handleBookNow}>
        <Text weight="semiBold" style={styles.buttonText}>
          Book now
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: colors.textLight,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  leftSection: {
    flex: 1,
  },
  priceText: {
    fontSize: 18,
    color: colors.textDark,
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: colors.textGray,
  },
  separator: {
    fontSize: 14,
    color: colors.textGray,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  buttonText: {
    fontSize: 16,
    color: colors.textLight,
  },
});

export default CartSummary;
