import { IoClose } from 'react-icons/io5';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
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
        <h2 className="text-[28px] font-semibold text-[#101828] mb-3">
          Log out?
        </h2>

        {/* Message */}
        <p className="text-[14px] text-[#6C6C6C] mb-6">
          Are you sure you want to log out ? This will log you out of the app.
          You can sign back in anytime
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 text-[16px] font-medium text-[#344054] bg-[#F0F0F0] rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-3 text-[16px] font-medium text-white bg-[#D92D20] rounded-lg hover:bg-[#b91c1c] disabled:opacity-50"
          >
            {isLoading ? 'Logging out...' : 'Log out'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmModal;
