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
            <h3 className="text-[16px] font-semibold text-[#101828] mb-1">
              Change password
            </h3>
            <p className="text-[14px] text-[#6C6C6C]">************</p>
          </div>
          <button
            onClick={() => setShowChangePasswordModal(true)}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiEdit2 size={18} />
          </button>
        </div>
      </div>

      {/* Language (Disabled) */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-[16px] font-semibold text-[#101828] mb-1">
              Language
            </h3>
            <p className="text-[14px] text-[#6C6C6C]">English (UK)</p>
          </div>
          <button disabled className="text-gray-300 cursor-not-allowed">
            <FiEdit2 size={18} />
          </button>
        </div>
      </div>

      {/* Log Out */}
      <div className="mt-8">
        <h3 className="text-[18px] font-semibold text-[#101828] mb-2">
          Log out
        </h3>
        <p className="text-[14px] text-[#6C6C6C] mb-4">
          This will sign you out of your account on this device but your data
          and preferences will remain saved. You can always log back in anytime
        </p>
        <button
          onClick={() => setShowLogoutModal(true)}
          className="px-6 py-2.5 text-[14px] font-medium text-white bg-[#D92D20] rounded-lg hover:bg-[#b91c1c]"
        >
          Log out
        </button>
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
