/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import HomeLayout from '@/layout/home/HomeLayout';
import { Button } from '@/components/Buttons';
import {
  useGetMyStoreQuery,
  useUpdateStoreMutation,
  useGetMarketplaceCategoriesQuery,
} from '@/redux/vendor';

const BusinessCategory = () => {
  const navigate = useNavigate();
  const { data: storeData, refetch } = useGetMyStoreQuery({});
  const [updateStore, { isLoading: isUpdating }] = useUpdateStoreMutation();
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useGetMarketplaceCategoriesQuery('service');

  const store = storeData?.store;
  const categories = categoriesData?.categories || [];

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    if (store?.preferredCategories) setSelectedCategories(store.preferredCategories);
  }, [store]);

  const handleCategoryToggle = (categoryName: string) =>
    setSelectedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((c) => c !== categoryName)
        : [...prev, categoryName]
    );

  const handleSave = async () => {
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one category');
      return;
    }
    try {
      await updateStore({ storeId: store.id, preferredCategories: selectedCategories }).unwrap();
      toast.success('Business categories updated successfully');
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update business categories');
    }
  };

  return (
    <HomeLayout isLoading={false} showNavBar={false}>
      <div className="min-h-screen bg-white">
        <div className="max-w-[500px] px-6 py-8">
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
            <span className="text-[#101828] font-medium">Business category</span>
          </div>

          {/* Title */}
          <h1 className="text-[23px] font-bold text-[#0A0A0A] mb-8 tracking-tight font-[lora]">
            Business category
          </h1>

          {/* Categories grid */}
          {isLoadingCategories ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 bg-[#F5F5F5] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {categories.map((category: any) => {
                const isSelected = selectedCategories.includes(category.name);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryToggle(category.name)}
                    className={`p-4 rounded-xl text-left transition-colors ${
                      isSelected
                        ? 'bg-[#FFF4FD]'
                        : 'bg-[#FAFAFA] hover:bg-[#FFF4FD]'
                    }`}
                  >
                    <div className="flex flex-col items-start gap-3">
                      {category.icon ? (
                        <img
                          src={category.icon}
                          alt={category.name}
                          className="w-6 h-6 object-contain"
                        />
                      ) : (
                        <span className="text-2xl">{category.emoji || '📦'}</span>
                      )}
                      <p className="text-[14px] font-medium text-[#101828] leading-snug">
                        {category.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Save */}
          <div className="mt-8">
            <Button
              onClick={handleSave}
              disabled={isUpdating || selectedCategories.length === 0 || isLoadingCategories}
              variant="default"
              size="full"
              loading={isUpdating}
            >
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
};

export default BusinessCategory;
