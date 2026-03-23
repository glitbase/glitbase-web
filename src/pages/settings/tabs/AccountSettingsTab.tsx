/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2 } from 'react-icons/fi';
import { useChangePasswordMutation, useLogoutMutation } from '@/redux/auth';
import { toast } from 'react-toastify';
import ChangePasswordModal from '@/components/Modal/ChangePasswordModal';
import LogoutConfirmModal from '@/components/Modal/LogoutConfirmModal';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { setUnauthenticated } from '@/redux/auth/authSlice';
import { Button } from '@/components/Buttons';
import { SquarePen } from 'lucide-react';

const AccountSettingsTab = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [changePassword, { isLoading: isChangingPassword }] =
    useChangePasswordMutation();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleChangePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    try {
      await changePassword({
        currentPassword,
        newPassword,
      }).unwrap();

      toast.success('Password changed successfully');
      setShowChangePasswordModal(false);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to change password');
    }
  };

  const handleLogout = async () => {
    try {
      // Remove tokens first to prevent any subsequent API calls from using them
      localStorage.removeItem('token');
      localStorage.removeItem('tokens');

      // Update Redux state to mark user as unauthenticated
      dispatch(setUnauthenticated());

      await logout({}).unwrap();
      toast.success('Logged out successfully');
      navigate('/auth/login');
    } catch (error: any) {
      // Even if API fails, ensure local logout happens
      localStorage.removeItem('token');
      localStorage.removeItem('tokens');
      dispatch(setUnauthenticated());
      // Still show success since local logout succeeded
      toast.success('Logged out successfully');
      navigate('/auth/login');
    }
  };

  return (
    <div className="max-w-[600px]">
      {/* Change Password */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-[14px] md:text-[16px] font-semibold text-[#101828] mb-1">
              Change password
            </h3>
            <p className="text-[12px] md:text-[14px] text-[#6C6C6C] font-medium">************</p>
          </div>
          <button
            onClick={() => setShowChangePasswordModal(true)}
            className="text-gray-400 hover:text-gray-600"
          >
            <SquarePen className='mt-3' size={18} color='#6C6C6C' />
          </button>
        </div>
      </div>

      {/* Language (Disabled) */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-[14px] md:text-[16px] font-semibold text-[#101828] mb-1">
              Language
            </h3>
            <p className="text-[12px] md:text-[14px] text-[#6C6C6C] font-medium">English (UK)</p>
          </div>
          <button disabled className="text-gray-300 cursor-not-allowed">
            <SquarePen className='mt-3 opacity-50' size={18} color='#6C6C6C' />
          </button>
        </div>
      </div>

      {/* Log Out */}
      <div className="mt-8">
        <h3 className="text-[14px] md:text-[16px] font-semibold text-[#101828] mb-2">
          Log out
        </h3>
        <p className="text-[13px] md:text-[14px] text-[#3B3B3B] mb-4 font-medium">
          This will sign you out of your account on this device but your data
          and preferences will remain saved. You can always log back in anytime
        </p>
        <Button variant="destructive" className='!px-6 mt-4' onClick={() => setShowLogoutModal(true)} >Log out</Button>
      </div>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSubmit={handleChangePassword}
        isLoading={isChangingPassword}
      />
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        isLoading={isLoggingOut}
      />
    </div>
  );
};

export default AccountSettingsTab;
