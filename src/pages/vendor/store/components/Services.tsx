/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState, useRef, useEffect } from 'react';
import { Button } from '@/components/Buttons';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { removeFromCart } from '@/redux/cart/cartSlice';
import { useGetServicesQuery, useLazyGetServicesQuery, useDeleteServiceMutation } from '@/redux/vendor';
import { getServiceCategoryLabel } from '@/utils/serviceCategoryLabel';
import { toast } from 'react-toastify';
import ServiceDetailsDrawer from './ServiceDetailsDrawer';
import BookingSummaryCard from './BookingSummaryCard';
import type { BookingItem } from '@/redux/booking/bookingSlice';

interface ServicesProps {
  storeId: string;
  isReadOnly?: boolean;
}

function cartToBookingItems(cartItems: Array<{ service: any; quantity: number; selectedAddOns?: any[] }>): BookingItem[] {
  return cartItems.map((item) => {
    const addOns = (item.selectedAddOns || []).map((a: any) => ({
      id: a._id || a.id,
      name: a.name,
      description: a.description,
      price: a.price,
      durationInMinutes: a.durationInMinutes ?? (a.duration ? a.duration.hours * 60 + (a.duration.minutes || 0) : 0),
    }));
    return {
      serviceId: item.service.id,
      name: item.service.name,
      description: item.service.description,
      pricingType: item.service.pricingType || 'fixed',
      price: item.service.price || 0,
      currency: item.service.currency || 'USD',
      durationInMinutes: item.service.durationInMinutes || 0,
      imageUrl: item.service.imageUrl,
      addOns,
      quantity: item.quantity,
      availableTypes: item.service.type,
    };
  });
}

const Services = ({ storeId, isReadOnly = false }: ServicesProps) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const store = useSelector((state: RootState) => state.vendorStore.store);
  const cartItems = useSelector((state: RootState) => {
    if (!storeId || !state.cart?.carts) return [];
    return state.cart.carts[storeId] || [];
  });

  const bookingItems = useMemo(() => cartToBookingItems(cartItems), [cartItems]);
  const bookingTotals = useMemo(() => {
    const subTotal = cartItems.reduce((sum, item) => {
      const itemPrice = item.service.pricingType === 'free' ? 0 : item.service.price;
      const addOnsPrice = (item.selectedAddOns || []).reduce((s, a) => s + a.price, 0);
      return sum + (itemPrice + addOnsPrice) * item.quantity;
    }, 0);
    const totalDuration = cartItems.reduce((sum, item) => {
      const addOnsDur = (item.selectedAddOns || []).reduce((s, a) => {
        return s + (a.duration ? a.duration.hours * 60 + a.duration.minutes : a.durationInMinutes || 0);
      }, 0);
      return sum + (item.service.durationInMinutes + addOnsDur) * item.quantity;
    }, 0);
    return {
      subTotal,
      deliveryFee: 0,
      taxes: 0,
      discount: 0,
      total: subTotal,
      totalDuration,
    };
  }, [cartItems]);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [openServiceMenu, setOpenServiceMenu] = useState<string | null>(null);
  const serviceMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (serviceMenuRef.current && !serviceMenuRef.current.contains(e.target as Node)) {
        setOpenServiceMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<any | null>(null);

  const { data, isLoading, refetch } = useGetServicesQuery({
    storeId,
    page,
    limit: 50,
    category,
  });

  const [fetchServicesForCategoryChips, categoryChipsState] = useLazyGetServicesQuery();

  useEffect(() => {
    void fetchServicesForCategoryChips({
      storeId,
      page: 1,
      limit: 500,
      category: undefined,
    });
  }, [storeId, fetchServicesForCategoryChips]);

  const [deleteService, { isLoading: isDeleting }] = useDeleteServiceMutation();

  const handleAddService = () => {
    navigate('/vendor/store/add-service');
  };

  const handleEditService = (service: any) => {
    navigate(`/vendor/store/edit-service/${service.id}`, {
      state: { service },
    });
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

  const formatPrice = (price: number, currency: string) => {
    const symbols: Record<string, string> = {
      NGN: '₦',
      USD: '$',
      GBP: '£',
    };
    return `${symbols[currency] || currency}${price.toLocaleString()}`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}hr ${mins}min`;
    } else if (hours > 0) {
      return `${hours}hr`;
    } else {
      return `${mins}min`;
    }
  };

  const handleSelectService = (service: any) => {
    if (!isReadOnly) return;
    setSelectedService(service);
  };

  const services = useMemo(() => data?.services ?? [], [data?.services]);
  const meta = data?.meta;

  const categories = useMemo(() => {
    const list = categoryChipsState.data?.services ?? [];
    const unique = new Set<string>();
    for (const s of list) {
      const label = getServiceCategoryLabel(s);
      if (label) unique.add(label);
    }
    return [...unique].sort((a, b) => a.localeCompare(b));
  }, [categoryChipsState.data?.services]);

  const displayedServices = useMemo(() => {
    if (!category) return services;
    return services.filter((s: any) => getServiceCategoryLabel(s) === category);
  }, [services, category]);

  if (isLoading) {
    return (
      <div className="space-y-3 sm:space-y-4 min-w-0">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-3 sm:p-4 animate-pulse">
            <div className="flex flex-row gap-3 sm:gap-4 items-start">
              <div className="w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20 bg-gray-200 rounded-lg shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3 max-w-[8rem]" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const hasCart = cartItems.length > 0;

  return (
    <div
      className={`relative flex min-w-0 w-full flex-col gap-6 ${
        hasCart
          ? 'lg:flex-row lg:items-start lg:justify-between lg:gap-8 xl:gap-12'
          : ''
      }`}
    >
      <div
        className={`w-full min-w-0 max-w-[600px] ${
          hasCart ? 'lg:mx-0 lg:shrink-0' : 'mx-auto'
        }`}
      >
        <div className="min-w-0">
          {/* Category Filter — full viewport width on mobile, horizontal scroll */}
          {categories.length > 0 && (
            <div className="mb-4 sm:mb-6 w-[100vw] max-w-[100vw] ml-[calc(50%-50vw)] sm:ml-0 sm:w-full sm:max-w-none">
              <div
                className="flex flex-nowrap gap-2 sm:gap-2 overflow-x-auto overflow-y-hidden scrollbar-hide overscroll-x-contain pb-2 pt-0.5 snap-x snap-mandatory scroll-px-4 px-4 sm:scroll-px-0 sm:px-0 touch-pan-x"
                role="tablist"
                aria-label="Filter services by category"
              >
                <button
                  type="button"
                  onClick={() => setCategory('')}
                  className={`shrink-0 snap-start px-4 sm:px-6 h-8 sm:h-[32px] rounded-full whitespace-nowrap font-semibold text-xs sm:text-[13px] transition-colors touch-manipulation ${
                    category === ''
                      ? 'bg-black text-white'
                      : 'text-[#6C6C6C] hover:bg-gray-200 active:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`shrink-0 snap-start px-3 sm:px-4 h-8 sm:h-[32px] rounded-full font-semibold text-xs sm:text-[13px] whitespace-nowrap transition-colors touch-manipulation ${
                      category === cat
                        ? 'bg-black text-white'
                        : 'text-[#6C6C6C] hover:bg-gray-200 active:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Services List */}
          {displayedServices.length === 0 ? (
            <div className="bg-white rounded-lg p-6 sm:p-10 md:p-12 text-center">
              {services.length > 0 && category ? (
                <>
                  <h3 className="text-lg sm:text-[20px] font-bold text-gray-900 mb-2 font-[lora] tracking-tight px-1">
                    No services in this category
                  </h3>
                  <p className="text-[#6C6C6C] mb-6 max-w-[min(100%,300px)] mx-auto text-sm sm:text-[14px] font-medium px-2">
                    Try another category or view all services.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCategory('')}
                    className="text-sm font-semibold text-[#4C9A2A] underline"
                  >
                    Show all
                  </button>
                </>
              ) : (
                <>
                  {!isReadOnly && (
                    <button
                      type="button"
                      className="w-16 h-16 cursor-pointer rounded-full flex items-center justify-center mx-auto mb-4 touch-manipulation"
                      onClick={handleAddService}
                      aria-label="Add service"
                    >
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 48 48"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect width="48" height="48" rx="24" fill="#4C9A2A" />
                        <path
                          d="M24 16V32M32 24H16"
                          stroke="white"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  )}
                  <h3 className="text-lg sm:text-[20px] font-bold text-gray-900 mb-2 font-[lora] tracking-tight px-1">
                    {isReadOnly ? 'Coming soon!' : 'No services added yet'}
                  </h3>
                  <p className="text-[#6C6C6C] mb-6 max-w-[min(100%,300px)] mx-auto text-sm sm:text-[14px] font-medium px-2">
                    {isReadOnly
                      ? 'Our services will be listed here once we’re up and running'
                      : 'Add your services to let customers know what you offer and start accepting bookings'}
                  </p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3 sm:space-y-4 min-w-0">
                {displayedServices.map((service: any) => (
                  <div
                    key={service.id}
                    onClick={() => handleSelectService(service)}
                    role={isReadOnly ? 'button' : undefined}
                    tabIndex={isReadOnly ? 0 : undefined}
                    onKeyDown={
                      isReadOnly
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleSelectService(service);
                            }
                          }
                        : undefined
                    }
                    className={`bg-white rounded-lg py-3 sm:p-4 w-full min-w-0 border border-transparent transition-shadow ${
                      isReadOnly ? 'cursor-pointer hover:border-[#F0F0F0] hover:shadow-sm' : ''
                    }`}
                  >
                    <div className="flex flex-row gap-3 sm:gap-4 items-start min-w-0">
                      {/* Service Image */}
                      <div className="w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        {service.imageUrl ? (
                          <img
                            src={service.imageUrl}
                            alt={service.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                            <svg
                              className="w-8 h-8 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Service Info */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex justify-between items-start gap-2 min-w-0">
                          <div className="flex-1 min-w-0 pr-1">
                            <h3 className="text-sm sm:text-[15px] font-medium text-[#0A0A0A] mb-1 break-words">
                              {service.name}
                            </h3>
                            {service.description && (
                              <p className="text-xs sm:text-[14px] text-[#6C6C6C] font-medium mb-2 line-clamp-2 break-words">
                                {service.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center justify-start gap-x-1 gap-y-0.5 text-xs sm:text-[14px]">
                              <span className="font-semibold text-[#0A0A0A]">
                                {service.pricingType === 'free'
                                  ? 'Free'
                                  : service.pricingType === 'from'
                                  ? `From ${formatPrice(
                                      service.price,
                                      service.currency
                                    )}`
                                  : formatPrice(
                                      service.price,
                                      service.currency
                                    )}
                              </span>
                              .
                              <span className="text-[#6C6C6C] text-[14px] font-medium">
                                {formatDuration(service.durationInMinutes)}
                              </span>
                              {/* {!isReadOnly && (
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    service.status === 'approved'
                                      ? 'bg-green-100 text-green-800'
                                      : service.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {service.status.charAt(0).toUpperCase() +
                                    service.status.slice(1)}
                                </span>
                              )} */}
                            </div>
                          </div>

                          {/* Actions */}
                          {!isReadOnly ? (
                            <div
                              className="relative ml-0 sm:ml-3 shrink-0 self-start"
                              ref={openServiceMenu === service.id ? serviceMenuRef : null}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenServiceMenu(openServiceMenu === service.id ? null : service.id);
                                }}
                                className="p-2 rounded-full hover:bg-gray-100 touch-manipulation"
                                aria-label="Service options"
                                aria-expanded={openServiceMenu === service.id}
                              >
                                <svg className="w-5 h-5 text-[#6C6C6C]" fill="currentColor" viewBox="0 0 24 24">
                                  <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
                                </svg>
                              </button>

                              {openServiceMenu === service.id && (
                                <div className="absolute right-0 sm:right-0 left-auto top-full mt-1 w-[min(100vw-2rem,10rem)] sm:w-40 bg-white rounded-xl shadow-lg z-20 overflow-hidden border border-[#F0F0F0]">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenServiceMenu(null);
                                      handleEditService(service);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-[14px] font-medium text-[#101828] hover:bg-gray-50"
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
                                      setServiceToDelete(service.id);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-[14px] font-medium text-[#D92D20] hover:bg-red-50"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="ml-0 sm:ml-3 text-gray-400 shrink-0 scale-[0.85] sm:scale-75 cursor-pointer self-start">
                              <svg
                                width="40"
                                height="40"
                                viewBox="0 0 40 40"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden
                              >
                                <rect
                                  width="40"
                                  height="40"
                                  rx="20"
                                  fill="#F0F0F0"
                                />
                                <path
                                  d="M26.6673 20L13.334 20"
                                  stroke="#3B3B3B"
                                  strokeWidth={1.8}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M22.5 24.1673C22.5 24.1673 26.6667 21.0986 26.6667 20.0006C26.6667 18.9026 22.5 15.834 22.5 15.834"
                                  stroke="#3B3B3B"
                                  strokeWidth={1.8}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 mt-6 px-1">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!meta.hasPrevPage}
                    className="px-3 sm:px-4 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 touch-manipulation"
                  >
                    Previous
                  </button>
                  <span className="text-xs sm:text-sm text-gray-600 px-1">
                    Page {meta.page} of {meta.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!meta.hasNextPage}
                    className="px-3 sm:px-4 py-2 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 touch-manipulation"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {hasCart && (
        <div className="w-full min-w-0 lg:w-[min(100%,24rem)] lg:max-w-sm lg:shrink-0">
          <BookingSummaryCard
            store={store || undefined}
            items={bookingItems}
            totals={bookingTotals}
            currency={cartItems[0]?.service?.currency || 'USD'}
            onBookNow={() => navigate(`/store/${storeId}/booking/create`)}
            showBreakdown={false}
            showCTA
            onRemoveItem={(serviceId) => dispatch(removeFromCart({ storeId, serviceId }))}
          />
        </div>
      )}

      {isReadOnly && (
        <>
          <ServiceDetailsDrawer
            service={selectedService}
            storeId={storeId}
            isOpen={!!selectedService}
            onClose={() => setSelectedService(null)}
          />
        </>
      )}

      {/* Floating Add Button */}
      {!isReadOnly && (
        <button
          type="button"
          onClick={handleAddService}
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom,0px))] right-4 sm:bottom-8 sm:right-8 w-12 h-12 sm:w-14 sm:h-14 bg-[#4C9A2A] hover:bg-[#3d7a22] text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-30 touch-manipulation"
          title="Add service"
          aria-label="Add service"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      )}

      {/* Delete Confirmation Modal */}
      {serviceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-[17px] font-bold text-[#101828] font-[lora] tracking-tight mb-2">
              Delete Service
            </h3>
            <p className="text-[14px] text-[#6C6C6C] font-medium mb-6">
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
    </div>
  );
};

export default Services;
