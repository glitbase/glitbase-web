import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useFetchMarketplaceCategoriesQuery } from '@/redux/app';
import { useGetGlitByIdQuery, useUpdateGlitMutation } from '@/redux/glits';
import { Input } from '@/components/Inputs/TextInput';
import { Textarea } from '@/components/Inputs/TextAreaInput';
import { Button } from '@/components/Buttons';
import { CustomSelect } from '@/components/Inputs/SelectInput';
import SimpleUploadInput from '@/components/VendorOnboarding/SimpleUploadInput';
import type { CreateGlitRequest } from '@/redux/glits';

export interface GlitFormData {
  image: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  creatorCredited: boolean;
  isPrivate: boolean;
}

const initialForm: GlitFormData = {
  image: '',
  title: '',
  description: '',
  category: '',
  tags: [],
  creatorCredited: false,
  isPrivate: false,
};

interface CreateGlitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNext: (data: GlitFormData) => void;
  editGlitId?: string;
  onSuccess?: () => void;
}

export default function CreateGlitModal({ isOpen, onClose, onNext, editGlitId, onSuccess }: CreateGlitModalProps) {
  const isEditMode = Boolean(editGlitId);
  const [form, setForm] = useState<GlitFormData>(initialForm);
  const [tagInput, setTagInput] = useState('');
  const { data: categoriesData } = useFetchMarketplaceCategoriesQuery({ limit: 100, type: 'service' });
  const { data: glitData } = useGetGlitByIdQuery(editGlitId!, { skip: !editGlitId || !isOpen });
  const [updateGlit, { isLoading: isUpdating }] = useUpdateGlitMutation();
  const categories = (categoriesData as { categories?: Array<{ id?: string; name?: string; value?: string; label?: string }> })?.categories ?? [];
  const categoryOptions = categories.map((c) => ({
    value: c.name ?? c.value ?? c.label ?? '',
    label: c.name ?? c.label ?? c.value ?? '',
  })).filter((o) => o.value);

  useEffect(() => {
    if (!isOpen) {
      setForm(initialForm);
      setTagInput('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && isEditMode && glitData?.data?.glit) {
      const g = glitData.data.glit;
      setForm({
        image: g.image ?? '',
        title: g.title ?? '',
        description: g.description ?? '',
        category: g.category ?? '',
        tags: Array.isArray(g.tags) ? g.tags : [],
        creatorCredited: g.creatorCredited ?? false,
        isPrivate: g.isPrivate ?? false,
      });
    }
  }, [isOpen, isEditMode, glitData]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (form.tags.includes(t)) {
      toast.error('Tag already added');
      return;
    }
    setForm((p) => ({ ...p, tags: [...p.tags, t] }));
    setTagInput('');
  };

  const removeTag = (index: number) => {
    setForm((p) => ({ ...p, tags: p.tags.filter((_, i) => i !== index) }));
  };

  const canNext = form.image && form.title.trim() && form.description.trim() && form.category;

  const handleNext = () => {
    if (!canNext) return;
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!form.description.trim()) {
      toast.error('Description is required');
      return;
    }
    if (!form.category) {
      toast.error('Category is required');
      return;
    }
    if (!form.image) {
      toast.error('Image is required');
      return;
    }
    onNext(form);
    onClose();
  };

  const handleUpdate = async () => {
    if (!editGlitId || !canNext) return;
    if (!form.title.trim() || !form.description.trim() || !form.category || !form.image) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      await updateGlit({
        id: editGlitId,
        data: {
          image: form.image,
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category,
          tags: form.tags,
          creatorCredited: form.creatorCredited,
          isPrivate: form.isPrivate,
        },
      }).unwrap();
      toast.success('Glit updated');
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } })?.data?.message ?? 'Failed to update glit');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 shrink-0">
          <h2 className="text-[17px] md:text-[19px] font-semibold text-[#1D2739] font-[lora] tracking-tight">
            {isEditMode ? 'Edit glit' : 'Create glit'}
          </h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-[#F5F5F5] rounded-full">
            <X className="w-[18px] h-[18px] md:w-5 md:h-5 text-[#6C6C6C]" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 md:px-6 py-3 md:py-4 space-y-6">
          {/* Media */}
          <div className="min-h-[12rem]">
            <SimpleUploadInput
              value={form.image}
              onChange={(url) => setForm((p) => ({ ...p, image: url }))}
              placeholder="Add media"
              accept="image/*"
            />
          </div>

          {/* Title */}
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Add a catchy title for your glit"
          />

          {/* Tags */}
          <div>
            <label className="mb-1 block text-[13px] md:text-[14px] font-medium text-[#0A0A0A] font-medium">Tag</label>
            <div className="flex min-h-[50px] w-full rounded-lg !bg-[#FAFAFA] overflow-hidden">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tags"
                className="flex-1 min-w-0 bg-transparent px-3 py-1 text-[14px] font-medium text-[#3B3B3B] placeholder:text-[14px] placeholder:font-medium placeholder:text-[#9D9D9D] focus:outline-none"
              />
              <p onClick={addTag} className="shrink-0 mt-4 pr-4 font-semibold text-[13px] underline opacity-70 cursor-pointer">
                Add
              </p>
            </div>
            {form.tags.length === 0 && (
              <p className="text-[13px] font-medium text-[#6C6C6C] mt-1.5">Try tags like &quot;notifications&quot;, &quot;clean aesthetic&quot;</p>
            )}
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#EBFEE3] text-[#3D7B22] text-[13px] font-medium capitalize"
                  >
                    {tag}
                    <button type="button" onClick={() => removeTag(i)} className="hover:opacity-80" aria-label="Remove tag">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Describe your glit or add more details about it..."
            rows={4}
          />

          {/* Category */}
          <CustomSelect
            label="Category"
            placeholder="Select category"
            options={categoryOptions}
            value={form.category ? { value: form.category, label: form.category } : null}
            onChange={(v) => setForm((p) => ({ ...p, category: (v as { value: string } | null)?.value ?? '' }))}
          />

          {/* Credit creator */}
          <div className="flex items-start justify-between items-center gap-4 py-2">
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-[#1D2739]">Credit creator</p>
              <p className="text-[13px] text-[#6C6C6C] mt-0.5 font-medium max-w-[80%]">
                By uploading, you confirm that you have the right to post this image or have permission from the original creator.{' '}
                <button type="button" className="text-[#CC5A88] font-medium">Learn more</button>
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.creatorCredited}
              onClick={() => setForm((p) => ({ ...p, creatorCredited: !p.creatorCredited }))}
              className={`shrink-0 w-10 h-5 rounded-full transition-colors ${form.creatorCredited ? 'bg-[#FF71AA]' : 'bg-[#E5E7EB]'}`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${form.creatorCredited ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
              />
            </button>
          </div>

          {/* Make private */}
          <div className="flex items-start justify-between items-center gap-4 py-2">
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-[#1D2739]">Make private</p>
              <p className="text-[13px] text-[#6C6C6C] mt-0.5 font-medium max-w-[80%]">Only you can view this glit and access it.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.isPrivate}
              onClick={() => setForm((p) => ({ ...p, isPrivate: !p.isPrivate }))}
              className={`shrink-0 w-10 h-5 rounded-full transition-colors ${form.isPrivate ? 'bg-[#FF71AA]' : 'bg-[#E5E7EB]'}`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isPrivate ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
              />
            </button>
          </div>
        </div>

        <div className="shrink-0 px-6 py-4 border-t border-[#E5E7EB]">
          {isEditMode ? (
            <Button
              type="button"
              variant="default"
              size="full"
              onClick={handleUpdate}
              disabled={!canNext || isUpdating}
              loading={isUpdating}
            >
              Update
            </Button>
          ) : (
            <Button
              type="button"
              variant="default"
              size="full"
              onClick={handleNext}
              disabled={!canNext}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export type { CreateGlitRequest };
