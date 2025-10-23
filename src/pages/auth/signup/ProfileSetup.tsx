/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/Buttons';
import { Typography } from '@/components/Typography';
import { Input } from '@/components/Inputs/TextInput';
import { PasswordInput } from '@/components/Inputs/PasswordInput';
import { GoBack } from '@/components/GoBack';
import {
  CountryDropdown,
  Country,
  countries,
} from '@/components/auth/CountryDropdown';
import {
  PasswordRequirements,
  isPasswordValid,
} from '@/components/auth/PasswordRequirements';
import {
  useCompleteProfileMutation,
  useLoginMutation,
  useUserProfileQuery,
} from '@/redux/auth';
import { useAuth } from '@/AuthContext';
import { toast } from 'react-toastify';
import {
  OnboardingStep,
  updateOnboardingState,
  completeStep,
  getOnboardingState,
} from '@/utils/vendorOnboarding';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setTokens } = useAuth();

  // Get email and userType from navigation state (passed from OTP verification)
  const emailFromState = location.state?.email as string | undefined;
  const userTypeFromState = location.state?.userType as
    | 'customer'
    | 'vendor'
    | undefined;

  console.log('Email from navigation state:', emailFromState);
  console.log('UserType from navigation state:', userTypeFromState);

  // Fetch user profile data if available (only if user is logged in)
  const hasTokens = !!localStorage.getItem('tokens');

  const {
    data: profileData,
    isLoading,
    error,
  } = useUserProfileQuery(undefined, {
    skip: !hasTokens,
    refetchOnMountOrArgChange: true,
  });

  console.log('Profile data:', profileData);
  console.log('Loading state:', isLoading);
  console.log('Error state:', error);

  // Load data from localStorage if available
  const savedState = getOnboardingState();
  console.log('Saved onboarding state:', savedState);

  // Priority: API data > localStorage > navigation state
  const email =
    profileData?.data?.user?.email || savedState.data.email || emailFromState;
  const userType = (profileData?.data?.user?.activeRole ||
    userTypeFromState ||
    'vendor') as 'customer' | 'vendor';

  // Check if user already has complete profile data to skip this step
  useEffect(() => {
    console.log('Auto-navigation effect running');

    if (!profileData) {
      console.log('No profile data yet');
      return;
    }

    if (!profileData.data?.user) {
      console.log('No user data in profile response');
      return;
    }

    const user = profileData.data.user;
    console.log('User data for navigation check:', user);

    // Check if user has all required fields
    const hasRequiredFields =
      user.firstName &&
      user.lastName &&
      user.phoneNumber &&
      user.countryCode &&
      user.countryName &&
      userType === 'vendor';

    console.log('Has all required fields:', hasRequiredFields);
    console.log('User type:', userType);

    if (hasRequiredFields) {
      console.log('All conditions met, preparing to navigate');

      // Save data to localStorage first
      updateOnboardingState({
        currentStep: OnboardingStep.STORE_SETUP,
        data: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          countryCode: user.countryCode,
          countryName: user.countryName,
        },
      });
      console.log('Onboarding state updated');

      // Mark profile setup as completed
      completeStep(OnboardingStep.PROFILE_SETUP, OnboardingStep.STORE_SETUP);
      console.log('Step marked as completed');

      // Navigate to store setup (stage 3)
      console.log('Navigating to /vendor/onboarding');
      navigate('/vendor/onboarding');
    } else {
      console.log('Missing required fields, not navigating');
      if (!user.firstName) console.log('Missing firstName');
      if (!user.lastName) console.log('Missing lastName');
      if (!user.phoneNumber) console.log('Missing phoneNumber');
      if (!user.countryCode) console.log('Missing countryCode');
      if (!user.countryName) console.log('Missing countryName');
      if (userType !== 'vendor') console.log('User is not a vendor');
    }
  }, [profileData, navigate, userType]);

  // State to track if we should skip this step
  const [shouldSkipToNextStep, setShouldSkipToNextStep] = useState(false);

  // Check if we already have completed profile setup in localStorage
  useEffect(() => {
    console.log('Checking localStorage for completed profile setup');

    // Get fresh state from localStorage
    const currentState = getOnboardingState();

    // If we already have completed profile setup and have the necessary data
    const hasCompletedProfile = currentState.completed.includes(
      OnboardingStep.PROFILE_SETUP
    );
    const hasRequiredData =
      currentState.data.firstName &&
      currentState.data.lastName &&
      currentState.data.phoneNumber &&
      currentState.data.countryCode &&
      currentState.data.countryName;

    console.log('Has completed profile:', hasCompletedProfile);
    console.log('Has required data:', hasRequiredData);

    if (hasCompletedProfile && hasRequiredData) {
      console.log('Profile setup already completed according to localStorage');
      console.log('Setting shouldSkipToNextStep to true');
      setShouldSkipToNextStep(true);

      // Navigate after a small delay to ensure state is updated
      setTimeout(() => {
        console.log('Navigating to vendor onboarding');
        navigate('/vendor/onboarding', { replace: true });
      }, 100);
    }
  }, [navigate]); // Only depend on navigate

  // Initialize form with saved data if available
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);

  // Prefill form data from API response or localStorage
  useEffect(() => {
    if (profileData?.data?.user) {
      const user = profileData.data.user;

      // Prefill name if available from API
      if (user.firstName && user.lastName) {
        setFullName(`${user.firstName} ${user.lastName}`);
      } else if (savedState.data.firstName && savedState.data.lastName) {
        setFullName(`${savedState.data.firstName} ${savedState.data.lastName}`);
      }

      // Prefill phone number if available from API
      if (user.phoneNumber) {
        // Extract only the digits after the country code
        // For Nigerian numbers (+234), we need to keep the "90" prefix
        const phoneWithoutCountryCode = user.phoneNumber.replace(
          /^\+(\d{1,3})/,
          ''
        );
        setPhoneNumber(phoneWithoutCountryCode);
      } else if (savedState.data.phoneNumber) {
        // Extract only the digits after the country code
        const phoneWithoutCountryCode = savedState.data.phoneNumber.replace(
          /^\+(\d{1,3})/,
          ''
        );
        setPhoneNumber(phoneWithoutCountryCode);
      }

      // Prefill country if available from API
      if (user.countryCode) {
        const country = countries.find((c) => c.code === user.countryCode);
        if (country) setSelectedCountry(country);
      } else if (savedState.data.countryCode) {
        const country = countries.find(
          (c) => c.code === savedState.data.countryCode
        );
        if (country) setSelectedCountry(country);
      }
    } else {
      // If no API data, use localStorage data
      if (savedState.data.firstName && savedState.data.lastName) {
        setFullName(`${savedState.data.firstName} ${savedState.data.lastName}`);
      }

      if (savedState.data.phoneNumber) {
        // Extract only the digits after the country code
        const phoneWithoutCountryCode = savedState.data.phoneNumber.replace(
          /^\+(\d{1,3})/,
          ''
        );
        setPhoneNumber(phoneWithoutCountryCode);
      }

      if (savedState.data.countryCode) {
        const country = countries.find(
          (c) => c.code === savedState.data.countryCode
        );
        if (country) setSelectedCountry(country);
      }
    }
  }, [profileData, savedState.data]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState<any>({});
  const [touched, setTouched] = useState<string[]>([]);

  const [completeProfile, { isLoading: isCompletingProfile }] =
    useCompleteProfileMutation();
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();

  const validateFullName = (name: string): boolean => {
    const nameParts = name.trim().split(' ');
    return nameParts.length >= 2 && !!nameParts[0] && !!nameParts[1];
  };

  const validatePhoneNumber = (phone: string): boolean => {
    return /^\d{10,11}$/.test(phone);
  };

  const validatePasswordMatch = useCallback((): boolean => {
    return password === confirmPassword;
  }, [password, confirmPassword]);

  useEffect(() => {
    const newErrors: any = {};

    if (touched.includes('fullName') && !validateFullName(fullName)) {
      newErrors.fullName = 'Please enter both first and last name';
    }

    if (touched.includes('phoneNumber') && !validatePhoneNumber(phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be 10-11 digits';
    }

    if (touched.includes('password') && !isPasswordValid(password)) {
      newErrors.password = 'Password must meet all requirements';
    }

    if (touched.includes('confirmPassword') && !validatePasswordMatch()) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
  }, [
    fullName,
    phoneNumber,
    password,
    confirmPassword,
    touched,
    validatePasswordMatch,
  ]);

  const handleBlur = (field: string) => {
    if (!touched.includes(field)) {
      setTouched([...touched, field]);
    }
  };

  const isFormValid = () => {
    return (
      validateFullName(fullName) &&
      validatePhoneNumber(phoneNumber) &&
      isPasswordValid(password) &&
      validatePasswordMatch() &&
      Object.keys(errors).length === 0
    );
  };

  const navigateAfterProfileSetup = (user: any) => {
    localStorage.setItem('isFirstTimeUser', 'true');

    if (user.activeRole === 'customer') {
      navigate('/auth/signup/interests');
    } else {
      // Vendor flow
      if (user.vendorOnboardingStatus !== 'completed') {
        // Save profile data to localStorage
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        updateOnboardingState({
          currentStep: OnboardingStep.STORE_SETUP,
          data: {
            firstName,
            lastName,
            email,
            phoneNumber: `${selectedCountry.dialCode}${phoneNumber}`,
            countryCode: selectedCountry.code,
            countryName: selectedCountry.name,
          },
        });

        completeStep(OnboardingStep.PROFILE_SETUP, OnboardingStep.STORE_SETUP);

        navigate('/vendor/onboarding');
      } else if (!user.hasPayoutInfo) {
        navigate('/vendor/payout-setup');
      } else if (!user.hasSubInfo) {
        navigate('/vendor/subscription-setup');
      } else {
        navigate('/');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    try {
      // Split full name into first and last name
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Complete profile
      await completeProfile({
        firstName,
        lastName,
        email,
        phoneNumber: `${selectedCountry.dialCode}${phoneNumber}`,
        countryName: selectedCountry.name,
        countryCode: selectedCountry.code,
        password,
      }).unwrap();

      toast.success('Profile completed successfully');

      // Auto-login
      try {
        const loginResponse = await login({
          email,
          password,
        }).unwrap();

        setTokens(loginResponse.tokens);

        // Navigate based on role
        navigateAfterProfileSetup(loginResponse.user);
      } catch (_: any) {
        toast.error(
          'Profile completed but auto-login failed. Please log in manually.'
        );
        navigate('/auth/login', { state: { email } });
      }
    } catch (error: any) {
      toast.error(
        error?.data?.message || error?.message || 'Failed to complete profile'
      );
    }
  };
  console.log(userType);

  // If we're skipping to the next step, show loading
  if (shouldSkipToNextStep) {
    console.log('Rendering skip state');
    return (
      <main className="h-screen w-full !bg-[white] overflow-y-auto">
        <div className="flex flex-col justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#CC5A88]"></div>
          <p className="mt-3 text-gray-600">
            Profile already completed. Redirecting to next step...
          </p>
        </div>
      </main>
    );
  }

  // Check if we have enough data to render the form
  const canRenderForm = !isLoading && (email || savedState.data.email);
  console.log('Can render form:', canRenderForm);
  console.log('Email from API:', email);
  console.log('Email from localStorage:', savedState.data.email);

  return (
    <main className="h-screen w-full !bg-[white] overflow-y-auto">
      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#CC5A88]"></div>
          <p className="mt-3 text-gray-600">Loading profile data...</p>
        </div>
      ) : !canRenderForm ? (
        <div className="flex flex-col justify-center items-center h-full">
          <p className="text-gray-600">
            Unable to load profile data. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#60983C] text-white rounded hover:bg-[#4d7a30]"
          >
            Refresh Page
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-between py-8 px-12">
            <GoBack text="Back" className="!text-[#60983C]" />
          </div>

          <div className="px-4 mx-auto pb-8 max-w-[470px] flex flex-col items-center">
            {/* Progress indicator */}
            <div className="w-full mb-6">
              <p className="text-[#CC5A88] text-sm font-semibold mb-2">
                {userType === 'vendor' ? 'Step 2 of 8' : 'Step 1 of 2'}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div
                  className="bg-[#CC5A88] h-1 rounded-full"
                  style={{ width: userType === 'vendor' ? '25%' : '50%' }}
                />
              </div>
            </div>

            <div className="space-y-2 flex justify-center flex-col items-start w-full">
              <Typography
                variant="heading"
                className="text-left !text-[2rem] font-medium font-[lora]"
              >
                Complete your account
              </Typography>
              <p className="text-left font-medium text-[1rem] text-[#667185] !mt-3">
                Add your personal details and create a secure password to set up
                your account
              </p>
            </div>

            <form className="w-full py-10" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={() => handleBlur('fullName')}
                    error={errors.fullName}
                    label="Full name"
                    placeholder="First & last name"
                    required
                  />
                </div>

                <div>
                  <Input
                    value={email}
                    label="Email address"
                    placeholder="Email address"
                    type="email"
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                <div>
                  <CountryDropdown
                    selectedCountry={selectedCountry}
                    onSelectCountry={setSelectedCountry}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone number
                  </label>
                  <div
                    className={`flex items-center border rounded-md shadow-sm focus-within:border-indigo-300 focus-within:ring focus-within:ring-indigo-200 focus-within:ring-opacity-50 ${
                      errors.phoneNumber ? 'border-red-500' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 px-3 py-2 border-r border-gray-200 bg-gray-50">
                      <span className="text-lg">{selectedCountry.flag}</span>
                      <span className="text-sm text-gray-700">
                        {selectedCountry.dialCode}
                      </span>
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setPhoneNumber(value);
                        if (!touched.includes('phoneNumber')) {
                          setTouched([...touched, 'phoneNumber']);
                        }
                      }}
                      onBlur={() => handleBlur('phoneNumber')}
                      placeholder="Phone Number"
                      maxLength={11}
                      className="flex-1 px-3 py-2 border-none focus:ring-0 focus:outline-none"
                    />
                  </div>
                  {errors.phoneNumber && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.phoneNumber}
                    </p>
                  )}
                </div>

                <div>
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => handleBlur('password')}
                    error={errors.password}
                    label="Password"
                    placeholder="Password"
                    required
                  />
                  <PasswordRequirements password={password} />
                </div>

                <div>
                  <PasswordInput
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => handleBlur('confirmPassword')}
                    error={errors.confirmPassword}
                    label="Confirm password"
                    placeholder="Password"
                    required
                  />
                </div>
              </div>

              <div className="mt-8">
                <Button
                  variant="default"
                  size="full"
                  loading={isCompletingProfile || isLoggingIn}
                  disabled={
                    !isFormValid() || isCompletingProfile || isLoggingIn
                  }
                  type="submit"
                  className="bg-[#60983C] hover:bg-[#4d7a30]"
                >
                  Continue
                </Button>
              </div>
            </form>
          </div>
        </>
      )}
    </main>
  );
};

export default ProfileSetup;
