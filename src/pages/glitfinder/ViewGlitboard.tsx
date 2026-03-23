import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Share2, Settings2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  useGetGlitboardByIdQuery,
  useUpdateGlitboardMutation,
  useDeleteGlitboardMutation,
} from '@/redux/glitboards';
import { useGetMyGlitProfileQuery } from '@/redux/glitfinder';
import { Input } from '@/components/Inputs/TextInput';
import { Textarea } from '@/components/Inputs/TextAreaInput';
import { Button } from '@/components/Buttons';
import type { Glit } from '@/redux/glits';
import HomeLayout from '@/layout/home/HomeLayout';
import { useMatchMedia } from '@/hooks/useMatchMedia';

type LayoutMode = 'expanded' | 'default' | 'condensed';

const GAP = 8;
const GAP_SM = 6;
/** Masonry / condensed: 3 / 4 / 5 columns */
const COL_MOBILE = 3;
const COL_MD = 4;
const COL_LG = 5;

function splitGlitsIntoColumns(items: Glit[], columnCount: number) {
  return Array.from({ length: columnCount }, (_, c) =>
    items.filter((_, i) => i % columnCount === c),
  );
}

const EMPTY_GLITS: Glit[] = [];

function getHeightForGlit(glit: Glit) {
  const seed =
    glit.id ??
    (glit as Glit & { _id?: string })._id ??
    glit.title ??
    glit.image ??
    '';
  let hash = 0;
  const str = String(seed);
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return 150 + (Math.abs(hash) % 230);
}

export default function ViewGlitboard() {
  const navigate = useNavigate();
  const { boardId } = useParams<{ boardId: string }>();
  const isMdUp = useMatchMedia('(min-width: 768px)');
  const isLgUp = useMatchMedia('(min-width: 1024px)');
  const gridColumnCount = isLgUp ? COL_LG : isMdUp ? COL_MD : COL_MOBILE;
  const gapPx = isMdUp ? GAP : GAP_SM;

  const { data: profileData } = useGetMyGlitProfileQuery();
  const myProfile = profileData?.data?.profile;

  const { data, isLoading, error, refetch } = useGetGlitboardByIdQuery(boardId ?? '', {
    skip: !boardId,
  });
  const [updateGlitboard, { isLoading: isUpdating }] = useUpdateGlitboardMutation();
  const [deleteGlitboard, { isLoading: isDeleting }] = useDeleteGlitboardMutation();

  const board = data?.data?.glitboard ?? data?.data?.board;
  const glits: Glit[] = board?.glits ?? EMPTY_GLITS;
  const isOwnGlitboard = board?.user === myProfile?.user || board?.user === myProfile?.id;

  const [layoutMode, setLayoutMode] = useState<LayoutMode>('default');
  const [showLayoutModal, setShowLayoutModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsPrivate, setEditIsPrivate] = useState(false);

  useEffect(() => {
    if (board) {
      setEditName(board.name ?? '');
      setEditDescription(board.description ?? '');
      setEditIsPrivate(board.isPrivate ?? false);
    }
  }, [board]);

  const glitColumns = useMemo(
    () => splitGlitsIntoColumns(glits, gridColumnCount),
    [glits, gridColumnCount],
  );

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: board?.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied');
      }
    } catch {
      // ignore
    }
  };

  const handleUpdate = async () => {
    if (!boardId || !editName.trim()) {
      toast.error('Name is required');
      return;
    }
    try {
      await updateGlitboard({
        id: boardId,
        data: {
          name: editName.trim(),
          description: editDescription.trim() || undefined,
          isPrivate: editIsPrivate,
        },
      }).unwrap();
      toast.success('Glitboard updated');
      setShowEditModal(false);
      refetch();
    } catch (err: unknown) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ?? 'Failed to update glitboard'
      );
    }
  };

  const handleDelete = async () => {
    if (!boardId) return;
    try {
      await deleteGlitboard(boardId).unwrap();
      toast.success('Glitboard deleted');
      navigate(-1);
    } catch (err: unknown) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ?? 'Failed to delete glitboard'
      );
    }
  };

  // ─── Layout helpers ───────────────────────────────────────────────

  const renderGlits = () => {
    if (glits.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-4 sm:px-8">
          <h2 className="text-[18px] sm:text-[20px] font-semibold text-[#101828] font-[lora] mb-2 tracking-tight text-center">
            No glits yet
          </h2>
          <p className="text-[14px] sm:text-[16px] text-[#6C6C6C] font-medium text-center max-w-[320px]">
            This glitboard is empty
          </p>
        </div>
      );
    }

    if (layoutMode === 'expanded') {
      return (
        <div className="flex flex-col min-w-0" style={{ gap: gapPx }}>
          {glits.map((glit) => {
            const id = glit.id ?? (glit as Glit & { _id?: string })._id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => navigate(`/glitfinder/glit/${id}`)}
                className="w-full rounded-lg sm:rounded-xl overflow-hidden bg-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#4C9A2A]/30 touch-manipulation h-[240px] sm:h-[280px] md:h-[300px]"
              >
                <img src={glit.image} alt={glit.title || 'Glit'} className="w-full h-full object-cover" />
              </button>
            );
          })}
        </div>
      );
    }

    if (layoutMode === 'condensed') {
      return (
        <div className="flex min-w-0" style={{ gap: gapPx }}>
          {glitColumns.map((col, ci) => (
            <div key={ci} className="flex-1 flex flex-col min-w-0" style={{ gap: gapPx }}>
              {col.map((glit) => {
                const id = glit.id ?? (glit as Glit & { _id?: string })._id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => navigate(`/glitfinder/glit/${id}`)}
                    className="w-full rounded-lg sm:rounded-xl overflow-hidden bg-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#4C9A2A]/30 touch-manipulation h-[200px] sm:h-[280px] md:h-[300px]"
                  >
                    <img src={glit.image} alt={glit.title || 'Glit'} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      );
    }

    // default – masonry with varying heights
    return (
      <div className="flex min-w-0" style={{ gap: gapPx }}>
        {glitColumns.map((col, ci) => (
          <div key={ci} className="flex-1 flex flex-col min-w-0" style={{ gap: gapPx }}>
            {col.map((glit) => {
              const id = glit.id ?? (glit as Glit & { _id?: string })._id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => navigate(`/glitfinder/glit/${id}`)}
                  className="w-full rounded-lg sm:rounded-xl overflow-hidden bg-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#4C9A2A]/30 touch-manipulation"
                  style={{ height: getHeightForGlit(glit) }}
                >
                  <img src={glit.image} alt={glit.title || 'Glit'} className="w-full h-full object-cover" />
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // ─── Loading ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <header className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 border-b border-[#E5E7EB] pt-[max(0.75rem,env(safe-area-inset-top,0px))] min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 -ml-1 sm:-ml-2 rounded-full hover:bg-gray-100 touch-manipulation shrink-0"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-[#101828]" />
          </button>
          <div className="w-24 sm:w-32 h-5 bg-[#F5F5F5] rounded animate-pulse" />
          <div className="w-9 sm:w-10 shrink-0" />
        </header>
        <div className="flex items-center justify-center py-16 sm:py-20 pb-[max(2rem,env(safe-area-inset-bottom,0px))]">
          <div className="w-8 h-8 border-2 border-[#4C9A2A] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen bg-white">
        <header className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-[#E5E7EB] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 -ml-1 sm:-ml-2 rounded-full hover:bg-gray-100 touch-manipulation"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-[#101828]" />
          </button>
        </header>
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-4 pb-[max(2rem,env(safe-area-inset-bottom,0px))]">
          <h2 className="text-[17px] sm:text-[18px] font-semibold text-[#101828] mb-2 text-center">Board not found</h2>
          <Button variant="default" size="auto" onClick={() => refetch()} className="touch-manipulation">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const glitsCount = board.glitsCount ?? glits.length;

  // ─── Main ─────────────────────────────────────────────────────────

  return (
    <HomeLayout isLoading={false} showNavBar={false}>
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 border-b border-[#E5E7EB] bg-white sticky top-0 z-10 pt-[max(0.75rem,env(safe-area-inset-top,0px))] min-w-0">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 -ml-1 sm:-ml-2 rounded-full hover:bg-gray-100 touch-manipulation shrink-0"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-[#101828]" />
        </button>

        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          {/* Layout picker */}
          <button
            type="button"
            onClick={() => setShowLayoutModal(true)}
            className="p-2 rounded-full hover:bg-gray-100 touch-manipulation"
            aria-label="View options"
          >
            <Settings2 className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-[#101828]" />
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-full hover:bg-gray-100 touch-manipulation"
            aria-label="Share"
          >
            <Share2 className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-[#101828]" />
          </button>

          {/* Owner actions */}
          {isOwnGlitboard && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowOptionsMenu((v) => !v)}
                className="p-2 rounded-full hover:bg-gray-100 touch-manipulation"
                aria-label="More options"
              >
                <MoreHorizontal className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-[#101828]" />
              </button>
              {showOptionsMenu && (
                <div className="absolute right-0 top-full mt-1 py-1 min-w-[180px] bg-white rounded-xl border border-[#E5E7EB] shadow-lg z-50">
                  <button
                    type="button"
                    onClick={() => { setShowOptionsMenu(false); setShowEditModal(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[15px] font-medium text-[#101828] hover:bg-gray-50"
                  >
                    <Pencil className="w-4 h-4 text-[#6C6C6C]" />
                    Edit glitboard
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowOptionsMenu(false); setShowDeleteModal(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[15px] font-medium text-[#DC2626] hover:bg-[#FEF2F2]"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete glitboard
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Board title & count */}
      <div className="flex flex-col items-center pt-4 sm:pt-5 pb-3 px-3 sm:px-4 min-w-0">
        <h1 className="text-[17px] sm:text-[18px] font-semibold text-[#101828] tracking-tight text-center break-words max-w-full px-1">
          {board.name}
        </h1>
        <p className="text-[14px] sm:text-[15px] text-[#6C6C6C] font-medium mt-1">
          {glitsCount} {glitsCount === 1 ? 'Glit' : 'Glits'}
        </p>
      </div>

      {/* Grid */}
      <div className="px-3 sm:px-4 pt-2 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] min-w-0">
        {renderGlits()}
      </div>

      {/* ── Layout modal ── */}
      {showLayoutModal && (
        <div
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
          onClick={() => setShowLayoutModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl px-4 sm:px-6 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] sm:pb-8 max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[17px] sm:text-[18px] font-semibold text-[#101828] mb-3 sm:mb-4">View type</h2>
            {(['expanded', 'default', 'condensed'] as LayoutMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => { setLayoutMode(mode); setShowLayoutModal(false); }}
                className="w-full flex items-center justify-between py-3 sm:py-4 border-b border-[#F3F4F6] last:border-0 touch-manipulation text-left"
              >
                <span className="text-[16px] font-medium text-[#101828] capitalize">{mode}</span>
                <span
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    layoutMode === mode ? 'border-[#AE3670] bg-[#AE3670]' : 'border-[#D1D5DB]'
                  }`}
                >
                  {layoutMode === mode && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Edit modal ── */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl px-4 sm:px-6 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] sm:pb-8 max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[22px] font-semibold text-[#101828] font-[lora] tracking-tight mb-5 text-center">
              Edit glitboard
            </h2>
            <div className="space-y-4">
              <Input
                label="Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter glitboard name"
              />
              <Textarea
                label="Description (optional)"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter description"
                rows={3}
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#1D2739]">Private glitboard</p>
                  <p className="text-[13px] text-[#6C6C6C] font-medium mt-0.5">Only you can see this glitboard</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={editIsPrivate}
                  onClick={() => setEditIsPrivate((p) => !p)}
                  className={`shrink-0 w-10 h-5 rounded-full transition-colors touch-manipulation self-start sm:self-auto ${editIsPrivate ? 'bg-[#FF71AA]' : 'bg-[#E5E7EB]'}`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${editIsPrivate ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
                  />
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-3 mt-8">
              <Button
                variant="default"
                size="full"
                onClick={handleUpdate}
                disabled={!editName.trim() || isUpdating}
                loading={isUpdating}
              >
                Save changes
              </Button>
              <Button variant="cancel" size="full" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete modal ── */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl px-4 sm:px-6 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] sm:pb-8 max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[22px] font-semibold text-[#101828] font-[lora] tracking-tight mb-3 text-center">
              Delete this glitboard?
            </h2>
            <p className="text-[15px] text-[#6C6C6C] font-medium text-center leading-relaxed mb-7 px-2">
              Once you delete this board, all pins and content will be permanently removed. You won't be able to recover any of the inspiration you've saved here.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                variant="destructive"
                size="full"
                onClick={handleDelete}
                disabled={isDeleting}
                loading={isDeleting}
              >
                Delete glitboard
              </Button>
              <Button variant="cancel" size="full" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </HomeLayout>
  );
}
