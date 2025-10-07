interface ValidationResult {
  isValid: boolean;
  errors: { [key: string]: string };
}

interface Values {
  [key: string]: string | number;
}

const restrictedEmailDomains = [
  'outlook.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
  'yahoo.com',
  'protonmail.com',
  'zoho.com',
  'aol.com',
  'yandex.com'
  // Add more domains as needed
];

const getEmailDomain = (email: string): string => {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : '';
};


const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return false;
  }

  const domain = getEmailDomain(email);
  return !restrictedEmailDomains.includes(domain);
};

const getEmailErrorMessage = (email: string): string => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return "Invalid email format.";
  }
  
  const domain = getEmailDomain(email);
  if (restrictedEmailDomains.includes(domain)) {
    return `We've experienced OTP delivery issues with ${domain} email addresses. Please use a Gmail account for better reliability.`;
  }
  
  return "";
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-]{10,}$/; // Example: US phone number format
  return phoneRegex.test(phone);
};

const validateName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z]{2,}$/;
  return nameRegex.test(name);
};

const validatePassword = (password: string): string[] => {
  const errors: string[] = [];
  if (password.length < 8) {
    errors.push(" be at least 8 characters long.");
  }
  if (!/[a-z]/.test(password)) {
    errors.push(" contain at least one lowercase letter.");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push(" contain at least one uppercase letter.");
  }
  if (!/\d/.test(password)) {
    errors.push(" contain at least one number.");
  }
  if (!/[@$!%*?&]/.test(password)) {
    errors.push(" contain at least one special character.");
  }
  return errors;
};

export const validateFields = (
  requiredFields: string | string[],
  values: Values
): ValidationResult => {
  let isValid = true;
  const errors: { [key: string]: string } = {};

  (Array.isArray(requiredFields) ? requiredFields : [requiredFields]).forEach((field: string) => {
    const value = values[field]?.toString(); 

    if (!value) {
      isValid = false;
      errors[field] = `${field} is required.`;
    } else {
      switch (field) {
        case "email":
          if (!validateEmail(value)) {
            isValid = false;
            errors[field] = getEmailErrorMessage(value);
          }
          break;
        case "phoneNumber":
          if (!validatePhone(value)) {
            isValid = false;
            errors[field] = "Invalid phone number format.";
          }
          break;
        case "firstName":
        case "lastName":
          if (!validateName(value)) {
            isValid = false;
            errors[
              field
            ] = `${field} must contain only alphabets and be at least 2 characters long.`;
          }
          break;
        case "password":
          const passwordErrors = validatePassword(value);
          if (passwordErrors.length > 0) {
            isValid = false;
            errors[field] = "Password must".concat(passwordErrors.join(","));
          }
          break;
        case "confirmPassword":
          if (value !== values["password"].toString()) {
            isValid = false;
            errors[field] = "Passwords do not match.";
          }
          break;
        default:
          break;
      }
    }
  });

  return { isValid, errors };
};