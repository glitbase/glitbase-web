import { useState, useEffect } from 'react';
import { Button } from '@/components/Buttons';
import { Typography } from '@/components/Typography';
import rolefill from '@/assets/images/rolefill.svg';
import roleoutline from '@/assets/images/roleoutline.svg';
import Card from '@/components/Card';
import { useNavigate } from 'react-router-dom';

interface AccountOption {
  id: string;
  title: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  role: string;
}

const SignUp = () => {
  const navigate = useNavigate();
  const [screen] = useState(1);
  const [selectedOption, setSelectedOption] = useState<string>('');

  useEffect(() => {
    // Reset selected option when the component mounts
    setSelectedOption('');
  }, []);

  const accountOptions: AccountOption[] = [
    {
      id: 'user',
      title: 'As a user',
      description:
        'I want to get inspired and find providers I can book or buy from',
      icon: selectedOption === 'user' ? rolefill : roleoutline,
      role: 'customer',
    },
    {
      id: 'vendor',
      title: 'As a pro',
      description: 'I want to inspire, showcase my work & grow my business',
      icon: selectedOption === 'vendor' ? rolefill : roleoutline,
      role: 'vendor',
    },
  ];

  const handleOptionSelect = (id: string) => {
    setSelectedOption(id);
  };

  const handleContinue = () => {
    const selectedAccount = accountOptions.find(
      (option) => option.id === selectedOption
    );
    if (selectedAccount) {
      navigate('/auth/signup/email', {
        state: { userType: selectedAccount.role },
      });
    }
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
        <Card className=" rounded-sm py-5 px-4 md:px-12 w-full max-w-[510px] !shadow-none">
          {screen === 1 ? (
            <>
              <div className="space-y-2 flex justify-center flex-col items-start">
                <Typography
                  variant="heading"
                  className="text-left !text-[2rem] font-medium font-[lora]"
                >
                  What's your role?
                </Typography>
                <p className="text-left font-medium text-[1rem] text-[#667185] !mt-3">
                  Select your role so we can personalize your experience based
                  on your goals
                </p>
              </div>

              <div className="mt-12 space-y-4">
                {accountOptions.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => handleOptionSelect(option.id)}
                    className={`border rounded-lg p-4 cursor-pointer flex items-center justify-between
                ${
                  selectedOption === option.id
                    ? 'border-[#CC5A88] bg-[#FFEFF6]'
                    : 'border-gray-200'
                }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center`}
                      >
                        <img src={option.icon} alt={option.title} />
                      </div>
                      <div>
                        <h3 className="font-medium text-[#101928] ">
                          {option.title}
                        </h3>
                        <p className="text-[.7rem] text-[#999999]  max-w-[220px]">
                          {option.description}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center
                    ${
                      selectedOption === option.id
                        ? 'border-[#CC5A88] bg-white'
                        : 'border-gray-300'
                    }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          selectedOption === option.id ? 'bg-[#CC5A88]' : ''
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-16 mb-12">
                <Button
                  onClick={handleContinue}
                  disabled={!selectedOption}
                  className={`w-full py-3 rounded-lg
              ${
                selectedOption
                  ? 'bg-[#60983C] text-white hover:bg-[#4d7a30]'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
                >
                  Continue
                </Button>
              </div>
            </>
          ) : (
            <></>
          )}
        </Card>
      </div>
    </main>
  );
};

export default SignUp;
