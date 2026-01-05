/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Buttons';
import { Typography } from '@/components/Typography';
import { Input } from '@/components/Inputs/TextInput';
import VendorOnboardingLayout from './VendorOnboardingLayout';
import { toast } from 'react-toastify';
import AuthLayout from '@/layout/auth';
import { useFileUploadMutation, useUpdateProfileMutation } from '@/redux/app';

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
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
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

  const handleTypeToggle = (value: string) => {
    setTouched((prev) => ({ ...prev, types: true }));
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
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
      toast.success('Banner image uploaded successfully');
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
        <div className="px-4 mx-auto pb-8 max-w-[600px] flex flex-col items-center">
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
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400">Profile</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() =>
                  document.getElementById('profile-upload')?.click()
                }
                disabled={isUploadingProfile}
                className="absolute bottom-4 right-0 bg-[#FAFAFA] rounded-full p-1 disabled:opacity-50"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clipPath="url(#clip0_85_142839)">
                    <path
                      d="M5.25 4.50049C4.33452 4.50323 3.82787 4.52513 3.41155 4.69988C2.8284 4.94464 2.35351 5.39676 2.07608 5.97131C1.84964 6.44027 1.81258 7.04111 1.73847 8.24279L1.62234 10.1258C1.43804 13.1141 1.34589 14.6083 2.22276 15.5542C3.09964 16.5001 4.57689 16.5001 7.5314 16.5001H10.4686C13.4231 16.5001 14.9004 16.5001 15.7772 15.5542C16.6541 14.6083 16.562 13.1141 16.3777 10.1258L16.2615 8.24279C16.1874 7.04111 16.1504 6.44027 15.9239 5.97131C15.6465 5.39676 15.1716 4.94464 14.5885 4.69988C14.1721 4.52513 13.6655 4.50323 12.75 4.50049"
                      stroke="#0A0A0A"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                    <path
                      d="M12.75 5.25L12.0856 3.58907C11.799 2.87247 11.5495 2.05958 10.8125 1.69466C10.4193 1.5 9.9462 1.5 9 1.5C8.0538 1.5 7.5807 1.5 7.18752 1.69466C6.45045 2.05958 6.20101 2.87247 5.91437 3.58907L5.25 5.25"
                      stroke="#0A0A0A"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M11.625 10.5C11.625 11.9497 10.4497 13.125 9 13.125C7.55025 13.125 6.375 11.9497 6.375 10.5C6.375 9.05025 7.55025 7.875 9 7.875C10.4497 7.875 11.625 9.05025 11.625 10.5Z"
                      stroke="#0A0A0A"
                      strokeWidth="1.3"
                    />
                    <path
                      d="M8.99986 4.5H9.00659"
                      stroke="#0A0A0A"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_85_142839">
                      <rect width="18" height="18" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
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
              className="text-center !text-[2rem] font-semibold font-[lora]"
            >
              Set up your store
            </Typography>
            <p className=" font-normal text-[1rem] text-[#667185] !mt-3 max-w-[440px]">
              Add your store details so customers can find you and make purchase
              easily
            </p>
          </div>

          <form className="w-full py-6 space-y-6">
            {/* Business Name */}
            <div>
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                onBlur={() =>
                  setTouched((prev) => ({ ...prev, businessName: true }))
                }
                label="Business name"
                placeholder="Enter your business name"
                required
                error={errors.businessName}
              />
            </div>

            {/* Store Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  className={`w-full px-4 py-2.5 border rounded-md text-left flex justify-between items-center ${
                    errors.types ? 'border-red-500' : 'border-gray-200'
                  }`}
                >
                  <span
                    className={
                      selectedTypes.length === 0
                        ? 'text-gray-400'
                        : 'text-gray-900'
                    }
                  >
                    {selectedTypes.length === 0 ? 'Store type' : 'Store type'}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      showTypeDropdown ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Selected Types as Chips */}
                {selectedTypes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTypes.map((value) => {
                      const type = storeTypes.find((t) => t.value === value);
                      return (
                        <div
                          key={value}
                          className="px-4 py-2 rounded-full bg-gray-100 border border-gray-200 flex items-center gap-1"
                        >
                          <span>{type?.label}</span>
                          <button
                            type="button"
                            onClick={() => handleTypeToggle(value)}
                            className="text-gray-500"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Dropdown */}
                {showTypeDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                    {storeTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => {
                          handleTypeToggle(type.value);
                          setShowTypeDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex justify-between items-center"
                      >
                        <span>{type.label}</span>
                        {selectedTypes.includes(type.value) && (
                          <svg
                            className="w-5 h-5 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.types && (
                <p className="mt-1 text-xs text-red-500">{errors.types}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() =>
                  setTouched((prev) => ({ ...prev, description: true }))
                }
                placeholder="From sleek bobs to flowing curls, vibrant colors to natural tones - we've got your perfect match! 💫"
                required
                rows={4}
                className={`w-full px-4 py-2.5 border rounded-md resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Banner Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store banner
              </label>
              {isUploadingBanner ? (
                <div className="w-full h-40 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#60983C]"></div>
                  <span className="mt-2 text-sm text-gray-500">
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
                  className="w-full h-40 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 disabled:opacity-50"
                >
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span className="mt-2">Click to upload banner image</span>
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
                className="bg-[#60983C] hover:bg-[#4d7a30] rounded-full py-3"
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
