import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import Text from "../../../../components/Text";
import Button from "../../../../components/Button";
import Input from "../../../../components/Input";
import { useToast } from "../../../../contexts/ToastContext";
import GoBack from "../../../../components/GoBack";
import Header from "../../../../components/Header";
import { colors } from "../../../../utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { BookingFormData } from "./index";

interface PaymentDetailsProps {
  formData: BookingFormData;
  updateFormData: (data: Partial<BookingFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const PaymentDetails: React.FC<PaymentDetailsProps> = ({ formData, updateFormData, onNext, onBack }) => {
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, "");
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(" ") : cleaned;
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handleCardNumberChange = (text: string) => {
    const cleaned = text.replace(/\s/g, "");
    if (cleaned.length <= 16) {
      setCardNumber(formatCardNumber(cleaned));
    }
  };

  const handleExpiryChange = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length <= 4) {
      setExpiry(formatExpiry(cleaned));
    }
  };

  const handleCvvChange = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length <= 3) {
      setCvv(cleaned);
    }
  };

  const handleContinue = () => {
    if (!name.trim()) {
      showToast({
        message: "Please enter cardholder name",
        type: "error",
      });
      return;
    }

    if (cardNumber.replace(/\s/g, "").length !== 16) {
      showToast({
        message: "Please enter a valid card number",
        type: "error",
      });
      return;
    }

    if (expiry.length !== 5) {
      showToast({
        message: "Please enter expiry date (MM/YY)",
        type: "error",
      });
      return;
    }

    if (cvv.length !== 3) {
      showToast({
        message: "Please enter a valid CVV",
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
        Add your card details
        </Header>
        <Text style={styles.info} weight="medium" color={colors.textGray}>
        Complete your purchase by adding your payment details. Your data is always secure.
        </Text>

        <View style={styles.formContainer}>
          {/* Cardholder Name */}
          <Input
            label="Name on card"
            value={name}
            onChangeText={setName}
            placeholder="Name on card"
          />

          {/* Card Number */}
          <View style={styles.cardInputWrapper}>
            <Input
              label="Card number"
              value={cardNumber}
              onChangeText={handleCardNumberChange}
              placeholder="1234 5678 9012 3456"
              type="tel"
            />
            <Ionicons
              name="card-outline"
              size={20}
              color={colors.mediumGray}
              style={styles.cardIcon}
            />
          </View>

          {/* Expiry and CVV */}
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Input
                label="Expiry Date"
                value={expiry}
                onChangeText={handleExpiryChange}
                placeholder="MM/YY"
                type="tel"
              />
            </View>

            <View style={styles.halfWidth}>
              <Input
                label="CVV"
                value={cvv}
                onChangeText={handleCvvChange}
                placeholder="123"
                type="tel"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={handleContinue}
          style={{ marginTop: 12 }}
        />
      </View>
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
  formContainer: {
    marginTop: 10,
  },
  cardInputWrapper: {
    position: "relative",
    marginVertical: 14
  },
  cardIcon: {
    position: "absolute",
    right: 15,
    top: 48,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  footer: {
    paddingTop: 20,
    paddingBottom: 30,
  },
});

export default PaymentDetails;
