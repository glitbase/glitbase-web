import { useAppSelector } from '@/hooks/redux-hooks';
import { useState, useEffect, useMemo, useRef } from 'react';
import HomeLayout from '@/layout/home/HomeLayout';
import { useGetProductsQuery, useGetServicesQuery } from '@/redux/entity';
import ProductCard from '@/components/EntityCards/ProductCard';
import VendorHome from './VendorHome';
import { useNavigate, useLocation } from 'react-router-dom';

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading] = useState<boolean>(false);
  const user = useAppSelector((state) => state.auth.user);

  const [currentEntity, setCurrentEntity] = useState<string>('product');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);

  const isManualEntityChange = useRef(false);

  const entities = [
    {
      label: 'Products',
      value: 'product',
    },
    {
      label: 'Services',
      value: 'service',
    },
  ];

  const {
    data: products = [],
    isLoading: pLoading,
    refetch: refetchProducts,
  } = useGetProductsQuery({
    status: 'pending',
  });
  const { data: services = [], refetch: refetchServices } = useGetServicesQuery(
    { status: 'pending' }
  );

  const items =
    currentEntity === 'product' ? products?.products : services?.services;

  const allItems = useMemo(() => {
    return [...(products?.products || []), ...(services?.services || [])];
  }, [products, services]);

  const resultCounts = useMemo(() => {
    if (!isSearchActive || searchResults.length === 0) {
      return { product: 0, service: 0 };
    }

    return searchResults.reduce(
      (counts, item) => {
        const type = item.type || 'product';
        counts[type] = (counts[type] || 0) + 1;
        return counts;
      },
      { product: 0, service: 0 }
    );
  }, [isSearchActive, searchResults]);

  const filteredItems = useMemo(() => {
    if (!isSearchActive) return items;

    // Filter search results by the current entity type
    return searchResults.filter((item) => {
      if (currentEntity === 'product') {
        return item.type === 'product' || !item.type;
      } else {
        return item.type === 'service';
      }
    });
  }, [isSearchActive, searchResults, currentEntity, items]);

  const handleEntityChange = (entityValue: string) => {
    setCurrentEntity(entityValue);
    isManualEntityChange.current = true;

    setTimeout(() => {
      isManualEntityChange.current = false;
    }, 100);
  };

  useEffect(() => {
    const handlePageReload = () => {
      setSearchTerm('');
      setSearchResults([]);
      setIsSearchActive(false);
      navigate(location.pathname, { replace: true, state: null });
    };

    window.addEventListener('beforeunload', handlePageReload);

    return () => {
      window.removeEventListener('beforeunload', handlePageReload);
    };
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (
      isSearchActive &&
      filteredItems.length === 0 &&
      !isManualEntityChange.current
    ) {
      if (currentEntity === 'product' && resultCounts.service > 0) {
        setCurrentEntity('service');
      } else if (currentEntity === 'service' && resultCounts.product > 0) {
        setCurrentEntity('product');
      }
    }
  }, [isSearchActive, filteredItems?.length, currentEntity, resultCounts]);

  useEffect(() => {
    const resetSearchState = () => {
      setSearchTerm('');
      setSearchResults([]);
      setIsSearchActive(false);
    };

    resetSearchState();

    window.addEventListener('beforeunload', resetSearchState);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', resetSearchState);
    };
  }, []);

  useEffect(() => {
    if (location.state?.searchTerm) {
      const term = location.state.searchTerm;

      if (searchTerm !== term) {
        setSearchTerm(term);
      }

      const results = allItems.filter(
        (item: any) =>
          item?.name?.toLowerCase().includes(term.toLowerCase()) ||
          item?.description?.toLowerCase().includes(term.toLowerCase())
      );

      if (results.length > 0) {
        const typedResults = results.map((item) => ({
          ...item,
          type: products?.products?.find(
            (p: { id: string }) => p.id === item.id
          )
            ? 'product'
            : 'service',
        }));

        setSearchResults(typedResults);

        if (!isSearchActive) {
          setIsSearchActive(true);
        }

        const productCount = typedResults.filter(
          (item) => item.type === 'product'
        ).length;
        const serviceCount = typedResults.filter(
          (item) => item.type === 'service'
        ).length;

        if (productCount === 0 && serviceCount > 0) {
          setCurrentEntity('service');
        } else if (serviceCount === 0 && productCount > 0) {
          setCurrentEntity('product');
        }
      } else {
        if (searchResults.length !== 0) {
          setSearchResults([]);
        }

        if (isSearchActive) {
          setIsSearchActive(false);
        }
      }
    } else {
      // Avoid redundant updates
      if (searchTerm !== '') {
        setSearchTerm('');
      }

      if (searchResults.length !== 0) {
        setSearchResults([]);
      }

      if (isSearchActive) {
        setIsSearchActive(false);
      }
    }
  }, [
    location.state?.searchTerm,
    allItems,
    products?.products,
    searchResults,
    isSearchActive,
  ]);

  const handleSearch = (value: string) => {
    if (!value.trim()) {
      setSearchTerm('');
      setIsSearchActive(false);
      setSearchResults([]);
      return;
    }

    setSearchTerm(value);

    const results = allItems.filter(
      (item: any) =>
        item?.name?.toLowerCase().includes(value.toLowerCase()) ||
        item?.description?.toLowerCase().includes(value.toLowerCase())
    );

    if (results.length > 0) {
      const typedResults = results.map((item) => ({
        ...item,
        type: products?.products?.find((p: { id: string }) => p.id === item.id)
          ? 'product'
          : 'service',
      }));

      setSearchResults(typedResults);
      setIsSearchActive(true);

      const productCount = typedResults.filter(
        (item) => item.type === 'product'
      ).length;
      const serviceCount = typedResults.filter(
        (item) => item.type === 'service'
      ).length;

      if (productCount === 0 && serviceCount > 0) {
        setCurrentEntity('service');
      } else if (serviceCount === 0 && productCount > 0) {
        setCurrentEntity('product');
      }
    } else {
      setIsSearchActive(false);
      setSearchResults([]);
    }
  };

  const handleLocationChange = () => {
    // Refetch products and services when location changes
    refetchProducts();
    refetchServices();
  };

  return (
    <HomeLayout
      isLoading={isLoading}
      onSearch={handleSearch}
      searchItems={allItems}
      onLocationChange={handleLocationChange}
    >
      {user?.activeRole === 'vendor' ? (
        <VendorHome />
      ) : (
        <div className="px-8 py-6">
          {/* Greeting Section */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-[32px] font-normal text-[#1D2739]">
              Hello, {user?.firstName || 'User'} 👋
            </h1>
            <button className="flex items-center gap-2 px-4 py-2 border border-[#E4E7EC] rounded-lg hover:bg-gray-50 transition-colors">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 10H15M2.5 5H17.5M7.5 15H12.5"
                  stroke="#1D2739"
                  strokeWidth="1.67"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[14px] font-medium text-[#1D2739]">
                Filters
              </span>
            </button>
          </div>

          {/* Search Results Header */}
          {isSearchActive && (
            <h3 className="font-[lora] text-semibold text-[#1D2739] text-[1.4rem] mb-4">
              {filteredItems.length > 0
                ? `Showing search results for "${searchTerm}" (${filteredItems.length})`
                : `No results found for "${searchTerm}"`}
            </h3>
          )}
          <div className="flex mt-4 rounded-lg border border-[#E4E7EC] w-fit overflow-hidden">
            {entities?.map((entity) => (
              <p
                key={entity?.label}
                onClick={() => handleEntityChange(entity?.value)}
                className={`py-2 capitalize cursor-pointer px-5 text-[12px] font-semibold ${
                  currentEntity === entity?.value
                    ? 'bg-[#FFF] text-[#1671D9]'
                    : 'bg-[#E4E7EC] text-[#98A2B3]'
                }`}
              >
                {entity?.label}{' '}
                {isSearchActive && `(${resultCounts[entity.value]})`}
              </p>
            ))}
          </div>
          {!isSearchActive && (
            <h3 className="font-[Lora] font-semibold text-[#B73F79] text-[1.05rem] capitalize mt-6">
              Trending {currentEntity}s
            </h3>
          )}
          {pLoading ? (
            <></>
          ) : (
            <>
              {isSearchActive && filteredItems.length === 0 && (
                <div className="flex justify-center items-center h-40 w-full">
                  <p className="text-gray-500 font-medium text-center">
                    No {currentEntity} results found for "{searchTerm}"
                  </p>
                </div>
              )}
              <div
                className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mt-4"
                style={{ rowGap: '0px' }}
              >
                {filteredItems?.map((product: any) => (
                  <ProductCard key={product?.id} item={product} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </HomeLayout>
  );
};

export default Home;
