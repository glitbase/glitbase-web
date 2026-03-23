/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { navigateTo } from './navigationSlice';
import { Tokens, setLoading } from './auth/authSlice';

let hasHandledSessionError = false;

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL,
  timeout: 180000,
  prepareHeaders: (headers, { endpoint }) => {
    // Don't add auth headers for public endpoints
    const publicEndpoints = [
      'resetPassword',
      'forgotPassword',
      'validateOtp',
      'resendPasswordResetToken',
      'login',
      'registerAgent',
      'initiateSignup',
      'verifyEmail',
      'resendEmailOtp',
      'googleAuth',
    ];
    
    // Check if this is a public endpoint
    const isPublicEndpoint = endpoint && publicEndpoints.includes(endpoint as string);
    
    if (!isPublicEndpoint) {
      const tokensString = localStorage.getItem('tokens');
      const tokens: Tokens = tokensString ? JSON.parse(tokensString) : null;

      if (tokens && tokens.accessToken) {
        headers.set('Authorization', `Bearer ${tokens.accessToken}`);
      }
    }
    return headers;
  },
});

const refreshAccessToken = async (refreshToken: string): Promise<Tokens> => {
  try {
    const refreshResponse = await fetch(
      `${import.meta.env.VITE_API_URL}/api/v1/auth/refresh-user-token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refreshToken}`,
        },
        body: JSON.stringify({}),
      }
    );

    if (!refreshResponse.ok) {
      throw new Error(`HTTP error! status: ${refreshResponse.status}`);
    }

    const data = await refreshResponse.json();
    console.log(data);
    return data.data.tokens;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
};

export const baseQueryWithReauth = async (
  args: any,
  api: any,
  extraOptions: any
) => {
  let result = await baseQuery(args, api, extraOptions);

  // Don't attempt token refresh for public endpoints (they shouldn't require auth)
  // Get endpoint name from api or check URL
  const endpoint = api?.endpoint || '';
  const url = args?.url || '';
  const publicEndpoints = [
    'resetPassword',
    'forgotPassword',
    'validateOtp',
    'resendPasswordResetToken',
    'login',
    'registerAgent',
    'initiateSignup',
    'verifyEmail',
    'resendEmailOtp',
    'googleAuth',
  ];
  const publicPaths = [
    '/api/v1/auth/reset-password',
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/validate-otp',
    '/api/v1/auth/resend-password-reset-otp',
    '/api/v1/auth/login',
    '/api/v1/auth/sign-up',
    '/api/v1/auth/initiate-signup',
    '/api/v1/auth/verify-email',
    '/api/v1/auth/resend-email-verification-token',
    '/api/v1/auth/google',
  ];
  
  const isPublicEndpoint = publicEndpoints.includes(endpoint) || publicPaths.some(path => url.includes(path));

  if (result.error && result.error.status === 401 && !isPublicEndpoint) {
    const tokensString = localStorage.getItem('tokens');
    const tokens: Tokens = tokensString ? JSON.parse(tokensString) : null;
    console.log(tokens);
    if (tokens?.refreshToken) {
      api.dispatch(setLoading(true));
      console.log('refreshing token');
      try {
        const newTokens = await refreshAccessToken(tokens.refreshToken);

        localStorage.setItem('tokens', JSON.stringify(newTokens));

        result = await baseQuery(
          {
            ...args,
            headers: {
              ...args.headers,
              Authorization: `Bearer ${newTokens.accessToken}`,
            },
          },
          api,
          extraOptions
        );
        api.dispatch(setLoading(false));
      } catch (refreshError) {
        handleApiErrors(result.error, api);
      }
    } else {
      handleApiErrors(result.error, api);
    }
  }

  return result;
};

const handleApiErrors = (error: any, api: any) => {
  let errorMessage = '';

  switch (error.data?.message) {
    case 'Invalid Token':
    case 'Session expired':
    case 'You have been logged out':
      if (!hasHandledSessionError) {
        hasHandledSessionError = true;
        errorMessage = 'Your session has expired. Please log in again.';

        api.dispatch(
          navigateTo({
            path: `/`,
            message: errorMessage,
          })
        );
      }
      break;
    case 'ThrottlerException: Too Many Requests':
      errorMessage = 'Too many requests. Please try again later.';
      // Display a notification or alert here if desired
      break;
    default:
      console.log('API error', error);
      return;
  }
};
