import { useEffect, useMemo, useState } from 'react';
import { IoClose } from 'react-icons/io5';

interface CancelBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  onReschedule?: () => void;
  isLoading?: boolean;
}

const MAX_REASON = 500;

const CancelBookingModal = ({
  isOpen,
  onClose,
  onConfirm,
  onReschedule,
  isLoading = false,
}: CancelBookingModalProps) => {
  const [reason, setReason] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setStep(1);
    }
  }, [isOpen]);

  const trimmed = reason.trim();
  const isValid = trimmed.length > 0 && trimmed.length <= MAX_REASON;

  const remaining = useMemo(() => MAX_REASON - reason.length, [reason.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-[32px] max-w-[600px] w-full mx-4 p-10 relative">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-8 right-8 w-12 h-12 rounded-full bg-[#F2F4F7] flex items-center justify-center text-gray-600 hover:bg-[#EAECF0]"
          aria-label="Close"
        >
          <IoClose size={24} />
        </button>

        <h2 className="text-[32px] leading-[56px] font-[lora] font-bold text-[#101828] mb-4">
          Cancel booking?
        </h2>

        <p className="text-[20px] leading-[44px] text-[#667085] mb-10 max-w-[820px]">
          This action cannot be undone. Are you sure you want to cancel your
          order?
        </p>

        {step === 2 ? (
          <div className="mb-10">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, MAX_REASON))}
              placeholder="Reason (required)"
              className="w-full min-h-[140px] rounded-[18px] border border-[#EAECF0] p-5 text-[16px] text-[#101828] placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#4C9A2A]/40"
              disabled={isLoading}
            />
            <div className="mt-2 flex items-center justify-between text-[12px] text-[#667085]">
              <span>
                {Math.max(0, remaining)}/{MAX_REASON} characters
              </span>
              {!isValid && reason.length > 0 ? (
                <span className="text-[#D92D20]">Reason is required</span>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex gap-6">
          <button
            type="button"
            onClick={() => {
              onReschedule?.();
              onClose();
            }}
            disabled={isLoading}
            className="flex-1 h-[70px] rounded-full bg-[#EFEFEF] text-[#344054] text-[1rem] font-semibold hover:bg-[#E8E8E8] disabled:opacity-50"
          >
            Reschedule instead
          </button>
          <button
            type="button"
            onClick={() => {
              // MD requires a cancellation reason, so we collect it in step 2
              if (step === 1) {
                setStep(2);
                return;
              }
              onConfirm(trimmed);
            }}
            disabled={(step === 2 && !isValid) || isLoading}
            className="flex-1 h-[70px] rounded-full bg-[#D20000] text-white text-[1rem] font-semibold hover:bg-[#b10000] disabled:opacity-50"
          >
            {isLoading ? 'Cancelling…' : 'Cancel booking'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelBookingModal;
