type CategoryCardProps = {
  name: string;
  imageUrl: string;
};

interface CategoryCardProp {
  item: CategoryCardProps;
  onClick?: () => void;
}

const CategoryCard = ({ item, onClick }: CategoryCardProp) => {
  return (
    <div
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl h-[172px] cursor-pointer hover:opacity-90 transition-opacity"
    >
      <img
        src={
          item?.imageUrl ||
          'https://media.istockphoto.com/id/1409329028/vector/no-picture-available-placeholder-thumbnail-icon-illustration-design.jpg?s=612x612&w=0&k=20&c=_zOuJu755g2eEUioiOUdz_mHKJQJn-tDgIAhQzyeKUQ='
        }
        alt={item?.name}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-[18px] text-white font-semibold">{item?.name}</h3>
      </div>
    </div>
  );
};

export default CategoryCard;
