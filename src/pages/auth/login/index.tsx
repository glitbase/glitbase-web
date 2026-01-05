import { Button } from '@/components/Buttons';
import { GoBack } from '@/components/GoBack';
import { PasswordInput } from '@/components/Inputs/PasswordInput';
import { Input } from '@/components/Inputs/TextInput';
import { Typography } from '@/components/Typography';
import { useLoginMutation } from '@/redux/auth';
import { trackAction } from '@/utils/AmpHelper';
import { handleError } from '@/utils/notify';
import { validateFields } from '@/utils/validator';
import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { setTokens, setUser } from '@/redux/auth/authSlice';
import GoogleAuth from '../GoogleAuth';

const Login = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const emailFromQuery = queryParams.get('email') || '';
  const action = queryParams.get('action');
  const returnUrl = queryParams.get('returnUrl');

  const [payload, setPayload] = useState({
    email: emailFromQuery,
    password: '',
  });
  const navigate = useNavigate();
  const [login, { isLoading, data }] = useLoginMutation();
  const [errors, setErrors] = useState<any>(null);
  const [touched, setTouched] = useState<any>(emailFromQuery ? ['email'] : []);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const x = validateFields(['email'], payload);
    setErrors(x);
  }, [payload]);

  const setTouch = (key: string) => {
    let x = touched;
    if (!x.includes(key)) {
      x = [...x, key];
      setTouched(x);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await login({
        email: payload.email.toLowerCase(),
        password: payload.password,
      }).unwrap();

      trackAction('User login', { email: payload.email });
      dispatch(setTokens(response.tokens));
      dispatch(setUser(response.user));

      // Check if user needs to complete interests selection
      const hasInterests =
        response.user?.interests && response.user.interests.length > 0;

      if (action === 'add-role') {
        navigate('/auth/add-role');
      } else if (!hasInterests && response.user?.activeRole === 'customer') {
        // Route customer users without interests to interests selection
        navigate('/auth/signup/interests');
      } else if (returnUrl) {
        // Validate returnUrl is internal (starts with /) and redirect
        const decodedReturnUrl = decodeURIComponent(returnUrl);
        if (
          decodedReturnUrl.startsWith('/') &&
          !decodedReturnUrl.startsWith('/auth/')
        ) {
          navigate(decodedReturnUrl);
        } else {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    } catch (error: any) {
      handleError(error?.data);
    }
  };

  useEffect(() => {
    if (data) {
      console.log(data);
    }
  }, [data]);

  return (
    <main className="h-screen w-full !bg-[white]">
      <div className="flex justify-end py-8 px-12">
        {/* <GoBack text="Back" className="!text-[#60983C]" /> */}
        <div className="flex items-center space-x-2">
          <p className="text-[13px] text-[#344054]">New to Glitbase?</p>
          <Button
            onClick={() => navigate('/auth/onboard')}
            variant={'secondary'}
            className="border-none"
          >
            Sign up
          </Button>
        </div>
      </div>
      <div className=" px-4 mx-auto pb-2 max-w-[470px] h-fit flex flex-col items-center mt-[30px] xl:mt-[50px]">
        <div className="space-y-2 flex justify-start flex-col items-start w-full">
          <Typography
            variant="heading"
            className="text-left !text-[2rem] font-semibold font-[lora]"
          >
            Welcome back ✨
          </Typography>
          <Typography
            variant="body"
            className="text-[#344054] text-[16px] mt-2 text-left max-w-[404px]"
          >
            Sign in to pick up where you left off with your beauty and lifestyle
            journey
          </Typography>
        </div>
        <form className="w-full py-5 xl:py-10">
          <div>
            <div>
              <Input
                value={payload.email}
                onChange={(e) => {
                  setTouch('email');
                  setPayload({ ...payload, email: e.target.value });
                }}
                error={
                  touched.includes('email') && (errors?.errors?.email ?? '')
                }
                label="Email"
                placeholder="Enter email address"
              />
            </div>
            <div className="mt-5">
              <PasswordInput
                value={payload.password}
                onChange={(e) => {
                  setTouch('password');
                  setPayload({ ...payload, password: e.target.value });
                }}
                error={
                  touched.includes('password') &&
                  (errors?.errors?.password ?? '')
                }
                label="Password"
                placeholder="Enter password"
              />
            </div>
            <div className="flex justify-end">
              <div className="mt-2">
                <a
                  href="/auth/forgot-password"
                  className="text-[13px] text-[#D01361] font-medium"
                >
                  {' '}
                  Forgot password?
                </a>
              </div>
            </div>
          </div>
          <div className="mb-3 mt-12">
            <Button
              variant="default"
              size={'full'}
              loading={isLoading}
              disabled={isLoading || !errors?.isValid || touched.length !== 2}
              onClick={handleSubmit}
            >
              Sign in
            </Button>
          </div>
          <GoogleAuth isSignup={false} />
        </form>
      </div>
    </main>
  );
};
export default Login;
