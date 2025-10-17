import { useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

interface VerifyPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (password: string) => void;
  isLoading?: boolean;
}

const VerifyPasswordModal = ({
  isOpen,
  onClose,
  onDelete,
  isLoading = false,
}: VerifyPasswordModalProps) => {
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleDelete = () => {
    if (password) {
      onDelete(password);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-[20px] max-w-[500px] w-full mx-4 p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
          disabled={isLoading}
        >
          <IoClose size={24} />
        </button>

        {/* Title */}
        <h2 className="text-[28px] font-semibold text-[#101828] mb-3">
          Verify your password
        </h2>

        {/* Subtitle */}
        <p className="text-[14px] text-[#6C6C6C] mb-6">
          For your security, please enter your current password to verify that
          you authorized this account deletion
        </p>

        {/* Password input */}
        <div className="mb-6">
          <label className="block text-[14px] font-medium text-[#344054] mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              disabled={isLoading}
              className="w-full px-4 py-3 pr-12 text-[16px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E11D48] focus:border-transparent disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <AiOutlineEyeInvisible size={20} />
              ) : (
                <AiOutlineEye size={20} />
              )}
            </button>
          </div>
        </div>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          disabled={!password || isLoading}
          className="w-full px-4 py-3 text-[16px] font-medium text-white bg-[#D92D20] rounded-lg hover:bg-[#b91c1c] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Deleting account...' : 'Delete account'}
        </button>
      </div>
    </div>
  );
};

export default VerifyPasswordModal;
