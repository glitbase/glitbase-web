/* eslint-disable @typescript-eslint/no-explicit-any */
import Card from '@/components/Card';
import OtpInput from 'react18-input-otp';
import { Typography } from '@/components/Typography';
import { useState, useEffect } from 'react';
import {
  useResendPasswordResetTokenMutation,
  useValidateOtpMutation,
} from '@/redux/auth';
import { useParams } from 'react-router-dom';
import { handleError, sendMessage } from '@/utils/notify';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { setNextpage } from '@/redux/auth/authSlice';
import { GoBack } from '@/components/GoBack';
import { useNavigate } from 'react-router-dom';

const ForgotOtp = () => {
  const dispatch = useAppDispatch();
  const { email } = useParams();
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [validateOtp, { isError, isSuccess }] = useValidateOtpMutation();
  const [resendOtp] = useResendPasswordResetTokenMutation();
  const [timer, setTimer] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [inputStyle] = useState({
    border: '',
  });

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
        dispatch(setNextpage(`/auth/reset-password`));
        localStorage.setItem(
          'otp',
          JSON.stringify({
            email,
            otp: otpValue,
          })
        );
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
    <div className="w-full h-full flex justify-center items-center">
      <Card
        borderRadius={'lg'}
        className="2xl:w-[604px] w-[504px] flex flex-col items-start !shadow-none"
      >
        <GoBack
          onBack={() => navigate('/auth/forgot-password')}
          className="!text-[#344054]"
          size={'lg'}
        />
        <div className="flex flex-col w-full py-4 space-y-6">
          <Typography
            variant="heading"
            className="text-left !text-[2rem] font-semibold font-[lora]"
          >
            Check your email
          </Typography>

          <Typography
            variant="body"
            className="text-[#344054] font-400 text-left text-[16px] "
          >
            We sent a 6-digit code to{' '}
            <span className="font-semibold  text-[#344054] text-foreground">
              {email}.
            </span>{' '}
            <br />
            Please enter it below to continue
          </Typography>
        </div>

        <form className="py-4 space-y-5">
          <div className="mb-1 flex justify-center">
            <OtpInput
              value={otp}
              onChange={handleChange}
              numInputs={6}
              isInputNum={true}
              hasErrored={isError}
              isSuccessed={isSuccess}
              shouldAutoFocus
              inputStyle={{
                width: '64.67px',
                height: '64px',
                marginLeft: '5px',
                marginRight: '5px',
                color: '#1c1a3a',
                fontSize: '32px',
                fontWeight: 600,
                background: '#F5F5F5',
                borderRadius: '9.2px',
                border: inputStyle.border,
              }}
              focusStyle={{
                outline: 'none',
                border: inputStyle.border,
              }}
              isInputSecure={false}
            />
          </div>
          <div className="text-left">
            <span className="text-[#6C6C6C] text-m leading-[19.68px] font-[600]">
              <span
                className={`text-[#ED79A9] cursor-pointer ${
                  isTimerActive ? 'pointer-events-none' : ''
                }`}
                onClick={async () => {
                  if (!isTimerActive) {
                    try {
                      await resendOtp(email as string).unwrap();
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
  );
};

export default ForgotOtp;
