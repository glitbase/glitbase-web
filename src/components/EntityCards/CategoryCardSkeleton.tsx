const CategoryCardSkeleton = () => {
  return (
    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl h-[136px] sm:h-[152px] md:h-[172px]">
      <div className="w-full h-full skeleton-shimmer" />
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
        <div className="h-4 sm:h-5 bg-gray-300/60 rounded w-2/3" />
      </div>
    </div>
  );
};

export default CategoryCardSkeleton;
