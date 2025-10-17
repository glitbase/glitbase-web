import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useGetMyStoreQuery, useUpdateStoreMutation } from '@/redux/vendor';

const GiftfinderTags = () => {
  const navigate = useNavigate();
  const { data: storeData, refetch } = useGetMyStoreQuery({});
  const [updateStore, { isLoading }] = useUpdateStoreMutation();

  const store = storeData?.store;

  const [inputValue, setInputValue] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Load existing tags
  useEffect(() => {
    if (store?.tags) {
      setTags(store.tags);
    }
  }, [store]);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newTag = inputValue.trim().toLowerCase();

      if (tags.includes(newTag)) {
        toast.error('This tag already exists');
        return;
      }

      setTags([...tags, newTag]);
      setInputValue('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSave = async () => {
    try {
      await updateStore({
        storeId: store.id,
        tags: tags,
      }).unwrap();

      toast.success('Tags updated successfully');
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update tags');
    }
  };

  return (
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
          <span className="text-[#101828]">Giftfinder & giftmatch tags</span>
        </div>

        {/* Header */}
        <h1 className="text-[28px] font-semibold text-[#101828] mb-2">
          Giftfinder & giftmatch tags
        </h1>

        {/* Form */}
        <div className="space-y-6 mt-8">
          {/* Gift Tag Input */}
          <div>
            <label className="block text-[14px] font-medium text-[#344054] mb-2">
              Gift tag
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Add gift tags"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-[14px]"
            />
            <p className="mt-2 text-[12px] text-[#667085]">
              Press Enter to add a tag
            </p>
          </div>

          {/* Tags Display */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-full flex items-center gap-2"
                >
                  <span className="text-[14px] text-[#101828]">{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="w-full px-4 py-3 text-[16px] font-medium text-white bg-[#3D7B22] rounded-full hover:bg-[#2d5c19] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftfinderTags;
