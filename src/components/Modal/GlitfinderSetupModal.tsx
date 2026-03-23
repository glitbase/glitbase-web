import { useEffect } from 'react';

interface GlitfinderSetupModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}

const GlitfinderSetupModal = ({ isOpen, onClose, children }: GlitfinderSetupModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
      onClick={() => onClose?.()}
    >
      <div
        className="relative bg-white rounded-[20px] max-w-[600px] w-full mx-4 max-h-[600px] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default GlitfinderSetupModal;
