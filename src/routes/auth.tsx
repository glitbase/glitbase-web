import ForgotPassword from "@/pages/auth/forgotPassword/forgotPasswordEmail";
import ResetPasswordOtp from "@/pages/auth/resetPassword";
import Login from "@/pages/auth/login";
import Otp from "@/pages/auth/onboarding/otp";
import SignUp from "@/pages/auth/onboarding/register";
import Register from "@/pages/auth/onboarding/signUp";
import Splash from "@/pages/auth/splash";
import { Route, Routes } from "react-router-dom";
import ForgotOtp from "@/pages/auth/forgotPassword/otp";
import ResetSuccess from "@/pages/auth/resetPassword/resetSuccess";
import AddRole from "@/pages/auth/addRole";
import AuthLayout from "@/layout/auth";

// New signup flow components
import UserTypeSelection from "@/pages/auth/signup/UserTypeSelection";
import EmailInput from "@/pages/auth/signup/EmailInput";
import OTPVerification from "@/pages/auth/signup/OTPVerification";
import ProfileSetup from "@/pages/auth/signup/ProfileSetup";
import InterestsSelection from "@/pages/auth/signup/InterestsSelection";

const Auth = ({ isLoading }: { isLoading: boolean }) => {
  return (
    <AuthLayout isLoading={isLoading}>
      <Routes>
        <Route path="/" element={<Splash />} />

        {/* New signup flow routes */}
        <Route path="signup" element={<UserTypeSelection />} />
        <Route path="signup/email" element={<EmailInput />} />
        <Route path="signup/verify" element={<OTPVerification />} />
        <Route path="signup/profile" element={<ProfileSetup />} />
        <Route path="signup/interests" element={<InterestsSelection />} />

        {/* Old routes (keeping for backwards compatibility) */}
        <Route path="onboard" element={<SignUp />} />
        <Route path="onboard/signup" element={<Register />} />

        <Route path="login" element={<Login />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path=":email/:role/onboard-otp" element={<Otp />} />
        <Route path="forgot-password/:email/otp" element={<ForgotOtp />} />
        <Route path="add-role" element={<AddRole />} />
        <Route
          path="reset-password"
          element={<ResetPasswordOtp />}
        />
        <Route
          path="reset-success"
          element={<ResetSuccess />}
        />
      </Routes>
    </AuthLayout>
  );
};
export default Auth;
