/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  useGetStoreReviewsQuery,
  useGetStoreReviewMetricsQuery,
} from "@/redux/vendor";

interface ReviewsProps {
  storeId: string;
  isSettings?: boolean;
}

const Reviews = ({ storeId, isSettings = false }: ReviewsProps) => {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<
    "latest" | "oldest" | "highest_rating" | "lowest_rating"
  >("latest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);

  const { data: metricsData, isLoading: isLoadingMetrics } =
    useGetStoreReviewMetricsQuery(storeId);

  const { data, isLoading } = useGetStoreReviewsQuery({
    storeId,
    page,
    limit: 10,
    sortBy,
  });

  const metrics = metricsData?.metrics?.metrics;
  const reviews = data?.reviews || [];
  const meta = data?.meta;

  const sortOptions = [
    { label: "Latest", value: "latest" },
    { label: "Oldest", value: "oldest" },
    { label: "Highest rating", value: "highest_rating" },
    { label: "Lowest rating", value: "lowest_rating" },
  ];

  const renderStars = (rating: number) => {
    return [...Array(rating)].map((_, index) => (
      // <svg
      //   key={index}
      //   className={`w-5 h-5 ${
      //     index < rating ? 'text-yellow-400' : 'text-gray-300'
      //   }`}
      //   fill="currentColor"
      //   viewBox="0 0 20 20"
      // >
      //   <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      // </svg>
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-3 h-3 ${
          index < rating ? "text-yellow-400" : "text-gray-300"
        }`}
      >
        <g clip-path="url(#clip0_94_250202)">
          <path
            d="M9.14655 2.29628L10.3198 4.66208C10.4797 4.99141 10.9064 5.3073 11.2663 5.36779L13.3927 5.724C14.7526 5.95251 15.0726 6.94722 14.0927 7.92849L12.4395 9.5953C12.1595 9.87759 12.0062 10.422 12.0929 10.8118L12.5662 12.8752C12.9395 14.5084 12.0796 15.1401 10.6464 14.2866L8.65327 13.097C8.29331 12.8819 7.70004 12.8819 7.33342 13.097L5.3403 14.2866C3.91379 15.1401 3.04722 14.5016 3.42052 12.8752L3.8938 10.8118C3.98045 10.422 3.82714 9.87759 3.54717 9.5953L1.89402 7.92849C0.920792 6.94722 1.23409 5.95251 2.59394 5.724L4.72037 5.36779C5.07367 5.3073 5.50029 4.99141 5.66027 4.66208L6.83347 2.29628C7.4734 1.01257 8.51329 1.01257 9.14655 2.29628Z"
            fill="#0A0A0A"
            stroke="#0A0A0A"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </g>
        <defs>
          <clipPath id="clip0_94_250202">
            <rect width="16" height="16" fill="white" />
          </clipPath>
        </defs>
      </svg>
    ));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays}d`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading || isLoadingMetrics) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
            <div className="flex space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Metrics and Reviews Grid */}
      <div className={`grid ${isSettings ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
        {/* Left Side - Metrics Summary */}
        {metrics && (
          <div className="">
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-base font-medium text-[#0A0A0A] text-[14px] w-3">
                    {rating}
                  </span>
                  <div className="flex-1 h-2 bg-[#EDEDED] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#03593E] rounded-full"
                      style={{
                        width: `${
                          metrics.ratingsDistribution[
                            rating as keyof typeof metrics.ratingsDistribution
                          ] || 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-[#9D9D9D] text-[14px] font-medium w-12">
                    {metrics.ratingsDistribution[
                      rating as keyof typeof metrics.ratingsDistribution
                    ] || 0}
                    %
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Right Side - Reviews List */}
        <div className="">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[15px] font-medium text-[#6C6C6C] -mt-4">
              {meta?.total || 0} review{(meta?.total || 0) !== 1 ? "s" : ""}
            </h2>
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center space-x-2 px-3 py-2 bg-[#F0F0F0] rounded-full hover:bg-gray-50 text-[#3B3B3B] text-[14px] font-medium"
              >
                <span className="text-[#3B3B3B] text-[13px] font-medium">
                  {sortOptions.find((opt) => opt.value === sortBy)?.label}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-600 transition-transform ${
                    showSortMenu ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showSortMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSortMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value as any);
                          setShowSortMenu(false);
                          setPage(1);
                        }}
                        className="block w-full text-left px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-100 first:rounded-t-md last:rounded-b-md"
                      >
                        <div className="flex items-center justify-between">
                          <span>{option.label}</span>
                          {sortBy === option.value && (
                            <svg
                              className="w-4 h-4 text-[#4C9A2A]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </div>
              <h3 className="text-[20px] font-bold text-[#0A0A0A] mb-2 font-[lora] tracking-tight">
                What people say
              </h3>
              <p className="text-[#6C6C6C] text-[14px] font-medium">
                Customer feedback and testimonials will appear here
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {reviews.map((review: any) => (
                  <div
                    key={review.id}
                    className="border-b border-gray-200 pb-4 last:border-0"
                  >
                    <div className="flex gap-3">
                      {/* Reviewer Avatar */}
                      <div className="flex-shrink-0">
                        {review?.user?.profileImageUrl ? (
                          <img
                            src={review.user.profileImageUrl}
                            alt={`${review.user.firstName} ${review.user.lastName}`}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-[15px] font-medium text-[#0A0A0A]">
                              {review?.user?.firstName?.charAt(0)}
                              {review?.user?.lastName?.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Review Content */}
                      <div className="flex-1 min-w-0">
                        <div className="mb-2">
                          <h4 className="text-[15px] font-medium text-[#0A0A0A]">
                            {review?.user?.firstName} {review?.user?.lastName}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex">
                              {renderStars(review.rating)}
                            </div>
                            <span className="text-[12px] text-[#9D9D9D] font-medium">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                        </div>
                        {review.message && (
                          <p className="text-[#3B3B3B] text-[14px] font-medium leading-relaxed">
                            {review.message}
                          </p>
                        )}
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
        </div>
      </div>

      {/* Metrics Modal */}
      {showMetricsModal && metrics && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowMetricsModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Reviews</h3>
              <button
                onClick={() => setShowMetricsModal(false)}
                className="text-gray-400 hover:text-gray-600"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  {metrics.averageRating.toFixed(1)}
                </div>
                <div className="flex justify-center mb-2">
                  {renderStars(Math.round(metrics.averageRating))}
                </div>
                <p className="text-sm text-gray-600">
                  {metrics.totalCount} reviews
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700 w-4">
                    {rating}
                  </span>
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#60983C] transition-all"
                      style={{
                        width: `${
                          metrics.ratingsDistribution[
                            rating as keyof typeof metrics.ratingsDistribution
                          ] || 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {Math.round(
                      metrics.ratingsDistribution[
                        rating as keyof typeof metrics.ratingsDistribution
                      ] || 0,
                    )}
                    %
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;
