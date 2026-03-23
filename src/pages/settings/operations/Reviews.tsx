import { useNavigate } from 'react-router-dom';
import HomeLayout from '@/layout/home/HomeLayout';
import ReviewsComponent from '@/pages/vendor/store/components/Reviews';
import { useGetMyStoreQuery } from '@/redux/vendor';

const Reviews = () => {
  const navigate = useNavigate();
  const { data: storeData, isLoading } = useGetMyStoreQuery({});
  const storeId = storeData?.store?.id;

  return (
    <HomeLayout isLoading={isLoading} showNavBar={false}>
      <div className="min-h-screen bg-white">
        <div className="max-w-[700px] px-6 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[14px] mb-6">
            <button
              onClick={() => navigate('/settings')}
              className="text-[#6C6C6C] hover:text-[#344054] font-medium"
            >
              Settings
            </button>
            <span className="text-[#6C6C6C]">/</span>
            <button
              onClick={() => navigate('/settings', { state: { tab: 'operations' } })}
              className="text-[#6C6C6C] hover:text-[#344054] font-medium"
            >
              Operations
            </button>
            <span className="text-[#6C6C6C]">/</span>
            <span className="text-[#101828] font-medium">Reviews</span>
          </div>

          {/* Title */}
          <h1 className="text-[23px] font-bold text-[#0A0A0A] mb-8 tracking-tight font-[lora]">
            Reviews
          </h1>

          {storeId && <ReviewsComponent storeId={storeId} isSettings={true} />}
        </div>
      </div>
    </HomeLayout>
  );
};

export default Reviews;
