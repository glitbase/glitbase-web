import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const textareaVariants = cva(
  'flex min-h-[80px] w-full rounded-md bg-[#FAFAFA] text-[#3B3B3B] font-medium px-4 py-2.5 placeholder:text-[14px] text-[14px] placeholder:text-[#9D9D9D] placeholder:font-medium focus-visible:outline-none disabled:cursor-not-allowed resize-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[#FAFAFA]',
        ghost: 'border-none shadow-none',
      },
      state: {
        error: 'border-red-500',
        default: 'border-gray-200',
      },
    },
    defaultVariants: {
      variant: 'default',
      state: 'default',
    },
  }
);

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  label?: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, variant, ...props }, ref) => {
    return (
      <div className="relative">
        {label && (
          <label
            className="mb-2 block text-[14px] font-medium text-[#0A0A0A]"
            htmlFor={props.id}
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          className={textareaVariants({
            variant,
            state: error ? 'error' : 'default',
            className,
          })}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea, textareaVariants };
