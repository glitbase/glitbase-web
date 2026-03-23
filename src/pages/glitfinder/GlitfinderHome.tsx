import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, SlidersHorizontal } from 'lucide-react';
import { useGetGlitsFeedQuery } from '@/redux/glits';
import { useFetchMarketplaceCategoriesQuery } from '@/redux/app';
import { useGetMyGlitProfileQuery, useSearchGlitProfilesQuery } from '@/redux/glitfinder';
import { useGetGlitboardsFeedQuery } from '@/redux/glitboards';
import GlitfinderFiltersModal, { type GlitfinderFilterParams } from '@/components/Modal/GlitfinderFiltersModal';
import CreateGlitModal, { type GlitFormData } from '@/components/Modal/CreateGlitModal';
import PreviewGlitModal from '@/components/Modal/PreviewGlitModal';
import type { Glit } from '@/redux/glits';
import type { Glitboard } from '@/redux/glitboards';
import { Button } from '@/components/Buttons';
import { useMatchMedia } from '@/hooks/useMatchMedia';
import { useMobileNav } from '@/layout/home/MobileNavContext';

type SearchTabType = 'glits' | 'boards' | 'profiles';

function mapFiltersToApiParams(filters: GlitfinderFilterParams) {
  const api: Record<string, string> = {};
  if (filters.glitType) {
    api.creatorType = filters.glitType === 'verified_pro' ? 'verifiedPro' : 'personal';
  }
  if (filters.glitboardSize) {
    const sizeMap: Record<string, string> = {
      '1_25': '1-25', '26_100': '26-100', '101_500': '101-500', '500_plus': '500+',
    };
    api.glitboardSize = sizeMap[filters.glitboardSize] ?? filters.glitboardSize;
  }
  if (filters.followerCount) {
    const followerMap: Record<string, string> = {
      under_1k: 'under-1k', '1k_10k': '1k-10k', '10k_100k': '10k-100k', '100k_plus': '100k+',
    };
    api.followerCount = followerMap[filters.followerCount] ?? filters.followerCount;
  }
  return api;
}

const PAGE_SIZE = 20;

const MASONRY_GAP = 12;
const MASONRY_GAP_SM = 10;
/** Mobile: max 3 columns; md+: 4 columns */
const COLUMN_COUNT_MD_UP = 4;
const COLUMN_COUNT_MOBILE = 2;
const CARD_HEIGHTS = [160, 195, 230, 265, 300, 335, 375, 180, 255, 320];
const EMPTY_GLITBOARDS: Glitboard[] = [];

const GlitfinderHome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMdUp = useMatchMedia('(min-width: 768px)');
  const isLgUp = useMatchMedia('(min-width: 1024px)');
  const mobileNav = useMobileNav();
  const columnCount = isMdUp ? COLUMN_COUNT_MD_UP : COLUMN_COUNT_MOBILE;
  const gapPx = isMdUp ? MASONRY_GAP : MASONRY_GAP_SM;
  const { data: profileData } = useGetMyGlitProfileQuery();
  const profile = profileData?.data?.profile;

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [allGlits, setAllGlits] = useState<Glit[]>([]);
  const [searchTab, setSearchTab] = useState<SearchTabType>('glits');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<GlitfinderFilterParams>({});
  const [showCreateGlitModal, setShowCreateGlitModal] = useState(false);
  const [showPreviewGlitModal, setShowPreviewGlitModal] = useState(false);
  const [previewGlitData, setPreviewGlitData] = useState<GlitFormData | null>(null);
  const scrollContainerRef = useRef<HTMLElement>(null);
  const hasNextPageRef = useRef(false);
  const isFetchingRef = useRef(false);

  const trimmedSearch = searchQuery.trim();
  const isSearchMode = trimmedSearch.length > 0;
  const mappedFilters = mapFiltersToApiParams(appliedFilters);
  const hasActiveFilters = () => Object.values(appliedFilters).some((v) => v !== undefined && v !== '');

  const { data: categoriesData } = useFetchMarketplaceCategoriesQuery({
    limit: 20,
    type: 'service',
  });
  const categories = (categoriesData as { categories?: Array<{ id?: string; value?: string; name?: string; label?: string }> })?.categories ?? [];
  const enhancedCategories = [
    { id: 'trending', name: 'Trending' },
    ...(Array.isArray(categories) ? categories.map((c) => ({ id: c.id ?? c.value ?? c.name ?? '', name: c.name ?? c.label ?? c.value ?? '' })) : []),
  ];

  const categoryName = selectedCategoryId === 'trending'
    ? undefined
    : enhancedCategories.find((c) => c.id === selectedCategoryId)?.name;

  const glitsQueryParams =
    isSearchMode && searchTab === 'glits'
      ? { page, limit: PAGE_SIZE, search: trimmedSearch, ...mappedFilters }
      : !isSearchMode
        ? { page, limit: PAGE_SIZE, ...(categoryName && { category: categoryName }) }
        : undefined;
  const glitsSkip = isSearchMode && searchTab !== 'glits';
  const { data: feedData, isLoading: feedLoading, isFetching } = useGetGlitsFeedQuery(
    glitsSkip ? undefined : glitsQueryParams,
    { skip: glitsSkip }
  );

  const { data: glitboardsData, isLoading: boardsLoading } = useGetGlitboardsFeedQuery(
    isSearchMode && searchTab === 'boards' ? { search: trimmedSearch, page: 1, limit: 20 } : undefined,
    { skip: !isSearchMode || searchTab !== 'boards' }
  );
  const profilesQueryArg = isSearchMode && searchTab === 'profiles' ? { searchTerm: trimmedSearch, page: 1, limit: 20 } : { searchTerm: '', page: 1, limit: 20 };
  const { data: profilesData, isLoading: profilesLoading } = useSearchGlitProfilesQuery(profilesQueryArg, {
    skip: !isSearchMode || searchTab !== 'profiles',
  });
  const glitboards = glitboardsData?.data?.docs ?? EMPTY_GLITBOARDS;
  const searchProfiles = profilesData?.data?.docs ?? [];
  const totalResults =
    searchTab === 'glits'
      ? (feedData?.data?.meta?.total ?? 0) || allGlits.length
      : searchTab === 'boards'
        ? glitboardsData?.data?.meta?.totalDocs ?? 0
        : profilesData?.data?.meta?.total ?? 0;

  const meta = feedData?.data?.meta;
  const docsLength = feedData?.data?.docs?.length ?? 0;
  const hasNextPage = Boolean(meta?.hasNextPage) || (page === 1 && docsLength >= PAGE_SIZE);
  hasNextPageRef.current = hasNextPage || (docsLength >= PAGE_SIZE);
  isFetchingRef.current = isFetching;

  // Reset and refetch when filters or search/category change
  useEffect(() => {
    setPage(1);
    setAllGlits([]);
  }, [categoryName, trimmedSearch, appliedFilters.glitType, appliedFilters.glitboardSize, appliedFilters.followerCount]);

  // Open create glit modal when navigated with state flag
  useEffect(() => {
    const state = location.state as { openCreateGlit?: boolean } | null;
    if (state?.openCreateGlit) {
      setShowCreateGlitModal(true);
      navigate(location.pathname, { replace: true, state: { ...state, openCreateGlit: false } });
    }
  }, [location, navigate]);

  // Accumulate docs only when the response matches current page (avoids duplicate appends)
  useEffect(() => {
    const docs = feedData?.data?.docs ?? [];
    const responsePage = feedData?.data?.meta?.page;
    if (responsePage == null) return;
    if (responsePage !== page) return;
    if (responsePage === 1) {
      setAllGlits(docs);
    } else {
      setAllGlits((prev) => [...prev, ...docs]);
    }
  }, [feedData, page]);

  // Infinite scroll: load next page when user scrolls near bottom
  const onScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el || !hasNextPageRef.current || isFetchingRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const threshold = 400;
    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      setPage((p) => p + 1);
    }
  }, []);

  const columns = useMemo(
    () =>
      Array.from({ length: columnCount }, (_, colIndex) =>
        allGlits.filter((_, i) => i % columnCount === colIndex)
      ),
    [allGlits, columnCount]
  );

  const handleGlitClick = (glit: Glit) => {
    const id = glit.id ?? (glit as Glit & { _id?: string })._id;
    if (id) navigate(`/glitfinder/glit/${id}`);
  };

  const renderGlitCard = (glit: Glit, height: number) => {
    const id = glit.id ?? (glit as Glit & { _id?: string })._id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => handleGlitClick(glit)}
        className="w-full rounded-lg sm:rounded-xl overflow-hidden bg-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#4C9A2A]/30 touch-manipulation"
        style={{ height }}
      >
        <img
          src={glit.image}
          alt={glit.title || 'Glit'}
          className="w-full h-full object-cover"
        />
      </button>
    );
  };

  const getHeightForGlit = (glit: Glit) => {
    const id = glit.id ?? (glit as Glit & { _id?: string })._id ?? '';
    const hashCode = String(id).split('').reduce((acc: number, c: string) => c.charCodeAt(0) + ((acc << 5) - acc), 0);
    return CARD_HEIGHTS[Math.abs(hashCode) % CARD_HEIGHTS.length];
  };

  const getHeightForBoard = (board: Glitboard) => {
    const id = board.id ?? '';
    const hashCode = String(id).split('').reduce((acc: number, c: string) => c.charCodeAt(0) + ((acc << 5) - acc), 0);
    return CARD_HEIGHTS[Math.abs(hashCode) % CARD_HEIGHTS.length];
  };

  const boardColumns = useMemo(
    () =>
      Array.from({ length: columnCount }, (_, i) =>
        glitboards.filter((_, idx) => idx % columnCount === i)
      ),
    [glitboards, columnCount]
  );

  const renderBoardCard = (board: Glitboard, height: number) => {
    const id = board.id ?? '';
    const firstGlit = board.glits?.[0] as { image?: string } | undefined;
    const thumb = board.image ?? firstGlit?.image ?? 'https://cdn-icons-png.flaticon.com/128/2182/2182242.png';
    const count = board.glitsCount ?? board.glits?.length ?? 0;
    return (
      <button
        key={id}
        type="button"
        onClick={() => navigate(`/glitfinder/board/${id}`)}
        className="w-full rounded-lg sm:rounded-xl overflow-hidden bg-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#4C9A2A]/30 relative touch-manipulation"
        style={{ height }}
      >
        <img src={thumb} alt={board.name || 'Board'} className="w-full h-full object-cover" />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 sm:p-3">
          <p className="text-white font-semibold text-[12px] sm:text-[14px] truncate">{board.name || 'Untitled Board'}</p>
          <p className="text-white/90 text-[11px] sm:text-[12px]">{count} glit{count !== 1 ? 's' : ''}</p>
        </div>
      </button>
    );
  };

  const showGlitsContent = !isSearchMode || searchTab === 'glits';
  const showBoardsContent = isSearchMode && searchTab === 'boards';
  const showProfilesContent = isSearchMode && searchTab === 'profiles';

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* Fixed: Search + profile */}
      <div className="flex-shrink-0 sticky top-0 z-20 bg-white pt-[max(0.75rem,env(safe-area-inset-top,0px))] sm:pt-6 pb-0">
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-[#E5E7EB] justify-between min-w-0">
          <div className="flex flex-1 min-w-0 items-center gap-2 sm:gap-3">
            {!isLgUp && mobileNav ? (
              <button
                type="button"
                className="shrink-0 p-2 -ml-1 rounded-lg hover:bg-gray-100 text-[#101828] transition-colors touch-manipulation"
                aria-label="Open menu"
                onClick={() => mobileNav.openMobileNav()}
              >
                <Menu size={22} strokeWidth={2} className="text-[#0A0A0A]" />
              </button>
            ) : null}
            <div className="flex-1 flex items-center gap-2 sm:gap-3 rounded-lg bg-[#F5F5F5] px-3 sm:px-4 py-2.5 sm:py-3 text-left min-w-0 max-w-[500px]">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-[#6C6C6C]" aria-hidden />
            <input
              type="search"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-0 bg-transparent text-[16px] sm:text-[14px] font-medium text-[#1a1a1a] placeholder:text-[#9D9D9D] focus:outline-none touch-manipulation"
              aria-label="Search glits"
            />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6 shrink-0">
            <Button onClick={() => setShowCreateGlitModal(true)} className="text-[13px] sm:text-[14px] px-3 sm:px-4 py-2 sm:py-2.5 touch-manipulation">
              Create
            </Button>
            {profile?.profilePicture && (
            <button
              type="button"
              onClick={() => navigate('/glitfinder/profile')}
              className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-[#E5E7EB] touch-manipulation"
            >
              <img
                src={profile.profilePicture}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </button>
          )}
          </div>
          
        </div>
        {/* Search mode: Filters + All glits | Boards | Profiles. Otherwise: category pills */}
        {isSearchMode ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-3 sm:px-4 py-3 sm:py-4 mt-2 sm:mt-4 min-w-0">
            <div className="flex flex-1 min-w-0 overflow-x-auto gap-2 no-scrollbar pb-0.5 sm:pb-0">
              {(['glits', 'boards', 'profiles'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSearchTab(tab)}
                  className={`flex-shrink-0 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-[13px] sm:text-[14px] font-semibold transition-colors touch-manipulation ${
                    searchTab === tab ? 'bg-[#EBFEE3] text-[#3D7B22]' : 'text-[#9D9D9D] hover:bg-[#EEEEEE]'
                  }`}
                >
                  {tab === 'glits' ? 'All glits' : tab === 'boards' ? 'Boards' : 'Profiles'}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowFiltersModal(true)}
              className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-full text-[12px] sm:text-[13px] font-semibold transition-colors shrink-0 touch-manipulation self-start sm:self-auto ${
                hasActiveFilters() ? 'bg-[#EBFEE3] text-[#3D7B22]' : 'bg-[#F5F5F5] text-[#3B3B3B] hover:bg-[#EEEEEE]'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 shrink-0" color={hasActiveFilters() ? '#3D7B22' : '#3B3B3B'} />
              Filters
            </button>
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-2 px-3 sm:px-4 py-3 sm:py-4 no-scrollbar mt-2 sm:mt-4 pb-0.5 sm:pb-0">
            {enhancedCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(selectedCategoryId === cat.id ? null : cat.id)}
                className={`flex-shrink-0 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-[13px] sm:text-[14px] font-semibold transition-colors touch-manipulation ${
                  selectedCategoryId === cat.id
                    ? 'bg-[#EBFEE3] text-[#3D7B22]'
                    : 'text-[#9D9D9D] hover:bg-[#EEEEEE]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Scrollable: Feed - masonry or list by tab */}
      <section
        ref={scrollContainerRef}
        onScroll={onScroll}
        className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 pt-2 pb-8 pb-[max(2rem,env(safe-area-inset-bottom,0px))]"
      >
        {showBoardsContent && (
          <>
            {boardsLoading ? (
              <div className="flex min-w-0 mt-4 sm:mt-6" style={{ gap: gapPx }}>
                {Array.from({ length: columnCount }, (_, colIndex) => (
                  <div key={colIndex} className="flex-1 flex flex-col min-w-0" style={{ gap: gapPx }}>
                    {CARD_HEIGHTS.filter((_, i) => i % columnCount === colIndex).map((h, i) => (
                      <div key={`b-${colIndex}-${i}`} className="rounded-lg sm:rounded-xl bg-[#F0F0F0] animate-pulse w-full" style={{ height: h }} />
                    ))}
                  </div>
                ))}
              </div>
            ) : glitboards.length === 0 ? (
              <div className="py-12 text-center flex items-center justify-center min-h-[40vh]">
                <div>
                  <img src="https://cdn-icons-png.flaticon.com/128/7486/7486820.png" alt="No boards" className="w-16 h-16 sm:w-[72px] sm:h-[72px] mx-auto mb-4" />
                  <p className="text-[14px] font-medium text-[#6C6C6C]">No boards found.</p>
                </div>
              </div>
            ) : (
              <div className="flex min-w-0 mt-3 sm:mt-4" style={{ gap: gapPx }}>
                {boardColumns.map((col, colIndex) => (
                  <div key={colIndex} className="flex-1 flex flex-col min-w-0" style={{ gap: gapPx }}>
                    {col.map((board) => renderBoardCard(board, getHeightForBoard(board)))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {showProfilesContent && (
          <>
            {profilesLoading ? (
              <div className="py-12 flex justify-center">
                <div className="rounded-full w-10 h-10 border-2 border-[#E5E7EB] border-t-[#4C9A2A] animate-spin" />
              </div>
            ) : searchProfiles.length === 0 ? (
              <div className="py-12 text-center flex items-center justify-center min-h-[40vh]">
                <div>
                  <img src="https://cdn-icons-png.flaticon.com/128/7486/7486820.png" alt="No profiles" className="w-16 h-16 sm:w-[72px] sm:h-[72px] mx-auto mb-4" />
                  <p className="text-[14px] font-medium text-[#6C6C6C]">No profiles found.</p>
                </div>
              </div>
            ) : (
              <ul className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 min-w-0">
                {searchProfiles.map((p: { id?: string; _id?: string; profilePicture?: string; username?: string }) => (
                  <li
                    key={p.id ?? p._id}
                    className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-[#F5F5F5] hover:bg-[#EEEEEE] min-w-0"
                  >
                    <button
                      type="button"
                      onClick={() => p.username && navigate(`/glitfinder/profile/${encodeURIComponent(p.username)}`)}
                      className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 text-left touch-manipulation"
                    >
                      <img
                        src={p.profilePicture ?? 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                        alt=""
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shrink-0"
                      />
                      <span className="flex-1 text-[14px] sm:text-[15px] font-medium text-[#1a1a1a] truncate min-w-0">
                        @{p.username ?? 'user'}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[13px] sm:text-[14px] font-semibold bg-[#4C9A2A] text-white hover:bg-[#3d7b22] shrink-0 touch-manipulation"
                    >
                      Follow
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {showGlitsContent && (
          <>
            {feedLoading && allGlits.length === 0 ? (
              <div className="flex min-w-0 mt-4 sm:mt-6" style={{ gap: gapPx }}>
                {Array.from({ length: columnCount }, (_, colIndex) => (
                  <div key={colIndex} className="flex-1 flex flex-col min-w-0" style={{ gap: gapPx }}>
                    {CARD_HEIGHTS.filter((_, i) => i % columnCount === colIndex).map((h, i) => (
                      <div
                        key={`${colIndex}-${i}`}
                        className="rounded-lg sm:rounded-xl bg-[#F0F0F0] animate-pulse w-full"
                        style={{ height: h }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            ) : allGlits.length === 0 ? (
              <div className="py-12 rounded-xl text-center min-h-[50vh] sm:min-h-[60vh] md:h-[70vh] flex items-center justify-center px-2">
                <div>
                  <img src={'https://cdn-icons-png.flaticon.com/128/7486/7486820.png'} alt="No glits" className="w-16 h-16 sm:w-[72px] sm:h-[72px] mx-auto mb-4" />
                  <p className="text-[14px] font-medium text-[#6C6C6C]">No glits found.</p>
                </div>
              </div>
            ) : (
              <div className="flex min-w-0 mt-2" style={{ gap: gapPx }}>
                {columns.map((columnGlits, colIndex) => (
                  <div key={colIndex} className="flex-1 flex flex-col min-w-0" style={{ gap: gapPx }}>
                    {columnGlits.map((glit) => renderGlitCard(glit, getHeightForGlit(glit)))}
                  </div>
                ))}
              </div>
            )}
            {allGlits.length > 0 && (
              <div className="min-h-[1px] flex justify-center py-4">
                {isFetching && page > 1 && (
                  <div className="rounded-full w-8 h-8 border-2 border-[#E5E7EB] border-t-[#4C9A2A] animate-spin" />
                )}
              </div>
            )}
          </>
        )}
      </section>

      <GlitfinderFiltersModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        onApplyFilters={setAppliedFilters}
        currentFilters={appliedFilters}
        resultCount={totalResults}
      />

      <CreateGlitModal
        isOpen={showCreateGlitModal}
        onClose={() => setShowCreateGlitModal(false)}
        onNext={(data) => {
          setPreviewGlitData(data);
          setShowCreateGlitModal(false);
          setShowPreviewGlitModal(true);
        }}
      />

      <PreviewGlitModal
        isOpen={showPreviewGlitModal}
        onClose={() => {
          setShowPreviewGlitModal(false);
          setPreviewGlitData(null);
        }}
        data={previewGlitData}
      />
    </div>
  );
};

export default GlitfinderHome;
