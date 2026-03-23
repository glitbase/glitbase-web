import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, ScrollView, Image, Modal, Pressable, Dimensions } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import Text from '../../../components/Text';
import Button from '../../../components/Button';
import { colors } from '../../../utils/constants';
import GoBack from '../../../components/GoBack';
import { Ionicons } from '@expo/vector-icons';
import { useGetBookingByReferenceQuery, useConfirmBookingMutation, useUpdateBookingStageMutation, useCompleteBookingVendorMutation, useRejectBookingMutation } from '../../../services/bookingsApi';
import { useCreateBookingChatMutation } from '../../../services/chatApi';
import { formatDuration, getCurrencySymbol } from '../../../utils/helper';
import { useToast } from '../../../contexts/ToastContext';
import CustomModal from '../../../components/Modal';

const { width: screenWidth } = Dimensions.get('window');

type VendorBookingDetailsRouteProp = RouteProp<{
  VendorBookingDetails: { bookingReference: string };
}, 'VendorBookingDetails'>;

const VendorBookingDetails = () => {
  const route = useRoute<VendorBookingDetailsRouteProp>();
  const navigation = useNavigation();
  const { bookingReference } = route.params;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const { showToast } = useToast();

  const { data, isLoading, error } = useGetBookingByReferenceQuery(bookingReference, {
    refetchOnMountOrArgChange: true,
  });
  const booking = data?.data?.booking;

  const [confirmBooking, { isLoading: isConfirming }] = useConfirmBookingMutation();
  const [updateBookingStage, { isLoading: isUpdatingStage }] = useUpdateBookingStageMutation();
  const [completeBookingVendor, { isLoading: isCompleting }] = useCompleteBookingVendorMutation();
  const [rejectBooking, { isLoading: isRejecting }] = useRejectBookingMutation();
  const [createBookingChat, { isLoading: isCreatingChat }] = useCreateBookingChatMutation();

  const handleAcceptBooking = async () => {
    try {
      await confirmBooking(bookingReference).unwrap();
      showToast({
        message: 'Booking accepted successfully',
        type: 'success',
      });
    } catch (err: any) {
      showToast({
        message: err?.data?.message || 'Failed to accept booking',
        type: 'error',
      });
    }
  };

  const handleUpdateStage = async (stage: string, successMessage: string) => {
    try {
      await updateBookingStage({ reference: bookingReference, stage }).unwrap();
      showToast({
        message: successMessage,
        type: 'success',
      });
    } catch (err: any) {
      showToast({
        message: err?.data?.message || 'Failed to update booking stage',
        type: 'error',
      });
    }
  };

  const handleCompleteBooking = async () => {
    try {
      await completeBookingVendor(bookingReference).unwrap();
      showToast({
        message: 'Booking marked as completed',
        type: 'success',
      });
    } catch (err: any) {
      showToast({
        message: err?.data?.message || 'Failed to complete booking',
        type: 'error',
      });
    }
  };

  const handleRejectBooking = async () => {
    try {
      await rejectBooking({
        reference: bookingReference,
        reason: 'Service not available'
      }).unwrap();
      showToast({
        message: 'Booking rejected successfully',
        type: 'success',
      });
      setRejectModalVisible(false);
      // Navigate back to bookings list
      (navigation as any).goBack();
    } catch (err: any) {
      showToast({
        message: err?.data?.message || 'Failed to reject booking',
        type: 'error',
      });
    }
  };

  const handleMessage = async () => {
    if (!booking) return;
    
    try {
      // Create chat for this booking
      const result = await createBookingChat({
        participants: [booking.user], // Customer ID
        type: 'booking',
        bookingId: booking._id,
        storeId: booking.store.id,
        title: `Booking Discussion - ${bookingReference}`
      }).unwrap();
      
      // showToast({
      //   message: 'Chat created successfully',
      //   type: 'success',
      // });
      
      // Navigate to the chat
      // Find the customer participant (booking.user is the customer)
      const customerParticipant = result.data.chat.participants.find((p: any) => p.id === booking.user || p._id === booking.user);
      
      // Use chatId or id or _id - whichever is available
      const chatId = result.data.chat.chatId || result.data.chat.id || result.data.chat._id;
      
      console.log('Navigating to chat:', chatId, 'Chat data:', result.data.chat);
      
      (navigation as any).navigate('MessageView', {
        messageData: {
          id: chatId,
          recipient: {
            firstName: customerParticipant?.firstName || 'Customer',
            lastName: customerParticipant?.lastName || '',
            profilePicture: customerParticipant?.profileImageUrl || 'https://via.placeholder.com/50'
          },
          messages: []
        }
      });
    } catch (err: any) {
      showToast({
        message: err?.data?.message || 'Failed to create chat',
        type: 'error',
      });
    }
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'pending':
        return 'New booking';
      case 'confirmed':
        return 'Confirmed';
      case 'readyToServe':
        return 'Ready to serve';
      case 'vendorEnroute':
        return 'Provider on the way';
      case 'vendorArrived':
        return 'Provider arrived';
      case 'itemReceived':
        return 'Item received';
      case 'inProgress':
        return 'Service in progress';
      case 'readyForPickup':
        return 'Ready for pickup';
      case 'completed':
        return 'Completed';
      default:
        return stage.charAt(0).toUpperCase() + stage.slice(1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: '#8A6703', bg: '#FFF8E6' };
      case 'completed':
        return { text: '#3D7B22', bg: '#EBFEE3' };
      case 'cancelled':
        return { text: '#BB0A0A', bg: '#FFF0F0' };
      case 'rejected':
        return { text: '#BB0A0A', bg: '#FFF0F0' };
      case 'confirmed':
        return { text: '#2196F3', bg: '#E3F2FD' };
      case 'readyToServe':
        return { text: '#8A6703', bg: '#FFF8E6' };
      case 'vendorEnroute':
        return { text: '#8A6703', bg: '#FFF8E6' };
      case 'vendorArrived':
        return { text: '#8A6703', bg: '#FFF8E6' };
      case 'itemReceived':
        return { text: '#8A6703', bg: '#FFF8E6' };
      case 'inProgress':
        return { text: '#8A6703', bg: '#FFF8E6' };
      case 'readyForPickup':
        return { text: '#8A6703', bg: '#FFF8E6' };
      default:
        return { text: colors.textGray, bg: colors.lightGray };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTimeRange = (startTime: string, durationMinutes: number) => {
    if (!startTime) return 'Not set';

    const timeParts = startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeParts) return startTime;

    let hours = parseInt(timeParts[1]);
    const minutes = parseInt(timeParts[2]);
    const period = timeParts[3].toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;

    const endPeriod = endHours >= 12 ? ' PM' : ' AM';
    const endHours12 = endHours === 0 ? 12 : endHours > 12 ? endHours - 12 : endHours;
    const formattedEndTime = `${endHours12}:${endMinutes.toString().padStart(2, '0')}${endPeriod}`;

    return `${startTime} - ${formattedEndTime}`;
  };

  const currency = booking?.pricing?.currency || 'NGN';
  const currencySymbol = getCurrencySymbol(currency);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <GoBack />
        <Text weight="lora" style={styles.headerTitle} numberOfLines={1} ellipsizeMode="middle">
          {bookingReference}
        </Text>
        <TouchableOpacity onPress={() => {/* TODO: Add menu options */}}>
          <Ionicons name="ellipsis-vertical" size={19} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text weight="medium" style={styles.errorText}>Failed to load booking details</Text>
        </View>
      )}

      {booking && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={{marginTop: 16}}>
            {/* Status Pill */}
            <View style={[styles.statusPill, { backgroundColor: getStatusColor(booking.bookingStage).bg }]}>
              <Text weight="semiBold" style={[styles.statusText, { color: getStatusColor(booking.bookingStage).text }]}>
                {getStageLabel(booking.bookingStage)}
              </Text>
            </View>

            {/* Customer Name */}
            <Text weight="semiBold" style={styles.customerName}>
              {booking.contactInfo?.name || 'Unknown Customer'}
            </Text>

            {/* Service Type, Date, Time */}
            <View style={styles.infoRow}>
              <Text weight="medium" style={styles.infoText}>
                {booking.serviceType === 'normal' ? 'Normal service' :
                 booking.serviceType === 'home' ? 'Home service' :
                 'Drop-off & pick-up'}
              </Text>
              <Text weight="medium" style={styles.infoDot}>•</Text>
              <Text weight="medium" style={styles.infoText}>
                {formatDate(booking.serviceDate)}
              </Text>
              <Text weight="medium" style={styles.infoDot}>•</Text>
              <Text weight="medium" style={styles.infoText}>
                {booking.serviceTime}
              </Text>
            </View>

            {/* Action Buttons */}
            {booking.bookingStage === 'pending' && (
              <View style={styles.buttonRow}>
                <View style={styles.buttonWrapper}>
                  <Button
                    title="Reject booking"
                    onPress={() => setRejectModalVisible(true)}
                    variant="dangerAlt"
                  />
                </View>
                <View style={styles.buttonWrapper}>
                  <Button
                    title="Accept"
                    onPress={handleAcceptBooking}
                    loading={isConfirming}
                    disabled={isConfirming}
                  />
                </View>
              </View>
            )}

            {booking.bookingStage === 'confirmed' && (
              <View style={styles.buttonRow}>
                <View style={styles.buttonWrapper}>
                  <Button
                    title="Message"
                    onPress={handleMessage}
                    variant="ghostgray"
                    loading={isCreatingChat}
                    disabled={isCreatingChat}
                  />
                </View>
                <View style={styles.buttonWrapper}>
                  {booking.serviceType === 'normal' ?
                  <Button
                    title="Ready to serve"
                      onPress={() => handleUpdateStage('readyToServe', 'Marked as ready to serve')}
                      loading={isUpdatingStage}
                      disabled={isUpdatingStage}
                    />
                  :
                  booking.serviceType === 'home' ?
                  <Button
                    title="On the way"
                    onPress={() => handleUpdateStage('vendorEnroute', 'Marked as on the way')}
                    loading={isUpdatingStage}
                    disabled={isUpdatingStage}
                  />
                  :
                  <Button
                    title="Mark item received"
                    onPress={() => handleUpdateStage('itemReceived', 'Marked as item received')}
                    loading={isUpdatingStage}
                    disabled={isUpdatingStage}
                  />}
                </View>
              </View>
            )}

            {booking.bookingStage === 'vendorEnroute' && (
              <View style={styles.buttonRow}>
                <View style={styles.buttonWrapper}>
                  <Button
                    title="Message"
                    onPress={handleMessage}
                    variant="ghostgray"
                    loading={isCreatingChat}
                    disabled={isCreatingChat}
                  />
                </View>
                <View style={styles.buttonWrapper}>
                  <Button
                    title="Mark arrived"
                    onPress={() => handleUpdateStage('vendorArrived', 'Marked as arrived')}
                    loading={isUpdatingStage}
                    disabled={isUpdatingStage}
                  />
                </View>
              </View>
            )}

            {booking.bookingStage === 'itemReceived' && (
              <View style={styles.buttonRow}>
                <View style={styles.buttonWrapper}>
                  <Button
                    title="Message"
                    onPress={handleMessage}
                    variant="ghostgray"
                    loading={isCreatingChat}
                    disabled={isCreatingChat}
                  />
                </View>
                <View style={styles.buttonWrapper}>
                  <Button
                    title="Start service"
                    onPress={() => handleUpdateStage('inProgress', 'Service started')}
                    loading={isUpdatingStage}
                    disabled={isUpdatingStage}
                  />
                </View>
              </View>
            )}

            {booking.bookingStage === 'vendorArrived' && (
              <View style={styles.buttonRow}>
                <View style={styles.buttonWrapper}>
                  <Button
                    title="Message"
                    onPress={handleMessage}
                    variant="ghostgray"
                    loading={isCreatingChat}
                    disabled={isCreatingChat}
                  />
                </View>
                <View style={styles.buttonWrapper}>
                  <Button
                    title="Start service"
                    onPress={() => handleUpdateStage('inProgress', 'Service started')}
                    loading={isUpdatingStage}
                    disabled={isUpdatingStage}
                  />
                </View>
              </View>
            )}

            {booking.bookingStage === 'readyToServe' && (
              <View style={styles.buttonRow}>
                <View style={styles.buttonWrapper}>
                  <Button
                    title="Message"
                    onPress={handleMessage}
                    variant="ghostgray"
                    loading={isCreatingChat}
                    disabled={isCreatingChat}
                  />
                </View>
                <View style={styles.buttonWrapper}>
                  <Button
                    title="Begin service"
                    onPress={() => handleUpdateStage('inProgress', 'Service started')}
                    loading={isUpdatingStage}
                    disabled={isUpdatingStage}
                  />
                </View>
              </View>
            )}

            {booking.bookingStage === 'readyForPickup' && (
              <View style={styles.buttonRow}>
                <View style={styles.buttonWrapper}>
                  <Button
                    title="Message"
                    onPress={handleMessage}
                    variant="ghostgray"
                    loading={isCreatingChat}
                    disabled={isCreatingChat}
                  />
                </View>
                <View style={styles.buttonWrapper}>
                  <Button
                    title="Mark as completed"
                    onPress={handleCompleteBooking}
                    loading={isCompleting}
                    disabled={isCompleting}
                  />
                </View>
              </View>
            )}

            {booking.bookingStage === 'inProgress' && (
              <View style={styles.buttonRow}>
                <View style={styles.buttonWrapper}>
                  <Button
                    title="Message"
                    onPress={handleMessage}
                    variant="ghostgray"
                    loading={isCreatingChat}
                    disabled={isCreatingChat}
                  />
                </View>
                {
                booking.serviceType === 'pickDrop' ?
                <View style={styles.buttonWrapper}>
                  <Button
                    title="Ready for pickup"
                    onPress={() => handleUpdateStage('readyForPickup', 'Marked as ready for pickup')}
                    loading={isUpdatingStage}
                    disabled={isUpdatingStage}
                  />
                </View>
                :
                <View style={styles.buttonWrapper}>
                  <Button
                    title="Mark as completed"
                    onPress={handleCompleteBooking}
                    loading={isCompleting}
                    disabled={isCompleting}
                  />
                </View>}
              </View>
            )}

            {/* Booking Details Section */}
            <View style={[styles.section, { marginTop: 50, }]}>
              <View style={styles.detailItem}>
                <View style={styles.iconCircle}>
                  <Ionicons name="calendar-outline" size={17} color={colors.darkGray} />
                </View>
                <View style={styles.detailContent}>
                  <Text weight="medium" style={styles.detailLabel}>Date</Text>
                  <Text weight="medium" style={styles.detailValue}>{formatDate(booking.serviceDate)}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <View style={styles.iconCircle}>
                  <Ionicons name="time-outline" size={18} color={colors.darkGray} />
                </View>
                <View style={styles.detailContent}>
                  <Text weight="medium" style={styles.detailLabel}>Time</Text>
                  <Text weight="medium" style={styles.detailValue}>{formatTimeRange(booking.serviceTime, booking.pricing.totalDuration)}</Text>
                </View>
              </View>
            </View>

            {/* Service Details Section */}
            <View style={[styles.section, { marginTop: 0}]}>
              <Text weight="medium" style={[styles.sectionTitle, {marginBottom: 24}]}>Service details</Text>
              {booking.items.map((item, index) => {
                // Calculate total duration including add-ons
                const addOnsDuration = (item.addOns || []).reduce((sum, addOn) => {
                  return sum + (addOn.durationInMinutes || 0);
                }, 0);
                const totalItemDuration = item.service.durationInMinutes + addOnsDuration;

                return (
                  <View key={index} style={styles.serviceItem}>
                    <Image
                      source={{ uri: item.service.imageUrl }}
                      style={styles.serviceImage}
                    />
                    <View style={styles.serviceInfo}>
                      <View style={styles.serviceRow}>
                        <Text weight="medium" style={styles.serviceName}>{item.service.name}</Text>
                        <Text weight="semiBold" style={styles.servicePrice}>
                          {currencySymbol}{item.subtotal.toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.durationRow}>
                        <Text weight="medium" style={styles.serviceDuration}>
                          {formatDuration(totalItemDuration)}
                        </Text>
                        {item.addOns && item.addOns.length > 1 && (
                          <Text weight="medium" style={styles.addOnIndicator}>
                            • Includes {item.addOns.length} add-ons
                          </Text>
                        )}
                      </View>
                      {item.addOns && item.addOns.length > 0 && (
                        <View style={styles.addOnsContainer}>
                          {item.addOns.map((addOn, addOnIndex) => (
                            <View key={addOnIndex} style={styles.addOnChip}>
                              <Text weight="medium" style={styles.addOnChipText}>
                                + {addOn.name}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Home Service Address */}
            {booking.serviceType === 'home' && booking.homeServiceAddress && (
              <View style={[styles.section, {marginBottom: 20}]}>
                <Text weight="medium" style={[styles.sectionTitle, {marginBottom: 16}]}>Service address</Text>
                <View style={styles.addressRow}>
                  <Ionicons name="location-outline" size={18} color={colors.darkGray} style={{marginTop: 2}} />
                  <Text weight="medium" style={styles.addressText}>
                    {[
                      booking.homeServiceAddress.apartment,
                      booking.homeServiceAddress.address,
                      `${booking.homeServiceAddress.city}.`
                    ].filter(Boolean).join(', ')}
                  </Text>
                </View>
              </View>
            )}

            {/* Pick-up & Drop-off Addresses */}
            {booking.serviceType === 'pickDrop' && (booking.pickupInfo || booking.dropoffInfo) && (
              <View style={styles.section}>
                <Text weight="medium" style={[styles.sectionTitle, {marginBottom: 16}]}>Drop-off & Pick-up</Text>
                {booking.dropoffInfo && (
                  <View style={styles.addressRow}>
                    <Ionicons name="arrow-down-circle-outline" size={18} color={colors.darkGray} style={{marginTop: 2}} />
                    <Text weight="medium" style={styles.addressText}>
                      Drop-off: {booking.dropoffInfo.address.address}, {booking.dropoffInfo.address.city}, {booking.dropoffInfo.address.postalCode}
                    </Text>
                  </View>
                )}
                {booking.pickupInfo && (
                  <View style={[styles.addressRow, {marginTop: booking.pickupInfo ? 12 : 0, marginBottom: 12}]}>
                    <Ionicons name="arrow-up-circle-outline" size={18} color={colors.darkGray} style={{marginTop: 2}} />
                    <Text weight="medium" style={styles.addressText}>
                      Pickup: {booking.pickupInfo.address.address}, {booking.pickupInfo.address.city}, {booking.pickupInfo.address.postalCode}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Additional Info Section */}
            {booking.additionalInfo && (booking.additionalInfo.notes || (booking.additionalInfo.images && booking.additionalInfo.images.length > 0)) && (
              <View style={[styles.section, {marginBottom: 20}]}>
                <Text weight="medium" style={[styles.sectionTitle, {marginBottom: 16}]}>Additional information</Text>

                {booking.additionalInfo.notes && (
                  <View style={styles.notesContainer}>
                    <Text weight="medium" style={styles.notesText}>
                      {booking.additionalInfo.notes}
                    </Text>
                  </View>
                )}

                {booking.additionalInfo.images && booking.additionalInfo.images.length > 0 && (
                  <View style={styles.imagesContainer}>
                    {booking.additionalInfo.images.map((imageUrl, index) => (
                      <Pressable key={index} onPress={() => setSelectedImage(imageUrl)}>
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.additionalImage}
                        />
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Payment Summary Section */}
            <Text weight="medium" style={[styles.sectionTitle, {marginVertical: 12}]}>Payment summary</Text>
            <View style={styles.summarySection}>
              
              <View style={styles.summaryRow}>
                <Text weight="medium" style={styles.summaryLabel}>
                  Subtotal ({booking.items.length} {booking.items.length > 1 ? 'Items' : 'Item'})
                </Text>
                <Text weight="medium" style={styles.summaryValue}>
                  {currencySymbol}{booking.pricing.subtotal.toLocaleString()}
                </Text>
              </View>
              {booking.pricing.remainingBalance > 0 && (
                <View style={styles.summaryRow}>
                  <Text weight="medium" style={styles.summaryLabel}>Remaining Balance</Text>
                  <Text weight="medium" style={styles.summaryValue}>
                    {currencySymbol}{booking.pricing.remainingBalance.toLocaleString()}
                  </Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text weight="medium" style={styles.summaryLabel}>Taxes</Text>
                <Text weight="medium" style={styles.summaryValue}>{currencySymbol}0.00</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text weight="medium" style={styles.summaryLabel}>Commission</Text>
                <Text weight="medium" style={styles.summaryValue}>- {currencySymbol}{booking.pricing.commissionAmount.toLocaleString()}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow, {marginBottom: 0}]}>
                <Text weight="semiBold" style={styles.totalLabel}>
                  {booking.pricing.amountPaid < booking.pricing.subtotal ? 'Total paid' : 'Total received'}
                </Text>
                <Text weight="semiBold" style={styles.totalValue}>
                  {currencySymbol}{booking?.pricing?.paymentTerm === 'deposit' ? booking.pricing.amountPaid.toLocaleString() : booking.pricing.vendorPayout?.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Full Screen Image Modal */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalContainer}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedImage(null)}>
            <View style={styles.modalContent}>
              <Pressable style={styles.closeButton} onPress={() => setSelectedImage(null)}>
                <Ionicons name="close" size={24} color={colors.textLight} />
              </Pressable>
              {selectedImage && (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </Pressable>
        </View>
      </Modal>

      {/* Reject Booking Modal */}
      <CustomModal visible={rejectModalVisible} onClose={() => setRejectModalVisible(false)} position="bottom">
        <View style={styles.modalContent}>
          <Text weight="lora" style={styles.modalTitle}>Reject this booking?</Text>
          <Text weight="medium" style={styles.modalSubtitle}>This action cannot be undone. The customer will be notified and any payment will be refunded automatically.</Text>
          <Button 
            title="Refund booking" 
            variant="danger" 
            style={{marginTop: 12}} 
            onPress={handleRejectBooking}
            loading={isRejecting}
            disabled={isRejecting}
          />
          <Button title="Cancel" variant='ghostgray' style={{marginTop: 12}} onPress={() => setRejectModalVisible(false)} />
        </View>
      </CustomModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.textLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    color: colors.textDark,
    letterSpacing: -0.5,
    flex: 1,
    textAlign: 'center',
    maxWidth: 100,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: colors.textGray,
    textAlign: 'center',
  },
  statusPill: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 15,
    letterSpacing: -0.3,
  },
  customerName: {
    fontSize: 18,
    color: colors.textDark,
    marginBottom: 8,
    marginTop: 12
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4
  },
  infoText: {
    color: colors.textGray,
  },
  infoDot: {
    fontSize: 14,
    color: colors.textGray,
    marginHorizontal: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 30,
  },
  buttonWrapper: {
    flex: 1,
  },
  section: {
    marginTop: 12,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    color: colors.textDark,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 26,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textGray,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: colors.textDark,
  },
  serviceItem: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  serviceImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: colors.lightGray,
  },
  serviceInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  serviceName: {
    fontSize: 15,
    color: colors.textDark,
    flex: 1,
  },
  servicePrice: {
    fontSize: 15,
    color: colors.textDark,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  serviceDuration: {
    fontSize: 14,
    color: colors.textGray,
  },
  addOnIndicator: {
    fontSize: 14,
    color: colors.textGray,
    marginLeft: 4,
  },
  addOnsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  addOnChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  addOnChipText: {
    fontSize: 13,
    color: colors.darkGray,
  },
  summarySection: {
    marginTop: 8,
    backgroundColor: colors.lightGray,
    padding: 16,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  summaryLabel: {
    fontSize: 15,
    color: colors.darkGray,
  },
  summaryValue: {
    fontSize: 15,
    color: colors.textDark,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  totalLabel: {
    color: colors.textDark,
  },
  totalValue: {
    color: colors.textDark,
  },
  addressRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  addressText: {
    fontSize: 15,
    color: colors.textGray,
    flex: 1,
    lineHeight: 22,
  },
  notesContainer: {
    marginBottom: 16,
  },
  notesText: {
    fontSize: 15,
    color: colors.textDark,
    lineHeight: 22,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  additionalImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: colors.lightGray,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,1)',
  },
  modalContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 80,
    left: 10,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenImage: {
    width: screenWidth,
    height: '80%',
  },
  modalContent2: {
    padding: 0,
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: 24,
    color: colors.textDark,
    textAlign: 'center',
    letterSpacing: -0.5
  },
  modalSubtitle: {
    fontSize: 16,
    color: colors.textGray,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
});

export default VendorBookingDetails;
