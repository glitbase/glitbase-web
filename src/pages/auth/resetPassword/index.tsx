/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/Buttons';
import { PasswordInput } from '@/components/Inputs/PasswordInput';
import { Typography } from '@/components/Typography';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { useResetPasswordMutation } from '@/redux/auth';
import { setNextpage } from '@/redux/auth/authSlice';
import { validateFields } from '@/utils/validator';
import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoBack } from '@/components/GoBack';
import { AUTH } from '@/pages/auth/authPageStyles';
import { PasswordRequirements } from '@/components/auth';
import { toast } from 'react-toastify';

function ResetPassword() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [payload, setPayload] = useState({
    password: '',
    confirmPassword: '',
  });
  const navigate = useNavigate();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [errors, setErrors] = useState<any>(null);
  const [touched, setTouched] = useState<any>([]);

  // Get data from navigation state, fallback to sessionStorage if state is lost
  const stateData = location.state as { email: string; otp: string } | null;
  const sessionData = sessionStorage.getItem('resetPasswordData');
  const userData = stateData || (sessionData ? JSON.parse(sessionData) : null);

  useEffect(() => {
    let x = validateFields(['password', 'confirmPassword'], payload);

    setErrors(x);
  }, [payload]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!userData?.email || !userData?.otp) {
      toast.error('Session expired. Please start the password reset process again.');
      navigate('/auth/forgot-password');
      return;
    }

    try {
      await resetPassword({
        password: payload.password,
        email: userData.email,
        otp: userData.otp,
      }).unwrap();
      // Clear sessionStorage after successful reset
      sessionStorage.removeItem('resetPasswordData');
      navigate('/auth/reset-success');
      toast.success('Your password was reset successfully');
    } catch (error: any) {
      dispatch(setNextpage(null));
      toast.error(error?.data?.message);
    }
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
              Create new password
            </Typography>
            <p className={`${AUTH.subtitle} max-w-full sm:max-w-[320px] leading-[1.35]`}>
              Create a strong new password to secure your account
            </p>
          </div>
          <form className="w-full grid grid-cols-1 py-5 md:py-8 space-y-5">
            <div className="mt-5">
              <PasswordInput
                value={payload.password}
                onChange={(e) => {
                  setTouched([...touched, 'password']);
                  setPayload({ ...payload, password: e.target.value });
                }}
                // error={
                //   touched.includes('password') && (errors?.errors?.password ?? '')
                // }
                label="New password"
                placeholder="Enter new password"
                className="bg-[#FAFAFA]"
              />
              <PasswordRequirements password={payload.password} />
            </div>
            <div className="">
              <PasswordInput
                value={payload.confirmPassword}
                onChange={(e) => {
                  setTouched([...touched, 'confirmPassword']);
                  setPayload({ ...payload, confirmPassword: e.target.value });
                }}
                // error={
                //   touched.includes('confirmPassword') &&
                //   (errors?.errors?.confirmPassword ?? '')
                // }
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
        </div>
      </div>
    </main>
  );
}

export default ResetPassword;
