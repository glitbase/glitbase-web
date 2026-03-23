import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const inputVariants = cva(
  'flex min-h-[50px] w-full rounded-lg !bg-[#FAFAFA] text-[#3B3B3B] font-medium px-3 py-1 placeholder:text-[14px] text-[14px] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#9D9D9D] placeholder:font-medium focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-background',
        ghost: 'border-none shadow-none',
      },
      state: {
        error: 'border-destructive ',
        default: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      state: 'default',
    },
  }
);

interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, variant, ...props }, ref) => {
    return (
      <div className="relative">
        {label && (
          <label
            className="mb-1 block text-[14px] font-medium text-[#0A0A0A] font-medium"
            htmlFor={props.id}
          >
            {label}
          </label>
        )}
        <input
          type={type}
          className={inputVariants({
            variant,
            state: error ? 'error' : 'default',
            className,
          })}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };
