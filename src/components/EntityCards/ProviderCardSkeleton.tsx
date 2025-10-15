const ProviderCardSkeleton = () => {
  return (
    <div className="flex-shrink-0 w-[156px]">
      <div className="relative">
        <div className="w-full h-[156px] skeleton-shimmer rounded-lg" />
      </div>
      <div className="mt-2 space-y-2">
        <div className="h-4 skeleton-shimmer rounded w-3/4" />
        <div className="h-3 skeleton-shimmer rounded w-1/2" />
      </div>
    </div>
  );
};

export default ProviderCardSkeleton;
