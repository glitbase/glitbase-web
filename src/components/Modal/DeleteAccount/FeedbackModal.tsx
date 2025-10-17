import { useState } from 'react';
import { IoClose } from 'react-icons/io5';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: (reason: string, feedback?: string) => void;
}

const FeedbackModal = ({ isOpen, onClose, onProceed }: FeedbackModalProps) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [otherFeedback, setOtherFeedback] = useState<string>('');

  const reasons = [
    "I'm not using the app enough",
    'Privacy concerns about my data',
    'Difficulty finding the services i want',
    'Issues with booking',
    'Problems with providers',
    'Other',
  ];

  const handleProceed = () => {
    if (selectedReason) {
      const feedback = selectedReason === 'Other' ? otherFeedback : undefined;
      onProceed(selectedReason, feedback);
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
        >
          <IoClose size={24} />
        </button>

        {/* Title */}
        <h2 className="text-[28px] font-semibold text-[#101828] mb-3">
          Tell us what went wrong
        </h2>

        {/* Subtitle */}
        <p className="text-[14px] text-[#6C6C6C] mb-6">
          Let us know why you're leaving - your feedback helps us do better
        </p>

        {/* Radio options */}
        <div className="space-y-3 mb-6">
          {reasons.map((reason) => (
            <label
              key={reason}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="relative flex items-center justify-center">
                <input
                  type="radio"
                  name="reason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="appearance-none w-5 h-5 border-2 border-gray-300 rounded-full checked:border-[#E11D48] checked:border-[6px] focus:outline-none cursor-pointer"
                />
              </div>
              <span className="text-[16px] text-[#344054]">{reason}</span>
            </label>
          ))}
        </div>

        {/* Other textarea */}
        {selectedReason === 'Other' && (
          <div className="mb-6">
            <textarea
              value={otherFeedback}
              onChange={(e) => setOtherFeedback(e.target.value)}
              placeholder="Tell us about your experience (optional)"
              className="w-full h-24 px-4 py-3 text-[14px] border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#E11D48] focus:border-transparent"
            />
          </div>
        )}

        {/* Proceed button */}
        <button
          onClick={handleProceed}
          disabled={!selectedReason}
          className="w-full px-4 py-3 text-[16px] font-medium text-white bg-[#D92D20] rounded-lg hover:bg-[#b91c1c] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Proceed to deletion
        </button>
      </div>
    </div>
  );
};

export default FeedbackModal;
