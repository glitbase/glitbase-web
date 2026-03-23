import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Heart,
  Share2,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Download,
  Flag,
  Maximize2,
  X,
  Pencil,
  Trash2,
  BadgeCheck,
  Search,
  Bookmark,
  BookmarkCheck,
  Plus,
} from "lucide-react";
import { toast } from "react-toastify";
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
} from "@/redux/glits";
import {
  useGetMyGlitProfileQuery,
  useFollowProfileMutation,
  useUnfollowProfileMutation,
  useLazyGetGlitProfileStoreQuery,
} from "@/redux/glitfinder";
import {
  useGetMyGlitNotesQuery,
  useCreateGlitNoteMutation,
  useUpdateGlitNoteMutation,
} from "@/redux/glitNotes";
import {
  useGetMyGlitboardsQuery,
  useCreateGlitboardMutation,
  useAddGlitToBoardMutation,
} from "@/redux/glitboards";
import { useSearchMarketplaceQuery } from "@/redux/app";
import { useCreateReportMutation } from "@/redux/reports";
import { Button } from "@/components/Buttons";
import { Input } from "@/components/Inputs/TextInput";
import { Textarea } from "@/components/Inputs/TextAreaInput";
import ProviderCard from "@/components/EntityCards/ProviderCard";
import ProviderCardSkeleton from "@/components/EntityCards/ProviderCardSkeleton";
import CreateGlitModal from "@/components/Modal/CreateGlitModal";
import type { Glit } from "@/redux/glits";
import { useMatchMedia } from "@/hooks/useMatchMedia";

const MASONRY_GAP = 12;
const MASONRY_GAP_SM = 10;
/** More to explore: 3 / 4 / 5 columns by breakpoint */
const EXPLORE_COL_MOBILE = 3;
const EXPLORE_COL_MD = 4;
const EXPLORE_COL_LG = 5;
const EXPLORE_LOADING_HEIGHTS = [180, 220, 200, 240, 190, 230, 210, 260];
const CARD_HEIGHTS = [180, 220, 260, 200, 240, 190, 230, 210];

const getHeightForGlit = (glit: Glit) => {
  const id = glit.id ?? (glit as Glit & { _id?: string })._id ?? "";
  const hashCode = String(id)
    .split("")
    .reduce(
      (acc: number, c: string) => c.charCodeAt(0) + ((acc << 5) - acc),
      0,
    );
  return CARD_HEIGHTS[Math.abs(hashCode) % CARD_HEIGHTS.length];
};

const ViewGlit = () => {
  const { glitId } = useParams<{ glitId: string }>();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const viewRecordedRef = useRef(false);
  const isMdUp = useMatchMedia("(min-width: 768px)");
  const isLgUp = useMatchMedia("(min-width: 1024px)");
  const exploreColumnCount = isLgUp
    ? EXPLORE_COL_LG
    : isMdUp
      ? EXPLORE_COL_MD
      : EXPLORE_COL_MOBILE;
  const exploreGapPx = isMdUp ? MASONRY_GAP : MASONRY_GAP_SM;

  const { data, isLoading, error, refetch } = useGetGlitByIdQuery(glitId!, {
    skip: !glitId,
  });
  const { data: myProfileData, refetch: refetchMyProfile } =
    useGetMyGlitProfileQuery();
  const myProfile = myProfileData?.data?.profile;
  const glit = data?.data?.glit;
  const glitProfileId = glit?.glitProfile?._id ?? glit?.glitProfile?.id;
  const isOwnGlit =
    glit?.glitProfile?._id === myProfile?.id ||
    glit?.glitProfile?.id === myProfile?.id;

  const [followProfile, { isLoading: isFollowing }] =
    useFollowProfileMutation();
  const [unfollowProfile, { isLoading: isUnfollowing }] =
    useUnfollowProfileMutation();
  const [fetchGlitProfileStore] = useLazyGetGlitProfileStoreQuery();
  const [likeGlit, { isLoading: isLiking }] = useLikeGlitMutation();
  const [unlikeGlit, { isLoading: isUnliking }] = useUnlikeGlitMutation();
  const [saveGlit, { isLoading: isSaving }] = useSaveGlitMutation();
  const [unsaveGlit, { isLoading: isUnsaving }] = useUnsaveGlitMutation();
  const [shareGlit] = useShareGlitMutation();
  const [viewGlit] = useViewGlitMutation();
  const [deleteGlit, { isLoading: isDeleting }] = useDeleteGlitMutation();
  const [createReport, { isLoading: isReporting }] = useCreateReportMutation();
  const [createGlitNote, { isLoading: isCreatingNote }] =
    useCreateGlitNoteMutation();
  const [updateGlitNote, { isLoading: isUpdatingNote }] =
    useUpdateGlitNoteMutation();

  const { data: likedData } = useGetMyLikedGlitsQuery({ page: 1, limit: 100 });
  const { data: savedData } = useGetMySavedGlitsQuery({ page: 1, limit: 100 });
  const { data: notesData, refetch: refetchNotes } = useGetMyGlitNotesQuery();
  const { data: glitboardsData, refetch: refetchGlitboards } =
    useGetMyGlitboardsQuery({ page: 1, limit: 100 }, { skip: !glitId });
  const [createGlitboard, { isLoading: isCreatingGlitboard }] =
    useCreateGlitboardMutation();
  const [addGlitToBoard, { isLoading: isAddingToBoard }] =
    useAddGlitToBoardMutation();

  const likedGlits = likedData?.data?.docs ?? [];
  const savedGlits = savedData?.data?.docs ?? [];
  const savedGlitsCount = savedData?.data?.meta?.total ?? savedGlits.length;
  const isSavedToAll = glitId
    ? savedGlits.some(
        (g: Glit) => (g.id ?? (g as Glit & { _id?: string })._id) === glitId,
      )
    : false;
  const glitboards = glitboardsData?.data?.docs ?? [];
  const isSavedToGlitboard = glitboards.some(
    (board: { glits?: Array<{ id?: string; _id?: string } | string> }) => {
      if (!board.glits?.length) return false;
      return board.glits.some((g: { id?: string; _id?: string } | string) => {
        const id = typeof g === "string" ? g : (g?.id ?? g?._id);
        return id === glitId;
      });
    },
  );
  const isSaved = isSavedToAll || isSavedToGlitboard;
  const isLiked = glitId
    ? likedGlits.some(
        (g: Glit) => (g.id ?? (g as Glit & { _id?: string })._id) === glitId,
      )
    : false;

  const notes = notesData?.data?.notes ?? [];
  const glitNote = glitId
    ? notes.find((n: { glit?: { id?: string } }) => n.glit?.id === glitId)
    : null;
  const hasNoteForGlit = glitId
    ? notes.some((n: { glit?: { id?: string } }) => n.glit?.id === glitId)
    : false;

  const [likesCount, setLikesCount] = useState(0);
  const [sharesCount, setSharesCount] = useState(0);
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const [noteText, setNoteText] = useState("");
  const [isNoteCollapsed, setIsNoteCollapsed] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReportSuccessModal, setShowReportSuccessModal] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState<string>("");
  const [submittedReportReason, setSubmittedReportReason] = useState<string>("");
  const [showGlitboardModal, setShowGlitboardModal] = useState(false);
  const [glitboardSearch, setGlitboardSearch] = useState("");
  const [showCreateGlitboardModal, setShowCreateGlitboardModal] =
    useState(false);
  const [newGlitboardName, setNewGlitboardName] = useState("");
  const [newGlitboardDescription, setNewGlitboardDescription] = useState("");
  const [newGlitboardIsPrivate, setNewGlitboardIsPrivate] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        actionsMenuRef.current &&
        !actionsMenuRef.current.contains(e.target as Node)
      ) {
        setShowActionsMenu(false);
      }
    };
    if (showActionsMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showActionsMenu]);

  const isFollowingUser =
    glit?.glitProfile?.followers?.includes(myProfile?.id) ?? false;
  const isLoadingFollow = isFollowing || isUnfollowing;

  const { data: moreGlitsData, isLoading: moreGlitsLoading } =
    useGetGlitsFeedQuery(
      glit?.category
        ? { page: 1, limit: 20, category: glit.category }
        : { page: 1, limit: 20 },
    );
  const moreGlits = (moreGlitsData?.data?.docs ?? []).filter(
    (g: Glit) => (g.id ?? (g as Glit & { _id?: string })._id) !== glitId,
  );

  const moreGlitsColumns = useMemo(() => {
    const list = moreGlits.slice(0, 10);
    return Array.from({ length: exploreColumnCount }, (_, col) =>
      list.filter((_, idx) => idx % exploreColumnCount === col),
    );
  }, [moreGlits, exploreColumnCount]);

  const exploreSkeletonColumns = useMemo(
    () =>
      Array.from({ length: exploreColumnCount }, (_, col) =>
        EXPLORE_LOADING_HEIGHTS.filter((_, i) => i % exploreColumnCount === col),
      ),
    [exploreColumnCount],
  );

  const { data: marketplaceData, isLoading: recommendedLoading } =
    useSearchMarketplaceQuery(
      glit?.category ? { category: glit.category, limit: 10 } : { limit: 0 },
      { skip: !glit?.category },
    );
  const recommendedStores = (marketplaceData?.stores ?? []) as Array<{
    id?: string;
    _id?: string;
    name?: string;
    bannerImageUrl?: string;
    rating?: number;
    reviewCount?: number;
  }>;

  const [bookNowLoading, setBookNowLoading] = useState(false);

  const formatStoreEndpointError = (err: unknown): string => {
    const data = (err as { data?: { message?: string | string[] } })?.data;
    const msg = data?.message;
    if (Array.isArray(msg)) return msg.join(" ");
    if (typeof msg === "string" && msg.trim()) return msg;
    return "";
  };

  const handleBookNow = async () => {
    if (!glitProfileId) {
      toast.error("This glit is missing creator profile info.");
      return;
    }
    setBookNowLoading(true);
    try {
      const res = await fetchGlitProfileStore(glitProfileId).unwrap();
      const storeId = res?.storeId?.trim();
      if (storeId) {
        navigate(`/store/${storeId}`);
        return;
      }
      toast.error("Store could not be found for this creator.");
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const detail = formatStoreEndpointError(err);
      if (status === 401) {
        toast.error(detail || "Sign in to book with this provider.");
      } else if (status === 403) {
        toast.error(detail || "You can’t access this creator’s store.");
      } else if (status === 404) {
        toast.error(detail || "This creator doesn’t have a store yet.");
      } else {
        toast.error(detail || "Could not open store. Try again later.");
      }
    } finally {
      setBookNowLoading(false);
    }
  };

  useEffect(() => {
    if (glit) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setLikesCount(glit.likes ?? 0);
      setSharesCount(glit.shares ?? 0);
    }
  }, [glit]);

  useEffect(() => {
    if (glitNote) setNoteText(glitNote.note ?? "");
    else setNoteText("");
  }, [glitNote]);

  useEffect(() => {
    if (glitId && glit && !viewRecordedRef.current) {
      viewRecordedRef.current = true;
      viewGlit(glitId).catch(() => {});
    }
  }, [glitId, glit, viewGlit]);

  useEffect(() => {
    if (glitId) viewRecordedRef.current = false;
  }, [glitId]);

  useEffect(() => {
    setOptimisticLiked(null);
  }, [glitId]);

  // Clear optimistic state only once server state matches (avoids flicker)
  useEffect(() => {
    if (optimisticLiked !== null && isLiked === optimisticLiked) {
      setOptimisticLiked(null);
    }
  }, [optimisticLiked, isLiked]);

  const displayLiked = optimisticLiked !== null ? optimisticLiked : isLiked;

  const handleFollowToggle = async () => {
    if (!glitProfileId || !myProfile?.id) {
      toast.error("Unable to follow/unfollow");
      return;
    }
    try {
      if (isFollowingUser) await unfollowProfile(glitProfileId).unwrap();
      else await followProfile(glitProfileId).unwrap();
      refetch();
      refetchMyProfile();
    } catch (err: unknown) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          "Failed to update follow status",
      );
    }
  };

  const handleLikeToggle = async () => {
    if (!glitId) return;
    const wasLiked = displayLiked;
    setOptimisticLiked(!wasLiked);
    setLikesCount((prev) => (wasLiked ? prev - 1 : prev + 1));
    try {
      if (wasLiked) await unlikeGlit(glitId).unwrap();
      else await likeGlit(glitId).unwrap();
      refetch();
    } catch {
      setOptimisticLiked(null);
      setLikesCount((prev) => (wasLiked ? prev + 1 : prev - 1));
      toast.error("Failed to update like");
    }
  };

  const handleSaveToggle = () => {
    setShowGlitboardModal(true);
  };

  const handleSaveToBoard = async (boardId: string | undefined) => {
    if (!glitId) return;
    try {
      if (boardId === "all") {
        if (isSavedToAll) {
          await unsaveGlit(glitId).unwrap();
          toast.success("Removed from glitboard");
        } else {
          await saveGlit(glitId).unwrap();
          toast.success("Saved to glitboard");
        }
      } else if (boardId) {
        const board = glitboards.find(
          (b: { id?: string; _id?: string }) => (b.id ?? b._id) === boardId,
        );
        const isAlreadyInBoard = board?.glits?.some(
          (g: { id?: string; _id?: string } | string) => {
            const id = typeof g === "string" ? g : (g?.id ?? g?._id);
            return id === glitId;
          },
        );
        if (isAlreadyInBoard) {
          toast.info("Already in this glitboard");
        } else {
          await addGlitToBoard({ boardId, data: { glitId } }).unwrap();
          toast.success("Saved to glitboard");
        }
        refetchGlitboards();
      }
      setShowGlitboardModal(false);
      setGlitboardSearch("");
      refetch();
    } catch (err: unknown) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          "Failed to update glitboard",
      );
    }
  };

  const handleCreateGlitboard = async () => {
    if (!newGlitboardName.trim()) {
      toast.error("Board name is required");
      return;
    }
    try {
      await createGlitboard({
        name: newGlitboardName.trim(),
        description: newGlitboardDescription.trim() || undefined,
        isPrivate: newGlitboardIsPrivate,
      }).unwrap();
      toast.success("Glitboard created");
      setShowCreateGlitboardModal(false);
      setNewGlitboardName("");
      setNewGlitboardDescription("");
      setNewGlitboardIsPrivate(false);
      refetchGlitboards();
      setShowGlitboardModal(false);
      setTimeout(() => setShowGlitboardModal(true), 200);
    } catch (err: unknown) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          "Failed to create glitboard",
      );
    }
  };

  const handleShare = async () => {
    if (!glit) return;
    setSharesCount((prev) => prev + 1);
    try {
      await shareGlit(glitId!).unwrap();
      if (navigator.share) {
        await navigator.share({
          title: glit.title,
          text: glit.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied");
      }
      refetch();
    } catch {
      setSharesCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleSaveNote = async () => {
    if (!glitId || !noteText.trim()) return;
    try {
      if (hasNoteForGlit && glitNote) {
        await updateGlitNote({
          id: glitNote.id,
          data: { note: noteText.trim() },
        }).unwrap();
        toast.success("Note updated");
      } else {
        await createGlitNote({ glit: glitId, note: noteText.trim() }).unwrap();
        toast.success("Note saved");
        refetchNotes();
      }
    } catch (err: unknown) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          "Failed to save note",
      );
    }
  };

  const handleSaveImage = async () => {
    setShowActionsMenu(false);
    if (!glit?.image) {
      toast.error("No image to download");
      return;
    }
    try {
      const res = await fetch(glit.image, { mode: "cors" });
      if (!res.ok) throw new Error("Fetch failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `glit-${glitId ?? "image"}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Image saved");
    } catch {
      toast.error("Failed to save image");
    }
  };

  const reportReasons = [
    {
      id: "spam",
      title: "Spam or scam",
      description: "Scams, false ads, or misleading posts",
    },
    {
      id: "offensive",
      title: "Offensive or unsafe content",
      description: "Includes hate speech, nudity, or disturbing visuals.",
    },
    {
      id: "harassment",
      title: "Harassments or bullying",
      description: "Threats, personal attacks, or targeted comments.",
    },
    {
      id: "privacy",
      title: "Privacy issue",
      description:
        "Someone's personal info or private image is shown without permission.",
    },
    {
      id: "copyright",
      title: "Copyright or stolen work",
      description: "This post uses my content without credit or permission.",
    },
  ];

  const handleReport = () => {
    setShowActionsMenu(false);
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!selectedReportReason || !glitId) return;
    const reason = reportReasons.find((r) => r.id === selectedReportReason);
    if (!reason) return;
    try {
      await createReport({
        type: "glit",
        targetId: glitId,
        title: reason.title,
        description: reason.description,
      }).unwrap();
      setSubmittedReportReason(selectedReportReason);
      setShowReportModal(false);
      setSelectedReportReason("");
      setShowReportSuccessModal(true);
    } catch (error: unknown) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ??
          "Failed to submit report",
      );
    }
  };

  const handleEditGlit = () => {
    setShowActionsMenu(false);
    setShowEditModal(true);
  };

  const handleDeleteGlit = () => {
    setShowActionsMenu(false);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteGlit = async () => {
    if (!glitId) return;
    try {
      await deleteGlit(glitId).unwrap();
      toast.success("Glit deleted successfully");
      setShowDeleteConfirm(false);
      navigate("/glitfinder");
    } catch (err: unknown) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ??
          "Failed to delete glit",
      );
      setShowDeleteConfirm(false);
    }
  };

  const handleGlitClick = (g: Glit) => {
    const id = g.id ?? (g as Glit & { _id?: string })._id;
    if (id) navigate(`/glitfinder/glit/${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!glitId) {
    navigate("/glitfinder");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#E5E7EB] bg-white px-3 sm:px-4 py-3 sm:py-4 pt-[max(0.75rem,env(safe-area-inset-top,0px))] min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full skeleton-shimmer shrink-0" />
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="h-9 sm:h-10 w-16 sm:w-20 rounded-full skeleton-shimmer" />
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full skeleton-shimmer" />
          </div>
        </header>
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 min-w-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
            <div className="w-full aspect-square rounded-xl sm:rounded-2xl skeleton-shimmer bg-[#F0F0F0]" />
            <div className="flex flex-col space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full skeleton-shimmer" />
                <div className="space-y-2">
                  <div className="h-4 w-32 skeleton-shimmer rounded" />
                  <div className="h-3 w-24 skeleton-shimmer rounded" />
                </div>
              </div>
              <div className="h-6 w-3/4 skeleton-shimmer rounded" />
              <div className="space-y-2">
                <div className="h-4 w-full skeleton-shimmer rounded" />
                <div className="h-4 w-full skeleton-shimmer rounded" />
                <div className="h-4 w-2/3 skeleton-shimmer rounded" />
              </div>
              <div className="flex items-center gap-6 pt-2">
                <div className="h-5 w-12 skeleton-shimmer rounded" />
                <div className="h-5 w-12 skeleton-shimmer rounded" />
                <div className="h-10 w-20 rounded-full skeleton-shimmer" />
              </div>
              <div className="rounded-xl border border-[#E5E7EB] p-4 mt-4 space-y-3">
                <div className="h-4 w-24 skeleton-shimmer rounded" />
                <div className="h-20 w-full skeleton-shimmer rounded-lg" />
              </div>
            </div>
          </div>
        </div>
        <div className="px-3 sm:px-4 md:px-6 pb-[max(2rem,env(safe-area-inset-bottom,0px))] max-w-6xl mx-auto min-w-0">
          <div className="py-4 sm:py-6 mt-6 sm:mt-8 space-y-4">
            <div className="h-5 w-40 sm:w-48 skeleton-shimmer rounded" />
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {[1, 2, 3, 4, 5].map((i) => (
                <ProviderCardSkeleton key={i} />
              ))}
            </div>
          </div>
          <div className="py-4 sm:py-6 mt-4 sm:mt-8">
            <div className="h-6 w-32 sm:w-40 skeleton-shimmer rounded mb-3 sm:mb-4" />
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
              {[180, 220, 200, 240, 190, 230].map((h, i) => (
                <div
                  key={i}
                  className="rounded-lg sm:rounded-xl skeleton-shimmer bg-[#F0F0F0]"
                  style={{ height: h }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !glit) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom,0px))]">
        <p className="text-[16px] font-medium text-[#6C6C6C] mb-4">
          Failed to load glit
        </p>
        <Button variant="default" size="auto" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </div>
    );
  }

  const descriptionWithTags = glit.description?.trim() ?? "";
  const tagString = glit.tags?.length
    ? glit.tags.map((t) => `#${t}`).join(" ")
    : "";
  const fullDescription = [descriptionWithTags, tagString]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-[#E5E7EB] bg-white px-3 sm:px-4 py-3 sm:py-4 pt-[max(0.75rem,env(safe-area-inset-top,0px))] min-w-0">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 -ml-1 sm:-ml-2 rounded-full hover:bg-gray-100 touch-manipulation shrink-0"
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-[#101828]" />
        </button>
        {/* {!isOwnGlit && glit?.glitProfile && (
          <div className="flex items-center gap-3 flex-1 min-w-0 justify-center">
            <button
              type="button"
              onClick={() => {}}
              className="flex items-center gap-2 min-w-0 shrink"
            >
              <img
                src={glit.glitProfile.profilePicture || 'https://via.placeholder.com/40'}
                alt=""
                className="w-10 h-10 rounded-full object-cover shrink-0"
              />
              <div className="text-left min-w-0">
                <p className="text-[15px] font-semibold text-[#1D2739] truncate capitalize">
                  {glit.glitProfile.username ?? 'Creator'}
                </p>
                <p className="text-[13px] text-[#6C6C6C]">
                  {glit.creatorType === 'personal' ? 'Inspiration' : 'Verified pro'}
                </p>
              </div>
            </button>
          </div>
        )} */}
        {/* {isOwnGlit && (
          <h1 className="text-[16px] font-semibold text-[#101828] truncate max-w-[200px]">
            Your Glit
          </h1>
        )} */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0">
          {/* {!isOwnGlit && glitProfileId && (
            <Button
              variant={isFollowingUser ? 'cancel' : 'default'}
              size="auto"
              onClick={handleFollowToggle}
              disabled={isLoadingFollow}
              loading={isLoadingFollow}
            >
              {isFollowingUser ? 'Following' : 'Follow'}
            </Button>
          )} */}
          <Button
            variant={isSaved ? "cancel" : "default"}
            size="auto"
            onClick={handleSaveToggle}
            disabled={isSaving || isUnsaving}
            loading={isSaving || isUnsaving}
            className="!h-9 sm:!h-[40px] !px-3 sm:!px-6 text-[13px] sm:text-[14px] touch-manipulation whitespace-nowrap"
          >
            {isSaved ? "Saved" : "Save"}
          </Button>
          <div className="relative" ref={actionsMenuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowActionsMenu((v) => !v);
              }}
              className="p-2 rounded-full hover:bg-gray-100 text-[#101828] touch-manipulation"
              aria-label="More options"
              aria-expanded={showActionsMenu}
            >
              <MoreHorizontal strokeWidth={1.8} className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </button>
            {showActionsMenu && (
              <div className="absolute right-0 top-full mt-1 py-1 min-w-[180px] bg-white rounded-xl border border-[#E5E7EB] shadow-lg z-30">
                {!isOwnGlit && (
                  <>
                  <button
                  type="button"
                  onClick={() => {
                    setShowActionsMenu(false);
                    handleShare();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[14px] font-medium text-[#1D2739] hover:bg-[#F5F5F5]"
                >
                  <Share2 className="w-4 h-4 shrink-0" />
                  Share glit
                </button>
                <button
                  type="button"
                  onClick={handleSaveImage}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[14px] font-medium text-[#1D2739] hover:bg-[#F5F5F5]"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  Save image
                </button>
                <button
                  type="button"
                  onClick={handleReport}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[14px] font-medium text-[#1D2739] hover:bg-[#F5F5F5]"
                >
                  <Flag className="w-4 h-4 shrink-0" />
                  Report
                </button>
                </>
                )}
                {isOwnGlit && (
                  <>
                    <button
                      type="button"
                      onClick={handleEditGlit}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[14px] font-medium text-[#1D2739] hover:bg-[#F5F5F5]"
                    >
                      <Pencil className="w-4 h-4 shrink-0" />
                      Edit glit
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteGlit}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[14px] font-medium text-[#D10606] hover:bg-[#FEE2E2]"
                    >
                      <Trash2 className="w-4 h-4 shrink-0" />
                      Delete glit
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="overflow-y-auto min-w-0 pb-[max(2rem,env(safe-area-inset-bottom,0px))]"
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 min-w-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
            <div className="relative min-w-0">
              <img
                src={glit.image}
                alt={glit.title || "Glit"}
                className="w-full aspect-square object-cover rounded-xl sm:rounded-2xl bg-[#F5F5F5]"
              />
              <button
                type="button"
                onClick={() => setShowImageModal(true)}
                className="absolute top-2 right-2 sm:top-3 sm:right-3 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors touch-manipulation"
                aria-label="Expand image"
              >
                <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            {showImageModal && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 sm:p-4 pt-[max(1rem,env(safe-area-inset-top,0px))]"
                onClick={() => setShowImageModal(false)}
                role="dialog"
                aria-modal="true"
                aria-label="Full size image"
              >
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  className="absolute top-[max(1rem,env(safe-area-inset-top,0px))] right-3 sm:right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10 touch-manipulation"
                  aria-label="Close"
                >
                  <X className="w-6 h-6" />
                </button>
                <img
                  src={glit.image}
                  alt={glit.title || "Glit"}
                  className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            <div className="flex flex-col min-w-0">
              {!isOwnGlit && glit?.glitProfile && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 min-w-0">
                  <button
                    type="button"
                    onClick={() => glit.glitProfile?.username && navigate(`/glitfinder/profile/${encodeURIComponent(glit.glitProfile.username)}`)}
                    className="flex items-center gap-2 sm:gap-3 min-w-0 text-left touch-manipulation"
                  >
                    <img
                      src={
                        glit.glitProfile.profilePicture ||
                        "https://via.placeholder.com/40"
                      }
                      alt=""
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shrink-0"
                    />
                    <div className="text-left min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <p className="text-[14px] sm:text-[15px] font-semibold text-[#1D2739] capitalize truncate">
                          {glit.glitProfile.username ?? "Creator"}
                        </p>
                        {glit.creatorType !== "personal" && (
                          <BadgeCheck
                            strokeWidth={2.5}
                            className="w-4 h-4"
                            color="#4A85E4"
                          />
                        )}
                      </div>
                      <p className="text-[13px] text-[#6C6C6C] font-medium">
                        {glit.creatorType === "personal"
                          ? "Inspiration"
                          : "Verified pro"}
                      </p>
                    </div>
                  </button>
                  {glitProfileId && (
                    <Button
                      variant={isFollowingUser ? "cancel" : "default"}
                      size="auto"
                      onClick={handleFollowToggle}
                      disabled={isLoadingFollow}
                      loading={isLoadingFollow}
                      className="!h-9 sm:!h-[40px] !px-4 sm:!px-6 w-full sm:w-auto touch-manipulation shrink-0"
                    >
                      {isFollowingUser ? "Following" : "Follow"}
                    </Button>
                  )}
                </div>
              )}
              {glit.title && (
                <h1 className="text-[18px] sm:text-[20px] font-semibold text-[#1D2739] tracking-tight mb-1 mt-2 sm:mt-4 break-words">
                  {glit.title}
                </h1>
              )}
              {fullDescription && (
                <p className="text-[14px] sm:text-[15px] text-[#3B3B3B] leading-relaxed mb-4 whitespace-pre-wrap font-medium break-words">
                  {fullDescription}
                </p>
              )}
              <div className="flex items-center gap-4 sm:gap-6 mb-4">
                <button
                  type="button"
                  onClick={handleLikeToggle}
                  disabled={isLiking || isUnliking}
                  className="flex items-center gap-2 text-[#1D2739] touch-manipulation disabled:opacity-60"
                >
                  <Heart
                    className={`w-4 h-4 ${displayLiked ? "fill-[#D10606] text-[#D10606]" : ""}`}
                  />
                  <span className="text-[14px] font-medium">{likesCount}</span>
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-2 text-[#1D2739] touch-manipulation"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="text-[14px] font-medium">{sharesCount}</span>
                </button>
                {/* <Button
                  variant={isSaved ? 'cancel' : 'default'}
                  size="auto"
                  onClick={handleSaveToggle}
                  disabled={isSaving || isUnsaving}
                  loading={isSaving || isUnsaving}
                >
                  {isSaved ? 'Saved' : 'Save'}
                </Button> */}
              </div>

              <div className="mt-4 rounded-lg sm:rounded-xl bg-[#FAFAFA] p-3 sm:p-4 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[14px] font-medium text-[#1D2739]">
                    Note to self
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsNoteCollapsed((c) => !c)}
                    className="p-1 text-[#6C6C6C]"
                    aria-label={
                      isNoteCollapsed ? "Expand note" : "Collapse note"
                    }
                  >
                    {isNoteCollapsed ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {!isNoteCollapsed && (
                  <>
                    <Textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Write a note..."
                      rows={3}
                      className="rounded-lg bg-[#FAFAFA] !px-0"
                    />
                    {(noteText.trim() || hasNoteForGlit) && (
                      <div className="mt-2 flex justify-end">
                        <Button
                          variant="default"
                          size="auto"
                          onClick={handleSaveNote}
                          disabled={isCreatingNote || isUpdatingNote}
                          loading={isCreatingNote || isUpdatingNote}
                          className="!h-9 sm:!h-[40px] !px-4 sm:!px-6 touch-manipulation"
                        >
                          {hasNoteForGlit ? "Update note" : "Save note"}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 sm:px-4 md:px-6 max-w-6xl mx-auto min-w-0">
          {glit?.creatorType === "personal" ?
          <div>
            {(recommendedLoading || recommendedStores.length > 0) && (
              <section className="mt-10 sm:mt-14 lg:mt-16">
                <p className="text-[14px] sm:text-[15px] text-[#9D9D9D] font-medium">
                  Glitmatch
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
                  <h2 className="text-[16px] sm:text-[18px] font-semibold text-[#1D2739] tracking-tight">
                    Recommended providers
                  </h2>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById("recommended-scroll");
                        if (el) el.scrollBy({ left: -280, behavior: "smooth" });
                      }}
                      className="p-2 rounded-full border border-[#E5E7EB] hover:bg-gray-50 touch-manipulation"
                      aria-label="Scroll left"
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[#1D2739]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById("recommended-scroll");
                        if (el) el.scrollBy({ left: 280, behavior: "smooth" });
                      }}
                      className="p-2 rounded-full border border-[#E5E7EB] hover:bg-gray-50 touch-manipulation"
                      aria-label="Scroll right"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#1D2739]" />
                    </button>
                  </div>
                </div>
                <div
                  id="recommended-scroll"
                  className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-1 px-1 scroll-smooth scrollbar-hide"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {recommendedLoading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <ProviderCardSkeleton key={i} />
                      ))
                    : recommendedStores.map((store) => (
                        <ProviderCard
                          key={store.id ?? store._id ?? Math.random()}
                          item={{
                            id: store.id ?? store._id,
                            name: store.name ?? "Store",
                            bannerImageUrl: store.bannerImageUrl ?? "",
                            rating: store.rating ?? 0,
                            reviewCount: store.reviewCount ?? 0,
                          }}
                        />
                      ))}
                </div>
              </section>
            )}
          </div>
          :
          <div className="w-full max-w-[400px] mt-8 sm:mt-12 mx-auto px-1">
            <Button
              type="button"
              className="w-full touch-manipulation"
              onClick={() => void handleBookNow()}
              loading={bookNowLoading}
              disabled={bookNowLoading || !glitProfileId}
            >
              Book Now
            </Button>
          </div>
          }

          {(moreGlitsLoading || moreGlits.length > 0) && (
            <section className="mt-8 sm:mt-10">
              <h2 className="text-[16px] sm:text-[18px] font-semibold text-[#1D2739] tracking-tight mb-3 sm:mb-4">
                More to explore
              </h2>
              <div className="flex min-w-0" style={{ gap: exploreGapPx }}>
                {moreGlitsLoading
                  ? exploreSkeletonColumns.map((heights, colIndex) => (
                      <div
                        key={colIndex}
                        className="flex-1 flex flex-col min-w-0"
                        style={{ gap: exploreGapPx }}
                      >
                        {heights.map((h, i) => (
                          <div
                            key={`sk-${colIndex}-${i}`}
                            className="rounded-lg sm:rounded-xl skeleton-shimmer bg-[#F0F0F0] w-full"
                            style={{ height: h }}
                          />
                        ))}
                      </div>
                    ))
                  : moreGlitsColumns.map((columnGlits, colIndex) => (
                      <div
                        key={colIndex}
                        className="flex-1 flex flex-col min-w-0"
                        style={{ gap: exploreGapPx }}
                      >
                        {columnGlits.map((g: Glit) => {
                          const id = g.id ?? (g as Glit & { _id?: string })._id;
                          const height = getHeightForGlit(g);
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => handleGlitClick(g)}
                              className="w-full rounded-lg sm:rounded-xl overflow-hidden bg-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#4C9A2A]/30 text-left touch-manipulation"
                              style={{ height }}
                            >
                              <img
                                src={g.image}
                                alt={g.title || "Glit"}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          );
                        })}
                      </div>
                    ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Save to glitboard modal */}
      {showGlitboardModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowGlitboardModal(false);
              setGlitboardSearch("");
            }}
            aria-hidden
          />
          <div
            className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 p-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9D9D9D] z-10" />
                <Input
                  value={glitboardSearch}
                  onChange={(e) => setGlitboardSearch(e.target.value)}
                  placeholder="Search glitboard"
                  className="pl-10"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowGlitboardModal(false);
                  setGlitboardSearch("");
                }}
                className="p-2 rounded-full hover:bg-[#F5F5F5]"
              >
                <X className="w-5 h-5 text-[#6C6C6C]" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              {/* All glits */}
              <button
                type="button"
                onClick={() => handleSaveToBoard("all")}
                disabled={isSaving || isUnsaving || isAddingToBoard}
                className="w-full flex items-center gap-3 py-3 text-left disabled:opacity-60"
              >
                <img
                  src={
                    savedGlits[0]?.image ||
                    glit?.image ||
                    "https://cdn-icons-png.flaticon.com/128/2182/2182242.png"
                  }
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover bg-[#F0F0F0] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-[#1D2739]">
                    All glits
                  </p>
                  <p className="text-[13px] text-[#6C6C6C] font-medium">
                    {savedGlitsCount} glits
                  </p>
                </div>
                {isSaving || isUnsaving ? (
                  <div className="w-5 h-5 border-2 border-[#4C9A2A] border-t-transparent rounded-full animate-spin shrink-0" />
                ) : isSavedToAll ? (
                  <BookmarkCheck className="w-5 h-5 text-[#E4AA05] shrink-0" />
                ) : (
                  <Bookmark className="w-5 h-5 text-[#1D2739] shrink-0" />
                )}
              </button>
              <div className="my-4" />
              <p className="text-[13px] font-medium text-[#6C6C6C] mb-3">
                Add to glitboard
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowGlitboardModal(false);
                  setShowCreateGlitboardModal(true);
                }}
                disabled={isSaving || isUnsaving || isAddingToBoard}
                className="w-full flex items-center gap-3 py-3 text-left disabled:opacity-60"
              >
                <div className="w-12 h-12 rounded-lg bg-[#4C9A2A] flex items-center justify-center shrink-0">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <span className="text-[15px] font-medium text-[#1D2739]">
                  Create glitboard
                </span>
              </button>
              {glitboards
                .filter(
                  (b: { name?: string }) =>
                    !glitboardSearch.trim() ||
                    (b.name ?? "")
                      .toLowerCase()
                      .includes(glitboardSearch.trim().toLowerCase()),
                )
                .map(
                  (board: {
                    id?: string;
                    _id?: string;
                    name?: string;
                    image?: string;
                    glits?: Array<{ id?: string; _id?: string } | string>;
                  }) => {
                    const bid = board.id ?? board._id ?? "";
                    const isSavedToThisBoard = board.glits?.some(
                      (g: { id?: string; _id?: string } | string) => {
                        const id =
                          typeof g === "string" ? g : (g?.id ?? g?._id);
                        return id === glitId;
                      },
                    );
                    return (
                      <button
                        key={bid}
                        type="button"
                        onClick={() => handleSaveToBoard(bid)}
                        disabled={isSaving || isUnsaving || isAddingToBoard}
                        className="w-full flex items-center gap-3 py-3 text-left disabled:opacity-60"
                      >
                        <img
                          src={
                            board.image ??
                            (board.glits?.[0] as { image?: string })?.image ??
                            "https://cdn-icons-png.flaticon.com/128/2182/2182242.png"
                          }
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover bg-[#F0F0F0] shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-medium text-[#1D2739] truncate">
                            {board.name ?? "Board"}
                          </p>
                        </div>
                        {isAddingToBoard ? (
                          <div className="w-5 h-5 border-2 border-[#4C9A2A] border-t-transparent rounded-full animate-spin shrink-0" />
                        ) : isSavedToThisBoard ? (
                          <BookmarkCheck className="w-5 h-5 text-[#E4AA05] shrink-0" />
                        ) : (
                          <Bookmark className="w-5 h-5 text-[#1D2739] shrink-0" />
                        )}
                      </button>
                    );
                  },
                )}
            </div>
          </div>
        </div>
      )}

      {/* Create glitboard modal */}
      {showCreateGlitboardModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowCreateGlitboardModal(false);
              setNewGlitboardName("");
              setNewGlitboardDescription("");
              setNewGlitboardIsPrivate(false);
            }}
            aria-hidden
          />
          <div
            className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowCreateGlitboardModal(false);
                  setNewGlitboardName("");
                  setNewGlitboardDescription("");
                  setNewGlitboardIsPrivate(false);
                }}
                className="p-2 -ml-2 rounded-full hover:bg-[#F5F5F5]"
              >
                <ChevronLeft className="w-5 h-5 text-[#1D2739]" />
              </button>
              <h2 className="text-[19px] font-semibold text-[#1D2739] font-[lora] tracking-tight">
                Create glitboard
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowCreateGlitboardModal(false);
                  setNewGlitboardName("");
                  setNewGlitboardDescription("");
                  setNewGlitboardIsPrivate(false);
                }}
                className="p-2 rounded-full hover:bg-[#F5F5F5]"
              >
                <X className="w-5 h-5 text-[#6C6C6C]" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              <Input
                label="Board name"
                value={newGlitboardName}
                onChange={(e) => setNewGlitboardName(e.target.value)}
                placeholder="e.g. Photoshoot idea"
              />
              <Textarea
                label="Description"
                value={newGlitboardDescription}
                onChange={(e) => setNewGlitboardDescription(e.target.value)}
                placeholder="e.g. Dreamy birthday photo inspiration for unforgettable birthday pics"
                rows={3}
              />
              <div className="flex items-center justify-between gap-4 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#1D2739]">
                    Make private
                  </p>
                  <p className="text-[13px] text-[#6C6C6C] mt-0.5 font-medium">
                    Only you can view this glitboard and access it.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={newGlitboardIsPrivate}
                  onClick={() => setNewGlitboardIsPrivate((p) => !p)}
                  className={`shrink-0 w-10 h-5 rounded-full transition-colors ${newGlitboardIsPrivate ? "bg-[#FF71AA]" : "bg-[#E5E7EB]"}`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${newGlitboardIsPrivate ? "translate-x-[22px]" : "translate-x-0.5"}`}
                  />
                </button>
              </div>
            </div>
            <div className="shrink-0 px-6 py-4">
              <Button
                type="button"
                variant="default"
                size="full"
                onClick={handleCreateGlitboard}
                disabled={!newGlitboardName.trim() || isCreatingGlitboard}
                loading={isCreatingGlitboard}
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Report modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
          <div
            className="bg-white w-full rounded-t-2xl sm:rounded-2xl sm:max-w-lg p-6 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[22px] font-semibold text-[#101828] font-[lora] tracking-tight mb-1">
              Report content
            </h3>
            <p className="text-[14px] text-[#6C6C6C] font-medium mb-5">
              Help us keep Glitbase safe, respectful, and inspiring for everyone. What's the issue?
            </p>
            <div className="flex-1 overflow-y-auto space-y-2 mb-5">
              {reportReasons.map((reason) => (
                <button
                  key={reason.id}
                  type="button"
                  onClick={() => setSelectedReportReason(reason.id)}
                  className={`w-full flex items-start gap-3 p-4 rounded-xl text-left transition-colors ${
                    selectedReportReason === reason.id
                      ? "border-[#FF71AA] bg-[#FFF5F9]"
                      : "border-[#E5E7EB] hover:bg-[#F9FAFB]"
                  }`}
                >
                  <div
                    className={`mt-1 shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                      selectedReportReason === reason.id
                        ? "border-[#FF71AA]"
                        : "border-[#D0D5DD]"
                    }`}
                  >
                    {selectedReportReason === reason.id && (
                      <div className="w-2 h-2 rounded-full bg-[#FF71AA]" />
                    )}
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-[#101828]">{reason.title}</p>
                    <p className="text-[13px] text-[#6C6C6C] font-medium mt-0.5">{reason.description}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3 shrink-0">
              <Button
                variant="cancel"
                size="full"
                onClick={() => {
                  setShowReportModal(false);
                  setSelectedReportReason("");
                }}
                disabled={isReporting}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="full"
                onClick={handleSubmitReport}
                disabled={!selectedReportReason || isReporting}
                loading={isReporting}
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Report success modal */}
      {showReportSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
          <div
            className="bg-white w-full rounded-t-2xl sm:rounded-2xl sm:max-w-md p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
            <svg className="scale-75" width="105" height="105" viewBox="0 0 105 105" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M98.3719 40.6969C96.6047 38.85 94.7766 36.9469 94.0875 35.2734C93.45 33.7406 93.4125 31.2 93.375 28.7391C93.3047 24.1641 93.2297 18.9797 89.625 15.375C86.0203 11.7703 80.8359 11.6953 76.2609 11.625C73.8 11.5875 71.2594 11.55 69.7266 10.9125C68.0578 10.2234 66.15 8.39531 64.3031 6.62812C61.0687 3.52031 57.3937 0 52.5 0C47.6063 0 43.9359 3.52031 40.6969 6.62812C38.85 8.39531 36.9469 10.2234 35.2734 10.9125C33.75 11.55 31.2 11.5875 28.7391 11.625C24.1641 11.6953 18.9797 11.7703 15.375 15.375C11.7703 18.9797 11.7188 24.1641 11.625 28.7391C11.5875 31.2 11.55 33.7406 10.9125 35.2734C10.2234 36.9422 8.39531 38.85 6.62812 40.6969C3.52031 43.9313 0 47.6063 0 52.5C0 57.3937 3.52031 61.0641 6.62812 64.3031C8.39531 66.15 10.2234 68.0531 10.9125 69.7266C11.55 71.2594 11.5875 73.8 11.625 76.2609C11.6953 80.8359 11.7703 86.0203 15.375 89.625C18.9797 93.2297 24.1641 93.3047 28.7391 93.375C31.2 93.4125 33.7406 93.45 35.2734 94.0875C36.9422 94.7766 38.85 96.6047 40.6969 98.3719C43.9313 101.48 47.6063 105 52.5 105C57.3937 105 61.0641 101.48 64.3031 98.3719C66.15 96.6047 68.0531 94.7766 69.7266 94.0875C71.2594 93.45 73.8 93.4125 76.2609 93.375C80.8359 93.3047 86.0203 93.2297 89.625 89.625C93.2297 86.0203 93.3047 80.8359 93.375 76.2609C93.4125 73.8 93.45 71.2594 94.0875 69.7266C94.7766 68.0578 96.6047 66.15 98.3719 64.3031C101.48 61.0687 105 57.3937 105 52.5C105 47.6063 101.48 43.9359 98.3719 40.6969ZM73.9031 43.9031L47.6531 70.1531C47.3049 70.5018 46.8913 70.7784 46.436 70.9671C45.9808 71.1558 45.4928 71.2529 45 71.2529C44.5072 71.2529 44.0192 71.1558 43.564 70.9671C43.1087 70.7784 42.6951 70.5018 42.3469 70.1531L31.0969 58.9031C30.7485 58.5547 30.4721 58.1411 30.2835 57.6859C30.095 57.2306 29.9979 56.7427 29.9979 56.25C29.9979 55.7573 30.095 55.2694 30.2835 54.8141C30.4721 54.3589 30.7485 53.9453 31.0969 53.5969C31.8005 52.8932 32.7549 52.4979 33.75 52.4979C34.2427 52.4979 34.7306 52.595 35.1859 52.7835C35.6411 52.9721 36.0547 53.2485 36.4031 53.5969L45 62.1984L68.5969 38.5969C68.9453 38.2485 69.3589 37.9721 69.8141 37.7835C70.2694 37.595 70.7573 37.4979 71.25 37.4979C71.7427 37.4979 72.2306 37.595 72.6859 37.7835C73.1411 37.9721 73.5547 38.2485 73.9031 38.5969C74.2515 38.9453 74.5279 39.3589 74.7165 39.8141C74.905 40.2694 75.0021 40.7573 75.0021 41.25C75.0021 41.7427 74.905 42.2306 74.7165 42.6859C74.5279 43.1411 74.2515 43.5547 73.9031 43.9031Z" fill="#149D0A"/>
            </svg>

            </div>
            <h3 className="text-[22px] font-semibold text-[#101828] font-[lora] tracking-tight mb-2">
              {submittedReportReason === "copyright"
                ? "We've logged your copyright concern"
                : "Thanks for reporting"}
            </h3>
            <p className="text-[14px] text-[#6C6C6C] font-medium leading-relaxed mb-6">
              {submittedReportReason === "copyright"
                ? "Thanks for letting us know. We take intellectual property seriously. To move forward, we may ask for proof that you own the content (e.g. links, screenshots, or original files). You'll be contacted via your registered email if more information is needed."
                : "We've received your report and will review it shortly. If it's a copyright or privacy concern, we may follow up for more details."}
            </p>
            <Button
              variant="default"
              size="full"
              onClick={() => {
                setShowReportSuccessModal(false);
                setSubmittedReportReason("");
              }}
            >
              Done
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[22px] font-semibold text-[#1D2739] font-[lora] tracking-tight mb-3">
              Delete this glit?
            </h3>
            <p className="text-[15px] text-[#6C6C6C] font-medium leading-relaxed mb-6">
              Once deleted, this glit and all its interactions will be gone
              forever. This action cannot be reversed.
            </p>
            <div className="flex gap-3">
              <Button
                variant="cancel"
                size="full"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="full"
                onClick={confirmDeleteGlit}
                disabled={isDeleting}
                loading={isDeleting}
              >
                Delete glit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit glit modal */}
      <CreateGlitModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        editGlitId={glitId ?? undefined}
        onSuccess={() => {
          refetch();
          setShowEditModal(false);
        }}
        onNext={() => setShowEditModal(false)}
      />
    </div>
  );
};

export default ViewGlit;
