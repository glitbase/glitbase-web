import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { useRoute, useNavigation, RouteProp, NavigationProp } from '@react-navigation/native';
import Text from '../../components/Text';
import Button from '../../components/Button';
import { colors } from '../../utils/constants';
import { Ionicons } from '@expo/vector-icons';
import { Star } from 'lucide-react-native';
import { useCreateReviewMutation } from '../../services/reviewsApi';
import { useToast } from '../../contexts/ToastContext';

type BookingRatingRouteProp = RouteProp<{ params: { bookingReference: string; store: any } }, 'params'>;

type RootStackParamList = {
  Activity: undefined;
};

const BookingRating = () => {
  const route = useRoute<BookingRatingRouteProp>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { store } = route.params;
  const { showToast } = useToast();

  const [createReview, { isLoading }] = useCreateReviewMutation();

  const handleClose = () => {
    (navigation as any).navigate('Activity');
  };

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) {
      showToast({ 
        message: 'Please select a rating before submitting.', 
        type: 'error' 
      });
      return;
    }

    try {
      await createReview({
        storeId: store.id,
        data: {
          rating,
          message: review.trim() || 'No comment provided',
        },
      }).unwrap();

      showToast({
        message: 'Thank you for your review!',
        type: 'success',
      });

      navigation.navigate('Activity');
    } catch (error: any) {
      console.error('Error submitting review:', error);
      showToast({
        message: error?.data?.message || 'Failed to submit review. Please try again.',
        type: 'error',
      });
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Star 
              size={30} 
              fill={star <= rating ? '#E4AA05' : 'transparent'} 
              color={star <= rating ? '#E4AA05' : colors.mediumGray}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={colors.textDark} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text weight="lora" style={styles.headerTitle}>
                {store.name}
              </Text>
            </View>
            <View style={styles.closeButton} />
          </View>
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={{ uri: store.bannerImageUrl }}
            style={styles.image}
          />
        </View>


        {/* Rating Section */}
        <View style={styles.section}>
          <Text weight="lora" style={styles.sectionTitle}>
            How was your service?
          </Text>
          <Text weight="medium" style={styles.sectionSubtitle}>
          We&apos;re always working to improve - share your experience with your recent order
          </Text>
          {renderStars()}

          {rating > 0 && (
            <Text weight="medium" style={styles.ratingText}>
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </Text>
          )}
        </View>

        {/* Review Section */}
        {rating > 0 &&
        <View style={styles.section}>
          <Text weight="semiBold" style={styles.sectionTitle2}>
          Tell us more about your experience
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="What was your experience like..."
            placeholderTextColor={colors.mediumGray}
            multiline
            numberOfLines={6}
            value={review}
            onChangeText={setReview}
            textAlignVertical="top"
          />
          <Text weight="medium" style={styles.characterCount}>
            {review.length}/500 characters max
          </Text>
        </View>}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <Button
          title={"Submit"}
          onPress={handleSubmit}
          loading={isLoading}
          disabled={rating === 0 || review === '' || isLoading}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.textLight,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    color: colors.textDark,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textGray,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 24,
    color: colors.textDark,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5
  },
  sectionTitle2: {
    fontSize: 17,
    color: colors.textDark,
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 17,
    color: colors.textGray,
    marginBottom: 24,
    textAlign: 'center'
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 17,
    color: colors.textDark,
    textAlign: 'center',
    marginTop: 8,
  },
  textInput: {
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: colors.textDark,
    fontFamily: 'Lora-Medium',
    minHeight: 150,
  },
  characterCount: {
    fontSize: 15,
    color: colors.textGray,
    textAlign: 'left',
    marginTop: 8,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  imageContainer: {
    width: 80,
    height: 80,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 'auto',
    marginTop: 20,
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
});

export default BookingRating;
