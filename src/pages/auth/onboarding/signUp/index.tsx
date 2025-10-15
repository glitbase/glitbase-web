/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from '@/AuthContext';
import { Button } from '@/components/Buttons';
import { GoBack } from '@/components/GoBack';
import { PasswordInput } from '@/components/Inputs/PasswordInput';
import { Input } from '@/components/Inputs/TextInput';
import { Typography } from '@/components/Typography';
import { useRegisterAgentMutation } from '@/redux/auth';
import { trackAction } from '@/utils/AmpHelper';
import { handleError } from '@/utils/notify';
import { validateFields } from '@/utils/validator';
import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { setNextpage } from '@/redux/auth/authSlice';
import './signUp.css';
import { useModal } from '@/components/Modal/ModalProvider';
import { ModalId } from '@/Layout';
import GoogleAuth from '../../GoogleAuth';

const Register = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const role = location.state?.role;

  const [payload, setPayload] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    role,
  });
  const [confirmPassword, setConfirmPassword] = useState<any>('');
  const navigate = useNavigate();
  const [registerAgent, { isLoading }] = useRegisterAgentMutation();
  const { showModal } = useModal();
  const [errors, setErrors] = useState<any>({});
  const [touched, setTouched] = useState<any>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [countryCode, setCountryCode] = useState('+234');
  const { setTokens } = useAuth();

  const handleChange = (name: string, value: string) => {
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else if (name === 'phoneNumber') {
      setPayload((prev) => ({ ...prev, [name]: value }));
    } else {
      setPayload((prev) => ({ ...prev, [name]: value }));
    }

    if (!touched.includes(name)) {
      setTouched((prev: string[]) => [...prev, name]);
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    if (inputValue.startsWith('+')) {
      const potentialCountryCode = inputValue.slice(0, 3);
      if (['+23', '+44'].includes(potentialCountryCode)) {
        setCountryCode(potentialCountryCode + inputValue[3]);
        handleChange(
          'phoneNumber',
          inputValue.slice(potentialCountryCode.length + 1)
        );
      } else {
        handleChange('phoneNumber', inputValue.slice(countryCode.length));
      }
    } else {
      handleChange('phoneNumber', inputValue);
    }
  };

  useEffect(() => {
    const newErrors: Record<string, string> = {};
    const touchedFields = [...Object.keys(payload), 'confirmPassword'].filter(
      (field) => touched.includes(field)
    );

    const validationResults = validateFields(touchedFields, {
      ...payload,
      confirmPassword,
    });

    if (!validationResults.isValid) {
      Object.assign(newErrors, validationResults.errors);
    }

    setErrors(newErrors);
  }, [payload, confirmPassword, touched]);

  const isFormValid = () => {
    return (
      Object.keys(errors).length === 0 &&
      Object.values(payload).every((value) => value !== '') &&
      confirmPassword === payload.password &&
      acceptedTerms
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    try {
      const response = await registerAgent({
        ...payload,
        email: payload.email.toLowerCase(),
        phoneNumber: `${countryCode}${payload.phoneNumber}`,
        countryCode: countryCode === '+234' ? 'NG' : 'GB',
        countryName: countryCode === '+234' ? 'Nigeria' : 'United Kingdom',
      }).unwrap();

      trackAction('User Sign-up', { email: payload.email });
      setTokens(response.tokens);
      dispatch(
        setNextpage(`/auth/${payload.email}/${payload.role}/onboard-otp`)
      );
    } catch (error: any) {
      if (error.status === 409) {
        showModal(ModalId.ADDROLE_MODAL);
      } else {
        handleError(error?.data);
      }
    }
  };

  return (
    <main className="h-screen w-full !bg-[white]">
      <div className="flex justify-between py-8 px-12">
        <GoBack text="Back" className="!text-[#60983C]" />
        <div className="flex items-center space-x-2">
          <p className="text-[13px] text-[#344054]">Already have an account?</p>
          <Button onClick={() => navigate('/auth/login')} variant={'noBorder'}>
            Log in
          </Button>
        </div>
      </div>
      <div className=" px-4 mx-auto pb-2 max-w-[470px] flex flex-col items-center mt-[30px] xl:mt-[0px]">
        <div className="space-y-2 flex justify-center flex-col items-center">
          <Typography
            variant="heading"
            className="text-center !text-[2rem] font-medium font-[lora]"
          >
            Create an account
          </Typography>
        </div>
        <form className="w-full py-10" onSubmit={handleSubmit}>
          <div>
            <div className="flex justify-between gap-3">
              <div className="flex-auto">
                <Input
                  value={payload.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  error={errors.firstName}
                  label="First name"
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div className="flex-auto">
                <Input
                  value={payload.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  error={errors.lastName}
                  label="Last name"
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <Input
                value={payload.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={errors.email}
                label="Email"
                placeholder="Enter email address"
                type="email"
                required
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone number
              </label>
              <div className="flex items-center border rounded-md border-gray-200 shadow-sm focus-within:border-indigo-300 focus-within:ring focus-within:ring-indigo-200 focus-within:ring-opacity-50">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="form-select border-none bg-transparent focus:ring-0 focus:border-none"
                  style={{ paddingLeft: '8px' }}
                >
                  <option value="+234">+234</option>
                  <option value="+44">+44</option>
                </select>
                <Input
                  value={payload.phoneNumber}
                  onChange={handlePhoneNumberChange}
                  // error={errors.phoneNumber}
                  label=""
                  placeholder="Enter phone number"
                  required
                  maxLength={10}
                  className="flex-1 border-none focus:ring-0"
                />
              </div>
              {errors.phoneNumber && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.phoneNumber}
                </p>
              )}
            </div>
            <div className="mt-4">
              <PasswordInput
                value={payload.password}
                onChange={(e) => handleChange('password', e.target.value)}
                error={errors.password}
                label="Password"
                placeholder="Create a password"
                required
              />
            </div>
            <div className="mt-4">
              <PasswordInput
                value={confirmPassword}
                onChange={(e) =>
                  handleChange('confirmPassword', e.target.value)
                }
                error={errors.confirmPassword}
                label="Confirm password"
                placeholder="Confirm password"
                required
              />
            </div>
            <div className="flex justify-center">
              <div className="mt-10 flex items-center">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mr-1 rounded border-gray-300 focus:ring-[#CC5A88] appearance-none custom-checkbox cursor-pointer"
                  required
                />

                <p className="text-[12px] font-[lora] text-[#475367]">
                  Please Accept Our{' '}
                  <span className="underline">Terms And Conditions</span> Before
                  Proceeding
                </p>
              </div>
            </div>
          </div>
          <div className="my-3">
            <Button
              variant="default"
              size="full"
              loading={isLoading}
              disabled={!isFormValid() || isLoading}
              type="submit"
              className="mt-1"
            >
              Sign up
            </Button>
          </div>
          <GoogleAuth isSignup={true} role={role} />
        </form>
      </div>
    </main>
  );
};
export default Register;
