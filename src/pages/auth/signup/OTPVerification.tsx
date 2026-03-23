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
import { useMatchMedia } from '@/hooks/useMatchMedia';
import {
  AUTH,
  authOtpFocusStyle,
  authOtpInputStyle,
} from '@/pages/auth/authPageStyles';

const OTPVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email as string;
  const userType = location.state?.userType as 'customer' | 'vendor';

  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [isError, setIsError] = useState(false);
  const compactOtp = useMatchMedia('(max-width: 400px)');

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
    <main className={AUTH.main}>
      <p onClick={() => navigate('/auth/login')} className={AUTH.topLink}>
        Already have an account? <span className={AUTH.topLinkAccent}>Sign In</span>
      </p>

      <div className={AUTH.center}>
        <div className={AUTH.column}>
          <GoBack color="#3B3B3B" size='lg' />
          <Typography variant="heading" className={AUTH.title}>
            Verify your email
          </Typography>
          <p className={AUTH.subtitle}>
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-[#344054] break-all">{email}</span>.
            Please enter it below to continue
          </p>

          <form className="py-6 md:py-8 w-full">
            <div className="mb-3 w-full overflow-x-auto flex justify-center pb-1 -mx-1 px-1">
              <OtpInput
                value={otp}
                onChange={handleChange}
                numInputs={6}
                isInputNum={true}
                hasErrored={isError}
                shouldAutoFocus
                inputStyle={authOtpInputStyle({
                  hasError: isError,
                  compact: compactOtp,
                })}
                focusStyle={authOtpFocusStyle(isError)}
                isInputSecure={false}
              />
            </div>

            <div>
              <span className="text-[#B8B8B8] text-sm font-semibold">
                {isTimerActive ? (
                  <>Resend code in 00:{timer < 10 ? `0${timer}` : timer}</>
                ) : (
                  <>
                    Didn't receive code?{' '}
                    <button
                      type="button"
                      onClick={handleResend}
                      className="text-[#CC5A88] font-semibold cursor-pointer hover:underline"
                    >
                      Resend code
                    </button>
                  </>
                )}
              </span>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default OTPVerification;
