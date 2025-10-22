/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/Buttons';
import Card from '@/components/Card';
import { Input } from '@/components/Inputs/TextInput';
import { Typography } from '@/components/Typography';
import { useAppDispatch } from '@/hooks/redux-hooks';

import { useForgotPasswordMutation } from '@/redux/auth';
import { setNextpage } from '@/redux/auth/authSlice';
import { handleError } from '@/utils/notify';
import { validateFields } from '@/utils/validator';
import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoBack } from '@/components/GoBack';

const ForgotPassword = () => {
  const dispatch = useAppDispatch();
  const [payload, setPayload] = useState({
    email: '',
  });
  const navigate = useNavigate();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [errors, setErrors] = useState<any>(null);
  const [touched, setTouched] = useState<any>([]);

  useEffect(() => {
    let x = validateFields(['email'], payload);

    setErrors(x);
  }, [payload]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await forgotPassword(payload.email).unwrap();
      navigate(`/auth/forgot-password/${payload.email}/otp`);
    } catch (error: any) {
      dispatch(setNextpage(null));
      handleError(error?.data);
    }
  };
  return (
    <main className="lg:h-screen w-full flex justify-center lg:items-center">
      <Card
        borderRadius={'lg'}
        className="2xl:w-[604px] w-[504px] flex flex-col items-start mt-[14px] max-h-lg !shadow-none"
      >
        {/* back button */}
        <GoBack
          onBack={() => navigate('/auth/login')}
          className="!text-[#344054]"
          size={'lg'}
        />
        <div className="space-y-2 flex justify-start flex-col items-start">
          <Typography
            variant="heading"
            className="text-left !text-[2rem] font-semibold font-[lora]"
          >
            Forgot your password?
          </Typography>
          <Typography
            variant="body"
            className="text-[#344054] font-400 font-regular text-left text-[16px]"
          >
            Enter your email associated with your account and we’ll send a reset
            code to get back in
          </Typography>
        </div>
        <form className="w-full py-10 space-y-5">
          <div>
            <Input
              value={payload.email}
              onChange={(e) => {
                setTouched([...touched, 'email']);
                setPayload({ ...payload, email: e.target.value });
              }}
              error={touched.includes('email') && (errors?.errors?.email ?? '')}
              label="Email address"
              placeholder="Enter email address"
            />
          </div>
          <div className="mt-10">
            <Button
              variant="default"
              size={'full'}
              loading={isLoading}
              disabled={isLoading || !errors?.isValid}
              onClick={handleSubmit}
            >
              Continue
            </Button>
          </div>
        </form>
      </Card>
    </main>
  );
};
export default ForgotPassword;
