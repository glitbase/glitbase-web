/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/Buttons';
import { PasswordInput } from '@/components/Inputs/PasswordInput';
import { Input } from '@/components/Inputs/TextInput';
import { Typography } from '@/components/Typography';
import { useLoginMutation } from '@/redux/auth';
import { trackAction } from '@/utils/AmpHelper';
import { validateFields } from '@/utils/validator';
import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { setTokens, setUser } from '@/redux/auth/authSlice';
import GoogleAuth from '../GoogleAuth';
import { isFirstVisit } from '@/utils/helpers';
import { toast } from 'react-toastify';
import { AUTH } from '@/pages/auth/authPageStyles';

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

  // Redirect first-time visitors to splash screen
  useEffect(() => {
    if (isFirstVisit()) {
      navigate('/auth/');
    }
  }, [navigate]);

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
          window.location.href = '/';
        }
      } else {
        window.location.href = '/';
      }
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'An unexpected error occurred.');
    }
  };

  useEffect(() => {
    if (data) {
      console.log(data);
    }
  }, [data]);

  return (
    <main className={AUTH.main}>
      <p onClick={() => navigate('/auth/onboard')} className={AUTH.topLink}>
        New to Glitbase? <span className={AUTH.topLinkAccent}>Sign up</span>
      </p>
      <div className={AUTH.center}>
        <div className={AUTH.column}>
          <Typography variant="heading" className={AUTH.title}>
            Welcome back ✨
          </Typography>
          <p className={AUTH.subtitle}>
            Sign in to pick up where you left off with your beauty and lifestyle
            journey
          </p>

          <form className={AUTH.formPad}>
            <div>
              <div>
                <Input
                  value={payload.email}
                  onChange={(e) => {
                    setTouch('email');
                    setPayload({ ...payload, email: e.target.value });
                  }}
                  // error={
                  //   touched.includes('email') && (errors?.errors?.email ?? '')
                  // }
                  label="Email address"
                  placeholder="Email address"
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
                  placeholder="Password"
                />
              </div>
              <div className="flex justify-end">
                <div className="mt-2">
                  <a
                    href="/auth/forgot-password"
                    className="text-[13px] text-[#CC5A88] font-medium hover:underline"
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
            {/* <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-gray-[#F0F0F0]"></div>
              <span className="px-4 text-[14px] font-medium text-[#9D9D9D]">or</span>
              <div className="flex-1 border-t border-gray-[#F0F0F0]"></div>
            </div> */}
            <GoogleAuth isSignup={false} />
          </form>
        </div>

      </div>
    </main>
  );
};
export default Login;
