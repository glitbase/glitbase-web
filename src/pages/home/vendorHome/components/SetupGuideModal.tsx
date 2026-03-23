import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import ProgressBar from '@/components/ProgressBar';
import { Button } from '@/components/Buttons';
import { useAppSelector } from '@/hooks/redux-hooks';
import { useGetServicesQuery } from '@/redux/vendor';

type SetupStep = {
  id: string;
  title: string;
  description?: string;
  buttonText?: string;
  path: string;
};

const SETUP_STEPS: SetupStep[] = [
  {
    id: 'business_rules',
    title: 'Set your business rules',
    description: 'Define how customers book and interact with your business.',
    buttonText: 'Configure rules',
    path: '/settings/operations/booking-policies',
  },
  {
    id: 'time_management',
    title: 'Manage your time',
    description: 'Control your schedule, availability, and walk-in queue to optimize your workflow.',
    buttonText: 'Set schedule',
    path: '/settings/operations/store-availability',
  },
  {
    id: 'add_service',
    title: 'Add service',
    description: 'Add your service so customers know exactly what you offer.',
    buttonText: 'Add service',
    path: '/vendor/store/add-service',
  },
  {
    id: 'payment_policy',
    title: 'Set payment policy',
    description: 'Set deposit requirements for customer transactions.',
    buttonText: 'Setup policy',
    path: '/settings/payment-billings/payment-policy',
  },
  {
    id: 'payout_details',
    title: 'Add payout details',
    description: 'Set up your bank account to receive payments.',
    buttonText: 'Add payout',
    path: '/settings/payment-billings/payout-details',
  },
];

type SetupGuideModalProps = {
  isOpen: boolean;
  onClose: () => void;
  storeId?: string;
};

const SetupGuideModal = ({ isOpen, onClose, storeId }: SetupGuideModalProps) => {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const store = useAppSelector((s) => s.vendorStore.store);

  const { data: servicesData } = useGetServicesQuery(
    { storeId: storeId || '', page: 1, limit: 1 },
    { skip: !storeId }
  );

  const hasServices = (servicesData as { services?: unknown[] })?.services?.length > 0;

  const progress = useMemo(() => {
    const stepIds = ['business_rules', 'time_management', 'add_service', 'payment_policy', 'payout_details'];
    const completedSteps: string[] = [];
    const pendingSteps: string[] = [];

    if (store?.policies?.booking?.cancellation && store?.policies?.booking?.rescheduling) {
      completedSteps.push('business_rules');
    } else {
      pendingSteps.push('business_rules');
    }

    const hasOpeningHours =
      Array.isArray(store?.openingHours) &&
      store.openingHours.length > 0 &&
      store.openingHours.some((h: { isOpen?: boolean }) => h?.isOpen);
    if (hasOpeningHours) {
      completedSteps.push('time_management');
    } else {
      pendingSteps.push('time_management');
    }

    if (hasServices) {
      completedSteps.push('add_service');
    } else {
      pendingSteps.push('add_service');
    }

    if (store?.policies?.payment?.depositType != null && store?.policies?.payment?.amount != null) {
      completedSteps.push('payment_policy');
    } else {
      pendingSteps.push('payment_policy');
    }

    if (user?.hasPayoutInfo) {
      completedSteps.push('payout_details');
    } else {
      pendingSteps.push('payout_details');
    }

    const overallPercentage = Math.round((completedSteps.length / stepIds.length) * 100);

    return {
      completedSteps,
      pendingSteps,
      overallPercentage,
    };
  }, [user?.hasPayoutInfo, store?.policies, store?.openingHours, hasServices]);

  const isStepCompleted = (stepId: string) => progress.completedSteps.includes(stepId);
  const isStepExpanded = (stepId: string) => progress.pendingSteps[0] === stepId;

  const handleStepClick = (step: SetupStep) => {
    onClose();
    navigate(step.path);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Setup guide"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel - right side, rounded top-left */}
      <div className="relative w-full max-w-[420px] bg-white overflow-hidden shadow-xl flex flex-col max-h-[100vh]">
        {/* Header */}
        <div className="flex items-center gap-4 p-5">
          <button
            type="button"
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-[#101828]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0 mx-auto max-w-[180px]">
            <p className="text-[14px] text-center font-semibold text-[#CC5A88]">
              {progress.overallPercentage}% complete
            </p>
            <div className="mt-2">
              <ProgressBar value={progress.overallPercentage} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <h2 className="text-[18px] font-semibold text-[#101828] font-[lora] mb-8 tracking-tight">
            Setup guide
          </h2>

          <ul className="space-y-6">
            {SETUP_STEPS.map((step) => (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => !isStepCompleted(step.id) && handleStepClick(step)}
                  className={`w-full flex items-start gap-4 text-left ${
                    !isStepCompleted(step.id) ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                  }`}
                >
                  <div
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isStepCompleted(step.id)
                        ? 'bg-[#AE3670] border-[#AE3670]'
                        : 'border-[#F0F0F0] bg-white'
                    }`}
                  >
                    {isStepCompleted(step.id) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-[#101828]">{step.title}</p>
                    {isStepExpanded(step.id) && step.description && (
                      <div className="mt-1 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <p className="text-[13px] text-[#3B3B3B] font-medium leading-snug max-w-[90%]">
                          {step.description}
                        </p>
                        {step.buttonText && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStepClick(step);
                            }}
                            className="!h-[44px] !px-6 !text-[13px] !font-semibold"
                          >
                            {step.buttonText}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SetupGuideModal;
