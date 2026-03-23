import { useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { PasswordInput } from '@/components/Inputs/PasswordInput';
import { Button } from '@/components/Buttons';

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

  const handleDelete = () => {
    if (password) {
      onDelete(password);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-[20px] max-w-[500px] w-full mx-4 p-6 md:p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
          disabled={isLoading}
        >
          <IoClose size={24} />
        </button>

        {/* Title */}
        <h2 className="text-[18px] md:text-[24px] font-semibold text-[#101828] mb-2 font-[lora] tracking-tight">
          Verify your password
        </h2>

        {/* Subtitle */}
        <p className="text-[13px] md:text-[15px] text-[#6C6C6C] font-medium mb-6">
          For your security, please enter your current password to verify that
          you authorized this account deletion
        </p>

        {/* Password input */}
        <div className="mb-6">
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            label='Password'
            disabled={isLoading}
          />
        </div>

        {/* Delete button */}
        <Button variant="destructive" className='w-full' onClick={handleDelete} disabled={!password || isLoading} >
          {isLoading ? 'Deleting account...' : 'Delete account'}
        </Button>
      </div>
    </div>
  );
};

export default VerifyPasswordModal;
