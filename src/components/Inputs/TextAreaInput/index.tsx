import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

const textareaVariants = cva(
  "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-[12px] ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed resize-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-background",
        ghost: "border-none shadow-none",
      },
      state: {
        error: "border-destructive focus-visible:ring-destructive",
        default: "",
      },
    },
    defaultVariants: {
      variant: "default",
      state: "default",
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
            className="mb-2 block text-[12px] font-medium text-foreground"
            htmlFor={props.id}
          >
            {label}
          </label>
        )}
        <textarea
          className={textareaVariants({
            variant,
            state: error ? "error" : "default",
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

Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
