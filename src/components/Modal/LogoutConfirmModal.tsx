import { IoClose } from 'react-icons/io5';
import { Button } from '../Buttons';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

const LogoutConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: LogoutConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-[20px] max-w-[450px] w-full mx-4 p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
        >
          <IoClose size={24} />
        </button>

        {/* Title */}
        <h2 className="text-[22px] font-semibold text-[#101828] mb-3">
          Log out?
        </h2>

        {/* Message */}
        <p className="text-[14px] text-[#3B3B3B] mb-6 font-medium">
          Are you sure you want to log out ? This will log you out of the app.
          You can sign back in anytime
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button variant="cancel" className='flex-1' onClick={onClose} disabled={isLoading} >Cancel</Button>
          <Button variant="destructive" className='flex-1' onClick={onConfirm} disabled={isLoading} >Log out</Button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmModal;
