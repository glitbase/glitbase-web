import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TextInput, Pressable, Image, ActivityIndicator, Dimensions } from "react-native";
import Text from "../../../../components/Text";
import Button from "../../../../components/Button";
import TextArea from "../../../../components/TextArea";
import { useToast } from "../../../../contexts/ToastContext";
import GoBack from "../../../../components/GoBack";
import Header from "../../../../components/Header";
import { colors, countries } from "../../../../utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { BookingFormData } from "./index";
import { useSelector } from "react-redux";
import { RootState } from "../../../../store/store";
import useImageUpload from "../../../../hooks/useImageUpload";

const { width: screenWidth } = Dimensions.get('window');
// Calculate tile size: screen width - padding (40) - gaps between 3 tiles (12 * 2) / 3 tiles
const TILE_SIZE = (screenWidth - 40 - 25) / 3;

interface ConfirmBookingDetailsProps {
  formData: BookingFormData;
  updateFormData: (data: Partial<BookingFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const ConfirmBookingDetails: React.FC<ConfirmBookingDetailsProps> = ({ formData, updateFormData, onNext, onBack }) => {
  const { showToast } = useToast();
  const { user } = useSelector((state: RootState) => state.user);

  // Initialize from formData if available
  const parseContactNotes = () => {
    if (formData.contactNotes) {
      try {
        return JSON.parse(formData.contactNotes);
      } catch {
        return null;
      }
    }
    return null;
  };

  const parseImages = () => {
    if (formData.additionalImages) {
      try {
        return JSON.parse(formData.additionalImages);
      } catch {
        return [];
      }
    }
    return [];
  };

  const contactNotes = parseContactNotes();

  const [selectedCountry] = useState<any>(countries.find((i: any) => i.name === user?.countryName));
  const [phoneNumber, setPhoneNumber] = useState(() => {
    // If we have saved contact notes with a phone number, use it
    if (contactNotes?.phoneNumber) {
      const savedPhone = contactNotes.phoneNumber;
      // Remove the country dial code to get just the number
      if (user?.countryCode === "NG") {
        return savedPhone.replace(/^\+234/, '');
      } else {
        return savedPhone.replace(/^\+\d{1,3}/, '');
      }
    }
    // Otherwise use the default from user profile
    return user?.countryCode === "NG" ? user?.phoneNumber?.slice(4) : user?.phoneNumber?.slice(3) || "";
  });
  const [additionalNotes, setAdditionalNotes] = useState(formData.additionalNotes || "");
  const [images, setImages] = useState<string[]>(parseImages());

  const { uploadImages, uploading } = useImageUpload({ multiple: false, showToast });

  const handleAddImage = async () => {
    if (images.length >= 3) {
      showToast({
        message: "Maximum 3 images allowed",
        type: "error",
      });
      return;
    }

    try {
      const urls = await uploadImages();
      if (urls.length > 0) {
        const remainingSlots = 3 - images.length;
        const newImages = [...images, ...urls.slice(0, remainingSlots)];
        setImages(newImages);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    if (!phoneNumber.trim()) {
      showToast({
        message: "Please enter your phone number",
        type: "error",
      });
      return;
    }

    // Save contact info and additional info to form data
    updateFormData({
      contactNotes: JSON.stringify({
        name: `${user?.firstName} ${user?.lastName}`,
        email: user?.email,
        phoneNumber: `${selectedCountry?.dialCode}${phoneNumber}`,
      }),
      additionalNotes: additionalNotes,
      additionalImages: JSON.stringify(images),
    });

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
          Confirm your details
        </Header>
        <Text style={styles.info} weight="medium" color={colors.textGray}>
          Please verify your contact information before proceeding.
        </Text>

        <View style={styles.formContainer}>
          {/* Full Name - Disabled */}
          <View style={styles.disabledInputWrapper}>
            <Text weight="medium" style={styles.label}>
              Full name
            </Text>
            <View style={styles.disabledInput}>
              <Text weight="medium" style={styles.disabledInputText}>
                {user?.firstName} {user?.lastName}
              </Text>
            </View>
          </View>

          {/* Email Address - Disabled */}
          <View style={styles.disabledInputWrapper}>
            <Text weight="medium" style={styles.label}>
              Email address
            </Text>
            <View style={styles.disabledInput}>
              <Text weight="medium" style={styles.disabledInputText}>
                {user?.email}
              </Text>
            </View>
          </View>

          {/* Phone Number */}
          <View style={styles.phoneWrapper}>
            <Text weight="medium" style={styles.label}>
              Phone number
            </Text>
            <View style={styles.phoneContainer}>
              {/* Country Flag + Dropdown (Disabled) */}
              <Pressable
                disabled
                style={[styles.countrySelector, styles.disabledSelector]}
              >
                <Text style={styles.flagText}>{selectedCountry?.flag}</Text>
                <Ionicons name="chevron-down" size={18} color={colors.mediumGray} />
              </Pressable>

              {/* Phone Number Input */}
              <View style={styles.phoneInputContainer}>
                <Text weight="medium" style={styles.countryCodePrefix}>
                  {selectedCountry?.dialCode}
                </Text>
                <TextInput
                  placeholder="Phone Number"
                  placeholderTextColor={colors.mediumGray}
                  onChangeText={setPhoneNumber}
                  value={phoneNumber}
                  keyboardType="number-pad"
                  maxLength={10}
                  style={styles.phoneInput}
                />
              </View>
            </View>
          </View>

          {/* Additional Notes */}
          <TextArea
            label="Additional notes (optional)"
            value={additionalNotes}
            onChangeText={setAdditionalNotes}
            placeholder="Any special requests or preferences..."
          />

          {/* Image Gallery */}
          <View style={styles.gallerySection}>
            {images.length === 0 ? (
              <Pressable
                style={styles.fullWidthAddTile}
                onPress={handleAddImage}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color={colors.textGray} />
                ) : (
                  <>
                    <Ionicons name="image-outline" size={32} color={colors.darkGray} />
                    <Text weight="medium" style={styles.addMediaText}>
                      Add media
                    </Text>
                  </>
                )}
              </Pressable>
            ) : (
              <View style={styles.grid}>
                {images.length < 3 && (
                  <Pressable
                    style={[styles.tile, styles.addTile]}
                    onPress={handleAddImage}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <ActivityIndicator color={colors.textGray} />
                    ) : (
                      <Ionicons name="image-outline" size={28} color={colors.darkGray} />
                    )}
                  </Pressable>
                )}

                {images.map((imageUrl, index) => (
                  <View key={index} style={styles.tile}>
                    <Image source={{ uri: imageUrl }} style={styles.image} />
                    <Pressable
                      onPress={() => handleRemoveImage(index)}
                      style={styles.deleteBtn}
                    >
                      <View style={styles.deleteIconWrap}>
                        <Ionicons name="close" size={20} color={colors.textLight} />
                      </View>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={handleContinue}
          style={{ marginTop: 12 }}
          disabled={uploading}
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
  disabledInputWrapper: {
    marginBottom: 16,
  },
  disabledInput: {
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    opacity: 0.6,
  },
  disabledInputText: {
    fontSize: 16,
    color: colors.textDark,
  },
  phoneWrapper: {
    marginVertical: 14,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: colors.textDark,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  disabledSelector: {
    opacity: 0.6,
  },
  flagText: {
    fontSize: 20,
    marginRight: 8,
  },
  phoneInputContainer: {
    flex: 1,
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneInput: {
    fontSize: 16,
    color: colors.textDark,
    fontFamily: "Nunito-Medium",
    paddingVertical: 0,
    flex: 1,
    minWidth: 0,
  },
  countryCodePrefix: {
    fontSize: 17,
    color: colors.textDark,
    marginRight: 8,
  },
  footer: {
    paddingTop: 20,
    paddingBottom: 30,
  },
  gallerySection: {
    marginTop: 6,
  },
  gallerySubtext: {
    fontSize: 14,
    color: colors.textGray,
    marginTop: 4,
    marginBottom: 16,
  },
  fullWidthAddTile: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.lightGray,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightGray,
  },
  addMediaText: {
    fontSize: 16,
    color: colors.darkGray,
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.lightGray,
    position: 'relative',
  },
  addTile: {
    borderWidth: 2,
    borderColor: colors.lightGray,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  deleteBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  deleteIconWrap: {
    width: 32,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
});

export default ConfirmBookingDetails;
