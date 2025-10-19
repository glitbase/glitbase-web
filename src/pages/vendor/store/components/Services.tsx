/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useGetServicesQuery, useDeleteServiceMutation } from '@/redux/vendor';
import { toast } from 'react-toastify';

interface ServicesProps {
  storeId: string;
}

const Services = ({ storeId }: ServicesProps) => {
  const navigate = useNavigate();
  const store = useSelector((state: RootState) => state.vendorStore.store);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

  const { data, isLoading, refetch } = useGetServicesQuery({
    storeId,
    page,
    limit: 10,
    category,
  });

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

  console.log(data);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
            <div className="flex space-x-4">
              <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const services = data?.services || [];
  const meta = data?.meta;
  const categories = store?.preferredCategories || [];

  return (
    <div className="relative">
      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="mb-6">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            <button
              onClick={() => setCategory('')}
              className={`px-6 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                category === ''
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-6 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                  category === cat
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Services List */}
      {services.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <div
            className="w-16 h-16 cursor-pointer rounded-full flex items-center justify-center mx-auto mb-4"
            onClick={handleAddService}
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
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No services added yet
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Add your services to let customers know what you offer and start
            accepting bookings
          </p>
          {/* <button
            onClick={handleAddService}
            className="px-6 py-3 bg-[#4C9A2A] text-white rounded-full font-medium hover:bg-[#4d7a30]"
          >
            Add your first service
          </button> */}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {services.map((service: any) => (
              <div
                key={service.id}
                className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex space-x-4">
                  {/* Service Image */}
                  <div className="w-20 h-20 flex-shrink-0">
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
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {service.name}
                        </h3>
                        {service.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {service.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <span className="font-semibold text-gray-900">
                            {service.pricingType === 'free'
                              ? 'Free'
                              : service.pricingType === 'from'
                              ? `From ${formatPrice(
                                  service.price,
                                  service.currency
                                )}`
                              : formatPrice(service.price, service.currency)}
                          </span>
                          <span className="text-gray-500">
                            {formatDuration(service.durationInMinutes)}
                          </span>
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
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEditService(service)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                          title="Edit service"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => setServiceToDelete(service.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                          title="Delete service"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!meta.hasPrevPage}
                className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {meta.page} of {meta.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!meta.hasNextPage}
                className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Floating Add Button */}
      <button
        onClick={handleAddService}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#4C9A2A] hover:bg-[#3d7a22] text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-30"
        title="Add service"
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

      {/* Delete Confirmation Modal */}
      {serviceToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Service
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this service? This action cannot
              be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setServiceToDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteService}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
