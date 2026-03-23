/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef } from 'react';
import { useAppSelector } from '@/hooks/redux-hooks';
import {
  useUpdateUserProfileMutation,
  useUserProfileQuery,
} from '@/redux/auth';
import { toast } from 'react-toastify';
import { useFileUploadMutation } from '@/redux/app';
import { FiEdit2 } from 'react-icons/fi';
import {
  DeleteAccountModal,
  FeedbackModal,
  VerifyPasswordModal,
} from '@/components/Modal/DeleteAccount';
import noProfile from '@/assets/images/noProfile.svg';
import { SquarePen } from 'lucide-react';
import { CountryDropdown, countries, type Country } from '@/components/auth/CountryDropdown';
import { Input } from '@/components/Inputs/TextInput';
import { Button } from '@/components/Buttons';

const ProfileTab = () => {
  const user = useAppSelector((state) => state.auth.user);
  const [updateProfile, { isLoading }] = useUpdateUserProfileMutation();
  const { refetch: refetchProfile } = useUserProfileQuery(undefined, {});
  const [fileUpload] = useFileUploadMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [profileImage, setProfileImage] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Delete account flow states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showVerifyPasswordModal, setShowVerifyPasswordModal] = useState(false);
  const [deletionReason, setDeletionReason] = useState<string>('');
  const [deletionFeedback, setDeletionFeedback] = useState<string>('');

  useEffect(() => {
    if (user?.phoneNumber) {
      const phoneMatch = user.phoneNumber.match(/^(\+\d{1,3})(.*)$/);
      if (phoneMatch) {
        setPhoneNumber(phoneMatch[2].trim());
        const dial = phoneMatch[1];
        const country = countries.find((c) => c.dialCode === dial) ?? null;
        setSelectedCountry(country);
      } else {
        setPhoneNumber(user.phoneNumber);
      }
    } else if (user?.countryCode) {
      const country = countries.find((c) => c.code === user.countryCode) ?? null;
      setSelectedCountry(country);
    }
    if (user?.profileImageUrl) {
      setProfileImage(user.profileImageUrl);
    }
  }, [user]);

  const handleSavePhone = async () => {
    if (!selectedCountry) {
      toast.error('Please select a country');
      return;
    }
    try {
      await updateProfile({
        phoneNumber: `${selectedCountry.dialCode}${phoneNumber}`,
        countryCode: selectedCountry.code,
        countryName: selectedCountry.name,
      }).unwrap();

      await refetchProfile();

      toast.success('Phone number updated successfully');
      setIsEditingPhone(false);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update phone number');
    }
  };

  const handleCancelPhone = () => {
    if (user?.phoneNumber) {
      const phoneMatch = user.phoneNumber.match(/^(\+\d{1,4})(.*)$/);
      if (phoneMatch) {
        setPhoneNumber(phoneMatch[2].trim());
        const country = countries.find((c) => c.dialCode === phoneMatch[1]) ?? null;
        setSelectedCountry(country);
      }
    }
    if (user?.countryCode) {
      const country = countries.find((c) => c.code === user.countryCode) ?? null;
      setSelectedCountry(country);
    }
    setIsEditingPhone(false);
  };

  // Handle profile picture upload
  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setIsUploadingImage(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      const response = await fileUpload(formData).unwrap();

      await updateProfile({ profileImageUrl: response.url }).unwrap();

      // Refetch the profile to update the UI immediately
      await refetchProfile();

      setProfileImage(response.url);
      toast.success('Profile picture updated successfully');
    } catch (error: any) {
      toast.error(
        error?.data?.message ||
          'Failed to upload profile picture. Please try again.'
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Delete account flow handlers
  const handleDeleteAccountClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteModalContinue = () => {
    setShowDeleteModal(false);
    setShowFeedbackModal(true);
  };

  const handleFeedbackSubmit = (reason: string, feedback?: string) => {
    setDeletionReason(reason);
    setDeletionFeedback(feedback || '');
    setShowFeedbackModal(false);
    setShowVerifyPasswordModal(true);
  };

  const handlePasswordVerify = (password: string) => {
    // TODO: Call delete account API endpoint when available
    console.log('Delete account with:', {
      password,
      reason: deletionReason,
      feedback: deletionFeedback,
    });

    // For now, just show a success message
    toast.info('Delete account endpoint not yet implemented');
    setShowVerifyPasswordModal(false);
  };

  const handleCloseAllModals = () => {
    setShowDeleteModal(false);
    setShowFeedbackModal(false);
    setShowVerifyPasswordModal(false);
    setDeletionReason('');
    setDeletionFeedback('');
  };

  return (
    <div className="max-w-[600px]">
      {/* Profile details heading */}
      <h2 className="text-[16px] md:text-[18px] font-semibold text-[#101828] mb-6">
        Profile details
      </h2>

      {/* Profile Picture */}
      <div className="mb-8">
        <div className="relative w-[80px] h-[80px] md:w-[100px] md:h-[100px]">
          <img
            src={profileImage || noProfile}
            alt="Profile"
            className="w-full h-full rounded-full object-cover"
          />
          <button
            onClick={handleProfilePictureClick}
            disabled={isUploadingImage}
            className="absolute bottom-0 right-0 w-6 h-6 md:w-8 md:h-8 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
          >
            {isUploadingImage ? (
              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7 6.00049C5.77936 6.00415 5.10383 6.03335 4.54873 6.26634C3.7712 6.59269 3.13801 7.19552 2.76811 7.96158C2.46618 8.58687 2.41677 9.38799 2.31796 10.9902L2.16312 13.5009C1.91739 17.4853 1.79452 19.4775 2.96369 20.7388C4.13285 22 6.10252 22 10.0419 22H13.9581C17.8975 22 19.8672 22 21.0363 20.7388C22.2055 19.4775 22.0826 17.4853 21.8369 13.5009L21.682 10.9902C21.5832 9.38799 21.5338 8.58687 21.2319 7.96158C20.862 7.19552 20.2288 6.59269 19.4513 6.26634C18.8962 6.03335 18.2206 6.00415 17 6.00049"
                  stroke="#0A0A0A"
                  stroke-width="2"
                  stroke-linecap="round"
                />
                <path
                  d="M17 7L16.1142 4.78543C15.732 3.82996 15.3994 2.7461 14.4166 2.25955C13.8924 2 13.2616 2 12 2C10.7384 2 10.1076 2 9.58335 2.25955C8.6006 2.7461 8.26801 3.82996 7.88583 4.78543L7 7"
                  stroke="#0A0A0A"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M15.5 14C15.5 15.933 13.933 17.5 12 17.5C10.067 17.5 8.5 15.933 8.5 14C8.5 12.067 10.067 10.5 12 10.5C13.933 10.5 15.5 12.067 15.5 14Z"
                  stroke="#0A0A0A"
                  stroke-width="2"
                />
                <path
                  d="M11.9998 6H12.0088"
                  stroke="#0A0A0A"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Full name */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <label className="block text-[13px] md:text-[14px] font-medium text-[#0A0A0A] mb-1 tracking-tight">
              Full name
            </label>
            <p className="text-[14px] font-medium text-[#6C6C6C]">
              {user?.firstName} {user?.lastName}
            </p>
          </div>
          {/* <button className="text-gray-400 hover:text-gray-600">
            <FiEdit2 size={18} />
          </button> */}
        </div>
      </div>

      {/* Email address */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <label className="block text-[13px] md:text-[14px] font-medium text-[#0A0A0A] mb-1 tracking-tight">
              Email address
            </label>
            <p className="text-[14px] font-medium text-[#6C6C6C]">{user?.email}</p>
          </div>
          {/* <button className="text-gray-400 hover:text-gray-600">
            <FiEdit2 size={18} />
          </button> */}
        </div>
      </div>

      {/* Phone number */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <label className="block text-[13px] md:text-[14px] font-medium text-[#0A0A0A] mb-1 tracking-tight">
              Phone number
            </label>
            {isEditingPhone ? (
              <div className="mt-2 space-y-4">
                {/* <CountryDropdown
                  selectedCountry={selectedCountry}
                  onSelectCountry={setSelectedCountry}
                /> */}
                <div>
                  <div className="flex items-center h-[50px] rounded-md bg-[#FAFAFA] rounded-lg focus-within:border-transparent focus-within:ring-0">
                    <div className="flex items-center gap-2 px-3 py-2 border-r border-gray-200 bg-gray-50 rounded-l-lg h-full">
                      {selectedCountry ? (
                        <>
                          <img src={selectedCountry.flag} alt={selectedCountry.name} className="w-5 h-5" />
                          <span className="text-sm text-[#3B3B3B] font-medium">
                            {selectedCountry.dialCode}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-[#9D9D9D]">+</span>
                      )}
                    </div>
                    <Input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setPhoneNumber(value);
                      }}
                      placeholder="Phone Number"
                      maxLength={11}
                      className="flex-1 px-3 py-2 border-none focus:ring-0 focus:outline-none bg-transparent h-full"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleCancelPhone}
                    disabled={isLoading}
                    className="px-4 py-2 text-[12px] font-semibold text-[#3B3B3B] bg-[#F0F0F0] rounded-full hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePhone}
                    disabled={isLoading}
                    className="px-4 py-2 text-[12px] font-semibold text-white bg-primary rounded-full hover:bg-[#2d5c19] disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[14px] font-medium text-[#6C6C6C]">
                {user?.phoneNumber || 'No phone number'}
              </p>
            )}
          </div>
          {!isEditingPhone && (
            <button
              onClick={() => setIsEditingPhone(true)}
              className="text-gray-400 hover:text-gray-600"
            >
              <SquarePen className='mt-3' size={18} color='#6C6C6C' />
            </button>
          )}
        </div>
      </div>

      {/* Country */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <label className="block text-[13px] md:text-[14px] font-medium text-[#0A0A0A] mb-1 tracking-tight">
              Country
            </label>
            <p className="text-[14px] font-medium text-[#6C6C6C]">
              {user?.countryName || 'Not specified'}
            </p>
          </div>
          {/* <button className="text-gray-400 hover:text-gray-600">
            <FiEdit2 size={18} />
          </button> */}
        </div>
      </div>

      {/* Delete account */}
      <div className="mt-6">
        <h3 className="text-[14px] md:text-[18px] font-semibold text-[#101828] mb-2">
          Delete account
        </h3>
        <p className="text-[13px] md:text-[14px] text-[#3B3B3B] font-medium mb-4">
          By deleting your account, you will permanently lose access to all
          providers you've connected with and won't be able to recover any of
          this information.
        </p>
        <Button variant="destructive" className='!px-6 mt-4' onClick={handleDeleteAccountClick} >
          Delete account
        </Button>
      </div>

      {/* Delete Account Modals */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={handleCloseAllModals}
        onContinue={handleDeleteModalContinue}
      />
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={handleCloseAllModals}
        onProceed={handleFeedbackSubmit}
      />
      <VerifyPasswordModal
        isOpen={showVerifyPasswordModal}
        onClose={handleCloseAllModals}
        onDelete={handlePasswordVerify}
        isLoading={false}
      />
    </div>
  );
};

export default ProfileTab;
