const CategoryCardSkeleton = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl h-[172px]">
      <div className="w-full h-full skeleton-shimmer" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="h-5 bg-gray-300/60 rounded w-2/3" />
      </div>
    </div>
  );
};

export default CategoryCardSkeleton;
