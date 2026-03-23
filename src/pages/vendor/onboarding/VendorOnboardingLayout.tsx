import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogoutMutation } from '@/redux/auth';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { logout as logoutAction } from '@/redux/auth/authSlice';
import { toast } from 'react-toastify';
import ProgressBar from '@/components/ProgressBar';

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
  const dispatch = useAppDispatch();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout({}).unwrap();
      dispatch(logoutAction());
      console.log('📋 VendorOnboardingLayout: Logout complete, navigating to /');
      navigate('/');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Logout failed');
    }
  };

  return (
    <main className="flex-1 w-full !bg-[white] overflow-hidden h-screen">
      <div className="flex justify-end px-8 py-4">
        {showLogout && (
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="text-[#CC5A88] text-sm font-medium hover:underline transition-colors"
          >
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </button>
        )}
      </div>
      <div className="w-full flex flex-col h-full max-w-[500px] mx-auto">
        <div className="w-full bg-white  sticky top-0 left-0 z-50">
          {/* Progress indicator */}
          <div className="w-full mb-6">
            <p className="text-[#CC5A88] text-[14px] font-semibold mb-3">
              Step {currentStep} of 8
            </p>
            <ProgressBar value={progress} />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </main>
  );
};

export default VendorOnboardingLayout;
