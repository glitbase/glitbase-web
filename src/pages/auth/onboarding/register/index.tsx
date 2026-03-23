import { useState, useEffect } from 'react';
import { Button } from '@/components/Buttons';
import { Typography } from '@/components/Typography';
import rolefill from '@/assets/images/rolefill.svg';
import roleoutline from '@/assets/images/roleoutline.svg';
import { useNavigate } from 'react-router-dom';
import { isFirstVisit } from '@/utils/helpers';
import { AUTH } from '@/pages/auth/authPageStyles';

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

  // Redirect first-time visitors to splash screen
  useEffect(() => {
    if (isFirstVisit()) {
      navigate('/auth/');
    }
  }, [navigate]);

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
    <main className={AUTH.main}>
      <p
        onClick={() => navigate('/auth/login')}
        className={AUTH.topLink}
      >
        Already have an account?{' '}
        <span className={AUTH.topLinkAccent}>Sign In</span>
      </p>

      <div className={AUTH.center}>
        <div className={AUTH.column}>
          {screen === 1 ? (
            <>
              <div className="space-y-2 flex justify-center flex-col items-start">
                <Typography variant="heading" className={AUTH.title}>
                  What's your role?
                </Typography>
                <p className={AUTH.subtitle}>
                  Select your role so we can personalize your experience based
                  on your goals
                </p>
              </div>

              <div className="mt-8 space-y-3">
                {accountOptions.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => handleOptionSelect(option.id)}
                    className={`bg-[#FAFAFA] rounded-lg p-4 cursor-pointer flex items-center justify-between
                ${selectedOption === option.id
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
                        <p className="font-medium text-[#0A0A0A] font-semibold">
                          {option.title}
                        </p>
                        <p className="text-[0.8rem] sm:text-[0.85rem] font-medium text-[#6C6C6C] max-w-[min(220px,100%)]">
                          {option.description}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center
                    ${selectedOption === option.id
                          ? 'border-[#CC5A88] bg-white'
                          : 'border-gray-300'
                        }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${selectedOption === option.id ? 'bg-[#CC5A88]' : ''
                          }`}
                      />
                    </div>
                  </div>
                ))}
              </div>



              <div className="mt-10 mb-12">
                <Button onClick={handleContinue} disabled={!selectedOption} variant='default' size='full'>Continue</Button>

              </div>
            </>
          ) : (
            <></>
          )}
        </div>
      </div>
    </main>
  );
};

export default SignUp;
