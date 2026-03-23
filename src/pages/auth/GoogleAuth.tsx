/* eslint-disable @typescript-eslint/no-explicit-any */
import { useGoogleAuthMutation } from '@/redux/auth'
import { CredentialResponse, GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { setTokens } from '@/redux/auth/authSlice';
import { toast } from 'react-toastify';

type GoogleAuthProps = {
    isSignup: boolean;
    role?: string;
}

const GoogleAuth = ({ role }: GoogleAuthProps) => {

  const [googleAuth] = useGoogleAuthMutation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const navigateAfterLogin = (user: any) => {
    // Check if user has interests (for customers only)
    const hasInterests = user?.interests && user.interests.length > 0;

    if (user.activeRole === 'customer') {
      // Route customer users without interests to interests selection
      if (!hasInterests) {
        navigate('/auth/signup/interests');
      } else {
        navigate('/');
      }
    } else {
      // Vendor flow
      if (user.vendorOnboardingStatus !== 'completed') {
        navigate('/vendor/onboarding');
      } else if (!user.hasPayoutInfo) {
        navigate('/vendor/payout-setup');
      } else if (!user.hasSubInfo) {
        navigate('/vendor/subscription-setup');
      } else {
        navigate('/');
      }
    }
  };

  const authenticateWithGoogle = async(idToken: string | undefined) => {
    try {
      const { data } = await googleAuth({
        // isSignup,
        role,
        idToken,
        // countryName: 'Nigeria',
        // countryCode: 'NG'
    }).unwrap();

    const token = data?.tokens?.accessToken || data.token;
    const user = data?.user;

    dispatch(setTokens(data?.tokens));

    // Check if profile is complete
    if (!user.firstName || !user.lastName || !user.phoneNumber) {
      // Navigate to profile completion
      navigate('/auth/signup/profile', {
        state: {
          email: user.email,
          userType: role,
          googleAuthData: { token, user }
        }
      });
    } else {
      // Navigate based on role
      navigateAfterLogin(user);
    }
    } catch(error: any) {
      toast.error(error?.data?.message || 'Google sign-in failed');
    }

  }

  const initializeGoogleAuth = async(res: CredentialResponse) => {
    authenticateWithGoogle(res.credential);
  }


  return (
    <div className="my-3 w-full flex justify-center min-w-0 [&>div]:w-full [&>div]:max-w-full [&_iframe]:max-w-full">
    <GoogleLogin
        onSuccess={(credentialResponse) => initializeGoogleAuth(credentialResponse)}
        onError={() => {
          toast.error('Google sign-in failed');
        }}
        text={'continue_with'}
        logo_alignment='center'
        shape='pill'
        theme='filled_black'
      />
    </div>
  )
}

export default GoogleAuth;