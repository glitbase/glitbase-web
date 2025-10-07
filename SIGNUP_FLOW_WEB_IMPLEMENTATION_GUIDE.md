# Glitbase Signup Flow - Web Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Complete User Flow](#complete-user-flow)
3. [API Endpoints Reference](#api-endpoints-reference)
4. [Step-by-Step Implementation](#step-by-step-implementation)
5. [Validation Rules](#validation-rules)
6. [State Management](#state-management)
7. [Conditional Navigation Logic](#conditional-navigation-logic)
8. [Social Authentication](#social-authentication)

---

## Overview

The Glitbase signup flow is a multi-step onboarding process that handles two distinct user types:
- **Customer** (`customer` role) - Users who want to browse and book services
- **Vendor** (`vendor` role) - Service providers who want to showcase work and grow their business

The flow consists of 4-7 steps depending on the user type and authentication method chosen.

### API Base URL
```
BASE_URL: {apiUrl}/Sapi/v1/
```
All endpoints mentioned below are relative to this base URL.

---

## Complete User Flow

### 1. User Type Selection
**Route:** `/signup` (or `/signup/user-type`)

**UI Components:**
- Header: "Before you set up, how do you want to use Glitbase?"
- Subheading: "Select your role so we can personalize your experience based on your goals"
- Progress bar: 33%
- Two selection cards with radio buttons

**User Type Options:**
```javascript
const userTypes = [
  {
    name: 'user',
    value: 'customer',
    description: 'I want to get inspired and find providers I can book or buy from',
    icon: 'person-outline' // or equivalent
  },
  {
    name: 'pro',
    value: 'vendor',
    description: 'I want to inspire, showcase my work & grow my business',
    icon: 'person-outline' // or equivalent
  }
]
```

**State to Track:**
- `selectedUserType`: string ('customer' | 'vendor')

**Validation:**
- User must select one option before continuing
- Show error toast if attempting to continue without selection: "Please select a role to continue"

**On Continue:**
- Navigate to Email Input step
- Pass `userType` (the value field: 'customer' or 'vendor') to next screen

---

### 2. Email Input
**Route:** `/signup/email`

**UI Components:**
- Header: "What's your email?"
- Subheading: "We'll use this to secure your account and send you booking confirmations"
- Progress bar: 66%
- Email input field
- "Create new account" button
- "or" divider
- Social auth buttons (Google, Apple)
- "Already have an account? Log in" link

**Form Fields:**
```javascript
{
  email: string // lowercase, trimmed
}
```

**Validation:**
- Email must not be empty
- Email must match regex: `/\S+@\S+\.\S+/`
- Convert email to lowercase before submission
- Button disabled if email is empty or invalid

**API Endpoint:**
```
POST /auth/initiate-signup
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "role": "customer" // or "vendor"
}
```

**Success Response:**
```json
{
  "message": "Please check your email for OTP verification"
}
```

**Error Handling:**
- Display error from `error?.data?.message || error?.message || 'Failed to initiate signup'`
- Common errors: Email already exists, invalid email format

**On Success:**
- Show success toast: "Please check your email for OTP verification"
- Navigate to OTP verification screen
- Pass email and userType to next screen

**Social Auth Alternative:**
- Users can skip email/OTP by using Google or Apple auth
- See [Social Authentication](#social-authentication) section

---

### 3. OTP Verification
**Route:** `/signup/verify`

**UI Components:**
- Header: "Verify your email"
- Subheading: "We sent a 6-digit code to {email}. Please enter it below to continue."
- Progress bar: 66%
- 6 individual input boxes for OTP digits
- Resend timer/button
- "Continue" button

**Form Fields:**
```javascript
{
  otp: string // 6 digits
}
```

**State to Track:**
- `otp`: array of 6 strings (one per digit)
- `resendTimer`: number (30 seconds countdown)
- `isError`: boolean (to show red border on error)

**Input Behavior:**
- Only accept numeric input
- Auto-focus next input on digit entry
- Auto-focus previous input on backspace when current is empty
- Show red border on all inputs if verification fails

**Resend Logic:**
- Show timer for 30 seconds: "Resend code in {timer}s"
- After timer expires, show clickable: "Resend code"
- Reset timer and OTP inputs on resend

**API Endpoints:**

**Verify OTP:**
```
POST /auth/verify-email
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Success Response:**
```json
{
  "message": "Email verified successfully"
}
```

**Resend OTP:**
```
POST /auth/resend-email-verification-token
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response:**
```json
{
  "message": "OTP resent successfully"
}
```

**Error Handling:**
- Set `isError` to true to show red borders
- Display error toast with message
- Don't clear OTP inputs on error (let user correct)

**On Success:**
- Show success toast: "Email verified successfully"
- Navigate to Profile Setup screen
- Pass email and userType to next screen

---

### 4. Profile Setup (Complete Account)
**Route:** `/signup/profile`

**UI Components:**
- Header: "Complete your account"
- Subheading: "Add your personal details and create a secure password to set up your account."
- Progress bar: 100%
- Form fields (see below)
- "Continue" button

**Form Fields:**
```javascript
{
  fullName: string,        // "First & last name"
  phoneNumber: string,     // Numeric only, max 11 digits
  country: object,         // Selected from modal
  password: string,
  confirmPassword: string
}
```

**Country Selector:**
- Default countries array (Nigeria and UK supported):
```javascript
const countries = [
  {
    name: 'Nigeria',
    flag: '🇳🇬',
    dialCode: '+234',
    code: 'NG'
  },
  {
    name: 'United Kingdom',
    flag: '🇬🇧',
    dialCode: '+44',
    code: 'GB'
  }
]
```
- Default to Nigeria
- Show flag + dropdown icon in button
- Open modal to select country
- Display format: `{flag} {dialCode} {phoneNumber}`

**Password Requirements Component:**
Display real-time validation indicators when password field has content:

```javascript
const passwordRequirements = {
  minLength: password.length >= 8,
  hasUppercase: /[A-Z]/.test(password),
  hasLowercase: /[a-z]/.test(password),
  hasNumber: /\d/.test(password),
  hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
}
```

Show checkmarks/indicators for:
- ✓ At least 8 characters
- ✓ One uppercase letter
- ✓ One lowercase letter
- ✓ One number
- ✓ One special character

**Confirm Password Validation:**
- Show error "Passwords do not match" if confirmPassword is filled but doesn't match password
- Error text color: `colors.error`

**Validation Rules:**
- Full name must have at least 2 words (first + last name)
- Phone number required
- Country selection required
- Password must meet all 5 requirements above
- Passwords must match
- Button disabled until all validations pass

**Form Submission:**

**Split Name:**
```javascript
const nameParts = fullName.trim().split(' ');
const firstName = nameParts[0] || '';
const lastName = nameParts.slice(1).join(' ') || '';
```

**Combine Phone:**
```javascript
const fullPhone = selectedCountry.dialCode + phoneNumber;
// e.g., "+234" + "8012345678" = "+2348012345678"
```

**API Endpoint:**
```
POST /auth/complete-profile
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@example.com",
  "phoneNumber": "+2348012345678",
  "countryName": "Nigeria",
  "countryCode": "NG",
  "password": "SecurePass123!"
}
```

**Success Response:**
```json
{
  "message": "Profile completed successfully"
}
```

**Post-Completion Flow:**

After profile completion, the app performs an **auto-login**:

**Auto-Login API:**
```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response:**
```json
{
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "user": {
      "id": "user123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "activeRole": "customer", // or "vendor"
      "vendorOnboardingStatus": "pending", // for vendors only
      "hasPayoutInfo": false,
      "hasSubInfo": false,
      // ... other user fields
    }
  }
}
```

**State Management:**
- Store `accessToken` in Redux/Context: `token`
- Store `user` object in Redux/Context: `user`
- Store in localStorage/sessionStorage: `isFirstTimeUser: true`

**Navigation Logic After Login:**

For **CUSTOMER** role:
```
Navigate to: Interests Selection Screen
```

For **VENDOR** role (check these conditions in order):
```javascript
if (user.vendorOnboardingStatus !== "completed") {
  Navigate to: Vendor Onboarding Screen
} else if (!user.hasPayoutInfo) {
  Navigate to: Payout Setup Screen
} else if (!user.hasSubInfo) {
  Navigate to: Subscription Setup Screen
} else {
  Navigate to: Home Screen
}
```

**Error Handling:**
- If profile completion succeeds but auto-login fails:
  - Show toast: "Profile completed but auto-login failed. Please log in manually."
  - Navigate to Login screen

---

### 5a. Interests Selection (Customer Only)
**Route:** `/signup/interests`

**UI Components:**
- Header: "What are you into?"
- Subheading: "Select what you love so we can match you with inspirations and services that fit your vibe"
- Progress bar: 100%
- Two sections with interest cards
- Fixed "Save" button at bottom

**Interest Categories:**

**Section 1: "Styles, slays & inspo you love"**
```javascript
const stylesInspo = [
  { id: "braids-twists", emoji: "👩🏿‍🦱", title: "Braids & Twists" },
  { id: "wig-installs", emoji: "👩🏿‍🦲", title: "Wig Installs & Sew-ins" },
  { id: "makeup-looks", emoji: "✨", title: "Makeup Looks" },
  { id: "hair-highlights", emoji: "🎨", title: "Hair Highlights & Colour" },
  { id: "nail-art", emoji: "💅", title: "Nail Art & Designs" },
  { id: "event-ready-looks", emoji: "💕", title: "Event Ready Looks" },
  { id: "save-worthy-inspo", emoji: "📌", title: "Save-worthy Inspo" },
  { id: "outfit-inspo", emoji: "👗", title: "Outfit Inspo" },
  { id: "asoebi-traditional-styles", emoji: "👘", title: "Asoebi & Traditional Styles" }
]
```

**Section 2: "From touch-ups to transformations"**
```javascript
const touchupsTransformations = [
  { id: "skincare-aesthetic", emoji: "💉", title: "Skincare & Aesthetic Treatments" },
  { id: "massage", emoji: "🧘‍♀️", title: "Massage" },
  { id: "haircuts", emoji: "✂️", title: "Haircuts" },
  { id: "makeup", emoji: "💄", title: "Makeup" },
  { id: "kids-hair-grooming", emoji: "👶", title: "Kids' Hair & Grooming" },
  { id: "at-home-services", emoji: "🛋️", title: "At-Home Services" },
  { id: "barbering-services", emoji: "💈", title: "Barbering Services" },
  { id: "in-salon-services", emoji: "🏠", title: "In-Salon Services" },
  { id: "lashes-brows-waxing", emoji: "💄", title: "Lashes, Brows & Waxing" }
]
```

**State to Track:**
```javascript
const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
```

**UI Behavior:**
- Interest items displayed as chips/cards with emoji + title
- Toggle selection on click
- Change background color when selected (e.g., light blue)
- Allow multiple selections
- Display in flex wrap layout

**Validation:**
- "Save" button disabled if `selectedInterests.length === 0`
- At least one interest must be selected

**API Endpoint:**
This screen appears to be for UX/personalization purposes. The mobile app currently doesn't save interests to backend on this screen - it's purely for feed personalization. However, you may want to implement:

```
PATCH /users/profile
```

**Request Body (optional):**
```json
{
  "interests": ["braids-twists", "makeup-looks", "haircuts"]
}
```

**On Save:**
- Navigate to Home Screen
- User is now fully onboarded

---

### 5b. Vendor Onboarding (Vendor Only)
**Route:** `/vendor/onboarding`

This is a complex multi-step process for vendors. Key screens include:

1. **Store Setup** - Business name, type (physical/online/mobile/event-based), description, banner image
2. **Categories Setup** - Select service categories offered
3. **Location Setup** - Business address, map coordinates, service areas
4. **Visibility Setup** - Operating hours, availability settings
5. **Payout Setup** - Bank account details for receiving payments
6. **Subscription Setup** - Choose vendor subscription plan

**API Endpoint for Vendor Onboarding:**
```
POST /users/complete-vendor-onboarding
```

**Request Body:**
```json
{
  "name": "Beauty Studio",
  "type": ["physical", "mobile"],
  "description": "Professional beauty services...",
  "bannerImageUrl": "https://...",
  "categories": ["makeup", "haircuts"],
  "tags": ["bridal", "natural-hair"],
  "location": {
    "address": "123 Main St",
    "city": "Lagos",
    "state": "Lagos",
    "coordinates": {
      "latitude": 6.5244,
      "longitude": 3.3792
    }
  },
  "openingHours": {
    // schedule object
  }
}
```

**Success Response:**
```json
{
  "message": "Vendor onboarding completed successfully"
}
```

After vendor onboarding is marked as "completed", vendors still need to complete:
- Payout Setup (if `hasPayoutInfo` is false)
- Subscription Setup (if `hasSubInfo` is false)

Then they can access the Home Screen.

---

## API Endpoints Reference

### Authentication Endpoints

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/auth/initiate-signup` | Start signup process, send OTP to email | No |
| POST | `/auth/verify-email` | Verify email with OTP | No |
| POST | `/auth/resend-email-verification-token` | Resend OTP to email | No |
| POST | `/auth/complete-profile` | Complete user profile after verification | No |
| POST | `/auth/login` | Login with email and password | No |
| POST | `/auth/google` | Authenticate with Google ID token | No |
| POST | `/auth/apple` | Authenticate with Apple ID token | No |

### User Management Endpoints

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/users/profile` | Get current user profile | Yes |
| PATCH | `/users/profile` | Update user profile | Yes |
| POST | `/users/complete-vendor-onboarding` | Complete vendor onboarding | Yes |
| PATCH | `/users/vendor-info` | Update vendor business info | Yes |

### Request/Response Headers

**All Requests:**
```
Content-Type: application/json
```

**Authenticated Requests:**
```
Authorization: Bearer {accessToken}
```

---

## Step-by-Step Implementation

### Frontend Structure

**Recommended File Structure:**
```
src/
├── pages/
│   └── auth/
│       ├── signup/
│       │   ├── UserTypeSelection.tsx
│       │   ├── EmailInput.tsx
│       │   ├── OTPVerification.tsx
│       │   ├── ProfileSetup.tsx
│       │   └── Interests.tsx
│       └── login/
│           └── Login.tsx
├── components/
│   ├── PasswordRequirements.tsx
│   ├── ProgressBar.tsx
│   ├── SocialAuthButtons.tsx
│   └── CountrySelector.tsx
├── services/
│   └── api/
│       └── authApi.ts
├── store/
│   └── userSlice.ts
└── utils/
    └── validation.ts
```

### Key Utilities to Implement

**validation.ts**
```typescript
export const validateEmail = (email: string): boolean => {
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
};

export const isPasswordValid = (password: string): boolean => {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(password)
  );
};

export const validatePasswordMatch = (
  password: string,
  confirmPassword: string
): boolean => {
  return password === confirmPassword;
};
```

**authApi.ts** (using RTK Query, Axios, or Fetch)
```typescript
// Example with fetch
const API_BASE = 'https://api.glitbase.com/api/v1';

export const initiateSignup = async (email: string, role: string) => {
  const response = await fetch(`${API_BASE}/auth/initiate-signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to initiate signup');
  }

  return response.json();
};

export const verifyEmail = async (email: string, otp: string) => {
  const response = await fetch(`${API_BASE}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Verification failed');
  }

  return response.json();
};

export const completeProfile = async (data: CompleteProfileRequest) => {
  const response = await fetch(`${API_BASE}/auth/complete-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to complete profile');
  }

  return response.json();
};

export const login = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
};
```

---

## Validation Rules

### Email Validation
```javascript
const emailRegex = /\S+@\S+\.\S+/;
const isValid = emailRegex.test(email);
```
- Must not be empty
- Must contain @ and domain
- Convert to lowercase before API submission

### Password Validation
All 5 requirements must be met:

| Requirement | Regex/Check | Error Message |
|-------------|-------------|---------------|
| Min length | `password.length >= 8` | "Password must be at least 8 characters long" |
| Uppercase | `/[A-Z]/.test(password)` | "Password must contain at least one uppercase letter" |
| Lowercase | `/[a-z]/.test(password)` | "Password must contain at least one lowercase letter" |
| Number | `/\d/.test(password)` | "Password must contain at least one number" |
| Special char | `/[!@#$%^&*(),.?":{}|<>]/.test(password)` | "Password must contain at least one special character" |

### Password Match Validation
```javascript
const passwordsMatch = password === confirmPassword;
```
- Only show error if confirmPassword field has been touched/filled
- Error: "Passwords do not match"

### Full Name Validation
```javascript
const nameParts = fullName.trim().split(' ');
const isValid = nameParts.length >= 2 && nameParts[0] && nameParts[1];
```
- Must contain at least first name and last name
- Error: "Please enter both first and last name"

### Phone Number Validation
```javascript
const isValid = /^\d{10,11}$/.test(phoneNumber);
```
- Numeric only
- 10-11 digits for Nigerian numbers
- Combined with country dial code before submission

---

## State Management

### Global User State (Redux/Context)

```typescript
interface UserState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  profileImageUrl?: string;
  activeRole: 'customer' | 'vendor';
  vendorOnboardingStatus?: 'pending' | 'in-progress' | 'completed';
  hasPayoutInfo?: boolean;
  hasSubInfo?: boolean;
  // ... other fields
}
```

### Local Storage/Session Storage

```javascript
// After successful login/signup
localStorage.setItem('isFirstTimeUser', 'true');
localStorage.setItem('accessToken', token);
localStorage.setItem('user', JSON.stringify(user));

// On app load, check:
const isFirstTimeUser = localStorage.getItem('isFirstTimeUser') === 'true';
const token = localStorage.getItem('accessToken');
const user = JSON.parse(localStorage.getItem('user') || 'null');
```

### Signup Flow State (Component or Route State)

```typescript
interface SignupFlowState {
  userType: 'customer' | 'vendor' | null;
  email: string;
  fullName?: string; // For social auth
}
```

Pass this state between screens using:
- React Router state: `navigate('/next', { state: { email, userType } })`
- Query params: `/signup/verify?email=...&type=...`
- Context/Provider
- URL state management library

---

## Conditional Navigation Logic

### After Profile Setup (Auto-Login Success)

```javascript
const navigateAfterProfileSetup = (user) => {
  // Set first-time user flag
  localStorage.setItem('isFirstTimeUser', 'true');

  if (user.activeRole === 'customer') {
    // Customer flow
    navigate('/signup/interests');
  } else {
    // Vendor flow
    if (user.vendorOnboardingStatus !== 'completed') {
      navigate('/vendor/onboarding');
    } else if (!user.hasPayoutInfo) {
      navigate('/vendor/payout-setup');
    } else if (!user.hasSubInfo) {
      navigate('/vendor/subscription-setup');
    } else {
      navigate('/home');
    }
  }
};
```

### After Interests Selection (Customer)
```javascript
navigate('/home');
```

### After Vendor Onboarding Completion
```javascript
const navigateAfterVendorOnboarding = (user) => {
  if (!user.hasPayoutInfo) {
    navigate('/vendor/payout-setup');
  } else if (!user.hasSubInfo) {
    navigate('/vendor/subscription-setup');
  } else {
    navigate('/home');
  }
};
```

---

## Social Authentication

### Google Authentication Flow

**Web Implementation (Google Sign-In):**

1. **Setup Google OAuth 2.0:**
   - Get Google Client ID from Google Cloud Console
   - Configure OAuth consent screen
   - Add authorized domains

2. **Install Google Sign-In Library:**
```bash
npm install @react-oauth/google
```

3. **Wrap App with GoogleOAuthProvider:**
```tsx
import { GoogleOAuthProvider } from '@react-oauth/google';

<GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
  <App />
</GoogleOAuthProvider>
```

4. **Implement Google Sign-In Button:**
```tsx
import { useGoogleLogin } from '@react-oauth/google';

const SocialAuthButtons = ({ userType }) => {
  const googleLogin = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
      try {
        // Get ID token from credential response
        const idToken = credentialResponse.credential;

        // Send to backend
        const response = await fetch(`${API_BASE}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken,
            role: userType // Include role if in signup flow
          })
        });

        const { data } = await response.json();

        // Extract token and user
        const token = data?.tokens?.accessToken || data.token;
        const user = data?.user;

        // Store in state
        dispatch(setUser({ token, user }));

        // Check if profile is complete
        if (!user.firstName || !user.lastName || !user.phoneNumber) {
          // Navigate to profile completion
          navigate('/signup/profile', {
            state: {
              email: user.email,
              fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
              googleAuthData: { token, user }
            }
          });
        } else {
          // Navigate based on role (use same logic as after profile setup)
          navigateAfterLogin(user);
        }
      } catch (error) {
        showToast({ message: error.message, type: 'error' });
      }
    },
    onError: () => {
      showToast({ message: 'Google sign-in failed', type: 'error' });
    }
  });

  return (
    <button onClick={() => googleLogin()}>
      Continue with Google
    </button>
  );
};
```

**API Endpoint:**
```
POST /auth/google
```

**Request Body:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "role": "customer" // Optional, only in signup flow
}
```

**Success Response:**
```json
{
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "user": {
      "id": "user123",
      "email": "user@gmail.com",
      "firstName": "John",
      "lastName": "Doe",
      "activeRole": "customer",
      // ... other fields
    }
  }
}
```

### Apple Authentication Flow

**Web Implementation (Sign in with Apple):**

1. **Setup Apple Sign-In:**
   - Register with Apple Developer Program
   - Configure Sign in with Apple capability
   - Get Service ID and configure domains

2. **Install Apple Auth Library:**
```bash
npm install react-apple-signin-auth
```

3. **Implement Apple Sign-In Button:**
```tsx
import AppleSignin from 'react-apple-signin-auth';

const AppleAuthButton = ({ userType }) => {
  return (
    <AppleSignin
      authOptions={{
        clientId: 'YOUR_APPLE_CLIENT_ID',
        scope: 'email name',
        redirectURI: 'https://yourapp.com/auth/apple/callback',
        usePopup: true
      }}
      onSuccess={async (response) => {
        try {
          const idToken = response.authorization.id_token;

          // Send to backend
          const apiResponse = await fetch(`${API_BASE}/auth/apple`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              idToken,
              role: userType
            })
          });

          const { data } = await apiResponse.json();
          const token = data?.tokens?.accessToken;
          const user = data?.user;

          dispatch(setUser({ token, user }));

          // Apple may not provide name on subsequent logins
          const fullName = response.user?.name
            ? `${response.user.name.firstName} ${response.user.name.lastName}`
            : '';

          if (!user.firstName || !user.phoneNumber) {
            navigate('/signup/profile', {
              state: {
                email: user.email,
                fullName,
                appleAuthData: { token, user }
              }
            });
          } else {
            navigateAfterLogin(user);
          }
        } catch (error) {
          showToast({ message: error.message, type: 'error' });
        }
      }}
      onError={(error) => {
        showToast({ message: 'Apple sign-in failed', type: 'error' });
      }}
    />
  );
};
```

**API Endpoint:**
```
POST /auth/apple
```

**Request Body:**
```json
{
  "idToken": "eyJraWQiOiJlWGF1bm1MIiwiYWxnIjoiUlMyNTYifQ...",
  "role": "vendor" // Optional
}
```

**Response:** Same format as Google auth

### Social Auth Notes

1. **Profile Completion After Social Auth:**
   - If user's profile is incomplete (missing firstName, lastName, phoneNumber), redirect to Profile Setup
   - Pass `fullName` extracted from social provider (if available)
   - Pass `{social}AuthData` object containing token and user to Profile Setup
   - After profile completion, don't auto-login again (user is already authenticated)
   - Use the existing token from social auth response

2. **Role Assignment:**
   - Include `role` in social auth request ONLY during signup flow
   - During login flow (user already exists), omit `role` parameter
   - Backend determines user's role from existing account

3. **Email Verification:**
   - Social auth emails are pre-verified
   - Skip OTP verification step
   - May go directly to Profile Setup or Home based on profile completeness

---

## Progress Bar Values

Display progress indicator at each step:

| Step | Progress % |
|------|------------|
| User Type Selection | 33% |
| Email Input | 66% |
| OTP Verification | 66% |
| Profile Setup | 100% |
| Interests (Customer) | 100% |

---

## Error Handling Best Practices

### Toast Notifications
Use a toast/notification system for:
- Success messages (green/success variant)
- Error messages (red/error variant)
- Info messages (blue/info variant)

### Common Error Messages

| Scenario | Message |
|----------|---------|
| No user type selected | "Please select a role to continue" |
| Empty email | "Please enter your email address" |
| Invalid email | "Please enter a valid email address" |
| Email already exists | "An account with this email already exists" |
| Invalid OTP | "Invalid verification code. Please try again." |
| OTP expired | "Verification code has expired. Please request a new one." |
| Weak password | "Password must meet all requirements" |
| Passwords don't match | "Passwords do not match" |
| Incomplete name | "Please enter both first and last name" |
| Network error | "Network error. Please check your connection and try again." |

### Network Error Handling
```typescript
try {
  const response = await apiCall();
  // Handle success
} catch (error) {
  if (error.message.includes('network') || error.message.includes('fetch')) {
    showToast({
      message: 'Network error. Please check your connection.',
      type: 'error'
    });
  } else {
    showToast({
      message: error?.data?.message || error.message || 'Something went wrong',
      type: 'error'
    });
  }
}
```

---

## Design & UX Considerations

### Colors (from mobile app)
```javascript
const colors = {
  primary: '#primary-color',        // Main brand color
  secondary: '#secondary-color',    // Accent color
  secondaryLight: '#light-secondary', // Selected states
  secondaryAlt: '#alt-secondary',   // Links
  textDark: '#text-dark',           // Primary text
  textGray: '#text-gray',           // Secondary text
  lightGray: '#F0F0F0',             // Input backgrounds
  error: '#error-red',              // Error messages
  mediumGray: '#CECECE',            // Placeholder text
}
```

### Typography
- **Headers:** Bold, 24-26px, tight letter-spacing (-0.5 to -0.8)
- **Subheadings:** Medium weight, 16-18px
- **Body text:** Regular weight, 15-16px
- **Links:** Underline, semibold, secondary color

### Spacing
- Screen padding: 20px
- Top padding: 100px (mobile), adjust for web
- Bottom padding: 50px
- Input margin bottom: 20-40px (varies by screen)
- Section margin bottom: 40px

### Button States
- **Enabled:** Full opacity, primary color
- **Disabled:** Reduced opacity or gray background
- **Loading:** Show spinner, disable interactions

### Input Fields
- **Default:** Light gray background (#FAFAFA or #F0F0F0)
- **Focus:** Border highlight
- **Error:** Red border
- **Valid:** Green checkmark (optional)

### Responsive Design
- Mobile-first approach
- Max width for form containers (e.g., 500px) on desktop
- Center-align content on larger screens
- Adjust padding/margins for tablet/desktop

---

## Testing Checklist

### User Type Selection
- [ ] Can select customer role
- [ ] Can select vendor role
- [ ] Can only select one at a time
- [ ] Error shown if continuing without selection
- [ ] Navigation passes correct role value

### Email Input
- [ ] Email validation works correctly
- [ ] Email converted to lowercase
- [ ] API error displayed properly
- [ ] Success message shown
- [ ] Navigation to OTP with email param
- [ ] Social auth buttons work
- [ ] Login link navigates correctly

### OTP Verification
- [ ] 6 input boxes accept only numbers
- [ ] Auto-focus to next input works
- [ ] Backspace focus to previous works
- [ ] Resend timer counts down from 30s
- [ ] Resend button appears after timer
- [ ] Resend clears OTP inputs
- [ ] Invalid OTP shows error with red borders
- [ ] Valid OTP navigates to profile setup

### Profile Setup
- [ ] Full name split works correctly
- [ ] Phone number accepts only digits
- [ ] Country selector modal works
- [ ] Dial code displays correctly
- [ ] Password requirements update in real-time
- [ ] All 5 password checks work
- [ ] Confirm password match validation works
- [ ] Form disabled until all validations pass
- [ ] Profile completion succeeds
- [ ] Auto-login after profile completion works
- [ ] Navigation logic based on role works

### Interests (Customer)
- [ ] Interest cards toggle on click
- [ ] Multiple selections allowed
- [ ] Save button disabled when none selected
- [ ] Navigation to home works

### Social Auth
- [ ] Google sign-in button works
- [ ] Apple sign-in button works
- [ ] Role passed during signup flow
- [ ] Incomplete profile redirects to profile setup
- [ ] Complete profile navigates to home/onboarding

### Error Handling
- [ ] Network errors handled gracefully
- [ ] API errors displayed in toast
- [ ] Form validation errors clear on correction
- [ ] Loading states prevent duplicate submissions

---

## Security Considerations

1. **Password Handling:**
   - Never log passwords
   - Don't store passwords in plain text (even in state)
   - Clear password fields after successful submission
   - Use proper input type="password"

2. **Token Management:**
   - Store access token securely (HttpOnly cookies ideal, localStorage acceptable for web)
   - Include token in Authorization header for authenticated requests
   - Handle token expiration (401 responses)
   - Clear tokens on logout

3. **API Security:**
   - Use HTTPS only
   - Validate all inputs on frontend and backend
   - Implement rate limiting for OTP requests
   - CSRF protection for state-changing operations

4. **Social Auth:**
   - Verify ID tokens on backend
   - Don't trust client-side data
   - Use official libraries for OAuth flows

---

## Additional Features to Consider

### Optional Enhancements:

1. **Email Availability Check:**
   - Check if email exists before sending OTP
   - API: `GET /auth/check-email?email=user@example.com`

2. **Password Strength Meter:**
   - Visual indicator (weak/medium/strong)
   - Based on password requirements met

3. **Remember Me:**
   - Checkbox on login to persist session longer

4. **Terms & Privacy:**
   - Checkbox: "I agree to Terms of Service and Privacy Policy"
   - Required before signup completion

5. **Analytics:**
   - Track signup funnel drop-off points
   - Monitor conversion rates per step
   - A/B test different flows

6. **Accessibility:**
   - Proper ARIA labels
   - Keyboard navigation support
   - Screen reader compatibility
   - Focus management

---

## Summary

This signup flow provides a smooth onboarding experience for both customers and vendors. Key implementation points:

1. **4-step customer flow:** User Type → Email → OTP → Profile Setup → Interests → Home
2. **Extended vendor flow:** Includes vendor onboarding, payout setup, and subscription setup
3. **Social auth shortcuts:** Google/Apple can bypass email/OTP steps
4. **Robust validation:** Email, password requirements, name splitting, phone formatting
5. **Auto-login:** Seamless transition after profile completion
6. **Conditional navigation:** Different paths based on user role and completion status

Follow this guide to implement a web version that matches the mobile app's functionality and user experience. Adapt the UI components to match your web design system while maintaining the same flow and validation logic.

---

**Questions or Need Clarification?**

This guide covers all the core signup functionality. For vendor-specific screens (store setup, categories, location, etc.), those would require separate detailed documentation. Let me know if you need any section expanded!
