import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import HomeLayout from '@/layout/home/HomeLayout';
import { Input } from '@/components/Inputs/TextInput';
import { Button } from '@/components/Buttons';
import { useGetMyStoreQuery, useUpdateStoreMutation } from '@/redux/vendor';

const GiftfinderTags = () => {
  const navigate = useNavigate();
  const { data: storeData, refetch } = useGetMyStoreQuery({});
  const [updateStore, { isLoading }] = useUpdateStoreMutation();

  const store = storeData?.store;

  const [inputValue, setInputValue] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (store?.tags) setTags(store.tags);
  }, [store]);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newTag = inputValue.trim().toLowerCase();
      if (tags.includes(newTag)) { toast.error('This tag already exists'); return; }
      setTags([...tags, newTag]);
      setInputValue('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) =>
    setTags(tags.filter((tag) => tag !== tagToRemove));

  const handleSave = async () => {
    try {
      await updateStore({ storeId: store.id, tags }).unwrap();
      toast.success('Tags updated successfully');
      refetch();
    } catch (error) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || 'Failed to update tags');
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
            <span className="text-[#101828] font-medium">Giftfinder tags</span>
          </div>

          {/* Title */}
          <h1 className="text-[23px] font-bold text-[#0A0A0A] mb-8 tracking-tight font-[lora]">
            Giftfinder & giftmatch tags
          </h1>

          <div className="space-y-7">
            {/* Tag input */}
            <div>
              <Input
                label="Gift tag"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Add gift tags"
              />
              <p className="mt-2 text-[13px] text-[#6C6C6C] font-medium">
                Press Enter to add a tag
              </p>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div
                    key={tag}
                    className="px-4 py-2 bg-[#FAFAFA] rounded-full flex items-center gap-2"
                  >
                    <span className="text-[14px] font-medium text-[#101828]">{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-[#9D9D9D] hover:text-[#344054] text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Save */}
            <Button
              onClick={handleSave}
              disabled={isLoading}
              variant="default"
              size="full"
              loading={isLoading}
            >
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
};

export default GiftfinderTags;
