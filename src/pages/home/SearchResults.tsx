/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import HomeLayout from '@/layout/home/HomeLayout';
import { useLazySearchMarketplaceQuery } from '@/redux/app';
import ServiceCard from '@/components/EntityCards/ServiceCard';
import ProviderCard from '@/components/EntityCards/ProviderCard';
import ServiceCardSkeleton from '@/components/EntityCards/ServiceCardSkeleton';
import ProviderCardSkeleton from '@/components/EntityCards/ProviderCardSkeleton';
import { IoChevronBack } from 'react-icons/io5';
import FilterModal from '@/components/Modal/FilterModal';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get('q') || '';

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'services' | 'stores'>('services');

  // Filter states
  const [filters, setFilters] = useState({
    sortBy: undefined as
      | 'latest'
      | 'highest_rating'
      | 'lowest_rating'
      | undefined,
    bookingType: undefined as string[] | undefined,
    category: undefined as string | undefined,
    storeAvailability: undefined as string | undefined,
    maxPrice: undefined as number | undefined,
    duration: undefined as string | undefined,
    distance: undefined as number | undefined,
  });

  const [searchMarketplace, { data: searchResults, isLoading, isFetching }] =
    useLazySearchMarketplaceQuery();

  // Perform search when query or filters change
  useEffect(() => {
    if (searchQuery) {
      searchMarketplace({
        query: searchQuery,
        limit: 50,
        ...filters,
      });
    }
  }, [searchQuery, filters, searchMarketplace]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === prev[key as keyof typeof prev] ? undefined : value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      sortBy: undefined,
      bookingType: undefined,
      category: undefined,
      storeAvailability: undefined,
      maxPrice: undefined,
      duration: undefined,
      distance: undefined,
    });
  };

  const hasActiveFilters = Object.values(filters).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== 0;
  });

  const handleSearch = (value: string) => {
    if (value.trim()) {
      navigate(`/search?q=${encodeURIComponent(value)}`);
    }
  };

  const services = searchResults?.services || [];
  const stores = searchResults?.stores || [];

  return (
    <HomeLayout isLoading={false} onSearch={handleSearch}>
      <div className="px-12 py-6 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <IoChevronBack size={24} className="text-[#1D2739]" />
            </button>
            <div>
              <h1 className="text-[32px] font-semibold text-[#1D2739] font-[lora]">
                Search Results
              </h1>
              <p className="text-[16px] text-[#6C6C6C] mt-1">
                {searchQuery && (
                  <>
                    Showing results for "
                    <span className="font-medium">{searchQuery}</span>"
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowFilterModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors bg-[#FAFAFA]"
          >
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
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 11.3333L6 11.3333"
                stroke="#3B3B3B"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 11.3333H14"
                stroke="#3B3B3B"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10 4.66675L14 4.66675"
                stroke="#3B3B3B"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4 4.66675C4 4.04549 4 3.73487 4.10149 3.48983C4.23682 3.16313 4.49639 2.90357 4.82309 2.76824C5.06812 2.66675 5.37875 2.66675 6 2.66675C6.62125 2.66675 6.93187 2.66675 7.17693 2.76824C7.5036 2.90357 7.7632 3.16313 7.89853 3.48983C8 3.73487 8 4.04549 8 4.66675C8 5.288 8 5.59863 7.89853 5.84366C7.7632 6.17036 7.5036 6.42993 7.17693 6.56525C6.93187 6.66675 6.62125 6.66675 6 6.66675C5.37875 6.66675 5.06812 6.66675 4.82309 6.56525C4.49639 6.42993 4.23682 6.17036 4.10149 5.84366C4 5.59863 4 5.288 4 4.66675Z"
                stroke="#3B3B3B"
                strokeWidth="1.5"
              />
              <path
                d="M8 11.3333C8 10.712 8 10.4014 8.10147 10.1563C8.2368 9.82965 8.4964 9.57005 8.82307 9.43472C9.06813 9.33325 9.37873 9.33325 10 9.33325C10.6213 9.33325 10.9319 9.33325 11.1769 9.43472C11.5036 9.57005 11.7632 9.82965 11.8985 10.1563C12 10.4014 12 10.712 12 11.3333C12 11.9545 12 12.2651 11.8985 12.5102C11.7632 12.8369 11.5036 13.0965 11.1769 13.2318C10.9319 13.3333 10.6213 13.3333 10 13.3333C9.37873 13.3333 9.06813 13.3333 8.82307 13.2318C8.4964 13.0965 8.2368 12.8369 8.10147 12.5102C8 12.2651 8 11.9545 8 11.3333Z"
                stroke="#3B3B3B"
                strokeWidth="1.5"
              />
            </svg>
            <span className="text-[14px] font-medium text-[#1D2739]">
              Filters
            </span>
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-[#4C9A2A] rounded-full"></span>
            )}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('services')}
            className={`pb-4 px-2 text-[16px] font-medium transition-colors relative ${
              activeTab === 'services'
                ? 'text-[#4C9A2A]'
                : 'text-[#6C6C6C] hover:text-[#1D2739]'
            }`}
          >
            Services
            {services.length > 0 && (
              <span className="ml-2 text-[14px]">({services.length})</span>
            )}
            {activeTab === 'services' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#4C9A2A]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('stores')}
            className={`pb-4 px-2 text-[16px] font-medium transition-colors relative ${
              activeTab === 'stores'
                ? 'text-[#4C9A2A]'
                : 'text-[#6C6C6C] hover:text-[#1D2739]'
            }`}
          >
            Stores
            {stores.length > 0 && (
              <span className="ml-2 text-[14px]">({stores.length})</span>
            )}
            {activeTab === 'stores' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#4C9A2A]" />
            )}
          </button>
        </div>

        {/* Loading State */}
        {(isLoading || isFetching) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) =>
              activeTab === 'services' ? (
                <ServiceCardSkeleton key={`skeleton-${index}`} />
              ) : (
                <ProviderCardSkeleton key={`skeleton-${index}`} />
              )
            )}
          </div>
        )}

        {/* Services Tab */}
        {!isLoading && !isFetching && activeTab === 'services' && (
          <>
            {services.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {services.map((service: any) => (
                  <ServiceCard key={service.id} item={service} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-[18px] text-[#6C6C6C] mb-2">
                  No services found
                </p>
                <p className="text-[14px] text-[#9C9C9C]">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </>
        )}

        {/* Stores Tab */}
        {!isLoading && !isFetching && activeTab === 'stores' && (
          <>
            {stores.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stores.map((store: any) => (
                  <ProviderCard key={store.id} item={store} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-[18px] text-[#6C6C6C] mb-2">
                  No stores found
                </p>
                <p className="text-[14px] text-[#9C9C9C]">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        onApplyFilters={() => {
          // Filters are already applied via useEffect watching filters state
        }}
      />
    </HomeLayout>
  );
};

export default SearchResults;
