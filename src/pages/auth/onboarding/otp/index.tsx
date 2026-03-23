/* eslint-disable @typescript-eslint/no-explicit-any */
import Card from '@/components/Card';
import verifyMail from '@/assets/images/verifyMail.svg';
import OtpInput from 'react18-input-otp';
import { Typography } from '@/components/Typography';
import { useState, useEffect } from 'react';
import {
  useResendEmailOtpMutation,
  useVerifyEmailMutation,
} from '@/redux/auth';
import { useParams, useNavigate } from 'react-router-dom';
import { handleError, sendMessage } from '@/utils/notify';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { setNextpage } from '@/redux/auth/authSlice';
import { trackAction } from '@/utils/AmpHelper';
import { useMatchMedia } from '@/hooks/useMatchMedia';
import {
  AUTH,
  authOtpFocusStyle,
  authOtpInputStyle,
} from '@/pages/auth/authPageStyles';

const Otp = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { email } = useParams();
  const [otp, setOtp] = useState('');
  const [verifyEmail, { isError, isSuccess }] = useVerifyEmailMutation();
  const [resendOtp] = useResendEmailOtpMutation();
  const [timer, setTimer] = useState(60);
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
        await verifyEmail({ email, otp: otpValue }).unwrap();
        sendMessage('Your account has been created successfully', 'success');
        trackAction('User created', { email: email });
        dispatch(setNextpage(`/auth/login?email=${email}`));
        navigate(`/auth/login?email=${email}`);
      } catch (error: any) {
        dispatch(setNextpage(null));
        handleError(error?.data);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const otpBase = authOtpInputStyle({
    hasError: isError && !isSuccess,
    compact: compactOtp,
  });
  const otpInputMerged = {
    ...otpBase,
    ...(isSuccess ? { border: '1px solid #0F973D' } : {}),
  };
  const otpFocusMerged = isSuccess
    ? { outline: 'none' as const, border: '1px solid #0F973D' }
    : authOtpFocusStyle(isError && !isSuccess);

  return (
    <main className={AUTH.mainScroll}>
      <div className={`${AUTH.center} py-6`}>
        <Card
          borderRadius={'lg'}
          className={`${AUTH.cardShell} flex flex-col items-center !shadow-none max-w-[440px] sm:max-w-[504px] 2xl:max-w-[560px]`}
        >
          <img
            src={verifyMail}
            alt=""
            className="w-[72px] sm:w-[88px] md:w-[96px] shrink-0"
          />
          <div className="flex flex-col w-full max-w-[min(100%,360px)] sm:w-[85%] py-4 space-y-4 md:space-y-6 px-2">
            <Typography variant="heading" className={AUTH.titleCenter}>
              Verify your email
            </Typography>

            <Typography
              variant="body"
              className="text-[#344054] font-normal text-center text-[0.95rem] md:text-[16px] leading-snug"
            >
              Enter the 6-digit code sent to{' '}
              <span className="font-semibold block text-[#344054] break-all mt-1">
                {email}
              </span>
            </Typography>
          </div>

          <form className="py-4 space-y-5 w-full px-2 max-w-full">
            <div className="mb-1 w-full overflow-x-auto flex justify-center pb-1 -mx-1 px-1">
              <OtpInput
                value={otp}
                onChange={handleChange}
                numInputs={6}
                isInputNum={true}
                hasErrored={isError}
                isSuccessed={isSuccess}
                shouldAutoFocus
                inputStyle={otpInputMerged}
                focusStyle={otpFocusMerged}
                isInputSecure={false}
              />
            </div>
          <div className="text-center px-1">
            <span className="text-[#6C6C6C] text-[11px] sm:text-xs leading-snug font-semibold">
              Didn’t receive OTP?{' '}
              <span
                className={`text-[#ED79A9] cursor-pointer ${
                  isTimerActive ? 'pointer-events-none' : ''
                }`}
                onClick={async () => {
                  if (!isTimerActive) {
                    try {
                      await resendOtp({ email }).unwrap();
                      sendMessage('Otp has been resent', 'success');
                      setTimer(60);
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
      </Card>
      </div>
    </main>
  );
};

export default Otp;
