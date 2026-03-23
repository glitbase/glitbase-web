/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { ChevronLeft } from 'lucide-react';
import { useFileUploadMutation, useUpdateProfileMutation } from '@/redux/app';
import { useUpdateStoreMutation } from '@/redux/vendor';
import { toast } from 'react-toastify';
import { Input } from '@/components/Inputs/TextInput';
import { Textarea } from '@/components/Inputs/TextAreaInput';
import { MultiSelect, SelectOption } from '@/components/Inputs/MultiSelect';
import { CustomSelect } from '@/components/Inputs/SelectInput';
import { Button } from '@/components/Buttons';
import HomeLayout from '@/layout/home/HomeLayout';

const storeTypeOptions: SelectOption[] = [
  { label: 'Physical', value: 'physical', description: 'Physical storefront customers can visit' },
  { label: 'Online', value: 'online', description: 'Digital-only business' },
  { label: 'Mobile', value: 'mobile', description: 'Mobile service that goes to customers' },
  { label: 'Event-based', value: 'event-based', description: 'Pop-up or event-based business' },
];

const storeStatusOptions = [
  { label: 'Available today', value: 'available' },
  { label: 'Currently busy', value: 'busy' },
  { label: 'Fully booked', value: 'booked' },
  { label: 'Offline', value: 'offline' },
];

const EditStoreProfile = () => {
  const navigate = useNavigate();
  const store = useSelector((state: RootState) => state.vendorStore.store);
  const user = useSelector((state: RootState) => state.auth.user);

  const [name, setName] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [status, setStatus] = useState<{ value: string; label: string } | null>(null);
  const [description, setDescription] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const [fileUpload] = useFileUploadMutation();
  const [updateProfile] = useUpdateProfileMutation();
  const [updateStore, { isLoading: isUpdating }] = useUpdateStoreMutation();

  useEffect(() => {
    if (store) {
      setName(store.name || '');
      setSelectedTypes(store.type || []);
      setDescription(store.description || '');
      setBannerImageUrl(store.bannerImageUrl || '');
      const statusOpt = storeStatusOptions.find((s) => s.value === store.status);
      setStatus(statusOpt || null);
    }
    if (user) setProfileImageUrl(user.profileImageUrl || '');
  }, [store, user]);

  const handleProfileUpload = async (file: File) => {
    try {
      setIsUploadingProfile(true);
      const fd = new FormData();
      fd.append('file', file);
      const res = await fileUpload(fd).unwrap();
      await updateProfile({ profileImageUrl: res.url }).unwrap();
      setProfileImageUrl(res.url);
      toast.success('Profile picture updated');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to upload profile picture');
    } finally {
      setIsUploadingProfile(false);
    }
  };

  const handleBannerUpload = async (file: File) => {
    try {
      setIsUploadingBanner(true);
      const fd = new FormData();
      fd.append('file', file);
      const res = await fileUpload(fd).unwrap();
      setBannerImageUrl(res.url);
      toast.success('Banner image uploaded');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to upload banner image');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const isFormValid = name.trim() && selectedTypes.length > 0 && description.trim();

  const handleSave = async () => {
    if (!isFormValid) { toast.error('Please fill in all required fields'); return; }
    if (!store) { toast.error('Store not found'); return; }

    try {
      await updateStore({
        storeId: store.id,
        name: name.trim(),
        type: selectedTypes,
        status: status?.value,
        description: description.trim(),
        bannerImageUrl,
      }).unwrap();

      toast.success('Store information updated');
      navigate(-1);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to save store information');
    }
  };

  if (!store) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#6C6C6C] font-medium mb-4">Store not found</p>
          <Button variant="default" size="auto" onClick={() => navigate('/vendor/store')}>
            Go to Store
          </Button>
        </div>
      </div>
    );
  }

  return (
    <HomeLayout isLoading={false} showNavBar={false}>
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#F0F0F0] px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="w-5 h-5 text-[#101828]" />
        </button>
        <h1 className="text-[17px] font-semibold text-[#101828] font-[lora] tracking-tight">
          Edit store profile
        </h1>
      </header>

      {/* Form */}
      <div className="max-w-[500px] px-6 py-8 space-y-7">
        {/* Profile picture */}
        <div>
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-[#F5F5F5]">
              {isUploadingProfile ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-7 h-7 border-2 border-[#4C9A2A] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : profileImageUrl ? (
                <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#9D9D9D] text-[13px] font-medium">
                  Photo
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => document.getElementById('profile-upload-edit')?.click()}
              disabled={isUploadingProfile}
              className="absolute bottom-0 right-0 bg-white border border-[#E5E7EB] rounded-full p-1.5 shadow-sm disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                <g clipPath="url(#clip-edit)">
                  <path d="M5.25 4.50049C4.33452 4.50323 3.82787 4.52513 3.41155 4.69988C2.8284 4.94464 2.35351 5.39676 2.07608 5.97131C1.84964 6.44027 1.81258 7.04111 1.73847 8.24279L1.62234 10.1258C1.43804 13.1141 1.34589 14.6083 2.22276 15.5542C3.09964 16.5001 4.57689 16.5001 7.5314 16.5001H10.4686C13.4231 16.5001 14.9004 16.5001 15.7772 15.5542C16.6541 14.6083 16.562 13.1141 16.3777 10.1258L16.2615 8.24279C16.1874 7.04111 16.1504 6.44027 15.9239 5.97131C15.6465 5.39676 15.1716 4.94464 14.5885 4.69988C14.1721 4.52513 13.6655 4.50323 12.75 4.50049" stroke="#0A0A0A" strokeWidth="1.3" strokeLinecap="round"/>
                  <path d="M12.75 5.25L12.0856 3.58907C11.799 2.87247 11.5495 2.05958 10.8125 1.69466C10.4193 1.5 9.9462 1.5 9 1.5C8.0538 1.5 7.5807 1.5 7.18752 1.69466C6.45045 2.05958 6.20101 2.87247 5.91437 3.58907L5.25 5.25" stroke="#0A0A0A" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11.625 10.5C11.625 11.9497 10.4497 13.125 9 13.125C7.55025 13.125 6.375 11.9497 6.375 10.5C6.375 9.05025 7.55025 7.875 9 7.875C10.4497 7.875 11.625 9.05025 11.625 10.5Z" stroke="#0A0A0A" strokeWidth="1.3"/>
                </g>
                <defs><clipPath id="clip-edit"><rect width="18" height="18" fill="white"/></clipPath></defs>
              </svg>
            </button>
            <input
              id="profile-upload-edit"
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploadingProfile}
              onChange={(e) => { if (e.target.files?.[0]) handleProfileUpload(e.target.files[0]); }}
            />
          </div>
        </div>

        {/* Business name */}
        <Input
          label="Business name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your business name"
        />

        {/* Store type */}
        <MultiSelect
          label="Store type"
          options={storeTypeOptions}
          value={selectedTypes}
          onChange={setSelectedTypes}
          placeholder="Select store type"
          required
        />

        {/* Store status */}
        <div>
          <label className="block text-[14px] font-medium text-[#344054] mb-2">
            Store status
          </label>
          <CustomSelect
            options={storeStatusOptions}
            value={status}
            onChange={(opt) => setStatus(opt as { value: string; label: string })}
            placeholder="Select status"
          />
        </div>

        {/* Description */}
        <Textarea
          label="Store description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell customers about your store..."
          rows={4}
        />

        {/* Banner image */}
        <div>
          <label className="block text-[14px] font-medium text-[#344054] mb-2">
            Store banner
          </label>
          {isUploadingBanner ? (
            <div className="w-full h-40 border-2 border-dashed border-[#E5E7EB] rounded-xl bg-[#FAFAFA] flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#4C9A2A] border-t-transparent rounded-full animate-spin" />
              <span className="mt-2 text-[13px] text-[#6C6C6C] font-medium">Uploading...</span>
            </div>
          ) : bannerImageUrl ? (
            <div className="relative rounded-xl overflow-hidden h-40">
              <img src={bannerImageUrl} alt="Store banner" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => document.getElementById('banner-upload-edit')?.click()}
                className="absolute top-2 right-2 bg-white rounded-full px-3 py-1 text-[13px] font-medium shadow-md hover:bg-gray-50"
              >
                Change
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => document.getElementById('banner-upload-edit')?.click()}
              className="w-full h-40 border-2 border-dashed border-[#E5E7EB] rounded-xl bg-[#FAFAFA] flex flex-col items-center justify-center text-[#9D9D9D] hover:bg-gray-50 transition-colors"
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span className="mt-2 text-[13px] font-medium">Click to upload banner</span>
            </button>
          )}
          <input
            id="banner-upload-edit"
            type="file"
            accept="image/*"
            className="hidden"
            disabled={isUploadingBanner}
            onChange={(e) => { if (e.target.files?.[0]) handleBannerUpload(e.target.files[0]); }}
          />
        </div>

        {/* Save */}
        <Button
          variant="default"
          size="full"
          onClick={handleSave}
          disabled={!isFormValid || isUpdating}
          loading={isUpdating}
        >
          Save changes
        </Button>
      </div>
    </div>
    </HomeLayout>
  );
};

export default EditStoreProfile;
