/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAppSelector } from '@/hooks/redux-hooks';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HomeLayout from '@/layout/home/HomeLayout';
import {
  useFetchMarketplaceQuery,
  useFetchMarketplaceCategoriesQuery,
} from '@/redux/app';
import ServiceCard from '@/components/EntityCards/ServiceCard';
import ProviderCard from '@/components/EntityCards/ProviderCard';
import CategoryCard from '@/components/EntityCards/CategoryCard';
import ServiceCardSkeleton from '@/components/EntityCards/ServiceCardSkeleton';
import ProviderCardSkeleton from '@/components/EntityCards/ProviderCardSkeleton';
import CategoryCardSkeleton from '@/components/EntityCards/CategoryCardSkeleton';
import VendorHome from './vendorHome/VendorHome';
import { IoChevronForward, IoChevronBack } from 'react-icons/io5';
import spiral2 from '@/assets/images/spiral2.svg';
import { useModal } from '@/components/Modal/ModalProvider';
import { ModalId } from '@/Layout';
import { Button } from '@/components/Buttons';

const Home = () => {
  const [isLoading] = useState<boolean>(false);
  const user = useAppSelector((state) => state.auth.user);
  const { showModal } = useModal();
  const navigate = useNavigate();

  // Fetch marketplace data
  const {
    data: marketplaceData,
    isLoading: isMarketplaceLoading,
    refetch: refetchMarketplace,
  } = useFetchMarketplaceQuery(10);
  const { data: categoriesData, isLoading: isCategoriesLoading } =
    useFetchMarketplaceCategoriesQuery({
      limit: 20,
      type: 'service',
    });

  // Refs for horizontal scrolling
  const servicesScrollRef = useRef<HTMLDivElement>(null);
  const providersScrollRef = useRef<HTMLDivElement>(null);
  const newProvidersScrollRef = useRef<HTMLDivElement>(null);

  // Scroll states for each carousel
  const [servicesScrollState, setServicesScrollState] = useState({
    isAtStart: true,
    isAtEnd: false,
  });
  const [providersScrollState, setProvidersScrollState] = useState({
    isAtStart: true,
    isAtEnd: false,
  });
  const [newProvidersScrollState, setNewProvidersScrollState] = useState({
    isAtStart: true,
    isAtEnd: false,
  });

  const checkScrollPosition = (
    element: HTMLDivElement,
    setState: React.Dispatch<
      React.SetStateAction<{ isAtStart: boolean; isAtEnd: boolean }>
    >
  ) => {
    const { scrollLeft, scrollWidth, clientWidth } = element;
    const isAtStart = scrollLeft <= 0;
    const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 1; // -1 for rounding

    setState({ isAtStart, isAtEnd });
  };

  const scroll = (
    ref: React.RefObject<HTMLDivElement>,
    direction: string,
    setState: React.Dispatch<
      React.SetStateAction<{ isAtStart: boolean; isAtEnd: boolean }>
    >
  ) => {
    if (ref.current) {
      const scrollAmount = 320;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });

      // Check position after scroll animation completes
      setTimeout(() => {
        if (ref.current) {
          checkScrollPosition(ref.current, setState);
        }
      }, 300);
    }
  };

  // Add scroll listeners
  useEffect(() => {
    const servicesEl = servicesScrollRef.current;
    const providersEl = providersScrollRef.current;
    const newProvidersEl = newProvidersScrollRef.current;

    const handleServicesScroll = () => {
      if (servicesEl) checkScrollPosition(servicesEl, setServicesScrollState);
    };
    const handleProvidersScroll = () => {
      if (providersEl)
        checkScrollPosition(providersEl, setProvidersScrollState);
    };
    const handleNewProvidersScroll = () => {
      if (newProvidersEl)
        checkScrollPosition(newProvidersEl, setNewProvidersScrollState);
    };

    servicesEl?.addEventListener('scroll', handleServicesScroll);
    providersEl?.addEventListener('scroll', handleProvidersScroll);
    newProvidersEl?.addEventListener('scroll', handleNewProvidersScroll);

    // Initial check
    if (servicesEl) checkScrollPosition(servicesEl, setServicesScrollState);
    if (providersEl) checkScrollPosition(providersEl, setProvidersScrollState);
    if (newProvidersEl)
      checkScrollPosition(newProvidersEl, setNewProvidersScrollState);

    return () => {
      servicesEl?.removeEventListener('scroll', handleServicesScroll);
      providersEl?.removeEventListener('scroll', handleProvidersScroll);
      newProvidersEl?.removeEventListener('scroll', handleNewProvidersScroll);
    };
  }, [marketplaceData]);

  const handleSearch = (value: string) => {
    if (value.trim()) {
      navigate(`/search?q=${encodeURIComponent(value)}`);
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    navigate(`/search?q=${encodeURIComponent(categoryName)}`);
  };

  const handleLocationChange = () => {
    // Refetch marketplace data when location changes
    refetchMarketplace();
  };

  /** Same horizontal inset as section headers (parent `p-4 md:p-6`); no negative margin */
  const carouselTrackClass =
    'flex gap-3 sm:gap-4 overflow-x-auto overscroll-x-contain scrollbar-hide scroll-smooth snap-x snap-mandatory pb-1 touch-pan-x';

  const sectionHeadingClass =
    'text-[17px] sm:text-lg md:text-[20px] font-semibold text-[#1D2739] leading-snug';

  const carouselNavBtnClass =
    'p-1.5 sm:p-2 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 touch-manipulation';

  // NOTE: Vendor onboarding redirects are now handled by VendorOnboardingGuard
  // on the /vendor/* routes. Homepage is accessible to all users.

  return (
    <HomeLayout
      isLoading={isLoading}
      onSearch={handleSearch}
      searchItems={[]}
      onLocationChange={handleLocationChange}
    >
      {user?.activeRole === 'vendor' ? (
        <VendorHome />
      ) : (
        <div className="min-h-screen p-4 md:p-6 py-6">
          {/* Greeting Section */}
          <div className="flex items-center justify-between mb-4 md:mb-8">
            <h1 className="text-[20px] md:text-[26px] font-semibold text-primary-text font-[lora] tracking-tight">
              Hello{user?.firstName ? `, ${user.firstName}` : ''} 👋
            </h1>
            {/* <button className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors bg-[#FAFAFA]">
              <Settings2 size={18} color='#3B3B3B' />
              <span className="text-[12px] font-semibold text-[#3B3B3B]">
                Filters
              </span>
            </button> */}
          </div>

          {/* Banner Section */}
          <div className="mb-6 md:mb-8 relative overflow-hidden rounded-xl sm:rounded-2xl bg-[#F2FFEC] p-4 sm:p-6 md:p-8 flex flex-col md:flex-row md:items-stretch gap-4 md:gap-6 md:min-h-[200px] lg:h-[230px] lg:min-h-0">
            <div className="relative z-10 flex flex-col justify-between gap-4 md:gap-5 flex-1 min-w-0 md:max-w-[min(100%,400px)] lg:max-w-[420px]">
              <div>
                <h2 className="text-[15px] sm:text-lg md:text-[20px] font-semibold text-[#0A0A0A] mb-1 leading-snug">
                  Your favorite pro not here yet?
                </h2>
                <p className="text-[#6C6C6C] text-[13px] sm:text-[15px] md:text-base font-medium leading-snug">
                  Share their details with us and we'll invite them to join
                </p>
              </div>
              <Button
                onClick={() => showModal(ModalId.RECOMMEND_PRO_MODAL)}
                className="w-fit !px-5 sm:!px-6 md:!py-2.5 !py-2 !text-[12px] md:text-[15px] justify-center"
              >
                Submit their info
              </Button>
            </div>
            {/* In-flow on small screens; decorative strip on md+ */}
            <div
              className="hidden md:block relative md:absolute md:right-0 md:top-0 md:h-full flex justify-end md:justify-end md:w-[48%] lg:w-[42%] max-w-[280px] sm:max-w-[320px] md:max-w-none mx-auto md:mx-0 pointer-events-none shrink-0 h-28 sm:h-32 md:h-full"
              aria-hidden
            >
              <img
                src={spiral2}
                alt=""
                className="h-full w-auto max-h-full object-contain object-right opacity-95 md:opacity-100 md:w-full md:object-cover"
              />
            </div>
          </div>

          {/* Services you may love */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-3 mb-4 md:mb-6">
              <h2
                className={`${sectionHeadingClass} min-w-0 flex-1 pr-2 sm:pr-3`}
              >
                Services you may love
              </h2>
              <div className="flex gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    scroll(servicesScrollRef, 'left', setServicesScrollState)
                  }
                  disabled={servicesScrollState.isAtStart}
                  className={`${carouselNavBtnClass} bg-[#F0F0F0] hover:bg-gray-50`}
                >
                  <IoChevronBack size={18} className="text-[#0A0A0A] sm:w-5 sm:h-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    scroll(servicesScrollRef, 'right', setServicesScrollState)
                  }
                  disabled={servicesScrollState.isAtEnd}
                  className={`${carouselNavBtnClass} bg-[#F0F0F0] hover:bg-gray-50`}
                >
                  <IoChevronForward size={18} className="text-[#1D2739] sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
            <div
              ref={servicesScrollRef}
              className={carouselTrackClass}
            >
              {isMarketplaceLoading
                ? Array.from({ length: 8 }).map((_, index) => (
                    <ServiceCardSkeleton key={`service-skeleton-${index}`} />
                  ))
                : marketplaceData?.servicesYouMayLove?.data?.services?.map(
                    (service: any) => (
                      <ServiceCard key={service.id} item={service} />
                    )
                  )}
            </div>
          </div>

          {/* Providers near you */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-3 mb-4 md:mb-6">
              <h2
                className={`${sectionHeadingClass} min-w-0 flex-1 pr-2 sm:pr-3`}
              >
                Providers near you
              </h2>
              <div className="flex gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    scroll(providersScrollRef, 'left', setProvidersScrollState)
                  }
                  disabled={providersScrollState.isAtStart}
                  className={`${carouselNavBtnClass} bg-[#F0F0F0] hover:bg-gray-50`}
                >
                  <IoChevronBack size={18} className="text-[#1D2739] sm:w-5 sm:h-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    scroll(providersScrollRef, 'right', setProvidersScrollState)
                  }
                  disabled={providersScrollState.isAtEnd}
                  className={`${carouselNavBtnClass} bg-[#F0F0F0] hover:bg-gray-50`}
                >
                  <IoChevronForward size={18} className="text-[#1D2739] sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
            <div
              ref={providersScrollRef}
              className={carouselTrackClass}
            >
              {isMarketplaceLoading
                ? Array.from({ length: 8 }).map((_, index) => (
                    <ProviderCardSkeleton key={`provider-skeleton-${index}`} />
                  ))
                : marketplaceData?.providersNearYou?.data?.stores?.map(
                    (store: any) => <ProviderCard key={store.id} item={store} />
                  )}
            </div>
          </div>

          {/* Categories */}
          <div className="mb-6 md:mb-8">
            <h2
              className={`${sectionHeadingClass} mb-4 md:mb-6`}
            >
              Categories
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {isCategoriesLoading
                ? Array.from({ length: 8 }).map((_, index) => (
                    <CategoryCardSkeleton key={`category-skeleton-${index}`} />
                  ))
                : categoriesData?.categories
                    ?.slice(0, 8)
                    .map((category: any) => (
                      <CategoryCard
                        key={category.id}
                        item={category}
                        onClick={() => handleCategoryClick(category.name)}
                      />
                    ))}
            </div>
          </div>

          {/* New to glitbase */}
          {marketplaceData?.newToGlitbase?.data?.stores?.length > 0 && (
            <div className="mb-8 md:mb-12">
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-3 mb-4 md:mb-6">
                <h2
                  className={`${sectionHeadingClass} min-w-0 flex-1 pr-2 sm:pr-3`}
                >
                  New to glitbase
                </h2>
                <div className="flex gap-1.5 sm:gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      scroll(
                        newProvidersScrollRef,
                        'left',
                        setNewProvidersScrollState
                      )
                    }
                    disabled={newProvidersScrollState.isAtStart}
                    className={`${carouselNavBtnClass} border border-[#E4E7EC] bg-white hover:bg-gray-50`}
                  >
                    <IoChevronBack size={18} className="text-[#1D2739] sm:w-5 sm:h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      scroll(
                        newProvidersScrollRef,
                        'right',
                        setNewProvidersScrollState
                      )
                    }
                    disabled={newProvidersScrollState.isAtEnd}
                    className={`${carouselNavBtnClass} border border-[#E4E7EC] bg-white hover:bg-gray-50`}
                  >
                    <IoChevronForward size={18} className="text-[#1D2739] sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
              <div
                ref={newProvidersScrollRef}
                className={carouselTrackClass}
              >
                {isMarketplaceLoading
                  ? Array.from({ length: 8 }).map((_, index) => (
                      <ProviderCardSkeleton
                        key={`new-provider-skeleton-${index}`}
                      />
                    ))
                  : marketplaceData?.newToGlitbase?.data?.stores?.map(
                      (store: any) => (
                        <ProviderCard key={store.id} item={store} />
                      )
                    )}
              </div>
            </div>
          )}
        </div>
      )}
    </HomeLayout>
  );
};

export default Home;
