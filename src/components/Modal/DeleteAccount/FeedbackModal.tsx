import { Button } from '@/components/Buttons';
import { Textarea } from '@/components/Inputs/TextAreaInput';
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
      <div className="bg-white rounded-[20px] max-w-[500px] w-full mx-4 p-6 md:p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
        >
          <IoClose size={24} />
        </button>

        {/* Title */}
        <h2 className="text-[18px] md:text-[24px] font-semibold text-[#101828] mb-1 font-[lora] tracking-tight">
          Tell us what went wrong
        </h2>

        {/* Subtitle */}
        <p className="text-[13px] md:text-[15px] text-[#6C6C6C] font-medium mb-6">
          Let us know why you're leaving - your feedback helps us do better
        </p>

        {/* Radio options */}
        <div className="space-y-5 mb-6">
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
                  className="appearance-none w-5 h-5 border border-gray-300 rounded-full checked:border-[#E11D48] checked:border-[6px] focus:outline-none cursor-pointer"
                />
              </div>
              <span className="text-[13px] md:text-[15px] text-[#0A0A0A] font-medium">{reason}</span>
            </label>
          ))}
        </div>

        {/* Other textarea */}
        {selectedReason === 'Other' && (
          <div className="mb-6">
            <Textarea 
              value={otherFeedback}
              onChange={(e) => setOtherFeedback(e.target.value)}
              placeholder="Tell us about your experience (optional)"
              className=""
            />
          </div>
        )}

        {/* Proceed button */}
        <Button variant="destructive" className='w-full' onClick={handleProceed} disabled={!selectedReason}>
          Proceed to deletion
        </Button>
      </div>
    </div>
  );
};

export default FeedbackModal;
