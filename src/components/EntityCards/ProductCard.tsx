import { resolveCurrency } from "@/utils/helpers";

type ProductCardProps = {
    name: string;
    isFavorite: boolean;
    imageUrls: string[];
    price: number;
    currency: string;
    description: string;
};

interface ProductCardProp {
    item: ProductCardProps;
}

const ProductCard = ({ item }: ProductCardProp) => {
  return (
    <div className="h-[300px]">
        <div className="">
        <img src={item?.imageUrls[0] === "http://image.jpeg" ? 'https://media.istockphoto.com/id/1409329028/vector/no-picture-available-placeholder-thumbnail-icon-illustration-design.jpg?s=612x612&w=0&k=20&c=_zOuJu755g2eEUioiOUdz_mHKJQJn-tDgIAhQzyeKUQ=' : item?.imageUrls[0]} alt={item?.name} className="w-full h-[150px] object-cover rounded-2xl" />
        <div className="mt-3">
            <h3 className="text-[13px] text-[#1E1E1E] font-medium font-[Lora]">{item?.name}</h3>
            <p className="text-[#101928] text-[11px] mt-2">{item?.description}</p>
        </div>
        </div>
        <p className="font-semibold mt-2 text-[15px]">{resolveCurrency(item?.currency)}{item?.price?.toLocaleString()}</p>
    </div>
  );
};

export default ProductCard;