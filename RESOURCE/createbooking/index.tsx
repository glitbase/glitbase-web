import React, { useState, useRef } from "react";
import Constants from "expo-constants";
import {
  Image,
  Pressable,
  StyleSheet,
  View,
  Share,
  Alert,
  Animated,
  ScrollView,
} from "react-native";
import Text from "../../components/Text";
import { colors } from "../../utils/constants";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store/store";
import ProfilePicture from "../../components/ProfilePicture";
import Flex from "../../components/Flex";
import { useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { ActiveRole, StoreStatuses } from "../../models";
import CustomModal from "../../components/Modal";
import Button from "../../components/Button";
import CustomTabs from "../../components/Tabs";
import Reviews from "./components/Reviews";
import About from "./components/About";
import Services from "./components/Services/Services";
import Faqs from "./components/Faqs/Faqs";
import Gallery from "./components/Gallery";
import { useGetStoreByIdQuery } from "../../services/storeApi";
import { setStore } from "../../store/storeSlice";
import StoreSkeleton from "./components/StoreSkeleton";
import { SafeAreaView } from "react-native-safe-area-context";
import CartSummary from "../../components/CartSummary";
import { clearCart } from "../../store/cartSlice";

type RootStackParamList = {
  Profile: undefined;
  StoreSetupEdit: { mode: "edit" };
  LocationSetupEdit: { mode: "edit" };
  Store: { storeId?: string; defaultTab?: number; source?: 'glitmatch' | 'other' };
  CreateBooking: { storeId: string };
  Cart: { storeId: string };
};

const webUrl = (Constants.expoConfig?.extra as { webUrl: string }).webUrl;

const Store = () => {
  const { user } = useSelector((state: RootState) => state.user);
  const { store } = useSelector((state: RootState) => state.store);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);

  console.log('STORE:', store)

  // Get cart items for current store
  const cartItems = useSelector((state: RootState) => {
    if (!store?.id || !state.cart.carts) return [];
    return state.cart.carts[store.id] || [];
  });

  const canEdit = (user?.id === store?.owner?.id) && user?.activeRole === ActiveRole.VENDOR

  // Get route params for store ID and source
  const { storeId, defaultTab: routeDefaultTab, source } = (route.params as { storeId?: string; defaultTab?: number; source?: 'glitmatch' | 'other' }) || {};
  
  // source indicates where the navigation came from: 'glitmatch' from ViewGlit recommended providers, 'other' for other sources
  // This can be used to customize behavior based on navigation source
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const navigationSource = source || 'other'; // Available for use: indicates if navigated from glitmatch or other source
  
  // Fetch store by ID when storeId is provided (for both customers and vendors viewing other stores)
  const shouldFetchStoreById = !!storeId && (user?.activeRole === ActiveRole.CUSTOMER || (user?.activeRole === ActiveRole.VENDOR && storeId !== store?.id));
  const { data: storeByIdData, isLoading: isLoadingStoreById } = useGetStoreByIdQuery(storeId!, {
    skip: !shouldFetchStoreById,
  });

  // Update store data in Redux when store is fetched by ID
  React.useEffect(() => {
    if (shouldFetchStoreById && storeByIdData?.data?.store) {
      dispatch(setStore(storeByIdData.data.store));
    }
  }, [storeByIdData, shouldFetchStoreById, dispatch]);
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = useRef(new Animated.Value(1)).current;
  const tabsOpacity = useRef(new Animated.Value(0)).current;
  const [activeTab, setActiveTab] = useState(routeDefaultTab ?? 0);

  const tabItems = [
    {
      title: "Services",
      render: <Services canEdit={canEdit} />,
    },
    {
      title: "Faqs",
      render: <Faqs canEdit={canEdit} />,
    },
    {
      title: "About",
      render: <About canEdit={canEdit} />,
    },
    {
      title: "Gallery",
      render: <Gallery canEdit={canEdit} />,
    },
    {
      title: "Reviews",
      render: <Reviews />,
    },
  ];

  const storeUrl = `${webUrl?.slice(8)}${store?.name
    ?.split(" ")
    ?.join("")
    ?.toLowerCase()}`;
  const fullStoreUrl = `https://${storeUrl}`;

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Check out ${
          user?.vendorName || "this store"
        } on Glitbase: ${fullStoreUrl}`,
        url: fullStoreUrl,
        title: `${user?.vendorName || "Store"} - Glitbase`,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with activity type of result.activityType
        } else {
          // Shared
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
      }
    } catch {
      Alert.alert("Error", "Failed to share store");
    }
  };

  const handleSwitchToCustomer = () => {
    setShowModal(false);
    // TODO: Implement switch to customer view
    Alert.alert(
      "Switch View",
      "Switch to customer view functionality will be implemented"
    );
  };

  const handleEditProfile = () => {
    setShowModal(false);
    navigation.navigate("StoreSetupEdit", { mode: "edit" });
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const threshold = 350;
        const tabsThreshold = 520;

        if (offsetY > threshold) {
          Animated.timing(headerHeight, {
            toValue: 0,
            duration: 80,
            useNativeDriver: false,
          }).start();
        } else {
          Animated.timing(headerHeight, {
            toValue: 1,
            duration: 80,
            useNativeDriver: false,
          }).start();
        }

        if (offsetY > tabsThreshold) {
          Animated.timing(tabsOpacity, {
            toValue: 1,
            duration: 10,
            useNativeDriver: false,
          }).start();
        } else {
          Animated.timing(tabsOpacity, {
            toValue: 0,
            duration: 10,
            useNativeDriver: false,
          }).start();
        }
      },
    }
  );

  const headerOpacity = headerHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const headerTranslateY = headerHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 0],
    extrapolate: "clamp",
  });

  // Show skeleton loader for customers while loading store data
  if (shouldFetchStoreById && isLoadingStoreById) {
    return <StoreSkeleton />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
        >
          <View style={styles.topContent}>
            <Flex style={{ opacity: user?.activeRole === ActiveRole.CUSTOMER ? 1 : source === 'glitmatch' ? 1 : 0 }}>
            <Pressable
                onPress={() => navigation.goBack()}
                style={{
                  backgroundColor: "#FFF",
                  padding: 8,
                  borderRadius: 50,
                  borderWidth: 1,
                  borderColor: colors.lightGray
                }}
              >
                <Ionicons name="chevron-back" size={20} />
              </Pressable>
              {user?.activeRole === ActiveRole.VENDOR && source !== 'glitmatch' && 
              <Pressable
                style={{
                  backgroundColor: "#FFF",
                  padding: 9,
                  borderRadius: 50,
                }}
              >
                <Ionicons name="ellipsis-vertical" size={20} />
              </Pressable>}
            </Flex>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.primaryLight,
                borderRadius: 20,
                paddingVertical: 3,
                paddingHorizontal: 10,
                gap: 4,
              }}
            >
              <Ionicons name="ellipse" size={10} color={colors.primaryAlt} />
              <Text
                weight="semiBold"
                style={{ fontSize: 12, color: colors.primaryAlt }}
              >
                {StoreStatuses?.find((i) => i.value === store?.status)?.label}
              </Text>
            </View>
            <Flex>
              <Pressable
                onPress={handleShare}
                style={{
                  backgroundColor: "#FFF",
                  padding: 8,
                  borderRadius: 50,
                }}
              >
                <Ionicons name="share-outline" size={22} />
              </Pressable>
              {user?.activeRole === ActiveRole.VENDOR &&
              <Pressable
                onPress={() => setShowModal(true)}
                style={{
                  backgroundColor: "#FFF",
                  padding: 9,
                  borderRadius: 50,
                }}
              >
                <Ionicons name="ellipsis-vertical" size={20} />
              </Pressable>}
            </Flex>
          </View>
          <Image
            source={{ uri: store?.bannerImageUrl }}
            resizeMode="cover"
            style={styles.coverImage}
          />
          <Pressable
            style={styles.profilePictureContainer}
            onPress={() => store?.id && dispatch(clearCart(store.id))}
          >
            <ProfilePicture showCameraIcon={false} disabled={true} size={90} altUrl={store?.owner?.profileImageUrl} />
          </Pressable>
          <View style={styles.content}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Text weight="semiBold" color={colors.textDark}>
                {store?.name}
              </Text>
              <Image
                source={{
                  uri: "https://cdn-icons-png.flaticon.com/128/15050/15050690.png",
                }}
                style={{ width: 20, height: 20 }}
                resizeMode="contain"
              />
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Image
                source={{
                  uri: "https://cdn-icons-png.flaticon.com/128/2099/2099156.png",
                }}
                style={{ width: 13, height: 13 }}
                resizeMode="contain"
              />
              <Text weight="medium">
                {store?.rating}{" "}
                <Text weight="semiBold" style={{ color: colors.primary }}>
                  ({store?.reviewCount})
                </Text>
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginVertical: 6,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: "#F0F0F0",
                paddingHorizontal: 12,
                paddingVertical: 6,
                marginTop: 8,
              }}
            >
              {store?.type?.map((i: string, index: number) => (
                <View
                  key={i}
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  {index > 0 && (
                    <Ionicons
                      name="ellipse"
                      size={7}
                      color={colors.mediumGray}
                      style={{ marginTop: 2 }}
                    />
                  )}
                  <Text weight="medium" style={styles.info}>
                    {i}
                  </Text>
                </View>
              ))}
            </View>
            <Text weight="medium" style={styles.description}>
              {store?.description}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginTop: 10,
              }}
            >
              <Ionicons
                name="link"
                size={20}
                color={colors.info}
                style={{ marginTop: 4 }}
              />
              <Text
                weight="medium"
                style={[styles.description, { color: colors.info }]}
              >
                {storeUrl}
              </Text>
            </View>
            <Pressable
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 14,
              }}
              onPress={() => {
                if(canEdit) {
                  navigation.navigate("LocationSetupEdit", { mode: "edit" })
                }
              }
              }
            >
              <Image
                source={{
                  uri: "https://cdn-icons-png.flaticon.com/128/16002/16002329.png",
                }}
                style={{ width: 16, height: 16 }}
                resizeMode="contain"
              />
              <Text
                weight="medium"
                style={[styles.description, { color: colors.darkGray }]}
              >
                {store?.location?.name}, {store?.location?.state}
              </Text>
            </Pressable>
           {canEdit && 
           <Pressable
              style={styles.editButton}
              onPress={() =>
                navigation.navigate("StoreSetupEdit", { mode: "edit" })
              }
            >
              <Text style={styles.editButtonText} weight="semiBold">
                Edit profile
              </Text>
            </Pressable>}
          </View>
        </Animated.View>
        <View style={styles.tabsContainer}>
          <CustomTabs
            tabItems={tabItems}
            defaultTab={activeTab}
            setDefaultTab={setActiveTab}
          />
        </View>
      </ScrollView>

      <Animated.View
        style={[styles.fixedTabsContainer, { opacity: tabsOpacity }]}
      >
        <CustomTabs
          tabItems={tabItems}
          defaultTab={activeTab}
          setDefaultTab={setActiveTab}
          showContent={false}
        />
      </Animated.View>

      {/* Floating Add Buttons - Show based on active tab */}
      {(activeTab === 0 && canEdit) && (
        <Pressable 
          style={styles.floatingButton} 
          onPress={() => navigation.navigate('CreateService' as any)}
        >
          <Ionicons name="add" size={24} color={colors.textLight} />
        </Pressable>
      )}
      
      {(activeTab === 1 && canEdit) && (
        <Pressable 
          style={styles.floatingButton} 
          onPress={() => navigation.navigate('CreateFaq' as any)}
        >
          <Ionicons name="add" size={24} color={colors.textLight} />
        </Pressable>
      )}

      <CustomModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        position="bottom"
      >
        <View style={styles.modalContent}>
          {/* <Pressable
            onPress={handleSwitchToCustomer}
            style={styles.modalOption}
          >
            <View style={styles.modalIconContainer}>
              <Image
                source={{
                  uri: "https://cdn-icons-png.flaticon.com/128/17740/17740840.png",
                }}
                style={styles.modalIcon}
                resizeMode="contain"
              />
            </View>
            <Text weight="medium" style={styles.modalOptionText}>
              Switch to customer view
            </Text>
          </Pressable> */}

          <Pressable
            onPress={handleEditProfile}
            style={[styles.modalOption, { marginBottom: 24 }]}
          >
            <View style={styles.modalIconContainer}>
              <Image
                source={{
                  uri: "https://cdn-icons-png.flaticon.com/128/16972/16972938.png",
                }}
                style={styles.modalIcon}
                resizeMode="contain"
              />
            </View>
            <Text weight="medium" style={styles.modalOptionText}>
              Edit profile
            </Text>
          </Pressable>
          <Button
            title="Close"
            variant="ghostgray"
            onPress={() => setShowModal(false)}
          />
        </View>
      </CustomModal>

      {/* Cart Summary - Show when cart has items for this store */}
      {cartItems.length > 0 && store?.id && (
        <CartSummary 
          storeId={store.id} 
          onCartClick={() => navigation.navigate("Cart", { storeId: store.id! })}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.textLight,
  },
  coverImage: {
    height: 200,
    width: "100%",
    zIndex: 4,
  },
  header: {
    position: "relative",
  },
  topContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 40,
    position: "absolute",
    width: "100%",
    top: 30,
    zIndex: 10,
    paddingHorizontal: 12,
  },
  profilePictureContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    marginTop: -50,
    zIndex: 15,
  },
  content: {
    paddingTop: 15,
    flexDirection: "column",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    fontSize: 14,
    color: colors.textDark,
    textTransform: "capitalize",
  },
  description: {
    textAlign: "center",
    maxWidth: "90%",
    color: colors.darkGray,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    paddingBottom: 10,
    borderRadius: 24,
    backgroundColor: colors.secondaryLight,
  },
  editButtonText: {
    fontSize: 14,
    color: colors.secondaryDark,
  },
  modalContent: {},
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 22,
  },
  modalIconContainer: {
    width: 24,
    height: 24,
    marginRight: 16,
  },
  modalIcon: {
    width: 24,
    height: 24,
  },
  modalOptionText: {
    fontSize: 16,
    color: colors.textDark,
  },
  tabsContainer: {
    backgroundColor: colors.textLight,
    paddingHorizontal: 16,
    marginTop: 12,
    paddingBottom: 10,
  },
  scrollContainer: {
    flex: 1,
  },
  fixedTabsContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.textLight,
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    zIndex: 30,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 25,
  },
});

export default Store;
