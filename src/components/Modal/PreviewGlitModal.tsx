import { useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCreateGlitMutation } from '@/redux/glits';
import type { GlitFormData } from './CreateGlitModal';
import { Button } from '../Buttons';

interface PreviewGlitModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: GlitFormData | null;
  onSuccess?: () => void;
}

export default function PreviewGlitModal({ isOpen, onClose, data, onSuccess }: PreviewGlitModalProps) {
  const [createGlit, { isLoading: isCreating }] = useCreateGlitMutation();

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleCreate = async () => {
    if (!data) return;
    if (!data.image || !data.title.trim() || !data.description.trim() || !data.category) {
      toast.error('Missing required fields');
      return;
    }
    try {
      await createGlit({
        image: data.image,
        title: data.title.trim(),
        description: data.description.trim(),
        category: data.category,
        tags: data.tags,
        creatorCredited: data.creatorCredited,
        isPrivate: data.isPrivate,
      }).unwrap();
      toast.success('Your glit has been posted successfully');
      onClose();
      onSuccess?.();
    } catch (error) {
      toast.error(error?.data?.message || error?.message || 'An unexpected error occurred.');
    }
  };

  if (!isOpen) return null;

  const descriptionWithTags = data
    ? [data.description.trim(), data.tags.length ? data.tags.map((t) => `#${t.replace(/\s/g, '')}`).join(', ') : '']
        .filter(Boolean)
        .join('. ')
    : '';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 shrink-0">
          <h2 className="text-[19px] font-semibold text-[#1D2739] font-[lora] tracking-tight">Preview glit</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-[#F5F5F5] rounded-full">
            <X className="w-5 h-5 text-[#6C6C6C]" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="px-6 py-4">
            {data?.image && (
            <img
              src={data.image}
              alt=""
              className="w-full aspect-[4/3] object-cover bg-[#F5F5F5] rounded-lg"
            />
          )}
          </div>
          
          <div className="px-6 space-y-1">
            {data?.title && (
              <h3 className="text-[15px] font-semibold text-[#1D2739] leading-tight">
                {data.title}
              </h3>
            )}
            {descriptionWithTags && (
              <p className="text-[14px] font-medium text-[#3B3B3B] leading-relaxed">
                {descriptionWithTags}
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 px-6 py-4 mt-6">
          <Button
            type="button"
            onClick={handleCreate}
            disabled={isCreating || !data}
            className='w-full'
          >
            {isCreating ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  );
}
