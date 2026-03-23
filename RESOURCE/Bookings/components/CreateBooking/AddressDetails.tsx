import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import Text from '../../../../components/Text';
import Button from '../../../../components/Button';
import GoBack from '../../../../components/GoBack';
import Header from '../../../../components/Header';
import Input from '../../../../components/Input';
import TextArea from '../../../../components/TextArea';
import { colors } from '../../../../utils/constants';
import { BookingFormData } from './index';
import { Ionicons } from '@expo/vector-icons';

interface AddressDetailsProps {
  formData: BookingFormData;
  updateFormData: (data: Partial<BookingFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface AddressFormData {
  address: string;
  apartment: string;
  city: string;
  postalCode: string;
  additionalDirections: string;
}

const AddressDetails: React.FC<AddressDetailsProps> = ({ formData, updateFormData, onNext, onBack }) => {
  const isHomeService = formData.serviceType === 'home';
  const isPickDropService = formData.serviceType === 'pickDrop';

  // Initialize from formData if available
  const parseAddressData = (jsonString?: string): AddressFormData => {
    if (!jsonString) {
      return {
        address: '',
        apartment: '',
        city: '',
        postalCode: '',
        additionalDirections: '',
      };
    }
    try {
      return JSON.parse(jsonString);
    } catch {
      return {
        address: '',
        apartment: '',
        city: '',
        postalCode: '',
        additionalDirections: '',
      };
    }
  };

  // Home service address
  const [homeAddress, setHomeAddress] = useState<AddressFormData>(() => parseAddressData(formData.contactAddress));

  // Pickup address
  const [pickupAddress, setPickupAddress] = useState<AddressFormData>(() => parseAddressData(formData.pickupAddress));

  // Dropoff address
  const [dropoffAddress, setDropoffAddress] = useState<AddressFormData>(() => parseAddressData(formData.dropoffAddress));

  // Accordion states
  const [isPickupExpanded, setIsPickupExpanded] = useState(true);
  const [isDropoffExpanded, setIsDropoffExpanded] = useState(false);

  // Same as pickup checkbox - check if addresses match
  const [sameAsPickup, setSameAsPickup] = useState(() => {
    if (formData.pickupAddress && formData.dropoffAddress) {
      return formData.pickupAddress === formData.dropoffAddress;
    }
    return false;
  });

  const handleSameAsPickupToggle = () => {
    const newValue = !sameAsPickup;
    setSameAsPickup(newValue);

    if (newValue) {
      // Copy pickup address to dropoff
      setDropoffAddress({
        address: pickupAddress.address,
        apartment: pickupAddress.apartment,
        city: pickupAddress.city,
        postalCode: pickupAddress.postalCode,
        additionalDirections: pickupAddress.additionalDirections,
      });
    } else {
      // Clear dropoff address
      setDropoffAddress({
        address: '',
        apartment: '',
        city: '',
        postalCode: '',
        additionalDirections: '',
      });
    }
  };

  // Update dropoff address when pickup changes and "same as pickup" is checked
  useEffect(() => {
    if (sameAsPickup) {
      setDropoffAddress({
        address: pickupAddress.address,
        apartment: pickupAddress.apartment,
        city: pickupAddress.city,
        postalCode: pickupAddress.postalCode,
        additionalDirections: pickupAddress.additionalDirections,
      });
    }
  }, [pickupAddress, sameAsPickup]);

  const handleContinue = () => {
    // Validate required fields
    if (isHomeService) {
      if (!homeAddress.address.trim() || !homeAddress.city.trim() || !homeAddress.postalCode.trim()) {
        return;
      }

      updateFormData({
        contactAddress: JSON.stringify(homeAddress),
      });
    }

    if (isPickDropService) {
      const finalDropoffAddress = sameAsPickup ? pickupAddress : dropoffAddress;

      if (!pickupAddress.address.trim() || !pickupAddress.city.trim() || !pickupAddress.postalCode.trim()) {
        return;
      }

      if (!finalDropoffAddress.address.trim() || !finalDropoffAddress.city.trim() || !finalDropoffAddress.postalCode.trim()) {
        return;
      }

      updateFormData({
        pickupAddress: JSON.stringify(pickupAddress),
        dropoffAddress: JSON.stringify(finalDropoffAddress),
      });
    }

    onNext();
  };

  const isFormValid = () => {
    if (isHomeService) {
      return homeAddress.address.trim().length > 0 &&
             homeAddress.city.trim().length > 0 &&
             homeAddress.postalCode.trim().length > 0;
    }

    if (isPickDropService) {
      const finalDropoffAddress = sameAsPickup ? pickupAddress : dropoffAddress;

      return pickupAddress.address.trim().length > 0 &&
             pickupAddress.city.trim().length > 0 &&
             pickupAddress.postalCode.trim().length > 0 &&
             finalDropoffAddress.address.trim().length > 0 &&
             finalDropoffAddress.city.trim().length > 0 &&
             finalDropoffAddress.postalCode.trim().length > 0;
    }

    return false;
  };

  const renderAddressForm = (
    addressData: AddressFormData,
    setAddressData: React.Dispatch<React.SetStateAction<AddressFormData>>,
    disabled: boolean = false
  ) => (
    <View style={{flexDirection: 'column', gap: 8}}>
      <Input
        label="Home address"
        placeholder="Home address"
        value={addressData.address}
        onChangeText={(text) => !disabled && setAddressData({ ...addressData, address: text })}
        style={disabled && styles.disabledInput}
      />

      <Input
        label="Apartment, suite, etc. (optional)"
        placeholder="Apt, suite, etc."
        value={addressData.apartment}
        onChangeText={(text) => !disabled && setAddressData({ ...addressData, apartment: text })}
        style={disabled && styles.disabledInput}
      />

      <View style={styles.rowInputs}>
        <View style={{ flex: 1 }}>
          <Input
            label="City"
            placeholder="City"
            value={addressData.city}
            onChangeText={(text) => !disabled && setAddressData({ ...addressData, city: text })}
            style={disabled && styles.disabledInput}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Input
            label="Postal code"
            placeholder="Postal code"
            value={addressData.postalCode}
            onChangeText={(text) => !disabled && setAddressData({ ...addressData, postalCode: text })}
            style={disabled && styles.disabledInput}
          />
        </View>
      </View>

      <TextArea
        label="Additional directions (optional)"
        placeholder="Any landmarks or special directions to help us find you..."
        value={addressData.additionalDirections}
        onChangeText={(text) => !disabled && setAddressData({ ...addressData, additionalDirections: text })}
        style={disabled && styles.disabledInput}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <GoBack goBack={onBack} />
          <View />
        </View>
        <Header style={styles.title} weight="bold">
          {isHomeService ? 'Enter your home address' : 'Pickup & dropoff details'}
        </Header>
        <Text style={styles.info} weight="medium" color={colors.textGray}>
          {isHomeService
            ? 'Please provide your complete home address so our service provider can locate you'
            : 'Provide pickup and dropoff locations for your service'}
        </Text>

        <View style={styles.formContainer}>
          {isHomeService && renderAddressForm(homeAddress, setHomeAddress)}

          {isPickDropService && (
            <>
              {/* Pickup Address Accordion */}
              <Pressable
                style={styles.accordionHeader}
                onPress={() => setIsPickupExpanded(!isPickupExpanded)}
              >
                <Text weight="medium" style={styles.accordionTitle}>
                  Pickup location
                </Text>
                <Ionicons
                  name={isPickupExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textDark}
                />
              </Pressable>

              {isPickupExpanded && (
                <View style={styles.accordionContent}>
                  {renderAddressForm(pickupAddress, setPickupAddress)}
                </View>
              )}

              {/* Dropoff Address Accordion */}
              <Pressable
                style={[styles.accordionHeader, { marginTop: 6 }]}
                onPress={() => setIsDropoffExpanded(!isDropoffExpanded)}
              >
                <Text weight="medium" style={styles.accordionTitle}>
                  Dropoff location
                </Text>
                <Ionicons
                  name={isDropoffExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textDark}
                />
              </Pressable>

              {isDropoffExpanded && (
                <View style={styles.accordionContent}>
                  {/* Same as pickup checkbox */}
                  <Pressable
                    style={styles.checkboxContainer}
                    onPress={handleSameAsPickupToggle}
                  >
                    <Ionicons
                      name={sameAsPickup ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={sameAsPickup ? colors.secondary : colors.mediumGray}
                    />
                    <Text weight="medium" style={styles.checkboxLabel}>
                      Same as pickup location
                    </Text>
                  </Pressable>

                  {renderAddressForm(dropoffAddress, setDropoffAddress, sameAsPickup)}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!isFormValid()}
          style={{ marginTop: 12 }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 100,
  },
  headerRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  required: {
    color: '#FF3B30',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  disabledInput: {
    opacity: 0.6,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // backgroundColor: colors.lightGray,
    borderRadius: 12,
    // paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
  },
  accordionTitle: {
    fontSize: 17,
    color: colors.textDark,
  },
  accordionContent: {
    marginBottom: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    gap: 10,
  },
  checkboxLabel: {
    fontSize: 16,
    color: colors.textDark,
  },
  footer: {
    paddingTop: 20,
    paddingBottom: 30,
  },
});

export default AddressDetails;
