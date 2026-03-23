import { IoClose } from 'react-icons/io5';
import { AiOutlineWarning } from 'react-icons/ai';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/Buttons';

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
      <div className="bg-white rounded-[20px] max-w-[600px] w-full mx-4 p-6 md:p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
        >
          <IoClose size={24} />
        </button>

        {/* Title */}
        <h2 className="text-[18px] md:text-[24px] font-semibold text-[#101828] mb-6 font-[lora] tracking-tight">
          Deleting your account?
        </h2>

        {/* Warning message */}
        <div className="bg-[#FFF8E6] rounded-xl p-4 mb-6 flex items-start gap-3">
          <TriangleAlert color='#E4AA05' size={18} />
          <p className="text-[13px] md:text-[14px] text-[#3B3B3B] font-medium">
            This action cannot be undone and will permanently delete your entire
            Glitbase account
          </p>
        </div>

        {/* Description */}
        <div className="mb-6 space-y-4">
          <p className="text-[13px] md:text-[15px] text-[#0A0A0A] font-medium">
            You'll lose access to all providers you've connected with and won't
            be able to recover any of this information once deleted.
          </p>
          <p className="text-[13px] md:text-[15px] text-[#0A0A0A] font-medium">
            If you have upcoming bookings, you'll need to contact your providers
            directly as you won't have access to in-app messaging.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className='!border-none flex-1 bg-[#F0F0F0] !text-[#3B3B3B] font-semibold !hover:bg-[#e0e0e0]'>
          Cancel
          </Button>
          <Button variant="destructive" className='flex-1' onClick={onContinue} >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
