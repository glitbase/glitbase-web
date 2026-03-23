import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import Text from "../../../../components/Text";
import Button from "../../../../components/Button";
import { useToast } from "../../../../contexts/ToastContext";
import GoBack from "../../../../components/GoBack";
import Header from "../../../../components/Header";
import { colors } from "../../../../utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { RootState } from "../../../../store/store";
import { BookingFormData } from "./index";

interface ServiceTypeProps {
  formData: BookingFormData;
  updateFormData: (data: Partial<BookingFormData>) => void;
  onNext: () => void;
}

const bookingTypes = [
    { label: 'Normal service', value: 'normal', description: 'Standard appointment' },
    { label: 'Home service', value: 'home', description: 'Service at your location' },
    { label: 'Drop-off & pick-up', value: 'pickDrop', description: 'Convenient collection and return' },
  ];

const ServiceType: React.FC<ServiceTypeProps> = ({ formData, updateFormData, onNext }) => {
  const navigation = useNavigation();
  const [selected, setSelected] = useState(formData.serviceType || "");
  const { showToast } = useToast();

  // Get cart items for this store
  const cartItems = useSelector((state: RootState) => {
    if (!formData.storeId || !state.cart.carts) return [];
    return state.cart.carts[formData.storeId] || [];
  });

  // Update formData when selection changes
  useEffect(() => {
    if (selected) {
      updateFormData({ serviceType: selected });
    }
  }, [selected]);

  // Extract unique service types from cart items
  const serviceTypes = Array.from(
    new Set(
      cartItems.flatMap((item) => item.service.type || [])
    )
  ).map((type) => ({
    name: type,
    description: bookingTypes?.find(i => i.value === type)?.description
  }));

  const handleContinue = () => {
    if (!selected) {
      showToast({
        message: "Please select a service type to continue",
        type: "error",
      });
      return;
    }

    onNext();
  };

  return (
    <View style={styles.container}>
      <View>
        <View style={styles.headerRow}>
          <GoBack />
          <View />
        </View>
        <Header style={styles.title} weight="bold">
        Choose your service type
        </Header>
        <Text style={styles.info} weight="medium" color={colors.textGray}>
        Select where you&apos;d like to receive your service.
        </Text>

        <View>
          {serviceTypes.map(({ name, description }) => (
            <Pressable
              key={name}
              onPress={() => setSelected(name)}
              style={[
                styles.serviceType,
                {
                  backgroundColor:
                    selected === name ? colors.secondaryLight : "#FAFAFA",
                },
              ]}
            >
              <View style={styles.serviceTypeContent}>
              {selected === name ? (
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
                <View>
                  <Text weight="medium" style={{ fontSize: 15 }}>
                    {bookingTypes?.find(i => i.value === name)?.label}
                  </Text>
                  <Text
                    color={colors.textGray}
                    weight="medium"
                    style={styles.description}
                  >
                    {description}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
      <View>
        <Button
          title="Continue"
          onPress={handleContinue}
          style={{ marginTop: 12 }}
          disabled={!selected}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: "flex",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 100,
    paddingBottom: 50,
    backgroundColor: "#FFFFFF",
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
    letterSpacing: -0.8,
    marginTop: 25,
  },
  info: {
    fontSize: 17,
    marginBottom: 40,
  },
  serviceType: {
    paddingVertical: 20,
    paddingHorizontal: 15,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
    marginBottom: 16,
    borderRadius: 15,
  },
  serviceTypeContent: {
    display: "flex",
    flexDirection: "row",
    gap: 16,
    alignItems: 'flex-start',
  },
  description: {
    marginTop: 5,
    maxWidth: 260,
    letterSpacing: -0.4,
    fontSize: 15
  },
});

export default ServiceType;
