import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Buttons';
import { Typography } from '@/components/Typography';
import Card from '@/components/Card';
import { toast } from 'react-toastify';
import rolefill from '@/assets/images/rolefill.svg';
import roleoutline from '@/assets/images/roleoutline.svg';
import { isFirstVisit } from '@/utils/helpers';
import { AUTH } from '@/pages/auth/authPageStyles';

interface UserType {
  name: string;
  value: 'customer' | 'vendor';
  description: string;
  icon: string;
}

const UserTypeSelection = () => {
  const navigate = useNavigate();
  const [selectedUserType, setSelectedUserType] = useState<
    'customer' | 'vendor' | ''
  >('');

  // Redirect first-time visitors to splash screen
  useEffect(() => {
    if (isFirstVisit()) {
      navigate('/auth/');
    }
  }, [navigate]);

  const userTypes: UserType[] = [
    {
      name: 'user',
      value: 'customer',
      description:
        'I want to get inspired and find providers I can book or buy from',
      icon: 'person-outline',
    },
    {
      name: 'pro',
      value: 'vendor',
      description: 'I want to inspire, showcase my work & grow my business',
      icon: 'person-outline',
    },
  ];

  const handleContinue = () => {
    if (!selectedUserType) {
      toast.error('Please select a role to continue');
      return;
    }
    navigate('/auth/signup/email', { state: { userType: selectedUserType } });
  };

  return (
    <main className={`${AUTH.main} relative`}>
      <div
        className={`${AUTH.topLink} flex flex-wrap items-center justify-end gap-x-1 gap-y-0 max-w-[calc(100%-1rem)] ml-auto`}
      >
        <span className="text-[#6C6C6C]">Already have an account?</span>
        <Button
          onClick={() => {
            if (isFirstVisit()) {
              navigate('/auth/');
            } else {
              navigate('/auth/login');
            }
          }}
          variant="noBorder"
          className="!p-0 !h-auto min-h-0 text-[14px] md:text-base font-semibold text-[#CC5A88]"
        >
          Sign in
        </Button>
      </div>

      <div className={AUTH.center}>
        <Card className={`${AUTH.cardShell} !shadow-none`}>
          {/* Progress indicator */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className="bg-[#CC5A88] h-1 rounded-full"
                style={{ width: '33%' }}
              />
            </div>
          </div>

          <div className="space-y-2 flex justify-center flex-col items-start w-full">
            <Typography variant="heading" className={AUTH.title}>
              What's your role?
            </Typography>
            <p className={`${AUTH.subtitle} !mt-2 md:!mt-3 leading-[1.35]`}>
              Select your role so we can personalize your experience based on
              your goals
            </p>
          </div>

          <div className="mt-8 md:mt-12 space-y-3 md:space-y-4 w-full">
            {userTypes.map((option) => (
              <div
                key={option.value}
                onClick={() => setSelectedUserType(option.value)}
                className={`border rounded-lg p-3 sm:p-4 cursor-pointer flex items-center justify-between gap-3 min-w-0 transition-all
                ${selectedUserType === option.value
                    ? 'border-[#CC5A88] bg-[#FFEFF6]'
                    : 'border-gray-200'
                  }`}
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-lg flex items-center justify-center">
                    <img
                      src={
                        selectedUserType === option.value
                          ? rolefill
                          : roleoutline
                      }
                      alt={option.name}
                      className="max-w-full max-h-full"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-[#101928] text-[0.95rem] md:text-base">
                      As a {option.name}
                    </h3>
                    <p className="text-[0.7rem] sm:text-[0.75rem] text-[#999999] max-w-none sm:max-w-[280px]">
                      {option.description}
                    </p>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center
                    ${selectedUserType === option.value
                      ? 'border-[#CC5A88] bg-white'
                      : 'border-gray-300'
                    }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${selectedUserType === option.value ? 'bg-[#CC5A88]' : ''
                      }`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 md:mt-16 mb-8 md:mb-12">
            <Button
              onClick={handleContinue}
              disabled={!selectedUserType}
              className={`w-full py-3 rounded-lg min-w-0
              ${selectedUserType
                  ? 'bg-[#60983C] text-white hover:bg-[#4d7a30]'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
            >
              Continue
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
};

export default UserTypeSelection;
