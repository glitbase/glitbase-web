/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/Buttons';
import { Typography } from '@/components/Typography';
import { Input } from '@/components/Inputs/TextInput';
import { PasswordInput } from '@/components/Inputs/PasswordInput';
import {
  Country,
  CountryDropdown,
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
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { setTokens, selectHasTokens } from '@/redux/auth/authSlice';
import { toast } from 'react-toastify';
import ProgressBar from '@/components/ProgressBar';
import { AUTH } from '@/pages/auth/authPageStyles';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  // Get email and userType from navigation state (passed from OTP verification)
  const emailFromState = location.state?.email as string | undefined;
  const userTypeFromState = location.state?.userType as
    | 'customer'
    | 'vendor'
    | undefined;

  console.log('Email from navigation state:', emailFromState);
  console.log('UserType from navigation state:', userTypeFromState);

  // Fetch user profile data if available (only if user is logged in)
  const hasTokens = useAppSelector(selectHasTokens);

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

  // Priority: API data > navigation state
  const email = profileData?.data?.user?.email || emailFromState || '';
  const userType = (profileData?.data?.user?.activeRole ||
    userTypeFromState ||
    'vendor') as 'customer' | 'vendor';

  // State to track if we should skip this step (if profile is already completed)
  const [shouldSkipToNextStep, setShouldSkipToNextStep] = useState(false);

  // SINGLE navigation check: If profile is already complete, redirect immediately
  useEffect(() => {
    // Skip if already in skip mode
    if (shouldSkipToNextStep) return;

    // Only check if we have profile data loaded
    if (!hasTokens || !profileData?.data?.user) return;

    const user = profileData.data.user;

    // Check if profile is complete
    const isProfileComplete =
      user.firstName &&
      user.lastName &&
      user.phoneNumber &&
      user.countryCode &&
      user.countryName;

    if (isProfileComplete) {
      console.log('Profile already complete, redirecting...');
      setShouldSkipToNextStep(true);

      // Navigate based on role (no localStorage needed)
      if (user.activeRole === 'customer') {
        navigate('/auth/signup/interests', { replace: true });
      } else {
        navigate('/vendor/onboarding', { replace: true });
      }
    }
  }, [hasTokens, profileData, shouldSkipToNextStep, navigate]);

  // Initialize form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<any>({});
  const [touched, setTouched] = useState<string[]>([]);

  // Prefill form data from API response
  useEffect(() => {
    if (profileData?.data?.user) {
      const user = profileData.data.user;


      // Prefill phone number if available from API
      if (user.phoneNumber) {
        const phoneWithoutCountryCode = user.phoneNumber.replace(
          /^\+(\d{1,3})/,
          ''
        );
        setPhoneNumber(phoneWithoutCountryCode);
      }

      // Prefill country if available from API
      if (user.countryCode) {
        const country = countries.find((c) => c.code === user.countryCode);
        if (country) setSelectedCountry(country);
      }
    }
  }, [profileData]);

  const [completeProfile, { isLoading: isCompletingProfile }] =
    useCompleteProfileMutation();
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();

  const validateFirstName = (firstName: string): boolean => {
    return firstName.trim().length > 0;
  };

  const validateLastName = (lastName: string): boolean => {
    return lastName.trim().length > 0;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    return /^\d{10,11}$/.test(phone);
  };

  const validatePasswordMatch = useCallback((): boolean => {
    return password === confirmPassword;
  }, [password, confirmPassword]);

  useEffect(() => {
    const newErrors: any = {};

    if (touched.includes('firstName') && !validateFirstName(firstName)) {
      newErrors.firstName = 'Please enter your first name';
    }

    if (touched.includes('lastName') && !validateLastName(lastName)) {
      newErrors.lastName = 'Please enter your last name';
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
    firstName,
    lastName,
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
      validateFirstName(firstName) &&
      validateLastName(lastName) &&
      selectedCountry !== null &&
      validatePhoneNumber(phoneNumber) &&
      isPasswordValid(password) &&
      validatePasswordMatch() &&
      Object.keys(errors).length === 0
    );
  };

  const navigateAfterProfileSetup = (user: any) => {
    if (user.activeRole === 'customer') {
      // Navigate to interests selection for customers
      navigate('/auth/signup/interests', { replace: true });
    } else {
      // Vendor flow - navigate based on onboarding status
      if (user.vendorOnboardingStatus !== 'completed') {
        navigate('/vendor/onboarding', { replace: true });
      } else if (!user.hasPayoutInfo) {
        navigate('/vendor/payout-setup', { replace: true });
      } else if (!user.hasSubInfo) {
        navigate('/vendor/subscription-setup', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid() || !selectedCountry) return;

    try {
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

        dispatch(setTokens(loginResponse.tokens));

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

  // If we're skipping to the next step, show loading
  if (shouldSkipToNextStep) {
    console.log('Rendering skip state');
    return (
      <main className={`${AUTH.mainScroll} justify-center`}>
        <div className="flex flex-col justify-center items-center min-h-[50vh] flex-1 py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#CC5A88]"></div>
          <p className="mt-3 text-gray-600">
            Profile already completed. Redirecting to next step...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={`${AUTH.mainScroll} justify-center`}>
      {isLoading ? (
        <div className="flex flex-col justify-center items-center min-h-[50vh] flex-1 py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#CC5A88]"></div>
          <p className="mt-3 text-gray-600">Loading profile data...</p>
        </div>
      ) : (
        <div className={`px-4 mx-auto pb-8 ${AUTH.columnWide} flex flex-col items-center w-full`}>
          {/* Progress indicator */}
          <div className="w-full mb-6">
            <p className="text-[#CC5A88] text-[14px] font-semibold mb-3">
              {userType === 'vendor' ? 'Step 2 of 8' : 'Step 1 of 2'}
            </p>
            <ProgressBar value={50} />
          </div>

          <div className="space-y-2 flex justify-center flex-col items-start w-full">
            <Typography variant="heading" className={`${AUTH.title} w-full`}>
              Complete your account
            </Typography>
            <p className={`${AUTH.subtitle} leading-[1.35] w-full`}>
              Add your personal details and create a secure password to set up your account
            </p>
          </div>

          <form className="w-full mt-8" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 min-w-0">
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onBlur={() => handleBlur('firstName')}
                    error={errors.firstName}
                    label="First name"
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onBlur={() => handleBlur('lastName')}
                    error={errors.lastName}
                    label="Last name"
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>

              {/* <div>
                <Input
                  value={email}
                  label="Email address"
                  placeholder="Email address"
                  type="email"
                  disabled
                  className="bg-gray-100"
                />
              </div> */}

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
                  className={`flex items-center h-[50px] rounded-md bg-[#FAFAFA] rounded-lg focus-within:border-transparent focus-within:ring-0 focus-within:ring-transparent ${
                    errors.phoneNumber ? 'border-red-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 px-3 py-2 border-r border-gray-200 bg-gray-50">
                    <img src={selectedCountry?.flag} alt={selectedCountry?.name} className="w-5 h-5" />
                    <span className="text-sm text-[#3B3B3B] font-medium">
                      {selectedCountry?.dialCode}
                    </span>
                  </div>
                  <Input
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
                  placeholder="Confirm password"
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
      )}
    </main>
  );
};

export default ProfileSetup;
