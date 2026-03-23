import { resolveCurrency } from '@/utils/helpers';

type ServiceCardProps = {
  name: string;
  imageUrl: string;
  price: number;
  currency: string;
  pricingType: string;
  store?: {
    name: string;
    rating: number;
    reviewCount: number;
  };
};

interface ServiceCardProp {
  item: ServiceCardProps;
}

const ServiceCard = ({ item }: ServiceCardProp) => {
  return (
    <div className="snap-start shrink-0 w-[158px] sm:w-[168px] md:w-[180px]">
      <div className="relative">
        <img
          src={
            item?.imageUrl ||
            'https://media.istockphoto.com/id/1409329028/vector/no-picture-available-placeholder-thumbnail-icon-illustration-design.jpg?s=612x612&w=0&k=20&c=_zOuJu755g2eEUioiOUdz_mHKJQJn-tDgIAhQzyeKUQ='
          }
          alt={item?.name}
          className="w-full h-[120px] md:h-[132px] sm:h-[144px] md:h-[156px] object-cover rounded-lg"
        />
      </div>
      <div className="mt-2">
        {item?.store && (
          <p className="text-[12px] text-[#6C6C6C] font-medium">
            {item.store.name}
          </p>
        )}
        <h3 className="text-[13px] md:text-[14px] text-[#1D2739] font-medium mt-1">
          {item?.name}
        </h3>
        {item?.store && item.store.rating > 0 && (
          <div className="flex items-center gap-1 mt-1">
            {/* <span className="text-[12px] font-medium text-[#1D2739] flex items-center gap-1">
              <svg
                width="16"
                height="17"
                viewBox="0 0 16 17"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.15046 2.79604L10.3237 5.16184C10.4836 5.49117 10.9103 5.80705 11.2702 5.86754L13.3967 6.22376C14.7565 6.45227 15.0765 7.44698 14.0966 8.42825L12.4434 10.0951C12.1635 10.3773 12.0101 10.9217 12.0968 11.3116L12.5701 13.3749C12.9434 15.0081 12.0835 15.6399 10.6503 14.7863L8.65718 13.5967C8.29722 13.3816 7.70395 13.3816 7.33732 13.5967L5.34421 14.7863C3.9177 15.6399 3.05113 15.0014 3.42442 13.3749L3.8977 11.3116C3.98436 10.9217 3.83104 10.3773 3.55107 10.0951L1.89792 8.42825C0.924698 7.44698 1.238 6.45227 2.59785 6.22376L4.72428 5.86754C5.07757 5.80705 5.50419 5.49117 5.66417 5.16184L6.83738 2.79604C7.47731 1.51232 8.51719 1.51232 9.15046 2.79604Z"
                  fill="#0A0A0A"
                  stroke="#0A0A0A"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              {item.store.rating}
            </span> */}
            {/* <span className="text-[12px] text-[#4C9A2A] font-bold">
              ({item.store.reviewCount})
            </span> */}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceCard;
