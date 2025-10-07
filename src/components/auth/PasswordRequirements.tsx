import React from 'react';

interface PasswordRequirementsProps {
  password: string;
}

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({ password }) => {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
    <div className="flex items-center gap-2">
      <div
        className={`w-4 h-4 rounded-full flex items-center justify-center ${
          met ? 'bg-green-500' : 'bg-gray-300'
        }`}
      >
        {met && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M5 13l4 4L19 7"></path>
          </svg>
        )}
      </div>
      <span className={`text-xs ${met ? 'text-green-700' : 'text-gray-600'}`}>{text}</span>
    </div>
  );

  // Only show if password field has content
  if (!password) return null;

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
      <p className="text-xs font-medium text-gray-700 mb-2">Password must contain:</p>
      <RequirementItem met={requirements.minLength} text="At least 8 characters" />
      <RequirementItem met={requirements.hasUppercase} text="One uppercase letter" />
      <RequirementItem met={requirements.hasLowercase} text="One lowercase letter" />
      <RequirementItem met={requirements.hasNumber} text="One number" />
      <RequirementItem met={requirements.hasSpecialChar} text="One special character" />
    </div>
  );
};

export const isPasswordValid = (password: string): boolean => {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(password)
  );
};
