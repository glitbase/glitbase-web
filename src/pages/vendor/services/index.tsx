/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { setStore } from '@/redux/vendor/storeSlice';
import HomeLayout from '@/layout/home/HomeLayout';
import { Button } from '@/components/Buttons';
import {
  useGetMyStoreQuery,
  useGetServicesQuery,
  useDeleteServiceMutation,
  useToggleServiceSuspensionMutation,
} from '@/redux/vendor';
import VendorServicesFiltersModal, {
  VendorServicesFilterRequest,
} from '@/components/Modal/VendorServicesFiltersModal';
import { toast } from 'react-toastify';
import { currencySymbol } from '@/pages/home/vendorHome/components/utils';
import { SlidersHorizontal, Plus, Search } from 'lucide-react';
import { Input } from '@/components/Inputs/TextInput';

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}hr ${mins}min`;
  if (hours > 0) return `${hours}hr`;
  return `${mins}min`;
};

const formatPrice = (price: number, currency: string) =>
  `${currencySymbol(currency)}${price.toLocaleString()}`;

const Services = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const store = useSelector((state: RootState) => state.vendorStore.store);
  const { data: storeData } = useGetMyStoreQuery(undefined, { skip: !!store?.id });
  const storeId = store?.id ?? storeData?.store?.id;

  useEffect(() => {
    if (storeData?.store && !store?.id) {
      dispatch(setStore(storeData.store));
    }
  }, [storeData, store?.id, dispatch]);

  const [activeTab, setActiveTab] = useState(0); // 0: All, 1: Active, 2: Archived
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<VendorServicesFilterRequest>({});
  const [page, setPage] = useState(1);
  const [openServiceMenu, setOpenServiceMenu] = useState<string | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [serviceToArchive, setServiceToArchive] = useState<any | null>(null);
  const serviceMenuRef = useRef<HTMLDivElement>(null);

  const getIsSuspendedFilter = () => {
    if (activeTab === 0) return undefined;
    if (activeTab === 1) return false;
    return true;
  };

  const {
    data,
    isLoading,
    refetch,
  } = useGetServicesQuery(
    {
      storeId: storeId!,
      page,
      limit: 20,
      category: selectedCategory || undefined,
      searchTerm: searchQuery || undefined,
      // search: searchQuery || undefined,
      durationInMinutes: appliedFilters.durationInMinutes,
      maxPrice: appliedFilters.maxPrice && appliedFilters.maxPrice > 0 ? appliedFilters.maxPrice : undefined,
      isSuspended: getIsSuspendedFilter(),
    },
    { skip: !storeId }
  );

  const [deleteService, { isLoading: isDeleting }] = useDeleteServiceMutation();
  const [toggleSuspension, { isLoading: isToggling }] = useToggleServiceSuspensionMutation();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (serviceMenuRef.current && !serviceMenuRef.current.contains(e.target as Node)) {
        setOpenServiceMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasActiveFilters = !!(
    appliedFilters.durationInMinutes !== undefined ||
    (appliedFilters.maxPrice !== undefined && appliedFilters.maxPrice > 0)
  );

  const getActiveFiltersCount = () => {
    let count = 0;
    if (appliedFilters.durationInMinutes !== undefined) count++;
    if (appliedFilters.maxPrice !== undefined && appliedFilters.maxPrice > 0) count++;
    return count;
  };

  const handleApplyFilters = (filters: VendorServicesFilterRequest) => {
    setAppliedFilters(filters);
  };

  const handleAddService = () => {
    navigate('/vendor/store/add-service');
  };

  const handleEditService = (service: any) => {
    navigate(`/vendor/store/edit-service/${service.id}`, { state: { service } });
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;
    try {
      await deleteService(serviceToDelete).unwrap();
      toast.success('Service deleted successfully');
      setServiceToDelete(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete service');
    }
  };

  const handleConfirmArchive = async () => {
    if (!serviceToArchive) return;
    try {
      await toggleSuspension(serviceToArchive.id).unwrap();
      toast.success(serviceToArchive.isSuspended ? 'Service activated' : 'Service archived');
      setServiceToArchive(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update service');
    }
  };

  const tabs = [
    { title: 'All services', type: 'all' as const },
    { title: 'Active', type: 'active' as const },
    { title: 'Archived', type: 'archived' as const },
  ];

  const categories = store?.preferredCategories ?? storeData?.store?.preferredCategories ?? [];
  const allCategories = ['', ...categories];
  const services = data?.services ?? [];
  const meta = data?.meta;

  if (!storeId) {
    return (
      <HomeLayout isLoading={false}>
        <div className="min-h-screen bg-white flex items-center justify-center">
          {isLoading ? (
            <div className="animate-pulse text-[#6C6C6C]">Loading...</div>
          ) : (
            <p className="text-[#6C6C6C]">No store found. Complete onboarding first.</p>
          )}
        </div>
      </HomeLayout>
    );
  }

  return (
    <HomeLayout isLoading={false}>
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between bg-white px-6 py-5">
          <h1 className="text-[24px] font-bold text-[#101828] font-[lora] tracking-tight">
            Services
          </h1>
          <Button onClick={handleAddService} className='!h-[40px] !px-4 !text-[14px] !font-medium'>
            <Plus size={18} className='mr-2' strokeWidth={2.5} />
            Add service
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-10 px-6 border-b border-[#FAFAFA]">
          {tabs.map((tab, i) => (
            <button
              key={tab.type}
              type="button"
              onClick={() => setActiveTab(i)}
              className={`py-2 border-b-[3px] -mb-[1px] outline-none focus:outline-none focus:ring-0 transition-colors ${
                activeTab === i
                  ? 'border-primary text-[#101828] font-semibold'
                  : 'border-transparent text-[#9D9D9D] font-medium'
              }`}
            >
              {tab.title}
            </button>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-3 justify-between px-6 py-4 mt-2">
          <div className="flex-1 relative max-w-[500px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9D9D9D] z-10" />
            <Input
              placeholder="Search services"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFiltersModal(true)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
              hasActiveFilters
                ? 'bg-[#F2FFEC] text-primary'
                : 'bg-[#FAFAFA] text-[#6C6C6C] hover:bg-[#FAFAFA]'
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" color='#3B3B3B' strokeWidth={2.5} />
            <span className="text-[13px] font-medium text-[#3B3B3B]">Filters</span>
            {hasActiveFilters && (
              <span className="min-w-[18px] h-[18px] rounded-full bg-primary flex items-center justify-center text-[11px] font-semibold text-white px-1">
                {getActiveFiltersCount()}
              </span>
            )}
          </button>
        </div>

        {/* Category chips */}
        {allCategories.length > 1 && (
          <div className="flex items-center gap-4 px-6 pb-4 overflow-x-auto scrollbar-hide">
            {allCategories.map((cat) => (
              <button
                key={cat || 'all'}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 py-2 px-4 rounded-full text-[14px] font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#101828] text-white'
                    : 'text-[#6C6C6C] hover:text-[#101828]'
                }`}
              >
                {cat || 'All'}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-6" style={{ paddingBottom: 'env(safe-area-inset-bottom, 100px)' }}>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-[#F0F0F0] rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[#F0F0F0] rounded w-1/3" />
                      <div className="h-3 bg-[#F0F0F0] rounded w-2/3" />
                      <div className="h-3 bg-[#F0F0F0] rounded w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-[20px] font-bold text-[#101828] font-[lora] mb-2">
                No services found
              </h3>
              <p className="text-[14px] font-medium text-[#6C6C6C] max-w-[70%] mx-auto mb-6">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Create your first service to get started'}
              </p>
              {!searchQuery && (
                <Button onClick={handleAddService}>Add service</Button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {services.map((service: any) => (
                  <div key={service.id} className="bg-white rounded-xl py-4">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 flex-shrink-0">
                        {service.imageUrl ? (
                          <img
                            src={service.imageUrl}
                            alt={service.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#F0F0F0] rounded-lg flex items-center justify-center">
                            <svg className="w-8 h-8 text-[#9D9D9D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-[15px] font-semibold text-[#101828] mb-1">{service.name}</h3>
                            {service.description && (
                              <p className="text-[14px] text-[#6C6C6C] font-medium line-clamp-2 mb-1 max-w-[500px]">
                                {service.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-1 text-[14px]">
                              <span className="font-semibold text-[#101828]">
                                {service.pricingType === 'free'
                                  ? 'Free'
                                  : service.pricingType === 'from'
                                  ? `From ${formatPrice(service.price, service.currency)}`
                                  : formatPrice(service.price, service.currency)}
                              </span>
                              <span className="text-[#6C6C6C]"> . </span>
                              <span className="text-[#6C6C6C] font-medium">
                                {formatDuration(service.durationInMinutes)}
                              </span>
                              {service.category && (
                                <>
                                  <span className="text-[#6C6C6C]"> . </span>
                                  <span className="text-[#6C6C6C] font-medium">{service.category}</span>
                                </>
                              )}
                            </div>
                            {(service.isSuspended ?? service.status === 'rejected') && (
                              <span className="inline-block mt-2 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#FFF0F0] text-[#BB0A0A]">
                                Archived
                              </span>
                            )}
                          </div>
                          <div className="relative ml-2" ref={openServiceMenu === service.id ? serviceMenuRef : undefined}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenServiceMenu(openServiceMenu === service.id ? null : service.id);
                              }}
                              className="p-2 rounded-full hover:bg-[#F0F0F0]"
                            >
                              <svg className="w-5 h-5 text-[#6C6C6C]" fill="currentColor" viewBox="0 0 24 24">
                                <circle cx="5" cy="12" r="1.5" />
                                <circle cx="12" cy="12" r="1.5" />
                                <circle cx="19" cy="12" r="1.5" />
                              </svg>
                            </button>
                            {openServiceMenu === service.id && (
                              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-[#F0F0F0] z-20 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenServiceMenu(null);
                                    handleEditService(service);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-[#101828] hover:bg-[#FAFAFA]"
                                >
                                  <svg className="w-4 h-4 text-[#6C6C6C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenServiceMenu(null);
                                    setServiceToArchive(service);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-[#101828] hover:bg-[#FAFAFA]"
                                >
                                  <svg className="w-4 h-4 text-[#6C6C6C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                  </svg>
                                  {service.isSuspended ?? service.status === 'rejected' ? 'Activate' : 'Archive'}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenServiceMenu(null);
                                    setServiceToDelete(service.id);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-[#D92D20] hover:bg-red-50"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {meta && meta.totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!meta.hasPrevPage}
                    className="px-4 py-2 border border-[#E5E5E5] rounded-lg text-[14px] font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FAFAFA]"
                  >
                    Previous
                  </button>
                  <span className="text-[14px] text-[#6C6C6C]">
                    Page {meta.page} of {meta.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!meta.hasNextPage}
                    className="px-4 py-2 border border-[#E5E5E5] rounded-lg text-[14px] font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FAFAFA]"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* FAB */}
        <button
          type="button"
          onClick={handleAddService}
          className="fixed bottom-8 right-6 w-14 h-14 bg-primary hover:bg-[#3d7a22] text-white rounded-full shadow-lg flex items-center justify-center z-30 transition-colors"
          title="Add service"
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </button>
      </div>

      <VendorServicesFiltersModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={appliedFilters}
      />

      {/* Archive/Activate confirmation modal */}
      {serviceToArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-[17px] font-bold text-[#101828] font-[lora] tracking-tight mb-2">
              {serviceToArchive.isSuspended ? 'Activate service' : 'Archive service'}
            </h3>
            <p className="text-[14px] font-medium text-[#6C6C6C] mb-6">
              {serviceToArchive.isSuspended
                ? 'This service will become visible to customers again.'
                : 'This service will be hidden from customers. You can activate it again at any time.'}
            </p>
            <div className="flex gap-3">
              <div className="flex-1">
                <Button variant="cancel" size="full" onClick={() => setServiceToArchive(null)} disabled={isToggling}>
                  Cancel
                </Button>
              </div>
              <div className="flex-1">
                <Button size="full" onClick={handleConfirmArchive} loading={isToggling}>
                  {serviceToArchive.isSuspended ? 'Activate' : 'Archive'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {serviceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-[17px] font-bold text-[#101828] font-[lora] tracking-tight mb-2">
              Delete service
            </h3>
            <p className="text-[14px] font-medium text-[#6C6C6C] mb-6">
              Are you sure you want to delete this service? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <div className="flex-1">
                <Button variant="cancel" size="full" onClick={() => setServiceToDelete(null)} disabled={isDeleting}>
                  Cancel
                </Button>
              </div>
              <div className="flex-1">
                <Button variant="destructive" size="full" onClick={handleDeleteService} loading={isDeleting}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </HomeLayout>
  );
};

export default Services;
