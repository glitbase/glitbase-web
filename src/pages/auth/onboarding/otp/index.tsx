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

const Otp = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { email } = useParams();
  const [otp, setOtp] = useState('');
  const [verifyEmail, { isError, isSuccess }] = useVerifyEmailMutation();
  const [resendOtp] = useResendEmailOtpMutation();
  const [timer, setTimer] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [inputStyle, setInputStyle] = useState({
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
        await verifyEmail({ email, otp: otpValue }).unwrap();
        sendMessage('Your account has been created successfully', 'success');
        trackAction('User created', { email: email });
        setInputStyle({ border: '1px solid #0F973D' });
        dispatch(setNextpage(`/auth/login?email=${email}`));
        navigate(`/auth/login?email=${email}`);
      } catch (error: any) {
        setInputStyle({ border: '1px solid #FF2F2F' });
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

  return (
    <div className="w-full h-full flex justify-center items-center">
      <Card
        borderRadius={'lg'}
        className="2xl:w-[604px] w-[504px] flex flex-col items-center !shadow-none"
      >
        <img src={verifyMail} className="w-[96px]" />
        <div className="flex flex-col w-[80%] py-4 space-y-6">
          <Typography
            variant="heading"
            className="text-center !text-[2rem] font-medium font-[lora]"
          >
            Verify your email
          </Typography>

          <Typography
            variant="body"
            className="text-[#344054] font-400 text-center text-[16px]"
          >
            Enter the 6-digit code sent to{' '}
            <span className="font-semibold block text-[#344054] text-foreground">
              {email}
            </span>
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
          <div className="text-center">
            <span className="text-[#6C6C6C] text-xs leading-[19.68px] font-[600]">
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
  );
};

export default Otp;
