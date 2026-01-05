/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGetMyStoreQuery } from '@/redux/vendor';
import { useGetStoreByIdQuery } from '@/redux/app';
import { useDispatch, useSelector } from 'react-redux';
import { setStore } from '@/redux/vendor/storeSlice';
import { RootState } from '@/redux/store';
import { useAppSelector } from '@/hooks/redux-hooks';
import { setStoreContext } from '@/redux/booking/bookingSlice';
import StoreHeader from './components/StoreHeader';
import Services from './components/Services';
import Faqs from './components/Faqs';
import About from './components/About';
import Gallery from './components/Gallery';
import Reviews from './components/Reviews';
import PageLoader from '@/PageLoader';
import HomeLayout from '@/layout/home/HomeLayout';

type TabType = 'Services' | 'FAQs' | 'About' | 'Gallery' | 'Reviews';

const StorePage = () => {
  const dispatch = useDispatch();
  const store = useSelector((state: RootState) => state.vendorStore.store);
  const user = useAppSelector((state) => state.auth.user);
  const { storeId } = useParams<{ storeId?: string }>();

  const [activeTab, setActiveTab] = useState<TabType>('Services');
  const [isHeaderFixed, setIsHeaderFixed] = useState(false);

  // Determine if we're viewing the vendor's own store (/vendor/store) or a public store (/store/:storeId)
  const hasStoreId = !!storeId;
  const isOwnStore = !hasStoreId;

  // Fetch the appropriate store
  const {
    data: myStoreData,
    isLoading: isMyStoreLoading,
    error: myStoreError,
  } = useGetMyStoreQuery(undefined, {
    // Only fetch "my store" when we are on the vendor dashboard route
    skip: hasStoreId,
    refetchOnMountOrArgChange: true,
  });

  const {
    data: publicStoreData,
    isLoading: isPublicStoreLoading,
    error: publicStoreError,
  } = useGetStoreByIdQuery(storeId!, {
    // Only fetch a public store when we have a storeId param
    skip: !hasStoreId,
  });

  const data = isOwnStore ? myStoreData : publicStoreData;
  const isLoading = isOwnStore ? isMyStoreLoading : isPublicStoreLoading;
  const error = isOwnStore ? myStoreError : publicStoreError;

  // Check if the current user is the owner of the viewed store
  const isStoreOwner = isOwnStore || (user?.id && store?.owner === user.id);

  useEffect(() => {
    if (data?.store) {
      dispatch(setStore(data.store));
      dispatch(
        setStoreContext({
          storeId: data.store.id,
          storeName: data.store.name,
          storeLocation: data.store.location?.name,
          storeRating: data.store.rating,
          storeOpeningHours: data.store.openingHours,
          storeBannerImageUrl: data.store.bannerImageUrl,
          storeReviewCount: data.store.reviewCount,
          storePaymentPolicy: data.store.policies?.payment,
          storeBookingPolicy: data.store.policies?.booking,
        })
      );
    }
  }, [data, dispatch]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsHeaderFixed(true);
      } else {
        setIsHeaderFixed(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load store</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#60983C] text-white rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const tabs: TabType[] = ['Services', 'FAQs', 'About', 'Gallery', 'Reviews'];

  return (
    <HomeLayout isLoading={false} showNavBar={!isStoreOwner}>
      <div className="min-h-screen ">
        {/* Store Header */}
        <StoreHeader store={store} isReadOnly={!isStoreOwner} />

        {/* Tabs Navigation */}
        <div
          className={`bg-white border-b sticky top-0 z-40 transition-shadow ${
            isHeaderFixed ? 'shadow-md' : ''
          }`}
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-center space-x-8 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-2 whitespace-nowrap font-medium transition-colors relative ${
                    activeTab === tab
                      ? 'text-[#343226] border-b-4 border-[#4C9A2A]'
                      : 'text-[#9D9D9D] hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {activeTab === 'Services' && (
            <Services storeId={store.id} isReadOnly={!isStoreOwner} />
          )}
          {activeTab === 'FAQs' && (
            <Faqs store={store} isReadOnly={!isStoreOwner} />
          )}
          {activeTab === 'About' && (
            <About store={store} isReadOnly={!isStoreOwner} />
          )}
          {activeTab === 'Gallery' && (
            <Gallery store={store} isReadOnly={!isStoreOwner} />
          )}
          {activeTab === 'Reviews' && <Reviews storeId={store.id} />}
        </div>
      </div>
    </HomeLayout>
  );
};

export default StorePage;
