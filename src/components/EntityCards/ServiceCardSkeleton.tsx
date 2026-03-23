const ServiceCardSkeleton = () => {
  return (
    <div className="snap-start shrink-0 w-[158px] sm:w-[168px] md:w-[180px]">
      <div className="relative">
        <div className="w-full h-[132px] sm:h-[144px] md:h-[156px] skeleton-shimmer rounded-lg" />
      </div>
      <div className="mt-2 space-y-2">
        <div className="h-3 skeleton-shimmer rounded w-3/4" />
        <div className="h-4 skeleton-shimmer rounded w-full" />
        <div className="h-3 skeleton-shimmer rounded w-1/2" />
      </div>
    </div>
  );
};

export default ServiceCardSkeleton;
