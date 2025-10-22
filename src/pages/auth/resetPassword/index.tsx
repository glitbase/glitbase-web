/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/Buttons';
import Card from '@/components/Card';
import { PasswordInput } from '@/components/Inputs/PasswordInput';
import { Typography } from '@/components/Typography';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { useResetPasswordMutation } from '@/redux/auth';
import { setNextpage } from '@/redux/auth/authSlice';
import { handleError, sendMessage } from '@/utils/notify';
import { validateFields } from '@/utils/validator';
import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoBack } from '@/components/GoBack';

function ResetPassword() {
  const dispatch = useAppDispatch();
  const [payload, setPayload] = useState({
    password: '',
    confirmPassword: '',
  });
  const navigate = useNavigate();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [errors, setErrors] = useState<any>(null);
  const [touched, setTouched] = useState<any>([]);
  const userData = JSON.parse(localStorage.getItem('otp') as string);

  useEffect(() => {
    let x = validateFields(['password', 'confirmPassword'], payload);

    setErrors(x);
  }, [payload]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await resetPassword({
        password: payload.password,
        email: userData.email,
        otp: userData.otp,
      }).unwrap();
      // dispatch(setNextpage(`/auth/reset-success`));
      navigate('/auth/reset-success');
      sendMessage('Your password was reset successfully', 'success');
    } catch (error: any) {
      dispatch(setNextpage(null));
      handleError(error?.data);
    }
  };

  return (
    <main className="lg:h-screen w-full flex justify-center items-center">
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
            Create new password
          </Typography>
          <Typography
            variant="body"
            className="text-[#344054] font-400 text-left text-[16px] max-w-[404px] "
          >
            Create a strong new password to secure your account
          </Typography>
        </div>
        <form className="w-full grid grid-cols-1 py-5 space-y-5">
          <div className="mt-5">
            <PasswordInput
              value={payload.password}
              onChange={(e) => {
                setTouched([...touched, 'password']);
                setPayload({ ...payload, password: e.target.value });
              }}
              error={
                touched.includes('password') && (errors?.errors?.password ?? '')
              }
              label="New password"
              placeholder="Enter new password"
              className="bg-[#FAFAFA]"
            />
          </div>
          <div className="">
            <PasswordInput
              value={payload.confirmPassword}
              onChange={(e) => {
                setTouched([...touched, 'confirmPassword']);
                setPayload({ ...payload, confirmPassword: e.target.value });
              }}
              error={
                touched.includes('confirmPassword') &&
                (errors?.errors?.confirmPassword ?? '')
              }
              label="Confirm new password"
              placeholder="Confirm new password"
              className="bg-[#FAFAFA]"
            />
          </div>

          <div className="!mt-10 bg-[#FAFAFA]">
            <Button
              variant="default"
              className="w-full"
              loading={isLoading}
              disabled={isLoading || !errors?.isValid}
              onClick={handleSubmit}
            >
              Submit
            </Button>
          </div>
        </form>
      </Card>
    </main>
  );
}

export default ResetPassword;
