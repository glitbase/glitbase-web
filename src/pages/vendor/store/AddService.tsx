/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { ImagePlus, X, MoreVertical, Plus } from 'lucide-react';
import {
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useCreateAddOnMutation,
  useUpdateAddOnMutation,
  useDeleteAddOnMutation,
  useUpdateStoreMutation,
} from '@/redux/vendor';
import { useFileUploadMutation } from '@/redux/app';
import { toast } from 'react-toastify';
import { Input } from '@/components/Inputs/TextInput';
import { Textarea } from '@/components/Inputs/TextAreaInput';
import { CustomSelect } from '@/components/Inputs/SelectInput';
import { Button } from '@/components/Buttons';
import { useAppSelector } from '@/hooks/redux-hooks';

interface AddOn {
  id?: string;
  _id?: string;
  name: string;
  description: string;
  price: number;
  duration: { hours: number; minutes: number };
}

const serviceTypeOptions = [
  { label: 'Normal service', value: 'normal' },
  { label: 'Home service', value: 'home' },
  { label: 'Drop-off & pick-up', value: 'pickDrop' },
];

const pricingTypeOptions = [
  { label: 'Fixed', value: 'fixed' },
  { label: 'Free', value: 'free' },
  { label: 'From', value: 'from' },
];

const formatAddOnDuration = (duration: { hours: number; minutes: number }) => {
  if (!duration) return '';
  if (duration.hours === 0) return `${duration.minutes}m`;
  if (duration.minutes === 0) return `${duration.hours}h`;
  return `${duration.hours}h ${duration.minutes}m`;
};

/** Normalise an addon from the API — server may return durationInMinutes instead of { hours, minutes } */
const normaliseAddOn = (addOn: any): AddOn => {
  let duration = addOn.duration;
  if (!duration || typeof duration !== 'object') {
    const total = addOn.durationInMinutes || 0;
    duration = { hours: Math.floor(total / 60), minutes: total % 60 };
  }
  return { ...addOn, duration };
};

const AddService = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { serviceId } = useParams();
  const store = useSelector((state: RootState) => state.vendorStore.store);
  const user = useAppSelector((state) => state.auth.user);

  const editService = location.state?.service;
  const isEditing = !!editService || !!serviceId;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  // Multi-select types (array)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [isDelivery, setIsDelivery] = useState(false);
  const [category, setCategory] = useState<{ value: string; label: string } | null>(null);
  const [pricingType, setPricingType] = useState<{ value: string; label: string } | null>(null);
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [durationHours, setDurationHours] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Category
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  // Add-on modal
  const [showAddOnModal, setShowAddOnModal] = useState(false);
  const [showAddOnActionsModal, setShowAddOnActionsModal] = useState(false);
  const [editingAddOnIndex, setEditingAddOnIndex] = useState<number | null>(null);
  const [currentAddOn, setCurrentAddOn] = useState<AddOn>({
    name: '', description: '', price: 0, duration: { hours: 0, minutes: 0 },
  });

  const [createService, { isLoading: isCreating }] = useCreateServiceMutation();
  const [updateService, { isLoading: isUpdating }] = useUpdateServiceMutation();
  const [createAddOn, { isLoading: isCreatingAddOn }] = useCreateAddOnMutation();
  const [updateAddOn, { isLoading: isUpdatingAddOn }] = useUpdateAddOnMutation();
  const [deleteAddOn, { isLoading: isDeletingAddOn }] = useDeleteAddOnMutation();
  const [updateStore, { isLoading: isUpdatingStore }] = useUpdateStoreMutation();
  const [fileUpload] = useFileUploadMutation();

  const categories = store?.preferredCategories || [];
  const categoryOptions = categories.map((c: string) => ({ label: c, value: c }));

  useEffect(() => {
    setCurrency(user?.countryCode === 'NG' ? 'NGN' : 'GBP');
  }, [user?.countryCode]);

  useEffect(() => {
    if (editService) {
      const hours = Math.floor(editService.durationInMinutes / 60);
      const minutes = editService.durationInMinutes % 60;

      setName(editService.name || '');
      setDescription(editService.description || '');
      setImageUrl(editService.imageUrl || '');
      setPrice(editService.price?.toString() || '');
      setDurationHours(hours > 0 ? hours.toString() : '');
      setDurationMinutes(minutes > 0 ? minutes.toString() : '');
      setAddOns((editService.addOns || []).map(normaliseAddOn));
      setIsDelivery(editService.isDelivery || false);
      setSelectedTypes(editService.type || []);

      if (editService.category) setCategory({ value: editService.category, label: editService.category });

      const foundPricing = pricingTypeOptions.find((p) => p.value === editService.pricingType);
      if (foundPricing) setPricingType(foundPricing);
    }
  }, [editService]);

  const handleImageUpload = async (file: File) => {
    try {
      setIsUploadingImage(true);
      const fd = new FormData();
      fd.append('file', file);
      const res = await fileUpload(fd).unwrap();
      setImageUrl(res.url);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleTypeToggle = (value: string) => {
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
    // Clear isDelivery if pickDrop is deselected
    if (value === 'pickDrop' && selectedTypes.includes('pickDrop')) {
      setIsDelivery(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) { toast.error('Please enter a category name'); return; }
    if (!store?.id) { toast.error('Store not found'); return; }

    const exists = categories.some((c: string) => c.toLowerCase() === newCategory.trim().toLowerCase());
    if (exists) { toast.error('This category already exists'); return; }

    try {
      const updated = [...categories, newCategory.trim()];
      await updateStore({ storeId: store.id, preferredCategories: updated }).unwrap();
      setCategory({ value: newCategory.trim(), label: newCategory.trim() });
      setNewCategory('');
      setShowAddCategoryModal(false);
      toast.success('Category added successfully');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to add category');
    }
  };

  const resetAddOnForm = () => {
    setCurrentAddOn({ name: '', description: '', price: 0, duration: { hours: 0, minutes: 0 } });
    setEditingAddOnIndex(null);
  };

  const handleSaveAddOn = async () => {
    if (!currentAddOn.name.trim()) { toast.error('Add-on name is required'); return; }

    // Always update local state first so the UI is responsive
    if (editingAddOnIndex !== null) {
      setAddOns((prev) => {
        const updated = [...prev];
        updated[editingAddOnIndex] = { ...currentAddOn };
        return updated;
      });
    } else {
      setAddOns((prev) => [...prev, { ...currentAddOn }]);
    }

    resetAddOnForm();
    setShowAddOnModal(false);

    // Fire API calls in the background when in edit mode
    if (isEditing && editService?.id) {
      try {
        if (editingAddOnIndex !== null) {
          const existing = addOns[editingAddOnIndex];
          const addOnId = existing?.id || existing?._id;
          if (addOnId) {
            await updateAddOn({
              serviceId: editService.id,
              addOnId,
              data: {
                name: currentAddOn.name,
                description: currentAddOn.description,
                price: currentAddOn.price,
                duration: currentAddOn.duration,
              },
            }).unwrap();
          }
        } else {
          await createAddOn({
            serviceId: editService.id,
            data: {
              name: currentAddOn.name,
              description: currentAddOn.description,
              price: currentAddOn.price,
              duration: currentAddOn.duration,
            },
          }).unwrap();
        }
      } catch (error: any) {
        toast.error(error?.data?.message || 'Failed to sync add-on with server');
      }
    }
  };

  const handleRemoveAddOn = async (index: number) => {
    try {
      const addOn = addOns[index];
      const addOnId = addOn?.id || addOn?._id;
      if (isEditing && editService?.id && addOnId) {
        await deleteAddOn({ serviceId: editService.id, addOnId }).unwrap();
        toast.success('Add-on removed');
      }
      setAddOns((prev) => prev.filter((_, i) => i !== index));
      setShowAddOnActionsModal(false);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to remove add-on');
    }
  };

  const hours = parseInt(durationHours) || 0;
  const minutes = parseInt(durationMinutes) || 0;
  const totalMinutes = hours * 60 + minutes;

  const isFormValid =
    name.trim() &&
    selectedTypes.length > 0 &&
    category &&
    imageUrl &&
    pricingType &&
    totalMinutes > 0 &&
    (pricingType?.value === 'free' || price);

  const isLoading = isCreating || isUpdating || isCreatingAddOn || isUpdatingAddOn || isDeletingAddOn;

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Service name is required'); return; }
    if (selectedTypes.length === 0) { toast.error('At least one service type is required'); return; }
    if (!category) { toast.error('Category is required'); return; }
    if (!imageUrl) { toast.error('Service image is required'); return; }
    if (!pricingType) { toast.error('Pricing type is required'); return; }
    if (totalMinutes <= 0 || totalMinutes > 1440) { toast.error('Duration must be between 1 minute and 24 hours'); return; }

    const basePayload: any = {
      name,
      description: description || undefined,
      type: selectedTypes,
      category: category.value,
      imageUrl,
      pricingType: pricingType.value,
      price: pricingType.value === 'free' ? 0 : parseFloat(price),
      currency,
      duration: { hours, minutes },
      maxBookingPerTimeSlot: 1,
    };

    if (selectedTypes.includes('pickDrop')) {
      basePayload.isDelivery = isDelivery;
    }

    try {
      if (isEditing && editService) {
        await updateService({ serviceId: editService.id, ...basePayload }).unwrap();
        toast.success('Service updated and published');
      } else {
        await createService({
          storeId: store?.id || '',
          ...basePayload,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          addOns: addOns.length > 0 ? addOns.map(({ id: _aid, _id: __aid, ...rest }) => rest) : undefined,
        }).unwrap();
        toast.success('New service created and published');
      }
      navigate('/vendor/store');
    } catch (error: any) {
      toast.error(error?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} service`);
    }
  };

  return (
    <div className="min-h-screen bg-white min-w-0">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#F0F0F0] px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 min-w-0">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 -ml-1 sm:-ml-2 rounded-full hover:bg-gray-100 touch-manipulation shrink-0"
          aria-label="Go back"
        >
          <X className="w-5 h-5 text-[#101828]" />
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink-0">
          <Button
            variant="cancel"
            size="auto"
            onClick={() => navigate(-1)}
            className="!px-2.5 sm:!px-4 !text-xs sm:!text-sm whitespace-nowrap touch-manipulation"
          >
            Cancel
          </Button>
          <Button
            size="auto"
            onClick={handleSubmit}
            disabled={!isFormValid || isLoading}
            loading={isLoading}
            className="!px-3 sm:!px-6 !text-xs sm:!text-sm touch-manipulation shrink-0"
          >
            {isEditing ? 'Edit service' : 'Add service'}
          </Button>
        </div>
      </header>

      {/* Form */}
      <div className="w-full max-w-[550px] mx-auto min-w-0 px-4 sm:px-6 py-6 sm:py-8 pb-24 sm:pb-8 space-y-5 sm:space-y-7">
        <h1 className="text-xl sm:text-[23px] font-bold text-[#0A0A0A] tracking-tight font-[lora] break-words pr-1">
          {isEditing ? 'Edit service' : 'Add service'}
        </h1>

        {/* Service photo */}
        <div>
          <label className="block text-sm sm:text-[14px] font-medium text-[#344054] mb-2">
            Service photo
          </label>
          {isUploadingImage ? (
            <div className="w-full h-36 sm:h-44 rounded-xl bg-[#F5F5F5] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#4C9A2A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : imageUrl ? (
            <div className="relative w-full h-36 sm:h-44 rounded-xl overflow-hidden">
              <img src={imageUrl} alt="Service" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => document.getElementById('service-image-upload')?.click()}
                disabled={isUploadingImage}
                className="absolute top-2 right-2 bg-black/70 text-white text-[11px] sm:text-[12px] font-medium flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg touch-manipulation"
              >
                Change
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => document.getElementById('service-image-upload')?.click()}
              className="w-full h-36 sm:h-44 rounded-xl bg-[#FAFAFA] border border-dashed border-[#E5E7EB] flex flex-col items-center justify-center text-[#9D9D9D] hover:bg-[#F5F5F5] transition-colors touch-manipulation"
            >
              <ImagePlus strokeWidth={1.5} size={32} color="#6C6C6C" />
              <span className="mt-2 text-[13px] font-medium text-[#6C6C6C]">Add photo</span>
            </button>
          )}
          <input
            id="service-image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); }}
          />
        </div>

        {/* Service name */}
        <Input
          label="Service name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Service name"
        />

        {/* Description */}
        <Textarea
          label="Service description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Tell customers about this service, what's included, and any special requirements..."
        />

        {/* Service type (multi) */}
        <div>
          <label className="block text-sm sm:text-[14px] font-medium text-[#0A0A0A] mb-2">Service type</label>
          <div className="rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] overflow-hidden">
            {serviceTypeOptions.map((opt, idx) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleTypeToggle(opt.value)}
                className={`w-full flex items-center justify-between gap-3 px-3 sm:px-4 py-3 sm:py-3.5 text-left transition-colors hover:bg-gray-50 touch-manipulation min-w-0 ${idx > 0 ? 'border-t border-[#F0F0F0]' : ''}`}
              >
                <span className={`text-sm sm:text-[14px] font-medium min-w-0 pr-2 ${selectedTypes.includes(opt.value) ? 'text-[#101828]' : 'text-[#6C6C6C]'}`}>
                  {opt.label}
                </span>
                <div className={`w-5 h-5 rounded flex items-center justify-center border ${selectedTypes.includes(opt.value) ? 'bg-[#CC5A88] border-[#CC5A88]' : 'border-[#D0D5DD] bg-white'}`}>
                  {selectedTypes.includes(opt.value) && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* isDelivery toggle — only when pickDrop selected */}
        {selectedTypes.includes('pickDrop') && (
          <div className="bg-[#F5F5F5] rounded-xl p-3 sm:p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 min-w-0">
            <span className="text-sm sm:text-[14px] font-medium text-[#101828] min-w-0 flex-1">
              Customer can choose drop-off or pick-up points?
            </span>
            <button
              type="button"
              onClick={() => setIsDelivery((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 self-end sm:self-auto touch-manipulation ${isDelivery ? 'bg-[#4C9A2A]' : 'bg-[#D0D5DD]'}`}
              aria-pressed={isDelivery}
              aria-label="Toggle delivery option"
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDelivery ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        )}

        {/* Category */}
        <div>
          <CustomSelect
            label="Category"
            options={categoryOptions}
            value={category}
            onChange={(opt) => setCategory(opt as { value: string; label: string })}
            placeholder="Category"
          />
          <button
            type="button"
            onClick={() => setShowAddCategoryModal(true)}
            className="mt-3 text-[13px] font-medium text-[#CC5A88] flex items-center gap-1 touch-manipulation"
          >
            <Plus size={14} strokeWidth={2.5} />
            Add category
          </button>
        </div>

        {/* Pricing type */}
        <CustomSelect
          label="Pricing type"
          options={pricingTypeOptions}
          value={pricingType}
          onChange={(opt) => {
            const selected = opt as { value: string; label: string };
            setPricingType(selected);
            if (selected?.value === 'free') setPrice('');
          }}
          placeholder="Pricing type"
        />

        {/* Price */}
        {pricingType && pricingType.value !== 'free' && (
          <div>
            <label className="block text-sm sm:text-[14px] font-medium text-[#0A0A0A] mb-1">Price</label>
            <div className="relative min-w-0">
              <Input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="pl-14 min-w-0"
                type="tel"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-medium text-[#6C6C6C] pointer-events-none">
                {currency}
              </span>
            </div>
          </div>
        )}

        {/* Duration */}
        <div>
          <label className="block text-sm sm:text-[14px] font-medium text-[#0A0A0A] mb-1">Duration</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 min-w-0">
              <Input
                type="number"
                value={durationHours === '0' ? '' : durationHours}
                onChange={(e) => {
                  const v = parseInt(e.target.value) || 0;
                  setDurationHours(v.toString());
                }}
                min={0}
                placeholder="Hours"
              />
            </div>
            <div className="flex-1 min-w-0">
              <Input
                type="number"
                value={durationMinutes === '0' ? '' : durationMinutes}
                onChange={(e) => {
                  const v = parseInt(e.target.value) || 0;
                  if (v > 59) return;
                  setDurationMinutes(v.toString());
                }}
                min={0}
                max={59}
                placeholder="Minutes"
              />
            </div>
          </div>
        </div>

        {/* Add-ons */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-sm sm:text-[14px] font-medium text-[#0A0A0A] min-w-0">
              <strong>Add-ons</strong> (Optional)
            </span>
            <button
              type="button"
              onClick={() => { resetAddOnForm(); setShowAddOnModal(true); }}
              className="flex items-center gap-1 text-[13px] font-medium text-[#4C9A2A] touch-manipulation shrink-0"
            >
              <Plus size={16} strokeWidth={2.5} />
              Add
            </button>
          </div>

          {addOns.length > 0 && (
            <div className="space-y-2">
              {addOns.map((addOn, index) => (
                <div key={addOn.id || addOn._id || index} className="py-3 border-b border-[#F0F0F0] flex items-start justify-between gap-2 min-w-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-[14px] font-semibold text-[#101828] break-words">{addOn.name}</p>
                    {addOn.description && (
                      <p className="text-[13px] font-medium text-[#6C6C6C] mt-0.5 break-words">{addOn.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1.5 text-[13px]">
                      <span className="font-semibold text-[#101828]">
                        {currency === 'NGN' ? '₦' : '£'}{addOn.price.toLocaleString()}
                      </span>
                      {addOn.duration && (
                        <span className="text-[#6C6C6C] font-medium">• {formatAddOnDuration(addOn.duration)}</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentAddOn(normaliseAddOn(addOn));
                      setEditingAddOnIndex(index);
                      setShowAddOnActionsModal(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 touch-manipulation shrink-0"
                    aria-label="Add-on options"
                  >
                    <MoreVertical size={16} className="text-[#6C6C6C]" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 py-0 sm:py-4 overflow-y-auto">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-5 sm:p-6 my-auto sm:my-0 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[17px] font-bold text-[#101828] font-[lora] tracking-tight">Add New Category</h3>
              <button type="button" onClick={() => { setShowAddCategoryModal(false); setNewCategory(''); }} className="p-2 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-[#6C6C6C]" />
              </button>
            </div>
            <Input
              label="Category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter category name"
            />
            <div className="flex gap-3 mt-5">
              <div className="flex-1">
                <Button variant="cancel" size="full" onClick={() => setShowAddCategoryModal(false)}>
                  Cancel
                </Button>
              </div>
              <div className="flex-1">
                <Button
                  variant="default"
                  size="full"
                  onClick={handleAddCategory}
                  disabled={!newCategory.trim() || isUpdatingStore}
                  loading={isUpdatingStore}
                >
                  Add category
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add-on Modal */}
      {showAddOnModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4 py-0 sm:py-4 overflow-y-auto">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-5 sm:p-6 sm:my-8 max-h-[min(92dvh,640px)] overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] sm:pb-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[17px] font-bold text-[#101828] font-[lora] tracking-tight">
                {editingAddOnIndex !== null ? 'Edit add-on' : 'Add add-on'}
              </h3>
              <button type="button" onClick={() => { setShowAddOnModal(false); resetAddOnForm(); }} className="p-2 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-[#6C6C6C]" />
              </button>
            </div>
            <div className="space-y-5">
              <Input
                label="Add-on name"
                value={currentAddOn.name}
                onChange={(e) => setCurrentAddOn((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Add-on name"
              />
              <Textarea
                label="Description (optional)"
                value={currentAddOn.description}
                onChange={(e) => setCurrentAddOn((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Describe the add-on"
              />
              <div className="min-w-0">
                <label className="block text-sm sm:text-[14px] font-medium text-[#0A0A0A] mb-1">Price</label>
                <div className="relative min-w-0">
                  <Input
                    value={currentAddOn.price === 0 ? '' : currentAddOn.price.toString()}
                    onChange={(e) => setCurrentAddOn((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="pl-14 min-w-0"
                    type="tel"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-medium text-[#6C6C6C] pointer-events-none">{currency}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm sm:text-[14px] font-medium text-[#0A0A0A] mb-1">Duration</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 min-w-0">
                    <Input
                      label="Hours"
                      type="number"
                      value={currentAddOn.duration.hours === 0 ? '' : currentAddOn.duration.hours.toString()}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || 0;
                        setCurrentAddOn((prev) => ({ ...prev, duration: { ...prev.duration, hours: v } }));
                      }}
                      min={0}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Input
                      label="Minutes"
                      type="number"
                      value={currentAddOn.duration.minutes === 0 ? '' : currentAddOn.duration.minutes.toString()}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || 0;
                        if (v > 59) return;
                        setCurrentAddOn((prev) => ({ ...prev, duration: { ...prev.duration, minutes: v } }));
                      }}
                      min={0}
                      max={59}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Button variant="cancel" size="full" onClick={() => { setShowAddOnModal(false); resetAddOnForm(); }}>
                    Cancel
                  </Button>
                </div>
                <div className="flex-1">
                  <Button
                    variant="default"
                    size="full"
                    onClick={handleSaveAddOn}
                    loading={isCreatingAddOn || isUpdatingAddOn}
                  >
                    {editingAddOnIndex !== null ? 'Update' : 'Add'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add-on Actions Modal */}
      {showAddOnActionsModal && editingAddOnIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg p-5 sm:p-6 pb-[max(2rem,env(safe-area-inset-bottom,0px))] sm:pb-8 max-h-[85dvh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setShowAddOnActionsModal(false);
                setShowAddOnModal(true);
              }}
              className="w-full flex items-center gap-4 py-4 border-b border-[#F0F0F0]"
            >
              <svg className="w-5 h-5 text-[#344054]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="text-[15px] font-medium text-[#101828]">Edit Add-on</span>
            </button>
            <button
              type="button"
              onClick={() => handleRemoveAddOn(editingAddOnIndex)}
              disabled={isDeletingAddOn}
              className="w-full flex items-center gap-4 py-4 mb-4"
            >
              <svg className="w-5 h-5 text-[#D92D20]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="text-[15px] font-medium text-[#D92D20]">
                {isDeletingAddOn ? 'Removing...' : 'Remove Add-on'}
              </span>
            </button>
            <Button variant="cancel" size="full" onClick={() => setShowAddOnActionsModal(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddService;
