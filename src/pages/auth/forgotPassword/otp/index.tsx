/* eslint-disable @typescript-eslint/no-explicit-any */
import OtpInput from 'react18-input-otp';
import { Typography } from '@/components/Typography';
import { useState, useEffect } from 'react';
import {
  useResendPasswordResetTokenMutation,
  useValidateOtpMutation,
} from '@/redux/auth';
import { useParams } from 'react-router-dom';
import { handleError } from '@/utils/notify';
import { GoBack } from '@/components/GoBack';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useMatchMedia } from '@/hooks/useMatchMedia';
import {
  AUTH,
  authOtpFocusStyle,
  authOtpInputStyle,
} from '@/pages/auth/authPageStyles';

const ForgotOtp = () => {
  const { email } = useParams();
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [validateOtp, { isError}] = useValidateOtpMutation();
  const [resendOtp] = useResendPasswordResetTokenMutation();
  const [timer, setTimer] = useState(15);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const compactOtp = useMatchMedia('(max-width: 400px)');

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

  const handleChange = async (otpValue: any) => {
    setOtp(otpValue);
    if (otpValue.length === 6) {
      try {
        await validateOtp({ email, otp: otpValue }).unwrap();
        // Store in sessionStorage as backup in case state is lost
        sessionStorage.setItem('resetPasswordData', JSON.stringify({ email, otp: otpValue }));
        // Navigate with state - don't set nextPage as it causes AuthLayout to navigate again and lose state
        navigate('/auth/reset-password', {
          state: {
            email,
            otp: otpValue,
          },
          replace: true, // Replace to prevent back navigation issues
        });
      } catch (error: any) {
        handleError(error?.data);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <main className={AUTH.mainScroll}>
      <div className={AUTH.center}>
        <div className={`${AUTH.column} w-full`}>
          <GoBack
            onBack={() => navigate('/auth/forgot-password')}
            className="!text-[#344054]"
            size={'lg'}
          />
          <div className="flex flex-col w-full py-4 space-y-4 md:space-y-6">
            <Typography variant="heading" className={AUTH.title}>
              Check your email
            </Typography>
            <p className={`${AUTH.subtitle} leading-[1.35]`}>
              We sent a 6-digit code to{' '}
              <span className="font-semibold text-[#344054] break-all">
                {email}.
              </span>{' '}
              Please enter it below to continue
            </p>
          </div>

          <form className="py-4 space-y-5 w-full">
            <div className="mb-1 w-full overflow-x-auto flex justify-center pb-1 -mx-1 px-1">
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
            <div className="text-left">
              <span className="text-[#CC5A88] text-sm leading-snug font-semibold">
                <span
                  className={`text-sm font-semibold ${isTimerActive ? 'pointer-events-none text-[#B8B8B8]' : 'cursor-pointer hover:underline'
                    }`}
                  onClick={async () => {
                    if (!isTimerActive) {
                      try {
                        await resendOtp(email as string).unwrap();
                        toast.success('Otp has been resent');
                        setTimer(15);
                        setIsTimerActive(true);
                      } catch (error: any) {
                        handleError(error?.data);
                      }
                    }
                  }}
                >
                  {isTimerActive
                    ? `Resend in ${formatTime(timer)}`
                    : 'Resend code'}
                </span>
              </span>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default ForgotOtp;
