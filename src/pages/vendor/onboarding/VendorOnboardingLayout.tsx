import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogoutMutation } from '@/redux/auth';
import { useAuth } from '@/AuthContext';
import { toast } from 'react-toastify';
import { Typography } from '@/components/Typography';

interface VendorOnboardingLayoutProps {
  children: ReactNode;
  progress: number;
  showLogout?: boolean;
  currentStep: number;
}

const VendorOnboardingLayout = ({
  children,
  progress,
  currentStep,
  showLogout = true,
}: VendorOnboardingLayoutProps) => {
  const navigate = useNavigate();
  const { setTokens } = useAuth();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout({}).unwrap();
      setTokens({
        accessToken: '',
        refreshToken: '',
        expiresIn: 0,
        expirationTime: 0,
      });
      localStorage.clear();
      navigate('/auth/login');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Logout failed');
    }
  };

  return (
    <main className="flex-1 w-full !bg-[white] overflow-auto h-screen">
      <div className="w-full flex flex-col h-full">
        {/* Top Bar with Logout and Progress - Sticky at top */}
        <div className="w-full bg-white  sticky top-0 left-0 z-50">
          {/* Logout Button Row */}
          <div className="flex justify-end px-8 py-4">
            {showLogout && (
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-[#98A2B3] text-sm font-medium hover:text-[#667185] transition-colors"
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            )}
          </div>

          {/* Progress Bar Section */}
          <div className="px-8 pb-6 max-w-2xl mx-auto w-full">
            <Typography
              variant="body"
              className="mb-3 text-[#CC5A88] font-semibold text-sm"
            >
              Step {currentStep} of 8
            </Typography>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#CC5A88] h-2 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </main>
  );
};

export default VendorOnboardingLayout;
