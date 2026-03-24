/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import noProfile from '@/assets/images/noProfile.svg';
import { Input } from '@/components/Inputs/TextInput';
import { Textarea } from '@/components/Inputs/TextAreaInput';
import { Button } from '@/components/Buttons';
import { useFileUploadMutation } from '@/redux/app';
import {
  glitfinderApi,
  useCreateGlitProfileMutation,
  useUpdateGlitProfileMutation,
  useLazyCheckUsernameAvailabilityQuery,
} from '@/redux/glitfinder';
import { useAppDispatch } from '@/hooks/redux-hooks';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
const BIO_MAX_LENGTH = 500;

/** Normalize API date (ISO or YYYY-MM-DD or date_of_birth) to YYYY-MM-DD for input[type="date"] */
function normalizeDateOfBirth(value: string | undefined): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface GlitProfileInitial {
  profilePicture?: string;
  profileImageUrl?: string;
  username?: string;
  dateOfBirth?: string;
  date_of_birth?: string;
  bio?: string;
  description?: string;
  isPrivate?: boolean;
}

interface GlitfinderSetupProps {
  initialProfile?: GlitProfileInitial | null;
  onSuccess?: () => void;
}

const GlitfinderSetup = ({ initialProfile, onSuccess }: GlitfinderSetupProps) => {
  const dispatch = useAppDispatch();
  const [fileUpload] = useFileUploadMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditMode = Boolean(initialProfile);

  const [createGlitProfile, { isLoading: isCreating }] =
    useCreateGlitProfileMutation();
  const [updateGlitProfile, { isLoading: isUpdating }] =
    useUpdateGlitProfileMutation();
  const [checkUsername] = useLazyCheckUsernameAvailabilityQuery();

  const [profilePicture, setProfilePicture] = useState(
    initialProfile?.profilePicture ?? initialProfile?.profileImageUrl ?? ''
  );
  const [username, setUsername] = useState(initialProfile?.username ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(
    normalizeDateOfBirth(initialProfile?.dateOfBirth ?? (initialProfile as { date_of_birth?: string })?.date_of_birth)
  );
  const [bio, setBio] = useState(
    initialProfile?.bio ?? (initialProfile as { description?: string })?.description ?? ''
  );
  const [isPrivate, setIsPrivate] = useState(initialProfile?.isPrivate ?? false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [usernameError, setUsernameError] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(
    isEditMode && initialProfile?.username ? true : null
  );

  // Debounced username availability check (skip when edit mode and username unchanged)
  useEffect(() => {
    if (!username) {
      setUsernameError('');
      setIsUsernameAvailable(isEditMode ? null : null);
      return;
    }
    if (!USERNAME_REGEX.test(username)) {
      setUsernameError(
        'Username must be 3-30 characters, alphanumeric and underscores only'
      );
      setIsUsernameAvailable(null);
      return;
    }
    if (isEditMode && username === initialProfile?.username) {
      setUsernameError('');
      setIsUsernameAvailable(true);
      return;
    }
    setUsernameError('');
    setIsCheckingUsername(true);
    const timeoutId = setTimeout(async () => {
      try {
        const result = await checkUsername(username).unwrap();
        setIsUsernameAvailable(result.data.available);
        if (!result.data.available) {
          setUsernameError('Username is already taken');
        }
      } catch {
        setUsernameError('Failed to check username availability');
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [username, checkUsername, isEditMode, initialProfile?.username]);

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    try {
      setIsUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);
      const response = await fileUpload(formData).unwrap();
      setProfilePicture(response.url);
      toast.success('Photo added');
    } catch (error: any) {
      toast.error(
        error?.data?.message || 'Failed to upload photo. Please try again.'
      );
    } finally {
      setIsUploadingImage(false);
    }
    e.target.value = '';
  };

  const isFormValid = useCallback(() => {
    const usernameValid =
      username.length >= 3 &&
      USERNAME_REGEX.test(username) &&
      (isUsernameAvailable === true || (isEditMode && username === initialProfile?.username));
    return usernameValid;
  }, [username, isUsernameAvailable, isEditMode, initialProfile?.username]);

  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }
    const payload = {
      profilePicture: profilePicture || 'https://static.vecteezy.com/system/resources/thumbnails/008/695/917/small/no-image-available-icon-simple-two-colors-template-for-no-image-or-picture-coming-soon-and-placeholder-illustration-isolated-on-white-background-vector.jpg',
      username,
      dateOfBirth: dateOfBirth || undefined,
      bio: bio.trim() || undefined,
      isPrivate,
    };
    try {
      if (isEditMode) {
        await updateGlitProfile(payload).unwrap();
        toast.success('Profile updated successfully!');
        dispatch(glitfinderApi.util.invalidateTags(['GlitProfile']));
        onSuccess?.();
      } else {
        await createGlitProfile(payload).unwrap();
        toast.success('Glit profile created successfully!');
        dispatch(glitfinderApi.util.invalidateTags(['GlitProfile']));
        onSuccess?.();
      }
    } catch (err: any) {
      const message =
        err?.data?.message ||
        (isEditMode ? 'Failed to update profile. Please try again.' : 'Failed to create profile. Please try again.');
      toast.error(message);
    }
  };

  return (
    <div className="w-full min-w-0 max-w-[700px] mx-auto px-3 sm:px-4 md:px-6 pt-4 sm:pt-5 md:pt-6 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:pb-5 md:pb-6">
      <h1 className="text-[18px] sm:text-[20px] md:text-[22px] font-semibold text-[#101828] mb-1 font-[lora] tracking-tight leading-snug">
        {isEditMode ? 'Edit your Glit profile' : "Hi there! Let's set up your Glit profile"}
      </h1>
      <p className="text-[13px] sm:text-[14px] text-[#6C6C6C] font-medium mb-6 sm:mb-8 leading-relaxed">
        {isEditMode
          ? 'Update your profile details below.'
          : 'You will be able to find and connect with others who share your interests and preferences, as well as discover new services and products that match your style.'}
      </p>

      {/* Profile picture - same style as ProfileTab */}
      <div className="mb-6 sm:mb-8">
        <div className="relative w-[88px] h-[88px] sm:w-[100px] sm:h-[100px]">
          <img
            src={profilePicture || noProfile}
            alt="Profile"
            className="w-full h-full rounded-full object-cover"
          />
          <button
            type="button"
            onClick={handleProfilePictureClick}
            disabled={isUploadingImage}
            className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-200 hover:bg-gray-50 disabled:opacity-50 touch-manipulation"
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
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M17 7L16.1142 4.78543C15.732 3.82996 15.3994 2.7461 14.4166 2.25955C13.8924 2 13.2616 2 12 2C10.7384 2 10.1076 2 9.58335 2.25955C8.6006 2.7461 8.26801 3.82996 7.88583 4.78543L7 7"
                  stroke="#0A0A0A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15.5 14C15.5 15.933 13.933 17.5 12 17.5C10.067 17.5 8.5 15.933 8.5 14C8.5 12.067 10.067 10.5 12 10.5C13.933 10.5 15.5 12.067 15.5 14Z"
                  stroke="#0A0A0A"
                  strokeWidth="2"
                />
                <path
                  d="M11.9998 6H12.0088"
                  stroke="#0A0A0A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
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
          aria-hidden
        />
      </div>

      {/* Username */}
      <div className="mb-6">
        <label className="block text-[14px] font-medium text-[#0A0A0A] mb-2">
          Username
        </label>
        <div className="flex items-center rounded-lg bg-[#FAFAFA] pl-3 pr-3 min-h-[50px] gap-0">
          <span className="text-[14px] font-medium text-[#0A0A0A] flex-shrink-0">@</span>
          <div className="flex-1 min-w-0">
            <Input
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border-0 bg-transparent shadow-none min-h-[50px] py-2 px-0 placeholder:text-[#9D9D9D] w-full"
            />
          </div>
          {username.length >= 3 && (
            <span className="flex-shrink-0 w-6 h-6 ml-2 flex items-center justify-center">
              {isCheckingUsername ? (
                <div className="w-4 h-4 border-2 border-[#6C6C6C] border-t-transparent rounded-full animate-spin" />
              ) : isUsernameAvailable === true ? (
                <span className="w-[18px] h-[18px] rounded-full bg-[#4C9A2A] flex items-center justify-center">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="text-white"
                  >
                    <path
                      d="M10 3L4.5 8.5L2 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              ) : isUsernameAvailable === false || usernameError ? (
                <span className="w-[18px] h-[18px] rounded-full bg-[#EF4444] flex items-center justify-center">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                    className="text-white"
                  >
                    <path
                      d="M2 2L8 8M8 2L2 8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              ) : null}
            </span>
          )}
        </div>
        {usernameError && !isCheckingUsername && (
          <p className="mt-1 text-[13px] text-[#EF4444] font-medium">
            {usernameError}
          </p>
        )}
      </div>

      {/* Date of birth */}
      <div className="mb-5 sm:mb-6">
        <label className="block text-[13px] sm:text-[14px] font-medium text-[#0A0A0A] mb-2">
          Date of birth{' '}
          <span className="text-[#6C6C6C] font-normal">(optional)</span>
        </label>
        <input
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          className="w-full min-h-[50px] rounded-lg bg-[#FAFAFA] px-3 text-[14px] font-medium text-[#3B3B3B] focus:outline-none focus:ring-2 focus:ring-[#4C9A2A]/20"
        />
      </div>

      {/* Bio */}
      <div className="mb-5 sm:mb-6 relative min-w-0">
        <Textarea
          label="Bio"
          placeholder="Tell us a bit about yourself..."
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX_LENGTH))}
          maxLength={BIO_MAX_LENGTH}
          className="min-h-[100px]"
        />
        <p className="text-[12px] font-medium text-[#6C6C6C] text-right mt-1">
          {bio.length}/{BIO_MAX_LENGTH}
        </p>
      </div>

      {/* Private profile toggle */}
      <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 bg-[#F9FAFB] p-3 sm:p-4 rounded-xl min-w-0">
        <div className="flex-1 min-w-0 pr-0 sm:pr-2">
          <p className="text-[13px] sm:text-[14px] font-semibold text-[#101828] mb-1">
            Private profile
          </p>
          <p className="text-[12px] sm:text-[13px] font-medium text-[#6C6C6C] max-w-full sm:max-w-[90%] leading-snug">
            Your profile is completely private; only you can see your content.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsPrivate((p) => !p)}
          className={`relative inline-flex h-6 w-11 sm:h-5 sm:w-10 flex-shrink-0 items-center self-start sm:self-center rounded-full transition-colors touch-manipulation ${
            isPrivate ? 'bg-[#4C9A2A]' : 'bg-[#D0D5DD]'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 sm:h-3 sm:w-3 transform rounded-full bg-white transition-transform ${
              isPrivate ? 'translate-x-[26px] sm:translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <Button
        onClick={handleSubmit}
        loading={isCreating || isUpdating}
        disabled={!isFormValid() || isCreating || isUpdating || isCheckingUsername}
        className="w-full"
      >
        {isEditMode ? 'Save changes' : 'Create profile'}
      </Button>
    </div>
  );
};

export default GlitfinderSetup;
