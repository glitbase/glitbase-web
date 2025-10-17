import { IoClose } from 'react-icons/io5';
import { AiOutlineWarning } from 'react-icons/ai';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

const DeleteAccountModal = ({
  isOpen,
  onClose,
  onContinue,
}: DeleteAccountModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-[20px] max-w-[500px] w-full mx-4 p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
        >
          <IoClose size={24} />
        </button>

        {/* Title */}
        <h2 className="text-[28px] font-semibold text-[#101828] mb-6">
          Deleting your account?
        </h2>

        {/* Warning message */}
        <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-lg p-4 mb-6 flex items-start gap-3">
          <AiOutlineWarning className="text-[#F59E0B] flex-shrink-0 mt-0.5" size={20} />
          <p className="text-[14px] text-[#92400E]">
            This action cannot be undone and will permanently delete your entire
            Glitbase account
          </p>
        </div>

        {/* Description */}
        <div className="mb-6 space-y-4">
          <p className="text-[14px] text-[#475467]">
            You'll lose access to all providers you've connected with and won't
            be able to recover any of this information once deleted.
          </p>
          <p className="text-[14px] text-[#475467]">
            If you have upcoming bookings, you'll need to contact your providers
            directly as you won't have access to in-app messaging.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-[16px] font-medium text-[#344054] bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onContinue}
            className="flex-1 px-4 py-3 text-[16px] font-medium text-white bg-[#D92D20] rounded-lg hover:bg-[#b91c1c]"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
