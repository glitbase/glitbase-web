/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Buttons';
import { Typography } from '@/components/Typography';
import { Input } from '@/components/Inputs/TextInput';
import { MultiSelect, SelectOption } from '@/components/Inputs/MultiSelect';
import { Textarea } from '@/components/Inputs/TextAreaInput';
import VendorOnboardingLayout from './VendorOnboardingLayout';
import { toast } from 'react-toastify';
import AuthLayout from '@/layout/auth';
import { useFileUploadMutation, useUpdateProfileMutation } from '@/redux/app';
import { Camera, ImageIcon } from 'lucide-react';

const storeTypes = [
  {
    label: 'Physical',
    value: 'physical',
    description: 'Physical storefront customers can visit',
  },
  {
    label: 'Online',
    value: 'online',
    description: 'Digital-only business',
  },
  {
    label: 'Mobile',
    value: 'mobile',
    description: 'Mobile service that goes to customers',
  },
  {
    label: 'Event-based',
    value: 'event-based',
    description: 'Pop-up or event-based business',
  },
];

const StoreSetup = () => {
  console.log('🏪 StoreSetup: Component mounting', {
    path: window.location.pathname
  });

  const navigate = useNavigate();

  // Form state - no localStorage needed
  const [businessName, setBusinessName] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [bannerImage, setBannerImage] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string>('');
  const [touched, setTouched] = useState<Record<string, boolean>>({
    businessName: false,
    types: false,
    description: false,
  });
  const [errors, setErrors] = useState<any>({});
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // RTK Query hooks
  const [fileUpload] = useFileUploadMutation();
  const [updateProfile] = useUpdateProfileMutation();

  useEffect(() => {
    const newErrors: any = {};

    if (!businessName.trim() && touched.businessName) {
      newErrors.businessName = 'Business name is required';
    }

    if (selectedTypes.length === 0 && touched.types) {
      newErrors.types = 'Please select at least one store type';
    }

    if (!description.trim() && touched.description) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
  }, [businessName, selectedTypes, description, touched]);

  const handleTypesChange = (values: string[]) => {
    setTouched((prev) => ({ ...prev, types: true }));
    setSelectedTypes(values);
  };

  const isFormValid = () => {
    return (
      businessName.trim() &&
      selectedTypes.length > 0 &&
      description.trim() &&
      Object.keys(errors).length === 0
    );
  };

  const handleContinue = () => {
    // Mark all fields as touched to show validation errors
    setTouched({
      businessName: true,
      types: true,
      description: true,
    });

    if (!isFormValid()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Pass data to next step via navigation state (no localStorage)
    const storeData = {
      name: businessName,
      storeName: businessName,
      type: selectedTypes,
      storeTypes: selectedTypes,
      description: description,
      storeDescription: description,
      bannerImageUrl: bannerImage,
      profileImageUrl: profileImage,
    };

    // Navigate to categories setup with store data
    navigate('/vendor/onboarding/categories', {
      state: { storeData },
    });
  };

  const handleBannerUpload = async (file: File) => {
    try {
      setIsUploadingBanner(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fileUpload(formData).unwrap();
      const uploadedUrl = response.url;

      setBannerImage(uploadedUrl);
    } catch (error: any) {
      console.error('Banner upload error:', error);
      toast.error(
        error?.data?.message ||
        'Failed to upload banner image. Please try again.'
      );
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleProfileUpload = async (file: File) => {
    try {
      setIsUploadingProfile(true);
      const formData = new FormData();
      formData.append('file', file);

      // Step 1: Upload file
      const response = await fileUpload(formData).unwrap();
      const uploadedUrl = response.url;

      // Step 2: Update user profile with the new image URL
      await updateProfile({ profileImageUrl: uploadedUrl }).unwrap();

      setProfileImage(uploadedUrl);
      toast.success('Profile picture updated successfully');
    } catch (error: any) {
      console.error('Profile upload error:', error);
      toast.error(
        error?.data?.message ||
        'Failed to upload profile picture. Please try again.'
      );
    } finally {
      setIsUploadingProfile(false);
    }
  };

  console.log('🏪 StoreSetup: Rendering UI');

  return (
    <AuthLayout isLoading={false}>
      <VendorOnboardingLayout progress={20} currentStep={3}>
        <div className="mx-auto pb-8 max-w-[600px] flex flex-col items-center">
          <div className="flex flex-col items-start w-full">

            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border border-gray-200">
                {isUploadingProfile ? (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#60983C]"></div>
                  </div>
                ) : profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#E7E7E7] flex items-center justify-center">
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() =>
                  document.getElementById('profile-upload')?.click()
                }
                disabled={isUploadingProfile}
                className="absolute bottom-4 border border-white right-0 bg-[#FAFAFA] rounded-full p-[5px] disabled:opacity-50"
              >
                <Camera strokeWidth={1.7} size={15} color="#0A0A0A" />
              </button>
              <input
                id="profile-upload"
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploadingProfile}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleProfileUpload(e.target.files[0]);
                  }
                }}
              />
            </div>

            <Typography
              variant="heading"
              className="text-left !text-[1.7rem] font-bold font-[lora] text-[#0A0A0A]"
            >
              Set up your store
            </Typography>
            <p className="text-left font-medium text-[1rem] text-[#6C6C6C] !mt-2">
              Add your store details so customers can find you and make purchase easily
            </p>
          </div>

          <form className="w-full py-6 space-y-4">
            {/* Business Name */}
            <div>
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                onBlur={() =>
                  setTouched((prev) => ({ ...prev, businessName: true }))
                }
                label="Business name"
                placeholder="Business name"
                required
                error={errors.businessName}
              />
            </div>

            {/* Store Type */}
            <MultiSelect
              options={storeTypes as SelectOption[]}
              value={selectedTypes}
              onChange={handleTypesChange}
              label="Store type"
              placeholder="Store type"
              error={errors.types}
            />

            {/* Description */}
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() =>
                setTouched((prev) => ({ ...prev, description: true }))
              }
              label="Store description"
              placeholder="Store description"
              rows={4}
            // error={errors.description}
            />

            {/* Banner Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store banner
              </label>
              {isUploadingBanner ? (
                <div className="w-full h-40 bg-[#FAFAFA] rounded-md flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#60983C]"></div>
                  <span className="text-[14px] text-[#9D9D9D] font-medium">
                    Uploading...
                  </span>
                </div>
              ) : bannerImage ? (
                <div className="relative rounded-md overflow-hidden h-40">
                  <img
                    src={bannerImage}
                    alt="Store banner"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setBannerImage('')}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    document.getElementById('banner-upload')?.click()
                  }
                  disabled={isUploadingBanner}
                  className="w-full h-40 bg-[#FAFAFA] rounded-md flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ImageIcon strokeWidth={1} size={40} color="#9D9D9D" />
                  <p className="text-[14px] text-[#9D9D9D] font-medium mt-4">Click to upload banner image</p>
                </button>
              )}
              <input
                id="banner-upload"
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploadingBanner}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleBannerUpload(e.target.files[0]);
                  }
                }}
              />
            </div>

            {/* Continue Button */}
            <div className="mt-8">
              <Button
                variant="default"
                size="full"
                onClick={handleContinue}
                disabled={!isFormValid()}
                className="bg-[#60983C] hover:bg-[#4d7a30] rounded-full py-3 mb-8"
              >
                Continue
              </Button>
            </div>
          </form>
        </div>
      </VendorOnboardingLayout>
    </AuthLayout>
  );
};

export default StoreSetup;
