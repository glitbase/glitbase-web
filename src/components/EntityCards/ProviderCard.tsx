import { useNavigate } from 'react-router-dom';

type ProviderCardProps = {
  id?: string;
  _id?: string;
  name: string;
  bannerImageUrl: string;
  rating: number;
  reviewCount: number;
};

interface ProviderCardProp {
  item: ProviderCardProps;
}

const ProviderCard = ({ item }: ProviderCardProp) => {
  const navigate = useNavigate();

  const handleClick = () => {
    const storeId = item?.id || item?._id;
    console.log('Provider card clicked:', item);
    if (storeId) {
      console.log('Navigating to store:', storeId);
      navigate(`/store/${storeId}`);
    } else {
      console.warn('No id or _id found in item:', item);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="flex-shrink-0 w-[156px] cursor-pointer hover:opacity-80 transition-opacity"
    >
      <div className="relative">
        <img
          src={
            item?.bannerImageUrl ||
            'https://media.istockphoto.com/id/1409329028/vector/no-picture-available-placeholder-thumbnail-icon-illustration-design.jpg?s=612x612&w=0&k=20&c=_zOuJu755g2eEUioiOUdz_mHKJQJn-tDgIAhQzyeKUQ='
          }
          alt={item?.name}
          className="w-full h-[156px] object-cover rounded-lg"
        />
      </div>
      <div className="mt-2">
        <h3 className="text-[14px] text-[#1D2739] font-semibold">
          {item?.name}
        </h3>
        {/* {item?.rating > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[12px] font-medium text-[#1D2739]">
              ⭐ {item.rating}
            </span>
            <span className="text-[12px] text-[#6C6C6C]">
              ({item.reviewCount})
            </span>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default ProviderCard;
