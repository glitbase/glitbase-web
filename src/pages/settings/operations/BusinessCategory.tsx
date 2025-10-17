/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  useGetMyStoreQuery,
  useUpdateStoreMutation,
  useGetMarketplaceCategoriesQuery,
} from '@/redux/vendor';
import HomeLayout from '@/layout/home/HomeLayout';

const BusinessCategory = () => {
  const navigate = useNavigate();
  const { data: storeData, refetch } = useGetMyStoreQuery({});
  const [updateStore, { isLoading: isUpdating }] = useUpdateStoreMutation();
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useGetMarketplaceCategoriesQuery('service');

  const store = storeData?.store;
  const categories = categoriesData?.categories || [];

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Load existing categories
  useEffect(() => {
    if (store?.preferredCategories) {
      setSelectedCategories(store.preferredCategories);
    }
  }, [store]);

  const handleCategoryToggle = (categoryName: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((c) => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleSave = async () => {
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one category');
      return;
    }

    try {
      await updateStore({
        storeId: store.id,
        preferredCategories: selectedCategories,
      }).unwrap();

      toast.success('Business categories updated successfully');
      refetch();
    } catch (error: any) {
      toast.error(
        error?.data?.message || 'Failed to update business categories'
      );
    }
  };

  return (
    <HomeLayout
      isLoading={false}
      showNavBar={false}
      onSearch={() => {}}
      onLocationChange={() => {}}
    >
      <div className="min-h-screen bg-white">
        <div className="max-w-[600px] mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[14px] text-[#667085] mb-6">
            <button
              onClick={() => navigate('/settings')}
              className="hover:text-[#101828]"
            >
              Settings
            </button>
            <span>/</span>
            <button
              onClick={() =>
                navigate('/settings', { state: { tab: 'operations' } })
              }
              className="hover:text-[#101828]"
            >
              Operations
            </button>
            <span>/</span>
            <span className="text-[#101828]">Business category</span>
          </div>

          {/* Header */}
          <h1 className="text-[28px] font-semibold text-[#101828] mb-8">
            Business category
          </h1>

          {/* Categories Grid */}
          {isLoadingCategories ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-100 rounded-lg animate-pulse"
                ></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((category: any) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryToggle(category.name)}
                  className={`p-4 rounded-lg transition-all text-left ${
                    selectedCategories.includes(category.name)
                      ? 'bg-[#FFF4FD]'
                      : ' bg-[#FAFAFA] hover:border-[#CC5A88]'
                  }`}
                >
                  <div className="flex flex-col items-start gap-3">
                    {category.icon ? (
                      <img
                        src={category.icon}
                        alt={category.name}
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#F5F5F5] flex items-center justify-center">
                        <span className="text-2xl">
                          {category.emoji || '📦'}
                        </span>
                      </div>
                    )}
                    <p className="font-medium text-[14px] text-[#101828]">
                      {category.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected Categories */}
          {/* {selectedCategories.length > 0 && (
          <div className="mt-6 p-4 bg-[#F9FAFB] rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              Selected ({selectedCategories.length}):
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((cat) => (
                <span
                  key={cat}
                  className="px-3 py-1 bg-white border border-[#CC5A88] text-[#CC5A88] rounded-full text-sm"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        )} */}

          {/* Product Category (Placeholder) */}
          {/* <div className="mt-8">
          <label className="block text-[14px] font-medium text-[#344054] mb-2">
            Product category
          </label>
          <input
            type="text"
            placeholder="Product category"
            disabled
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-[14px] bg-gray-50 cursor-not-allowed"
          />
        </div> */}

          {/* Save Button */}
          <div className="mt-8">
            <button
              onClick={handleSave}
              disabled={
                isUpdating ||
                selectedCategories.length === 0 ||
                isLoadingCategories
              }
              className="w-full px-4 py-3 text-[16px] font-medium text-white bg-[#3D7B22] rounded-full hover:bg-[#2d5c19] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
};

export default BusinessCategory;
