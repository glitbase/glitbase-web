/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/Buttons';
import { Typography } from '@/components/Typography';
import { Input } from '@/components/Inputs/TextInput';
import { PasswordInput } from '@/components/Inputs/PasswordInput';
import { GoBack } from '@/components/GoBack';
import { CountryDropdown, Country, countries } from '@/components/auth/CountryDropdown';
import { PasswordRequirements, isPasswordValid } from '@/components/auth/PasswordRequirements';
import { useCompleteProfileMutation, useLoginMutation } from '@/redux/auth';
import { useAuth } from '@/AuthContext';
import { toast } from 'react-toastify';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setTokens } = useAuth();

  const email = location.state?.email as string;
  const userType = location.state?.userType as 'customer' | 'vendor';

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState<any>({});
  const [touched, setTouched] = useState<string[]>([]);

  const [completeProfile, { isLoading: isCompletingProfile }] = useCompleteProfileMutation();
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();

  const validateFullName = (name: string): boolean => {
    const nameParts = name.trim().split(' ');
    return nameParts.length >= 2 && !!nameParts[0] && !!nameParts[1];
  };

  const validatePhoneNumber = (phone: string): boolean => {
    return /^\d{10,11}$/.test(phone);
  };

  const validatePasswordMatch = (): boolean => {
    return password === confirmPassword;
  };

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
  }, [fullName, phoneNumber, password, confirmPassword, touched]);

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
      } catch (loginError: any) {
        toast.error('Profile completed but auto-login failed. Please log in manually.');
        navigate('/auth/login', { state: { email } });
      }
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to complete profile');
    }
  };

  return (
    <main className="h-screen w-full !bg-[white] overflow-y-auto">
      <div className="flex justify-between py-8 px-12">
        <GoBack text="Back" className="!text-[#60983C]" />
      </div>

      <div className="px-4 mx-auto pb-8 max-w-[470px] flex flex-col items-center">
        {/* Progress indicator */}
        <div className="w-full mb-6">
          <p className="text-[#EE79A9] text-sm font-semibold mb-2">Step 1 of 2</p>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div className="bg-[#EE79A9] h-1 rounded-full" style={{ width: '50%' }} />
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
            Add your personal details and create a secure password to set up your account
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
                  <span className="text-sm text-gray-700">{selectedCountry.dialCode}</span>
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
                <p className="mt-1 text-xs text-red-500">{errors.phoneNumber}</p>
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
              disabled={!isFormValid() || isCompletingProfile || isLoggingIn}
              type="submit"
              className="bg-[#60983C] hover:bg-[#4d7a30]"
            >
              Continue
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default ProfileSetup;
