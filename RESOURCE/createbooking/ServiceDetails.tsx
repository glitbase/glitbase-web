import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Share,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import Text from "../../../../components/Text";
import { colors } from "../../../../utils/constants";
import { Service } from "../../../../services/servicesApi";
import { MarketplaceService } from "../../../../services/appDataApi";
import { formatPrice, formatDuration } from "../../../../utils/helper";
import Button from "../../../../components/Button";
import { addToCart, updateCartAddOns, clearCart } from "../../../../store/cartSlice";
import { RootState } from "../../../../store/store";
import CartSummary from "../../../../components/CartSummary";

type RouteParams = {
  service: Service | MarketplaceService;
};

const ServiceDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { service } = route.params as RouteParams;
  const { store } = useSelector((state: RootState) => state.store);
  
  // Check if service is MarketplaceService (has store property)
  const isMarketplaceService = 'store' in service && (service as MarketplaceService).store;
  
  // Get the service's store ID - prefer service.store.id (from MarketplaceService) over Redux store.id
  const serviceStoreId = isMarketplaceService 
    ? String((service as MarketplaceService).store)
    : store?.id 
    ? String(store.id)
    : null;
  
  // Get all carts to check for vendor mismatch
  const carts = useSelector((state: RootState) => state.cart.carts);
  const allCartStoreIds = useMemo(() => {
    if (!carts) return [];
    return Object.keys(carts);
  }, [carts]);
  
  const items = useSelector((state: RootState) => {
    if (!serviceStoreId || !state.cart.carts) return [];
    return state.cart.carts[serviceStoreId] || [];
  });

  // Check if this service is already in the cart
  const isInCart = items.some((item) => item.service.id === service.id);

  // Get current cart item for this service
  const cartItem = items.find((item) => item.service.id === service.id);

  // State for selected add-ons - initialize from cart if service is already added
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>(
    cartItem?.selectedAddOns?.map(addOn => addOn._id || addOn.id!).filter(Boolean) || []
  );

  // Show cart only if items exist AND current service is in cart
  const showCart = items.length > 0 && isInCart;

  const toggleAddOn = (addOnId: string) => {
    const newSelectedAddOns = selectedAddOns.includes(addOnId)
      ? selectedAddOns.filter((id) => id !== addOnId)
      : [...selectedAddOns, addOnId];

    setSelectedAddOns(newSelectedAddOns);

    // If service is already in cart, update add-ons immediately
    if (isInCart && serviceStoreId) {
      const addOns = service.addOns?.filter((addOn) => {
        const addOnId = addOn._id || (addOn as any).id;
        return newSelectedAddOns.includes(addOnId);
      }) || [];
      dispatch(updateCartAddOns({ storeId: serviceStoreId, serviceId: service.id, selectedAddOns: addOns }));
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${service.name} on Glitbase`,
        title: service.name,
      });
    } catch {
      Alert.alert("Error", "Failed to share service");
    }
  };

  const handleAddToCart = () => {
    if (!serviceStoreId) {
      Alert.alert("Error", "Unable to determine store information for this service.");
      return;
    }
    
    // Convert MarketplaceService to Service format if needed
    const serviceToAdd: Service = isMarketplaceService 
      ? {
          id: (service as MarketplaceService).id,
          name: (service as MarketplaceService).name,
          description: (service as MarketplaceService).description,
          type: (service as MarketplaceService).type,
          category: (service as MarketplaceService).category,
          imageUrl: (service as MarketplaceService).imageUrl,
          pricingType: (service as MarketplaceService).pricingType as 'fixed' | 'free' | 'from',
          maxBookingPerTimeSlot: (service as MarketplaceService).maxBookingPerTimeSlot,
          price: (service as MarketplaceService).price,
          currency: (service as MarketplaceService).currency as 'NGN' | 'GBP' | 'USD',
          durationInMinutes: (service as MarketplaceService).durationInMinutes,
          addOns: (service as MarketplaceService).addOns?.map(addOn => ({
            _id: addOn._id,
            name: addOn.name,
            description: addOn.description,
            price: addOn.price,
          })),
          status: (service as MarketplaceService).status as 'pending' | 'approved' | 'rejected',
          createdAt: (service as MarketplaceService).createdAt,
          updatedAt: (service as MarketplaceService).updatedAt,
        }
      : service as Service;
    
    // Get selected add-ons
    const addOns = serviceToAdd.addOns?.filter((addOn) => {
      const addOnId = addOn._id || (addOn as any).id;
      return selectedAddOns.includes(addOnId);
    }) || [];
    
    // Check if there's a cart with a different vendor
    if (allCartStoreIds.length > 0) {
      const hasDifferentVendorCart = allCartStoreIds.some(cartStoreId => {
        return String(cartStoreId) !== String(serviceStoreId);
      });
      
      if (hasDifferentVendorCart) {
        Alert.alert(
          "Different Provider",
          "You have services from a different provider in your cart. Would you like to clear your cart and add this service?",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Clear & Add",
              onPress: () => {
                dispatch(clearCart());
                dispatch(addToCart({ storeId: serviceStoreId, service: serviceToAdd, selectedAddOns: addOns }));
              },
            },
          ]
        );
        return;
      }
    }
    
    // If no conflict or no existing carts, add to cart
    dispatch(addToCart({ storeId: serviceStoreId, service: serviceToAdd, selectedAddOns: addOns }));
  };

  console.log('serviceStoreId:', serviceStoreId);
  console.log('service:', service?.store);
  console.log('store:', store?.id);


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textDark} />
        </Pressable>
        <Pressable
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={24} color={colors.textDark} />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Service Image */}
        <View style={{paddingHorizontal: 16}}>
            <Image source={{ uri: service.imageUrl }} style={styles.serviceImage} />
        </View>
        

        {/* Service Details */}
        <View style={styles.contentContainer}>

          {/* Service Name */}
          <Text weight="medium" style={styles.serviceName}>
            {service.name}
          </Text>

          {/* Price and Duration Row */}
          <View style={styles.servicePriceRow}>
            <Text weight='semiBold' style={styles.servicePrice}>
              {formatPrice(service.price, service.currency, service.pricingType)}
            </Text>
            <Text weight='medium' style={styles.serviceDuration}>
              • {formatDuration(service.durationInMinutes)}
            </Text>
          </View>

          {/* Description */}
          {service.description && (
            <View style={styles.section}>
              <Text weight="medium" style={styles.description}>
                {service.description}
              </Text>
            </View>
          )}

          {/* Add-ons */}
          {service.addOns && service.addOns.length > 0 && (
            <View style={styles.addOnsSection}>
              <Text weight="lora" style={styles.addOnsTitle}>
              Select add-ons
              </Text>
              {service.addOns.map((addOn) => {
                const addOnId = addOn._id || addOn.id!;
                return (
                <Pressable
                  key={addOnId}
                  onPress={() => toggleAddOn(addOnId)}
                  style={styles.addOnItem}
                >
                  <View style={styles.addOnLeft}>
                    <View>
                      <Text weight="medium" style={styles.addOnName}>
                        {addOn.name}
                      </Text>
                      {addOn.description && (
                        <Text weight="medium" style={styles.addOnDescription}>
                          {addOn.description}
                        </Text>
                      )}
                      <View style={styles.addOnPriceRow}>
                        <Text weight="semiBold" style={styles.addOnPrice}>
                          {formatPrice(addOn.price, service.currency, 'fixed')}
                        </Text>
                        {addOn.duration && (
                          <Text weight="medium" style={styles.addOnDuration}>
                            • {formatDuration((addOn.duration.hours * 60) + addOn.duration.minutes)}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      selectedAddOns.includes(addOnId) && styles.checkboxSelected,
                    ]}
                  >
                    {selectedAddOns.includes(addOnId) && (
                      <Ionicons name="checkmark" size={16} color={colors.textLight} />
                    )}
                  </View>
                </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Conditionally show Cart Summary or Add Service Button */}
      {showCart && serviceStoreId ? (
        <CartSummary storeId={serviceStoreId} />
      ) : (
        <View style={styles.bottomButtonContainer}>
          <Button
            title="Add Service"
            onPress={handleAddToCart}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.textLight,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 22,
    backgroundColor: colors.textLight,
  },
  scrollView: {
    flex: 1,
  },
  serviceImage: {
    width: "100%",
    height: 300,
    resizeMode: "cover",
    borderRadius: 16
  },
  contentContainer: {
    padding: 20,
  },
  serviceName: {
    fontSize: 19,
    color: colors.darkGray,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  servicePriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 15,
    paddingBottom: 10,
  },
  servicePrice: {
    fontSize: 17,
    color: colors.textDark,
  },
  serviceDuration: {
    fontSize: 17,
    color: colors.textGray,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    color: colors.textDark,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: colors.darkGray,
    lineHeight: 22,
  },
  addOnsSection: {
    marginTop: 12,
    paddingBottom: 70,
  },
  addOnsTitle: {
    fontSize: 19,
    color: colors.textDark,
    marginBottom: 12,
    letterSpacing: -0.5
  },
  addOnItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  addOnLeft: {
    flex: 1,
  },
  addOnName: {
    fontSize: 16,
    color: colors.textDark,
    marginBottom: 4,
  },
  addOnDescription: {
    fontSize: 14,
    color: colors.textGray,
    marginBottom: 6,
    maxWidth: '80%'
  },
  addOnPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  addOnPrice: {
    fontSize: 15,
    color: colors.textDark,
  },
  addOnDuration: {
    fontSize: 15,
    color: colors.textGray,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  bottomButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: colors.textLight,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
});

export default ServiceDetails;
