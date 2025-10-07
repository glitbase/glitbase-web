/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Typography } from '@/components/Typography';
import { GoBack } from '@/components/GoBack';
import OtpInput from 'react18-input-otp';
import {
  useVerifyEmailMutation,
  useResendEmailOtpMutation,
} from '@/redux/auth';
import { toast } from 'react-toastify';

const OTPVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email as string;
  const userType = location.state?.userType as 'customer' | 'vendor';

  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [isError, setIsError] = useState(false);

  const [verifyEmail] = useVerifyEmailMutation();
  const [resendOtp] = useResendEmailOtpMutation();

  useEffect(() => {
    if (timer > 0 && isTimerActive) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setIsTimerActive(false);
    }
  }, [timer, isTimerActive]);

  const handleChange = async (otpValue: string) => {
    setOtp(otpValue);
    setIsError(false);

    if (otpValue.length === 6) {
      try {
        await verifyEmail({ email, otp: otpValue }).unwrap();
        toast.success('Email verified successfully');
        navigate('/auth/signup/profile', {
          state: { email, userType },
        });
      } catch (error: any) {
        setIsError(true);
        toast.error(
          error?.data?.message || 'Invalid verification code. Please try again.'
        );
      }
    }
  };

  const handleResend = async () => {
    if (!isTimerActive) {
      try {
        await resendOtp({ email }).unwrap();
        toast.success('OTP resent successfully');
        setTimer(30);
        setIsTimerActive(true);
        setOtp('');
        setIsError(false);
      } catch (error: any) {
        toast.error(error?.data?.message || 'Failed to resend OTP');
      }
    }
  };

  return (
    <main className="h-screen w-full !bg-[white]">
      <div className="flex justify-between py-8 px-12">
        <GoBack text="Back" className="!text-[#60983C]" />
        <div className="flex items-center space-x-2">
          <p className="text-[13px] text-[#344054]">Already have an account?</p>
          <button
            onClick={() => navigate('/auth/login')}
            className="text-[#EE79A9] text-[13px] font-semibold"
          >
            Sign in
          </button>
        </div>
      </div>

      <div className="px-4 mx-auto pb-2 max-w-[470px] flex flex-col items-center mt-[30px]">
        <div className="space-y-2 flex justify-center flex-col items-center w-full">
          <Typography
            variant="heading"
            className="text-center !text-[2rem] font-medium font-[lora]"
          >
            Verify your email
          </Typography>
          <Typography
            variant="body"
            className="text-[#344054] font-400 text-center text-[16px] mt-2"
          >
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-[#344054]">{email}</span>.
            Please enter it below to continue
          </Typography>
        </div>

        <form className="py-10 w-full">
          <div className="mb-6 flex justify-center">
            <OtpInput
              value={otp}
              onChange={handleChange}
              numInputs={6}
              isInputNum={true}
              hasErrored={isError}
              shouldAutoFocus
              inputStyle={{
                width: '54px',
                height: '54px',
                marginLeft: '4px',
                marginRight: '4px',
                color: '#1c1a3a',
                fontSize: '24px',
                fontWeight: 600,
                background: '#F5F5F5',
                borderRadius: '8px',
                border: isError ? '1px solid #FF2F2F' : '1px solid transparent',
              }}
              focusStyle={{
                outline: 'none',
                border: isError ? '1px solid #FF2F2F' : '1px solid #EE79A9',
              }}
              isInputSecure={false}
            />
          </div>

          <div className="text-center">
            <span className="text-[#98A2B3] text-sm">
              {isTimerActive ? (
                <>Resend code in 00:{timer < 10 ? `0${timer}` : timer}</>
              ) : (
                <>
                  Didn't receive code?{' '}
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-[#EE79A9] font-semibold cursor-pointer hover:underline"
                  >
                    Resend code
                  </button>
                </>
              )}
            </span>
          </div>
        </form>
      </div>
    </main>
  );
};

export default OTPVerification;
