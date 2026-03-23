import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetMyGlitsQuery, useGetUserGlitsQuery } from '@/redux/glits';
import type { Glit } from '@/redux/glits';
import { useMatchMedia } from '@/hooks/useMatchMedia';

const MASONRY_GAP = 12;
const MASONRY_GAP_SM = 10;
/** Mobile: max 3 columns; md+: 4 columns */
const COLUMN_COUNT_MD_UP = 4;
const COLUMN_COUNT_MOBILE = 2;
const HEIGHTS = [160, 195, 230, 265, 300, 335, 375, 180, 255, 320];
/** Stable fallback so useMemo deps don’t see a new [] every render */
const EMPTY_GLITS: Glit[] = [];

function getHeightForGlit(glit: Glit) {
  const seed =
    glit.id ??
    (glit as Glit & { _id?: string })._id ??
    glit.title ??
    glit.image ??
    Math.random().toString(36).slice(2);

  let hash = 0;
  const str = String(seed);
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }

  const minHeight = 150;
  const maxHeight = 380;
  const range = maxHeight - minHeight;

  const value = Math.abs(hash) % range;
  return minHeight + value;
}

interface CreatedProps {
  isOwnProfile: boolean;
  userId?: string;
  profileData?: { id?: string; username?: string } | null;
  onCreateGlit?: () => void;
}

export default function Created({ isOwnProfile, userId, profileData, onCreateGlit }: CreatedProps) {
  const navigate = useNavigate();
  const isMdUp = useMatchMedia('(min-width: 768px)');
  const columnCount = isMdUp ? COLUMN_COUNT_MD_UP : COLUMN_COUNT_MOBILE;

  const { data: myData, isLoading: myLoading, isError: myError, refetch: refetchMy } = useGetMyGlitsQuery(
    { page: 1, limit: 50, includePrivate: true },
    { skip: !isOwnProfile }
  );
  const { data: userData, isLoading: userLoading, isError: userError, refetch: refetchUser } = useGetUserGlitsQuery(
    { userId: userId ?? '', page: 1, limit: 50 },
    { skip: isOwnProfile || !userId }
  );

  const data = isOwnProfile ? myData : userData;
  const isLoading = isOwnProfile ? myLoading : userLoading;
  const isError = isOwnProfile ? myError : userError;
  const refetch = isOwnProfile ? refetchMy : refetchUser;

  const glits = data?.data?.docs ?? EMPTY_GLITS;
  const meta = data?.data?.meta;

  const handleGlitClick = (glit: Glit) => {
    const id = glit.id ?? (glit as Glit & { _id?: string })._id;
    if (id) navigate(`/glitfinder/glit/${id}`, { state: { profile: profileData ?? glit?.glitProfile } });
  };

  const columns = useMemo(
    () =>
      Array.from({ length: columnCount }, (_, i) =>
        glits.filter((_, idx) => idx % columnCount === i)
      ),
    [glits, columnCount]
  );

  const gapPx = isMdUp ? MASONRY_GAP : MASONRY_GAP_SM;

  if (isLoading && glits.length === 0) {
    return (
      <div className="px-3 sm:px-4 py-4 sm:py-5">
        <div className="flex min-w-0" style={{ gap: gapPx }}>
          {Array.from({ length: columnCount }, (_, col) => (
            <div key={col} className="flex-1 flex flex-col min-w-0" style={{ gap: gapPx }}>
              {HEIGHTS.slice(0, 4).map((h, i) => (
                <div key={i} className="w-full rounded-lg sm:rounded-xl bg-[#F5F5F5] animate-pulse" style={{ height: h }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <p className="text-[16px] text-[#DC2626] mb-2">Failed to load glits</p>
        <button type="button" onClick={() => refetch()} className="text-[16px] text-[#4C9A2A] font-medium underline">
          Tap to retry
        </button>
      </div>
    );
  }

  if (glits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8">
        {isOwnProfile ? (
          <>
            <button
              type="button"
              onClick={() => (onCreateGlit ? onCreateGlit() : navigate('/glitfinder', { state: { openCreateGlit: true } }))}
              className="w-12 h-12 rounded-full bg-[#4C9A2A] flex items-center justify-center text-white text-2xl mb-6 shadow-md"
            >
              +
            </button>
            <h2 className="text-[20px] font-semibold text-[#101828] font-[lora] mb-2 tracking-tight">Start creating your board</h2>
            <p className="text-[16px] text-[#6C6C6C] font-medium text-center max-w-[360px]">
              Upload your first inspiration to showcase your style and inspire the community
            </p>
          </>
        ) : (
          <>
            <h2 className="text-[20px] font-semibold text-[#101828] font-[lora] mb-2">Nothing here yet</h2>
            <p className="text-[16px] text-[#6C6C6C] font-medium text-center max-w-[75%]">
              This user has not shared any uploads on their board
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 py-4 sm:py-5 min-w-0">
      <div className="flex min-w-0" style={{ gap: gapPx }}>
        {columns.map((columnGlits, colIndex) => (
          <div key={colIndex} className="flex-1 flex flex-col min-w-0" style={{ gap: gapPx }}>
            {columnGlits.map((glit) => {
              const id = glit.id ?? (glit as Glit & { _id?: string })._id;
              const height = getHeightForGlit(glit);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleGlitClick(glit)}
                  className="w-full rounded-lg sm:rounded-xl overflow-hidden bg-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#4C9A2A]/30 touch-manipulation"
                  style={{ height }}
                >
                  <img src={glit.image} alt={glit.title || 'Glit'} className="w-full h-full object-cover" />
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {meta?.hasNextPage && (
        <div className="flex justify-center py-5">
          <div className="w-8 h-8 border-2 border-[#4C9A2A] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
    </div>
  );
}
