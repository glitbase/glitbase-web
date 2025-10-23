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
import VendorHome from './VendorHome';
import { IoChevronForward, IoChevronBack } from 'react-icons/io5';
import spiral2 from '@/assets/images/spiral2.svg';
import { useModal } from '@/components/Modal/ModalProvider';
import { ModalId } from '@/Layout';

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
        <div className="px-12 py-6  min-h-screen">
          {/* Greeting Section */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-[40px] font-normal text-[#1D2739] font-[lora]">
              Hello, {user?.firstName || 'User'} 👋
            </h1>
            <button className="flex items-center gap-2 px-6 py-3  rounded-lg hover:bg-gray-50 transition-colors bg-[#FAFAFA]">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 4.66675L4 4.66675"
                  stroke="#3B3B3B"
                  stroke-width="1.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M2 11.3333L6 11.3333"
                  stroke="#3B3B3B"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M12 11.3333H14"
                  stroke="#3B3B3B"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M10 4.66675L14 4.66675"
                  stroke="#3B3B3B"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M4 4.66675C4 4.04549 4 3.73487 4.10149 3.48983C4.23682 3.16313 4.49639 2.90357 4.82309 2.76824C5.06812 2.66675 5.37875 2.66675 6 2.66675C6.62125 2.66675 6.93187 2.66675 7.17693 2.76824C7.5036 2.90357 7.7632 3.16313 7.89853 3.48983C8 3.73487 8 4.04549 8 4.66675C8 5.288 8 5.59863 7.89853 5.84366C7.7632 6.17036 7.5036 6.42993 7.17693 6.56525C6.93187 6.66675 6.62125 6.66675 6 6.66675C5.37875 6.66675 5.06812 6.66675 4.82309 6.56525C4.49639 6.42993 4.23682 6.17036 4.10149 5.84366C4 5.59863 4 5.288 4 4.66675Z"
                  stroke="#3B3B3B"
                  stroke-width="1.5"
                />
                <path
                  d="M8 11.3333C8 10.712 8 10.4014 8.10147 10.1563C8.2368 9.82965 8.4964 9.57005 8.82307 9.43472C9.06813 9.33325 9.37873 9.33325 10 9.33325C10.6213 9.33325 10.9319 9.33325 11.1769 9.43472C11.5036 9.57005 11.7632 9.82965 11.8985 10.1563C12 10.4014 12 10.712 12 11.3333C12 11.9545 12 12.2651 11.8985 12.5102C11.7632 12.8369 11.5036 13.0965 11.1769 13.2318C10.9319 13.3333 10.6213 13.3333 10 13.3333C9.37873 13.3333 9.06813 13.3333 8.82307 13.2318C8.4964 13.0965 8.2368 12.8369 8.10147 12.5102C8 12.2651 8 11.9545 8 11.3333Z"
                  stroke="#3B3B3B"
                  stroke-width="1.5"
                />
              </svg>

              <span className="text-[14px] font-medium text-[#1D2739]">
                Filters
              </span>
            </button>
          </div>

          {/* Banner Section */}
          <div className="mb-12 relative overflow-hidden rounded-2xl bg-[#F2FFEC] p-8 h-[250px] flex items-center justify-between">
            <div className="flex flex-col justify-between h-full">
              <div className="upper mb-4">
                {' '}
                <h2 className="text-[24px] font-semibold text-[#0A0A0A] mb-3 max-w-[375px]">
                  Your favorite pro not here yet?
                </h2>
                <p className="text-[18px] text-[#6C6C6C] mb-4 max-w-[375px]">
                  Share their details with us and we'll invite them to join
                </p>
              </div>

              <button
                onClick={() => showModal(ModalId.RECOMMEND_PRO_MODAL)}
                className="bg-[#4C9A2A] text-white max-w-[225px] px-12 py-4 rounded-full font-semibold text-[14px] hover:bg-[#3d7b22] transition-colors"
              >
                Submit their info
              </button>
            </div>
            <div className="absolute right-0 top-0 h-full">
              <img
                src={spiral2}
                alt="banner"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Services you may love */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[24px] font-semibold text-[#1D2739]">
                Services you may love
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    scroll(servicesScrollRef, 'left', setServicesScrollState)
                  }
                  disabled={servicesScrollState.isAtStart}
                  className="p-2 rounded-full border border-[#E4E7EC] hover:bg-gray-50 transition-colors bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <IoChevronBack size={20} className="text-[#1D2739]" />
                </button>
                <button
                  onClick={() =>
                    scroll(servicesScrollRef, 'right', setServicesScrollState)
                  }
                  disabled={servicesScrollState.isAtEnd}
                  className="p-2 rounded-full border border-[#E4E7EC] hover:bg-gray-50 transition-colors bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <IoChevronForward size={20} className="text-[#1D2739]" />
                </button>
              </div>
            </div>
            <div
              ref={servicesScrollRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
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
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[24px] font-semibold text-[#1D2739]">
                Providers near you
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    scroll(providersScrollRef, 'left', setProvidersScrollState)
                  }
                  disabled={providersScrollState.isAtStart}
                  className="p-2 rounded-full border border-[#E4E7EC] hover:bg-gray-50 transition-colors bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <IoChevronBack size={20} className="text-[#1D2739]" />
                </button>
                <button
                  onClick={() =>
                    scroll(providersScrollRef, 'right', setProvidersScrollState)
                  }
                  disabled={providersScrollState.isAtEnd}
                  className="p-2 rounded-full border border-[#E4E7EC] hover:bg-gray-50 transition-colors bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <IoChevronForward size={20} className="text-[#1D2739]" />
                </button>
              </div>
            </div>
            <div
              ref={providersScrollRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
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
          <div className="mb-12">
            <h2 className="text-[24px] font-semibold text-[#1D2739] mb-6">
              Categories
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[24px] font-semibold text-[#1D2739]">
                New to glitbase
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    scroll(
                      newProvidersScrollRef,
                      'left',
                      setNewProvidersScrollState
                    )
                  }
                  disabled={newProvidersScrollState.isAtStart}
                  className="p-2 rounded-full border border-[#E4E7EC] hover:bg-gray-50 transition-colors bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <IoChevronBack size={20} className="text-[#1D2739]" />
                </button>
                <button
                  onClick={() =>
                    scroll(
                      newProvidersScrollRef,
                      'right',
                      setNewProvidersScrollState
                    )
                  }
                  disabled={newProvidersScrollState.isAtEnd}
                  className="p-2 rounded-full border border-[#E4E7EC] hover:bg-gray-50 transition-colors bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <IoChevronForward size={20} className="text-[#1D2739]" />
                </button>
              </div>
            </div>
            <div
              ref={newProvidersScrollRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
            >
              {isMarketplaceLoading
                ? Array.from({ length: 8 }).map((_, index) => (
                    <ProviderCardSkeleton
                      key={`new-provider-skeleton-${index}`}
                    />
                  ))
                : marketplaceData?.newToGlitbase?.data?.stores?.map(
                    (store: any) => <ProviderCard key={store.id} item={store} />
                  )}
            </div>
          </div>
        </div>
      )}
    </HomeLayout>
  );
};

export default Home;
