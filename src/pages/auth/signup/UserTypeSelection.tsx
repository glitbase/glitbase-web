import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Buttons';
import { Typography } from '@/components/Typography';
import Card from '@/components/Card';
import { toast } from 'react-toastify';
import rolefill from '@/assets/images/rolefill.svg';
import roleoutline from '@/assets/images/roleoutline.svg';

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
    <main className="h-screen w-full !bg-[white]">
      <div className="flex justify-end py-8 px-12">
        <div className="flex items-center space-x-2">
          <p className="text-[13px] text-[#344054]">Already have an account?</p>
          <Button onClick={() => navigate('/auth/login')} variant="noBorder">
            Sign in
          </Button>
        </div>
      </div>

      <div className="flex justify-center items-center px-4 md:px-20">
        <Card className="rounded-sm py-5 px-4 md:px-12 w-full max-w-[510px] !shadow-none">
          {/* Progress indicator */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className="bg-[#EE79A9] h-1 rounded-full"
                style={{ width: '33%' }}
              />
            </div>
          </div>

          <div className="space-y-2 flex justify-center flex-col items-start">
            <Typography
              variant="heading"
              className="text-left !text-[2rem] font-medium font-[lora]"
            >
              What's your role?
            </Typography>
            <p className="text-left font-medium text-[1rem] text-[#667185] !mt-3">
              Select your role so we can personalize your experience based on
              your goals
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {userTypes.map((option) => (
              <div
                key={option.value}
                onClick={() => setSelectedUserType(option.value)}
                className={`border rounded-lg p-4 cursor-pointer flex items-center justify-between transition-all
                ${
                  selectedUserType === option.value
                    ? 'border-[#EE79A9] bg-[#FFEFF6]'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                    <img
                      src={
                        selectedUserType === option.value
                          ? rolefill
                          : roleoutline
                      }
                      alt={option.name}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#101928] ">
                      As a {option.name}
                    </h3>
                    <p className="text-[.7rem] text-[#999999] max-w-[220px]">
                      {option.description}
                    </p>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center
                    ${
                      selectedUserType === option.value
                        ? 'border-[#EE79A9] bg-white'
                        : 'border-gray-300'
                    }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      selectedUserType === option.value ? 'bg-[#EE79A9]' : ''
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 mb-12">
            <Button
              onClick={handleContinue}
              disabled={!selectedUserType}
              className={`w-full py-3 rounded-lg
              ${
                selectedUserType
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
