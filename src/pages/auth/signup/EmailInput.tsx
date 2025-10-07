/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/Buttons';
import { Typography } from '@/components/Typography';
import { Input } from '@/components/Inputs/TextInput';
import { GoBack } from '@/components/GoBack';
import GoogleAuth from '../GoogleAuth';
import { useInitiateSignupMutation } from '@/redux/auth';
import { toast } from 'react-toastify';

const EmailInput = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userType = location.state?.userType as 'customer' | 'vendor';

  const [email, setEmail] = useState('');
  const [initiateSignup, { isLoading }] = useInitiateSignupMutation();

  const validateEmail = (email: string): boolean => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const isFormValid = () => {
    return email && validateEmail(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    try {
      await initiateSignup({
        email: email.toLowerCase(),
        role: userType,
      }).unwrap();

      toast.success('Please check your email for OTP verification');
      navigate('/auth/signup/verify', {
        state: { email: email.toLowerCase(), userType },
      });
    } catch (error: any) {
      toast.error(
        error?.data?.message || error?.message || 'Failed to initiate signup'
      );
    }
  };

  return (
    <main className="h-screen w-full !bg-[white]">
      <div className="flex justify-between py-8 px-12">
        <GoBack text="Back" className="!text-[#60983C]" />
        <div className="flex items-center space-x-2">
          <p className="text-[13px] text-[#344054]">Already have an account?</p>
          <Button onClick={() => navigate('/auth/login')} variant="noBorder">
            Sign in
          </Button>
        </div>
      </div>

      <div className="px-4 mx-auto pb-2 max-w-[470px] flex flex-col items-start mt-[30px]">
        <div className="space-y-2 flex justify-center flex-col items-start w-full">
          <Typography
            variant="heading"
            className="text-left !text-[2rem] font-medium font-[lora]"
          >
            What's your email?
          </Typography>
          <p className="text-left font-medium text-[1rem] text-[#667185] !mt-3">
            We'll use this to keep your account secure and send you booking
            confirmations
          </p>
        </div>

        <form className="w-full py-10" onSubmit={handleSubmit}>
          <div>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              label="Email address"
              placeholder="Email address"
              type="email"
              required
            />
          </div>

          <div className="mt-6">
            <Button
              variant="default"
              size="full"
              loading={isLoading}
              disabled={!isFormValid() || isLoading}
              type="submit"
              className="bg-[#60983C] hover:bg-[#4d7a30]"
            >
              Create new account
            </Button>
          </div>

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-[#667185]">or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          <GoogleAuth isSignup={true} role={userType} />
        </form>
      </div>
    </main>
  );
};

export default EmailInput;
