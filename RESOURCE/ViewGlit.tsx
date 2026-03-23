import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Share,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import Text from '../../../components/Text';
import Skeleton from '../../../components/Skeleton';
import { colors } from '../../../utils/constants';
import {
  useGetGlitByIdQuery,
  useGetMyLikedGlitsQuery,
  useGetMySavedGlitsQuery,
  useGetGlitsFeedQuery,
  useLikeGlitMutation,
  useUnlikeGlitMutation,
  useSaveGlitMutation,
  useUnsaveGlitMutation,
  useShareGlitMutation,
  useViewGlitMutation,
  useDeleteGlitMutation,
} from '../../../services/glitsApi';
import { useGetAllStoresQuery } from '../../../services/storeApi';
import {
  useGetMyGlitProfileQuery,
  useFollowProfileMutation,
  useUnfollowProfileMutation,
} from '../../../services/glitProfileApi';
import { useToast } from '../../../contexts/ToastContext';
import TextArea from '../../../components/TextArea';
import { useCreateGlitNoteMutation, useGetMyGlitNotesQuery, useUpdateGlitNoteMutation } from '../../../services/glitNotesApi';
import CustomModal from '../../../components/Modal';
import Button from '../../../components/Button';
import { BadgeCheck, Bookmark, BookmarkCheck, Download } from 'lucide-react-native';
import { useCreateReportMutation } from '../../../services/reportsApi';
import Input from '../../../components/Input';
import Toggle from '../../../components/Toggle';
import { useGetMyGlitboardsQuery, useCreateGlitboardMutation, useAddGlitToBoardMutation } from '../../../services/glitboardsApi';

type RouteParams = {
  glitId: string;
  profile: any;
};

const ViewGlit = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute();
  const routeParams = route.params as RouteParams;
  const routeProfile = routeParams?.profile;
  const glitId = routeParams?.glitId;
  
  // Fetch current user's profile as fallback
  const { data: profileQueryData, refetch: refetchMyProfile } = useGetMyGlitProfileQuery();
  const myProfile = profileQueryData?.data?.profile;
  
  // Use route profile if provided, otherwise use current user's profile
  const profile = routeProfile || myProfile;
  
  const { data, isLoading, error, refetch } = useGetGlitByIdQuery(glitId);
  
  // Refetch glit and profile when screen comes into focus (e.g., when navigating back from profile)
  useFocusEffect(
    React.useCallback(() => {
      refetch();
      refetchMyProfile();
    }, [refetch, refetchMyProfile])
  );
  const { showToast } = useToast();
  const [followProfile, { isLoading: isFollowing }] = useFollowProfileMutation();
  const [unfollowProfile, { isLoading: isUnfollowing }] = useUnfollowProfileMutation();
  const [likeGlit, { isLoading: isLiking }] = useLikeGlitMutation();
  const [unlikeGlit, { isLoading: isUnliking }] = useUnlikeGlitMutation();
  const [saveGlit, { isLoading: isSaving }] = useSaveGlitMutation();
  const [unsaveGlit, { isLoading: isUnsaving }] = useUnsaveGlitMutation();
  const [shareGlit] = useShareGlitMutation();
  const [viewGlit] = useViewGlitMutation();
  const [createGlitNote, { isLoading: isCreatingNote }] = useCreateGlitNoteMutation();
  const [updateGlitNote, { isLoading: isUpdatingNote }] = useUpdateGlitNoteMutation();
  const [deleteGlit] = useDeleteGlitMutation();
  const [createReport, { isLoading: isReporting }] = useCreateReportMutation();

  // Fetch liked and saved glits in the background
  const { data: likedGlitsData } = useGetMyLikedGlitsQuery({ page: 1, limit: 100 });
  const { data: savedGlitsData } = useGetMySavedGlitsQuery({ page: 1, limit: 100 });
  
  // Fetch notes to check if user already has a note for this glit
  const { data: notesData, refetch: refetchNotes } = useGetMyGlitNotesQuery();
  
  // Fetch glitboards
  const { data: glitboardsData, refetch: refetchGlitboards } = useGetMyGlitboardsQuery({ page: 1, limit: 100 });
  const [createGlitboard, { isLoading: isCreatingGlitboard }] = useCreateGlitboardMutation();
  const [addGlitToBoard, { isLoading: isAddingToBoard }] = useAddGlitToBoardMutation();

  const glit = data?.data?.glit;
  const glitCategory = glit?.category;
  const glitProfileId = glit?.glitProfile?._id || glit?.glitProfile?.id;

  console.log('glit', glit);

  // Fetch more glits from the same category (excluding current glit)
  const { data: moreGlitsData } = useGetGlitsFeedQuery(
    glitCategory
      ? {
          page: 1,
          limit: 20,
          category: glitCategory,
        }
      : { page: 1, limit: 20 }
  );

  const moreGlits = (moreGlitsData?.data?.docs || []).filter(
    (g: any) => g.id !== glitId
  );

  // Fetch recommended stores based on glit category and tags
  const glitTags = glit?.tags || [];
  const tagsQuery = glitTags.length > 0 ? glitTags.join(',') : undefined;
  const { data: recommendedStoresData } = useGetAllStoresQuery(
    glitCategory || tagsQuery
      ? {
          category: glitCategory,
          tags: tagsQuery,
        }
      : undefined
  );

  const recommendedStores = recommendedStoresData?.data?.stores || [];

  // Check if current user is following the glit creator
  // Use myProfile.id (current user) instead of profile.id (which might be route profile)
  const isFollowingUser = glit?.glitProfile?.followers?.includes(myProfile?.id) || false;
  const isLoadingFollow = isFollowing || isUnfollowing;

  // Track like/save state
  const [likesCount, setLikesCount] = useState(0);
  const [sharesCount, setSharesCount] = useState(0);
  const [isNoteCollapsed, setIsNoteCollapsed] = useState(true);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  
  const viewRecordedRef = useRef(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReportSuccessModal, setShowReportSuccessModal] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState<string>('');
  const [submittedReportReason, setSubmittedReportReason] = useState<string>('');
  const [showGlitboardModal, setShowGlitboardModal] = useState(false);
  const [glitboardSearch, setGlitboardSearch] = useState('');
  const [showCreateGlitboardModal, setShowCreateGlitboardModal] = useState(false);
  const [newGlitboardName, setNewGlitboardName] = useState('');
  const [newGlitboardDescription, setNewGlitboardDescription] = useState('');
  const [newGlitboardIsPrivate, setNewGlitboardIsPrivate] = useState(false);
  
  // Check if current user owns this glit
  const isOwnGlit = glit?.glitProfile?._id === profile?.id;
  // console.log('isOwnGlit', glit?.glitProfile?.id, profile?.id, isOwnGlit);

  // Check if current glit is in liked/saved lists
  const likedGlits = likedGlitsData?.data?.docs || [];
  const savedGlits = savedGlitsData?.data?.docs || [];
  const savedGlitsCount = savedGlitsData?.data?.meta?.total ?? savedGlits.length;
  const isLiked = likedGlits.some((g: any) => g.id === glitId);
  
  // Check if glit is saved to "All glits"
  const isSavedToAll = savedGlits.some((g: any) => g.id === glitId);
  
  // Check if glit is saved to any glitboard
  const glitboards = glitboardsData?.data?.docs || [];
  const isSavedToGlitboard = glitboards.some((board: any) => {
    if (!board.glits || board.glits.length === 0) return false;
    return board.glits.some((glit: any) => {
      // Handle different possible structures: object with id/_id, or just the id string
      if (typeof glit === 'string') {
        return glit === glitId;
      }
      const glitIdFromBoard = glit?.id || glit?._id;
      return glitIdFromBoard === glitId;
    });
  });
  
  // Glit is saved if it's in "All glits" OR any specific glitboard
  const isSaved = isSavedToAll || isSavedToGlitboard;
  
  // Check if user already has a note for this glit
  const notes = notesData?.data?.notes || [];
  const glitNote = notes.find((n: any) => n.glit?.id === glitId);
  const hasNoteForGlit = notes.some((n: any) => n.glit?.id === glitId);

  const [noteText, setNoteText] = useState(glitNote?.note || '');

  // Update noteText when glitNote changes
  useEffect(() => {
    if (glitNote) {
      setNoteText(glitNote.note || '');
    } else {
      setNoteText('');
    }
  }, [glitNote]);

  // Initialize state from glit data
  useEffect(() => {
    if (glit) {
      setLikesCount(glit.likes || 0);
      setSharesCount(glit.shares || 0);
    }
  }, [glit]);

  // Record view only once when component mounts and glit is loaded
  useEffect(() => {
    if (glitId && glit && !viewRecordedRef.current) {
      viewRecordedRef.current = true;
      viewGlit(glitId).catch(() => {
        // Silently fail - view tracking is not critical
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glitId, glit]);

  // Scroll to top when glitId changes (e.g., when clicking a glit from "more to explore")
  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    // Reset view tracking when glit changes
    viewRecordedRef.current = false;
  }, [glitId]);

  const renderStoreCard = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        style={styles.storeCard}
        onPress={() => {
          navigation.navigate('Store', { storeId: item.id || item._id, source: 'glitmatch' });
        }}
      >
        <View style={styles.storeImageContainer}>
          <Image
            source={{ uri: item.bannerImageUrl }}
            style={styles.storeImage}
            resizeMode="cover"
          />
        </View>
        <View style={styles.storeContent}>
          <Text weight="medium" style={styles.storeName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.storeRatingContainer}>
            <Image
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/128/2099/2099156.png',
              }}
              style={styles.starIcon}
              resizeMode="contain"
            />
            <Text weight="semiBold" style={styles.storeRatingText}>
              {item.rating}{' '}
              <Text weight="semiBold" style={styles.storeReviewCount}>
                ({item.reviewCount})
              </Text>
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleFollowToggle = async () => {
    if (!glitProfileId || !myProfile?.id) {
      showToast({ message: 'Unable to follow/unfollow', type: 'error' });
      return;
    }

    try {
      if (isFollowingUser) {
        await unfollowProfile(glitProfileId).unwrap();
      } else {
        await followProfile(glitProfileId).unwrap();
      }
      // Refetch glit and profile to update followers list
      refetch();
      refetchMyProfile();
    } catch (err: any) {
      const message = err?.data?.message || 'Failed to update follow status';
      showToast({ message, type: 'error' });
    }
  };

  const handleLikeToggle = async () => {
    if (!glitId) return;

    // Optimistic update
    const wasLiked = isLiked;
    setLikesCount((prev) => (wasLiked ? prev - 1 : prev + 1));

    try {
      if (wasLiked) {
        await unlikeGlit(glitId).unwrap();
      } else {
        await likeGlit(glitId).unwrap();
      }
      // Refetch to get accurate count and update liked list
      refetch();
    } catch (err: any) {
      // Revert optimistic update on error
      setLikesCount((prev) => (wasLiked ? prev + 1 : prev - 1));
      const message = err?.data?.message || 'Failed to update like status';
      showToast({ message, type: 'error' });
    }
  };

  const handleSaveToggle = () => {
    // Always open the glitboard selection modal
    setShowGlitboardModal(true);
  };

  const handleSaveToBoard = async (boardId?: string) => {
    console.log('handleSaveToBoard', boardId);
    if (!glitId) return;

    try {
      if (boardId === 'all') {
        // Handle "All glits" - use existing save/unsave logic
        if (isSavedToAll) {
          // If already saved, unsave it
          await unsaveGlit(glitId).unwrap();
          showToast({ message: 'Removed from glitboard', type: 'success' });
        } else {
          // If not saved, save it to "All glits"
          await saveGlit(glitId).unwrap();
          showToast({ message: 'Saved to glitboard', type: 'success' });
        }
      } else if (boardId) {
        // Check if glit is already saved to this board
        const board = glitboards.find((b: any) => (b.id || b._id) === boardId);
        const isAlreadyInBoard = board?.glits?.some((glit: any) => {
          const glitIdFromBoard = glit?.id || glit?._id || glit;
          return glitIdFromBoard === glitId;
        });
        
        if (isAlreadyInBoard) {
          // Already in board - could show message or handle removal if endpoint exists
          showToast({ message: 'Already in this glitboard', type: 'info' });
        } else {
          // Handle specific glitboard - use new endpoint
          await addGlitToBoard({
            boardId,
            data: { glitId },
          }).unwrap();
          showToast({ message: 'Saved to glitboard', type: 'success' });
        }
        refetchGlitboards(); // Refresh to update glit count
      }
      setShowGlitboardModal(false);
      setGlitboardSearch('');
      refetch();
    } catch (error: any) {
      const message = error?.data?.message || 'Failed to update glitboard';
      showToast({ message, type: 'error' });
    }
  };

  const handleCreateGlitboard = async () => {
    if (!newGlitboardName.trim()) {
      showToast({ message: 'Board name is required', type: 'error' });
      return;
    }

    try {
      await createGlitboard({
        name: newGlitboardName.trim(),
        description: newGlitboardDescription.trim() || undefined,
        isPrivate: newGlitboardIsPrivate,
      }).unwrap();

      showToast({ message: 'Glitboard created successfully', type: 'success' });
      setShowCreateGlitboardModal(false);
      setNewGlitboardName('');
      setNewGlitboardDescription('');
      setNewGlitboardIsPrivate(false);
      refetchGlitboards();
      // Optionally close the glitboard selection modal and reopen it to show the new board
      setShowGlitboardModal(false);
      setTimeout(() => setShowGlitboardModal(true), 300);
    } catch (error: any) {
      const message = error?.data?.message || 'Failed to create glitboard';
      showToast({ message, type: 'error' });
    }
  };

  const handleSaveNote = async () => {
    if (!glitId || !noteText.trim()) return;

    try {
      if (hasNoteForGlit && glitNote) {
        // Update existing note
        await updateGlitNote({
          id: glitNote.id,
          data: { note: noteText.trim() },
        }).unwrap();
        showToast({ message: 'Note updated!', type: 'success' });
      } else {
        // Create new note
        await createGlitNote({ glit: glitId, note: noteText.trim() }).unwrap();
        showToast({ message: 'Note saved!', type: 'success' });
        setNoteText('');
      }
      refetchNotes(); // Refetch to update hasNoteForGlit
    } catch (err: any) {
      const message = err?.data?.message || (hasNoteForGlit ? 'Failed to update note' : 'Failed to save note');
      showToast({ message, type: 'error' });
    }
  };

  const handleShare = async () => {
    if (!glit) return;

    // Optimistic update
    setSharesCount((prev) => prev + 1);

    try {
      // Record share
      await shareGlit(glitId).unwrap();
      
      // Native share
      await Share.share({
        message: `Check out "${glit.title}" on Glitbase`,
        title: glit.title,
      });
      
      // Refetch to get accurate count
      refetch();
    } catch {
      // Revert optimistic update on error
      setSharesCount((prev) => prev - 1);
      // If share fails, still try to record it
      try {
        await shareGlit(glitId).unwrap();
        setSharesCount((prev) => prev + 1);
        refetch();
      } catch {
        // Silently fail
      }
    }
  };

  const handleEditGlit = () => {
    setShowOptionsModal(false);
    // Navigate to edit screen - you may need to create this screen
    navigation.navigate('CreateGlit', { glitId, editMode: true });
  };

  const handleDeleteGlit = () => {
    setShowOptionsModal(false);
    setShowDeleteModal(true);
  };

  const confirmDeleteGlit = async () => {
    if (!glitId) return;

    try {
      await deleteGlit(glitId).unwrap();
      showToast({ message: 'Glit deleted successfully', type: 'success' });
      setShowDeleteModal(false);
      navigation.goBack();
    } catch (err: any) {
      const message = err?.data?.message || 'Failed to delete glit';
      showToast({ message, type: 'error' });
      setShowDeleteModal(false);
    }
  };

  const handleSaveImage = async () => {
    setShowActionsModal(false);
    
    if (!glit?.image) {
      showToast({ message: 'No image to download', type: 'error' });
      return;
    }

    try {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        showToast({ message: 'Permission to access media library is required', type: 'error' });
        return;
      }

      // showToast({ message: 'Downloading image...', type: 'info' });

      // Download the image
      const fileUri = FileSystem.documentDirectory + `glit_${glitId}_${Date.now()}.jpg`;
      const downloadResult = await FileSystem.downloadAsync(glit.image, fileUri);

      if (downloadResult.status !== 200) {
        throw new Error('Failed to download image');
      }

      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
      await MediaLibrary.createAlbumAsync('Glitbase', asset, false);

      showToast({ message: 'Image saved to gallery', type: 'success' });
    } catch (error: any) {
      console.error('Error saving image:', error);
      showToast({ 
        message: error?.message || 'Failed to save image', 
        type: 'error' 
      });
    }
  };

  const reportReasons = [
    {
      id: 'spam',
      title: 'Spam or scam',
      description: 'Scams, false ads, or misleading posts'
    },
    {
      id: 'offensive',
      title: 'Offensive or unsafe content',
      description: 'Includes hate speech, nudity, or disturbing visuals.'
    },
    {
      id: 'harassment',
      title: 'Harassments or bullying',
      description: 'Threats, personal attacks, or targeted comments.'
    },
    {
      id: 'privacy',
      title: 'Privacy issue',
      description: "Someone's personal info or private image is shown without permission."
    },
    {
      id: 'copyright',
      title: 'Copyright or stolen work',
      description: 'This post uses my content without credit or permission.'
    },
  ];

  const handleReport = () => {
    setShowActionsModal(false);
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!selectedReportReason || !glitId) return;

    const reason = reportReasons.find(r => r.id === selectedReportReason);
    if (!reason) return;

    try {
      await createReport({
        type: 'glit',
        targetId: glitId,
        title: reason.title,
        description: reason.description,
      }).unwrap();

      setSubmittedReportReason(selectedReportReason);
      setShowReportModal(false);
      setSelectedReportReason('');
      setShowReportSuccessModal(true);
    } catch (error: any) {
      showToast({ 
        message: error?.data?.message || 'Failed to submit report', 
        type: 'error' 
      });
    }
  };

  console.log('glitboardsData', glitboardsData?.data?.docs);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header Skeleton */}
        <View style={styles.header}>
          <Skeleton width={24} height={24} borderRadius={4} />
          <Skeleton width={100} height={20} borderRadius={4} />
          <Skeleton width={24} height={24} borderRadius={4} />
        </View>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Image Skeleton */}
          <Skeleton width="100%" height={400} borderRadius={0} />
          
          {/* Content Skeleton */}
          <View style={styles.content}>
            {/* Title Skeleton */}
            <Skeleton width="80%" height={24} borderRadius={4} style={{ marginBottom: 12 }} />
            <Skeleton width="90%" height={20} borderRadius={4} style={{ marginBottom: 8 }} />
            <Skeleton width="70%" height={20} borderRadius={4} style={{ marginBottom: 24 }} />
            
            {/* Stats Skeleton */}
            <View style={styles.statsContainer}>
              <View style={{flexDirection: 'row', gap: 20, alignItems: 'center'}}>
                <Skeleton width={60} height={20} borderRadius={4} />
                <Skeleton width={60} height={20} borderRadius={4} />
                <Skeleton width={24} height={20} borderRadius={4} />
              </View>
              <Skeleton width={80} height={36} borderRadius={18} />
            </View>
            
            {/* Note Container Skeleton */}
            <View style={styles.noteContainer}>
              <Skeleton width={120} height={16} borderRadius={4} style={{ marginBottom: 8 }} />
              <Skeleton width="100%" height={100} borderRadius={8} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error || !glit) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={colors.textDark} />
          </Pressable>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textGray} />
          <Text weight="semiBold" style={styles.errorTitle}>Failed to load glit</Text>
          <Text weight="medium" style={styles.errorText}>Please try again</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {isOwnGlit ? (
          <>
            <Pressable onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color={colors.textDark} />
            </Pressable>
            <Text weight="semiBold" style={{fontSize: 16, color: colors.textDark}}>
              Your Glit
            </Text>
            <Pressable onPress={() => setShowOptionsModal(true)}>
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.textDark} />
            </Pressable>
          </>
        ) : (
          <>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
              <Pressable onPress={() => navigation.goBack()} style={{marginRight: 4, marginLeft: -6}}>
                <Ionicons name="chevron-back" size={24} color={colors.textDark} />
              </Pressable>
              <Pressable 
                style={{flexDirection: 'row', alignItems: 'center', gap: 10}}
                onPress={() => navigation.navigate('GlitProfile', { profile: glit?.glitProfile })}
              >
                <Image source={{ uri: glit?.glitProfile?.profilePicture }} style={{width: 40, height: 40, borderRadius: 100}} resizeMode="cover" />
                <View>
                <Text weight="semiBold" style={{fontSize: 15, textTransform: 'capitalize'}}>{glit?.glitProfile?.username} {glit?.creatorType !== 'personal' && <BadgeCheck strokeWidth={3} size={12} style={{marginTop: 4, marginLeft: 3}} color={'#4A85E4'} />}</Text>
                <Text weight="medium" style={{fontSize: 13, color: colors.textGray}}>{glit?.creatorType === 'personal' ? 'Inspiration' : 'Verified pro'}</Text>
                </View>
              </Pressable>
            </View>
            <Pressable
              style={[
                styles.followButton,
                isFollowingUser && styles.unfollowButton,
                isLoadingFollow && styles.followButtonDisabled,
              ]}
              onPress={handleFollowToggle}
              disabled={isLoadingFollow || !glitProfileId || !myProfile?.id}
            >
              {isLoadingFollow ? (
                <ActivityIndicator size="small" color={isFollowingUser ? colors.textDark : colors.textLight} />
              ) : (
                <Text color={isFollowingUser ? colors.textDark : colors.textLight} weight="semiBold" style={styles.followButtonText}>
                  {isFollowingUser ? 'Following' : 'Follow'}
                </Text>
              )}
            </Pressable>
          </>
        )}
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Image */}
        <Pressable onPress={() => setExpandedImage(glit.image)}>
          <Image source={{ uri: glit.image }} style={styles.image} resizeMode="cover" />
        </Pressable>

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          {glit.title && (
            <Text weight="semiBold" style={styles.title}>
              {glit.title}
            </Text>
          )}

          {/* Description */}
          {glit.description && (
            <Text weight="medium" style={styles.description}>
              {glit.description} {glit.tags && glit.tags.length > 0 && `#${glit.tags.join(' #')}`}
            </Text>
          )}


          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={{flexDirection: 'row', gap: 20, alignItems: 'center'}}>
              <Pressable
                style={styles.statItem}
                onPress={handleLikeToggle}
                disabled={isLiking || isUnliking}
              >
                <Ionicons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={18}
                  color={isLiked ? colors.error : colors.textDark}
                />
                <Text style={styles.statText}>{likesCount}</Text>
              </Pressable>
              <Pressable style={styles.statItem} onPress={handleShare}>
                <Ionicons name="share-outline" size={18} color={colors.textDark} />
                <Text style={styles.statText}>{sharesCount}</Text>
              </Pressable>
              <Pressable style={styles.statItem} onPress={() => setShowActionsModal(true)}>
                <Ionicons name="ellipsis-horizontal" size={18} color={colors.textDark} />
              </Pressable>
            </View>
            {/* {!isOwnGlit &&  */}
            <Pressable
              style={[
                styles.followButton,
                isSaved && styles.unfollowButton,
                (isSaving || isUnsaving) && styles.followButtonDisabled,
              ]}
              onPress={handleSaveToggle}
              disabled={isSaving || isUnsaving}
            >
              {(isSaving || isUnsaving) ? (
                <ActivityIndicator size="small" color={colors.textLight} />
              ) : (
                <Text color={isSaved ? colors.textDark : colors.textLight} weight="semiBold" style={styles.followButtonText}>
                  {isSaved ? 'Saved' : 'Save'}
                </Text>
              )}
            </Pressable>
            {/* } */}
          </View>

          {/* Note to self */}
          <View style={styles.noteContainer}>
            <View style={styles.noteHeader}>
              <Text weight="medium" style={styles.noteHeaderLabel}>
                Note to self
              </Text>
              <Pressable
                onPress={() => setIsNoteCollapsed(prev => !prev)}
                hitSlop={8}
              >
                <Ionicons
                  name={isNoteCollapsed ? "chevron-down" : "chevron-up"}
                  size={18}
                  color={colors.textGray}
                />
              </Pressable>
            </View>

            {!isNoteCollapsed && (
              <>
                <TextArea
                  label=""
                  value={noteText}
                  labelStyle={{ color: '#E4AA05' }}
                  onChangeText={setNoteText}
                  placeholder="Write a note..."
                />
                {noteText.trim().length > 0 && (
                  <Pressable
                    style={styles.createNoteButton}
                    onPress={handleSaveNote}
                    disabled={isCreatingNote || isUpdatingNote}
                  >
                    {(isCreatingNote || isUpdatingNote) ? (
                      <ActivityIndicator size="small" color={colors.textLight} />
                    ) : (
                      <Ionicons
                        name={hasNoteForGlit ? "checkmark" : "add"}
                        size={18}
                        color={colors.textLight}
                      />
                    )}
                  </Pressable>
                )}
              </>
            )}
          </View>

          {/* Creator Credit */}
          {/* {glit.creatorCredited && (
            <View style={styles.creatorContainer}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={styles.creatorText}>Creator credited</Text>
            </View>
          )} */}

          {/* Date */}
          {/* {glit.createdAt && (
            <Text style={styles.dateText} color={colors.textGray}>
              Posted {formatDate(glit.createdAt)}
            </Text>
          )} */}
        </View>

        {/* Recommended Providers */}
        {recommendedStores.length > 0 && (
          <View style={styles.recommendedProvidersSection}>
            <Text weight="medium" style={{color: colors.mediumGray, marginBottom: 8}}>Glitmatch</Text>
            <Text weight="medium" style={styles.recommendedProvidersTitle}>
              Recommended Providers
            </Text>
            <FlatList
              data={recommendedStores}
              renderItem={renderStoreCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storesListContainer}
            />
          </View>
        )}

        {/* More to explore */}
        {moreGlits.length > 0 && (
          <View style={styles.moreToExploreSection}>
            <Text weight="medium" style={styles.moreToExploreTitle}>
              More to explore
            </Text>
            <View style={styles.masonryContainer}>
              <View style={styles.column}>
                {moreGlits
                  .filter((_: any, index: number) => index % 2 === 0)
                  .map((glit: any) => renderGlitCard(glit, navigation, profile))}
              </View>
              <View style={styles.column}>
                {moreGlits
                  .filter((_: any, index: number) => index % 2 === 1)
                  .map((glit: any) => renderGlitCard(glit, navigation, profile))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Options Modal for Own Glits */}
      <CustomModal
        visible={showOptionsModal}
        onClose={() => setShowOptionsModal(false)}
        position="bottom"
      >
        <View style={styles.modalContent}>
          <Pressable
            onPress={handleEditGlit}
            style={[styles.modalOption, { marginBottom: 16 }]}
          >
            <View style={styles.modalIconContainer}>
              <Ionicons name="create-outline" size={24} color={colors.textDark} />
            </View>
            <Text weight="medium" style={styles.modalOptionText}>
              Edit glit
            </Text>
          </Pressable>
          <Pressable
            onPress={handleDeleteGlit}
            style={[styles.modalOption, { marginBottom: 24 }]}
          >
            <View style={styles.modalIconContainer}>
              <Ionicons name="trash-outline" size={24} color={colors.error} />
            </View>
            <Text weight="medium" style={[styles.modalOptionText, { color: colors.error }]}>
              Delete glit
            </Text>
          </Pressable>
          <Button
            title="Cancel"
            variant="ghostgray"
            onPress={() => setShowOptionsModal(false)}
          />
        </View>
      </CustomModal>

      {/* Delete Confirmation Modal */}
      <CustomModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        position="bottom"
      >
        <View style={styles.deleteModalContent}>
          <Text weight="lora" style={styles.deleteModalTitle}>
          Delete this glit?
          </Text>
          <Text weight="medium" style={styles.deleteModalSubtitle}>
          Once deleted, this glit and all its interactions will be gone forever. This action cannot be reversed 
          {/* &quot;{glit?.title}&quot; */}
          </Text>
          
          <View style={styles.deleteModalButtons}>
            <Button
              title="Delete glit"
              onPress={confirmDeleteGlit}
              variant="danger"
              style={styles.deleteButton}
            />
            <Button
              title="Cancel"
              onPress={() => setShowDeleteModal(false)}
              variant="ghostgray"
              style={styles.cancelButton}
            />
          </View>
        </View>
      </CustomModal>

      {/* Actions Modal (Save Image / Report) */}
      <CustomModal
        visible={showActionsModal}
        onClose={() => setShowActionsModal(false)}
        position="bottom"
      >
        <View style={styles.modalContent}>
          <Pressable
            onPress={handleSaveImage}
            style={[styles.modalOption, { marginBottom: 16 }]}
          >
            <View style={styles.modalIconContainer}>
              <Download size={24} color={colors.textDark} />
            </View>
            <Text weight="medium" style={styles.modalOptionText}>
              Save image
            </Text>
          </Pressable>
          <Pressable
            onPress={handleReport}
            style={[styles.modalOption, { marginBottom: 24 }]}
          >
            <View style={styles.modalIconContainer}>
              <Ionicons name="flag-outline" size={24} color={colors.textDark} />
            </View>
            <Text weight="medium" style={styles.modalOptionText}>
              Report
            </Text>
          </Pressable>
          <Button
            title="Close"
            variant="ghostgray"
            onPress={() => setShowActionsModal(false)}
          />
        </View>
      </CustomModal>

      {/* Report Modal */}
      <CustomModal
        visible={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setSelectedReportReason('');
        }}
        position="bottom"
      >
        <View style={styles.reportModalContent}>
          <Text weight="lora" style={styles.reportModalTitle}>
            Report content
          </Text>
          <Text weight="medium" style={styles.reportModalSubtitle}>
            Help us keep Glitbase safe, respectful, and inspiring for everyone. What&apos;s the issue?
          </Text>

          <View style={styles.reportOptionsContainer}>
            {reportReasons.map((reason) => (
              <Pressable
                key={reason.id}
                style={styles.reportOption}
                onPress={() => setSelectedReportReason(reason.id)}
              >
                <View style={styles.reportOptionContent}>
                  <View style={[styles.radioButton, selectedReportReason === reason.id && styles.radioButtonSelected]}>
                    {selectedReportReason === reason.id && <View style={styles.radioButtonInner} />}
                  </View>
                  <View style={{flex: 1}}>
                    <Text weight="medium" style={styles.reportOptionTitle}>
                      {reason.title}
                    </Text>
                    <Text weight="medium" style={styles.reportOptionDescription}>
                      {reason.description}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>

          <Button
            title="Submit"
            onPress={handleSubmitReport}
            disabled={!selectedReportReason || isReporting}
            loading={isReporting}
          />
        </View>
      </CustomModal>

      {/* Report Success Modal */}
      <CustomModal
        visible={showReportSuccessModal}
        onClose={() => {
          setShowReportSuccessModal(false);
          setSubmittedReportReason('');
        }}
        position="bottom"
      >
        <View style={styles.reportSuccessContent}>
          <View style={styles.reportSuccessIconContainer}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          </View>
          <Text weight="lora" style={styles.reportSuccessTitle}>
            {submittedReportReason === 'copyright' 
              ? "We've logged your copyright concern"
              : 'Thanks for reporting'}
          </Text>
          <Text weight="medium" style={styles.reportSuccessMessage}>
            {submittedReportReason === 'copyright' ? (
              <>
                Thanks for letting us know. We take intellectual property seriously. To move forward, we may ask for proof that you own the content (e.g. links, screenshots, or original files).{'\n\n'}
                You&apos;ll be contacted via your registered email if more information is needed.
              </>
            ) : (
              "We've received your report and will review it shortly. If it&apos;s a copyright or privacy concern, we may follow up for more details."
            )}
          </Text>
          <View style={{width: '100%'}}>
            <Button
              title="Done"
              onPress={() => {
                setShowReportSuccessModal(false);
                setSubmittedReportReason('');
              }}
            />
          </View>
        </View>
      </CustomModal>

      {/* Glitboard Selection Modal */}
      <CustomModal
        visible={showGlitboardModal}
        onClose={() => {
          setShowGlitboardModal(false);
          setGlitboardSearch('');
        }}
        position="bottom"
      >
        <View style={styles.glitboardModalContent}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color={colors.textGray} style={styles.searchIcon} />
            <Input
              placeholder="Search glitboard"
              value={glitboardSearch}
              onChangeText={setGlitboardSearch}
              style={styles.searchInput}
            />
          </View>

          <ScrollView style={styles.glitboardList} showsVerticalScrollIndicator={false}>
            {/* All Glits Board */}
            <Pressable
              style={[styles.glitboardItem, (isSaving || isUnsaving || isAddingToBoard) && styles.glitboardItemDisabled]}
              onPress={() => handleSaveToBoard('all')}
              disabled={isSaving || isUnsaving || isAddingToBoard}
            >
              <Image
                source={{ uri: savedGlits[0]?.image }}
                style={styles.glitboardThumbnail}
                resizeMode="cover"
              />
              <View style={styles.glitboardInfo}>
                <Text weight="semiBold" style={styles.glitboardName}>
                  All glits
                </Text>
                <Text weight="medium" style={styles.glitboardCount}>
                  {savedGlitsCount} glits
                </Text>
              </View>
              {(isSaving || isUnsaving) ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                isSavedToAll ? <BookmarkCheck color={'#E4AA05'} size={20} /> : <Bookmark color={colors.textDark} size={20} />
              )}
            </Pressable>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Add to glitboard header */}
            <Text weight="medium" style={styles.sectionHeader}>
              Add to glitboard
            </Text>

            {/* Create glitboard option */}
            <Pressable 
              style={[styles.createGlitboardButton, (isSaving || isUnsaving || isAddingToBoard) && styles.glitboardItemDisabled]}
              onPress={() => {
                setShowGlitboardModal(false);
                setShowCreateGlitboardModal(true);
              }}
              disabled={isSaving || isUnsaving || isAddingToBoard}
            >
              <View style={styles.createIconContainer}>
                <Ionicons name="add" size={24} color={colors.textLight} />
              </View>
              <Text weight="medium" style={styles.createGlitboardText}>
                Create glitboard
              </Text>
            </Pressable>

            {/* Glitboards from API */}
            {(glitboardsData?.data?.docs || []).map((board: any) => {
              // Check if this glit is saved to this board by directly checking the board's glits array
              const isSavedToThisBoard = board.glits && board.glits.length > 0 && board.glits.some((glit: any) => {
                // Handle different possible structures: object with id/_id, or just the id string
                if (typeof glit === 'string') {
                  return glit === glitId;
                }
                const glitIdFromBoard = glit?.id || glit?._id;
                return glitIdFromBoard === glitId;
              });
              
              return (
                <Pressable
                  key={board.id || board._id}
                  style={[styles.glitboardItem, (isSaving || isUnsaving || isAddingToBoard) && styles.glitboardItemDisabled]}
                  onPress={() => handleSaveToBoard(board.id || board._id)}
                  disabled={isSaving || isUnsaving || isAddingToBoard}
                >
                  <Image
                    source={{ 
                      uri: board.glits && board.glits.length > 0 
                        ? board?.image 
                        : 'https://cdn-icons-png.flaticon.com/128/2182/2182242.png' 
                    }}
                    style={styles.glitboardThumbnail}
                    resizeMode="cover"
                  />
                  <View style={styles.glitboardInfo}>
                    <Text weight="medium" style={styles.glitboardName}>
                      {board.name}
                    </Text>
                    {/* {board.glitsCount > 0 && (
                      <Text weight="medium" style={styles.glitboardCount}>
                        {board.glitsCount} glits
                      </Text>
                    )} */}
                  </View>
                  {isAddingToBoard ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : isSavedToThisBoard ? (
                    <BookmarkCheck color={'#E4AA05'} size={20} />
                  ) : (
                    <Bookmark color={colors.textDark} size={20} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </CustomModal>

      {/* Create Glitboard Modal */}
      <CustomModal
        visible={showCreateGlitboardModal}
        onClose={() => {
          setShowCreateGlitboardModal(false);
          setNewGlitboardName('');
          setNewGlitboardDescription('');
          setNewGlitboardIsPrivate(false);
        }}
        position="bottom"
      >
        <View style={styles.createGlitboardModalContent}>
          <View style={styles.createGlitboardHeader}>
            <Pressable onPress={() => setShowCreateGlitboardModal(false)}>
              <Ionicons name="chevron-back" size={24} color={colors.textDark} />
            </Pressable>
            <Text weight="lora" style={styles.createGlitboardModalTitle}>
              Create glitboard
            </Text>
            <View style={{width: 24}} />
          </View>

          <ScrollView 
            style={styles.createGlitboardForm} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.createGlitboardFormContent}
            nestedScrollEnabled={true}
            keyboardDismissMode="interactive"
          >
            <View style={styles.formField}>
              <Input
                placeholder="Board name"
                value={newGlitboardName}
                onChangeText={setNewGlitboardName}
                label='Board name'
              />
            </View>

            <View style={styles.formField}>
              <TextArea
                placeholder="Describe your board"
                value={newGlitboardDescription}
                onChangeText={setNewGlitboardDescription}
                numberOfLines={4}
                label='Description'
              />
            </View>

            <View style={styles.formField}>
              <View style={styles.toggleContainer}>
                <View style={styles.toggleInfo}>
                  <Text weight="semiBold" style={styles.formLabel}>
                    Make private
                  </Text>
                  <Text weight="medium" style={styles.toggleDescription}>
                    Only you can view this glitboard and access it.
                  </Text>
                </View>
                <Toggle
                  size='small'
                  value={newGlitboardIsPrivate}
                  onValueChange={setNewGlitboardIsPrivate}
                />
              </View>
            </View>

            <Button
              title="Create"
              onPress={handleCreateGlitboard}
              disabled={!newGlitboardName.trim() || isCreatingGlitboard}
              loading={isCreatingGlitboard}
            />
          </ScrollView>
        </View>
      </CustomModal>

      {/* Full Screen Image Modal */}
      <Modal
        visible={!!expandedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setExpandedImage(null)}
      >
        <View style={styles.imageModalContainer}>
          <Pressable style={styles.imageModalBackdrop} onPress={() => setExpandedImage(null)}>
            <View style={styles.imageModalContent}>
              <Pressable style={styles.imageCloseButton} onPress={() => setExpandedImage(null)}>
                <Ionicons name="close" size={24} color={colors.textLight} />
              </Pressable>
              {expandedImage && (
                <Image 
                  source={{ uri: expandedImage }} 
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const SPACING = 8;

const renderGlitCard = (glit: any, navigation: any, profile: any) => {
  const heights = [180, 220, 260, 200, 240, 190, 230, 210];
  const hashCode = glit.id.split('').reduce((acc: number, char: string) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const heightIndex = Math.abs(hashCode) % heights.length;
  const glitHeight = heights[heightIndex];

  return (
    <TouchableOpacity
      key={glit.id}
      style={styles.glitCard}
      onPress={() => {
        navigation.navigate('ViewGlit', { glitId: glit.id, profile: profile });
      }}
    >
      <Image
        source={{ uri: glit.image }}
        style={[styles.glitImage, { height: glitHeight }]}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.textLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.textLight
  },
  scrollView: {
    flex: 1,
    marginTop: 8, 
    paddingHorizontal: 10
  },
  scrollContent: {
    paddingBottom: 20,
  },
  image: {
    width: '100%',
    height: 480,
    backgroundColor: colors.lightGray,
    borderRadius: 14
  },
  content: {
    paddingTop: 16
  },
  title: {
    fontSize: 18,
    color: colors.textDark,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    color: colors.darkGray,
    lineHeight: 24,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    color: colors.primaryAlt,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: colors.textDark,
    fontWeight: '500',
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  creatorText: {
    fontSize: 14,
    color: colors.primaryAlt,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 13,
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textGray,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  errorTitle: {
    fontSize: 18,
    color: colors.textDark,
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: colors.textGray,
    marginTop: 8,
  },
  followButton: {
    paddingHorizontal: 16,
    height: 40,
    backgroundColor: colors.primary,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
  },
  unfollowButton: {
    backgroundColor: colors.lightGray,
  },
  unfollowButtonText: {
    color: colors.textDark,
  },
  followButtonDisabled: {
    opacity: 0.6,
  },
  followButtonText: {
    fontSize: 12,
  },
  moreToExploreSection: {
    marginTop: 32,
  },
  moreToExploreTitle: {
    color: colors.textDark,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  masonryContainer: {
    flexDirection: 'row',
    gap: SPACING,
    paddingBottom: 20,
  },
  column: {
    flex: 1,
    gap: SPACING,
  },
  glitCard: {
    backgroundColor: colors.textLight,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 1,
  },
  glitImage: {
    width: '100%',
    resizeMode: 'cover',
  },
  recommendedProvidersSection: {
    marginTop: 32,
  },
  recommendedProvidersTitle: {
    color: colors.textDark,
    marginBottom: 16,
  },
  storesListContainer: {
    gap: 12,
  },
  storeCard: {
    width: 155,
    backgroundColor: colors.textLight,
  },
  storeImageContainer: {
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.lightGray,
  },
  storeImage: {
    width: '100%',
    height: '100%',
  },
  storeContent: {
    paddingVertical: 6,
  },
  storeName: {
    fontSize: 14,
    color: colors.textDark,
    marginVertical: 6,
  },
  storeRatingContainer: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  starIcon: {
    width: 10,
    height: 10,
  },
  storeRatingText: {
    fontSize: 12,
    color: colors.textDark,
  },
  storeReviewCount: {
    color: colors.primary,
  },
  noteContainer: {
    backgroundColor: colors.lightGray,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    position: 'relative',
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  noteHeaderLabel: {
    fontSize: 14,
    color: colors.textDark,
  },
  createNoteButton: {
    position: 'absolute',
    bottom: 24,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  modalIconContainer: {
    width: 32,
    height: 32,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 16,
    color: colors.textDark,
  },
  deleteModalContent: {
    alignItems: 'center',
  },
  deleteModalTitle: {
    fontSize: 22,
    color: colors.textDark,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  deleteModalSubtitle: {
    fontSize: 16,
    color: colors.textGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
    paddingHorizontal: 18,
  },
  deleteModalButtons: {
    width: '100%',
    gap: 12,
  },
  deleteButton: {
    marginBottom: 0,
  },
  cancelButton: {
    marginBottom: 6,
  },
  reportModalContent: {
    paddingTop: 8,
  },
  reportModalTitle: {
    fontSize: 22,
    color: colors.textDark,
    marginBottom: 12,
    letterSpacing: -0.5,
    textAlign: 'center'
  },
  reportModalSubtitle: {
    fontSize: 15,
    color: colors.textGray,
    marginBottom: 40,
    lineHeight: 22,
    textAlign: 'center',
  },
  reportOptionsContainer: {
    marginBottom: 24,
  },
  reportOption: {
    marginBottom: 28,
  },
  reportOptionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 18,
  },
  reportOptionTitle: {
    fontSize: 16,
    color: colors.textDark,
    marginBottom: 4,
  },
  reportOptionDescription: {
    fontSize: 14,
    color: colors.textGray,
    lineHeight: 18,
  },
  reportSuccessContent: {
    alignItems: 'center',
    paddingTop: 8,
  },
  reportSuccessIconContainer: {
    marginBottom: 16,
  },
  reportSuccessTitle: {
    fontSize: 22,
    color: colors.textDark,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
    paddingHorizontal: 18,
  },
  reportSuccessMessage: {
    fontSize: 15,
    color: colors.textGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 14,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4
  },
  radioButtonSelected: {
    borderColor: colors.secondary,
    borderWidth: 2,
    backgroundColor: colors.secondary
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 6,
    backgroundColor: colors.textLight,
  },
  glitboardModalContent: {
    maxHeight: 600,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: 44,
  },
  glitboardList: {
    maxHeight: 500,
  },
  glitboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  glitboardItemDisabled: {
    opacity: 0.5,
  },
  glitboardThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.lightGray,
  },
  glitboardInfo: {
    flex: 1,
  },
  glitboardName: {
    fontSize: 16,
    color: colors.textDark,
    marginBottom: 2,
  },
  glitboardCount: {
    fontSize: 14,
    color: colors.textGray,
  },
  divider: {
    height: 1,
    // backgroundColor: colors.lightGray,
    marginVertical: 16,
  },
  sectionHeader: {
    fontSize: 13,
    color: colors.textGray,
    marginBottom: 12,
  },
  createGlitboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  createIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createGlitboardText: {
    fontSize: 16,
    color: colors.textDark,
  },
  createGlitboardModalContent: {
    maxHeight: 800,
  },
  createGlitboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 38,
  },
  createGlitboardModalTitle: {
    fontSize: 20,
    color: colors.textDark,
    letterSpacing: -0.5,
  },
  createGlitboardForm: {
    maxHeight: 800,
    marginBottom: 12
  },
  createGlitboardFormContent: {
    paddingBottom: 20,
  },
  formField: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    color: colors.textDark,
    marginBottom: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 120,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleDescription: {
    fontSize: 14,
    color: colors.textGray,
    lineHeight: 18,
    maxWidth: '76%',
  },
  // Full Screen Image Modal Styles
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  imageModalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,1)',
  },
  imageModalContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageCloseButton: {
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
    width: Dimensions.get('window').width,
    height: '80%',
  },
});

export default ViewGlit;

