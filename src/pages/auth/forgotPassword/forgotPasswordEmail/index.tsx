/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/Buttons';
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
import { AUTH } from '@/pages/auth/authPageStyles';

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
    <main className={AUTH.mainScroll}>
      <div className={AUTH.center}>
        <div className={`${AUTH.column} w-full`}>
          <GoBack
            onBack={() => navigate('/auth/login')}
            className="!text-[#3B3B3B]"
            size={'lg'}
          />
          <div className="space-y-2 flex justify-start flex-col items-start w-full">
            <Typography variant="heading" className={AUTH.title}>
              Reset password
            </Typography>
            <p className={`${AUTH.subtitle} leading-[1.35]`}>
              Enter your email associated with your account and we’ll send a reset code to get back in
            </p>
          </div>
          <form className={`w-full ${AUTH.formPad} space-y-5`}>
            <div>
              <Input
                value={payload.email}
                onChange={(e) => {
                  setTouched([...touched, 'email']);
                  setPayload({ ...payload, email: e.target.value });
                }}
                // error={touched.includes('email') && (errors?.errors?.email ?? '')}
                label="Email address"
                placeholder="Email address"
              />
            </div>
            <div className="mt-8 md:mt-12">
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
        </div>
      </div>
    </main>
  );
};
export default ForgotPassword;
