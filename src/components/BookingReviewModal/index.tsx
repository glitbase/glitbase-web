import { useEffect, useMemo, useState } from 'react';
import { IoClose } from 'react-icons/io5';

interface BookingReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { rating: number; message: string }) => void;
  isLoading?: boolean;
}

const MAX_MESSAGE = 500;

const Star = ({
  filled,
  onClick,
}: {
  filled: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-1"
      aria-label={filled ? 'Selected star' : 'Unselected star'}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z"
          fill={filled ? '#E0B400' : '#EAECF0'}
        />
      </svg>
    </button>
  );
};

const BookingReviewModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: BookingReviewModalProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [rating, setRating] = useState<number>(0);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setRating(0);
      setMessage('');
    }
  }, [isOpen]);

  const canGoNext = rating >= 1 && rating <= 5;
  const trimmed = message.trim();
  const canSubmit = canGoNext && trimmed.length > 0 && trimmed.length <= MAX_MESSAGE;

  const remaining = useMemo(() => MAX_MESSAGE - message.length, [message.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-[24px] w-full max-w-[720px] mx-4 p-10 relative">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <IoClose size={24} />
        </button>

        {step === 1 ? (
          <div className="text-center">
            <div className="w-[92px] h-[92px] rounded-full bg-[#F2F4F7] mx-auto mb-6" />
            <h2 className="text-[34px] font-[lora] font-bold text-[#101828] mb-3">
              How was your service?
            </h2>
            <p className="text-[14px] text-[#667085] max-w-[420px] mx-auto">
              We’re always working to improve - share your experience with your
              recent order
            </p>

            <div className="flex justify-center gap-2 mt-8">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} filled={rating >= n} onClick={() => setRating(n)} />
              ))}
            </div>

            <button
              type="button"
              disabled={!canGoNext || isLoading}
              onClick={() => setStep(2)}
              className="mt-10 w-full h-[54px] rounded-full bg-[#EAECF0] text-white font-semibold disabled:opacity-60"
              style={{
                backgroundColor: canGoNext ? '#4C9A2A' : '#EAECF0',
              }}
            >
              Next
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-[34px] font-[lora] font-bold text-[#101828] mb-6">
              Tell us about your experience
            </h2>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
              placeholder="Write your review (required)"
              className="w-full min-h-[140px] rounded-[16px] border border-[#EAECF0] p-4 text-[14px] text-[#101828] placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#4C9A2A]/40"
              disabled={isLoading}
            />
            <div className="mt-2 text-[12px] text-[#667085]">
              {Math.max(0, remaining)}/{MAX_MESSAGE} characters max
            </div>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isLoading}
                className="px-6 py-3 rounded-full bg-[#F2F4F7] text-[#344054] text-[14px] font-medium hover:bg-[#EAECF0] disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => onSubmit({ rating, message: trimmed })}
                disabled={!canSubmit || isLoading}
                className="flex-1 h-[54px] rounded-full text-white font-semibold disabled:opacity-60"
                style={{
                  backgroundColor: canSubmit ? '#4C9A2A' : '#EAECF0',
                }}
              >
                {isLoading ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingReviewModal;

