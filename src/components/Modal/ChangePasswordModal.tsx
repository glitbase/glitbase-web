import { useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { PasswordInput } from '../Inputs/PasswordInput';
import { isPasswordValid, PasswordRequirements } from '../auth';
import { Button } from '../Buttons';

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

  const handleSubmit = () => {
    if (!currentPassword || !newPassword) {
      return;
    }
    onSubmit(currentPassword, newPassword);
    setCurrentPassword('');
    setNewPassword('');
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    onClose();
  };

  if (!isOpen) return null;

  const isFormValid = () => {
    return currentPassword.trim() !== '' && newPassword.trim() !== '' && isPasswordValid(newPassword);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-[20px] max-w-[500px] w-full mx-4 p-6 md:p-8 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
        >
          <IoClose size={24} />
        </button>

        {/* Title */}
        <h2 className="text-[18px] md:text-[22px] font-semibold text-[#101828] mb-1 font-[lora] tracking-tight">
          Create new password
        </h2>

        {/* Subtitle */}
        <p className="text-[13px] md:text-[14px] text-[#6C6C6C] mb-6 font-medium">
        Create a strong new password to secure your account
        </p>

        {/* Current Password */}
        <div className="mb-4">
          <PasswordInput
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            label="Current password"
            placeholder="Current password"
            disabled={isLoading}
          />
        </div>
        {/* New Password */}
        <div className="mb-6">
        <PasswordInput
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            label="New password"
            placeholder="New password"
            disabled={isLoading}
          />
          <PasswordRequirements password={newPassword} />
        </div>

        {/* Submit button */}
        <Button variant="default" className='w-full' loading={isLoading} onClick={handleSubmit} disabled={!isFormValid() || isLoading} >Submit</Button>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
