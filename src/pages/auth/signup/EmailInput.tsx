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
import { AUTH } from '@/pages/auth/authPageStyles';

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
    <main className={AUTH.main}>
      <p onClick={() => navigate('/auth/login')} className={AUTH.topLink}>
        Already have an account? <span className={AUTH.topLinkAccent}>Sign In</span>
      </p>

      <div className={AUTH.center}>
        <div className={AUTH.column}>
          <GoBack color="#3B3B3B" size='lg' />
          <Typography variant="heading" className={AUTH.title}>
            What’s your email?
          </Typography>
          <p className={AUTH.subtitle}>
            We’ll use this to keep your account secure and send you booking confirmations
          </p>

          <form className={AUTH.formPad} onSubmit={handleSubmit}>
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

            {/* <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-gray-[#F0F0F0]"></div>
              <span className="px-4 text-[14px] font-medium text-[#9D9D9D]">or</span>
              <div className="flex-1 border-t border-gray-[#F0F0F0]"></div>
            </div> */}

            <GoogleAuth isSignup={true} role={userType} />
          </form>
        </div>
      </div>
    </main>
  );
};

export default EmailInput;
