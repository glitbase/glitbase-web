import React, { useState } from 'react';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { cva, type VariantProps } from 'class-variance-authority';

const inputVariants = cva(
  'flex min-h-[50px] w-full rounded-lg !bg-[#FAFAFA] text-[#3B3B3B] font-medium px-3 py-1 placeholder:text-[14px] text-[14px] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#9D9D9D] placeholder:font-medium focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-input',
        focused: 'border-input',
        error: 'border-destructive focus-visible:ring-border-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);
interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  note?: string;
  error?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [focus, setFocus] = useState(false);

    const handleTogglePassword = (e: React.MouseEvent) => {
      e.preventDefault();
      setShowPassword((prev) => !prev);
    };

    return (
      <div className="">
        {label && (
          <label
            className="mb-1 block text-[14px] font-medium text-[#0A0A0A] font-medium"
            htmlFor={props.id}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            {...props}
            type={showPassword ? 'text' : 'password'}
            className={inputVariants({
              variant: error ? 'error' : focus ? 'focused' : 'default',
              className,
            })}
            ref={ref}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground flex items-center justify-center bg-transparent rounded-[10px] border-none"
            onClick={handleTogglePassword}
          >
            {showPassword ? (
              <AiOutlineEyeInvisible color="#9D9D9D" />
            ) : (
              <AiOutlineEye color="#9D9D9D" />
            )}
          </button>
        </div>

        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput, inputVariants };
