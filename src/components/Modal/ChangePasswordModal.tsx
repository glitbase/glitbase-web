import { useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (currentPassword: string, newPassword: string) => void;
  isLoading?: boolean;
}

const ChangePasswordModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: ChangePasswordModalProps) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleSubmit = () => {
    if (!currentPassword || !newPassword) {
      return;
    }
    onSubmit(currentPassword, newPassword);
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-[20px] max-w-[500px] w-full mx-4 p-8 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
        >
          <IoClose size={24} />
        </button>

        {/* Title */}
        <h2 className="text-[28px] font-semibold text-[#101828] mb-3">
          Create new password
        </h2>

        {/* Subtitle */}
        <p className="text-[14px] text-[#6C6C6C] mb-6">
          Enter your current password and create a strong new password
        </p>

        {/* Current Password */}
        <div className="mb-4">
          <label className="block text-[14px] font-medium text-[#344054] mb-2">
            Current password
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              disabled={isLoading}
              className="w-full px-4 py-3 pr-12 text-[16px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D7B22] focus:border-transparent disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              disabled={isLoading}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showCurrentPassword ? (
                <AiOutlineEyeInvisible size={20} />
              ) : (
                <AiOutlineEye size={20} />
              )}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="mb-6">
          <label className="block text-[14px] font-medium text-[#344054] mb-2">
            New password
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              disabled={isLoading}
              className="w-full px-4 py-3 pr-12 text-[16px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D7B22] focus:border-transparent disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              disabled={isLoading}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showNewPassword ? (
                <AiOutlineEyeInvisible size={20} />
              ) : (
                <AiOutlineEye size={20} />
              )}
            </button>
          </div>
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!currentPassword || !newPassword || isLoading}
          className="w-full px-4 py-3 text-[16px] font-medium text-white bg-[#3D7B22] rounded-lg hover:bg-[#2d5c19] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
