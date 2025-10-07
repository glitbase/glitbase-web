import React, { useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";

const inputVariants = cva(
  "flex h-[56px] w-full rounded-[10px] border bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input",
        focused: "border-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface CouponInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">,
    VariantProps<typeof inputVariants> {
  label?: string;
  note?: string;
  onApply: () => void;
}

const CouponInput = React.forwardRef<HTMLInputElement, CouponInputProps>(
  ({ className, label, note, onApply, ...props }, ref) => {
    const [focus, setFocus] = useState(false);

    return (
      <div className="space-y-2">
        {label && (
          <label
            className="text-sm font-normal text-foreground"
            htmlFor={props.id}
          >
            {label}
          </label>
        )}
        <div
          className={inputVariants({
            variant: focus ? "focused" : "default",
            className,
          })}
        >
          <svg
            width="25"
            height="24"
            viewBox="0 0 25 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2 flex-shrink-0"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M6.2125 2.39062C4.88702 2.39062 3.8125 3.46514 3.8125 4.79062V21.5906L8.0125 19.1906L12.2125 21.5906L16.4125 19.1906L20.6125 21.5906V4.79062C20.6125 3.46514 19.538 2.39062 18.2125 2.39062H6.2125ZM9.2125 5.99062C8.21839 5.99062 7.4125 6.79651 7.4125 7.79062C7.4125 8.78474 8.21839 9.59062 9.2125 9.59062C10.2066 9.59062 11.0125 8.78474 11.0125 7.79062C11.0125 6.79651 10.2066 5.99062 9.2125 5.99062ZM16.661 6.3421C16.1924 5.87347 15.4326 5.87347 14.964 6.3421L7.76397 13.5421C7.29534 14.0107 7.29534 14.7705 7.76397 15.2392C8.2326 15.7078 8.9924 15.7078 9.46103 15.2392L16.661 8.03915C17.1297 7.57052 17.1297 6.81073 16.661 6.3421ZM15.2125 11.9906C14.2184 11.9906 13.4125 12.7965 13.4125 13.7906C13.4125 14.7847 14.2184 15.5906 15.2125 15.5906C16.2066 15.5906 17.0125 14.7847 17.0125 13.7906C17.0125 12.7965 16.2066 11.9906 15.2125 11.9906Z"
              fill="currentColor"
              className="text-primary"
            />
          </svg>
          <input
            {...props}
            type="text"
            className="bg-transparent h-full outline-none flex-grow"
            ref={ref}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
          />
          <button
            type="button"
            className="min-w-fit text-primary font-medium text-sm leading-[21px] bg-transparent rounded-[10px] border-none"
            onClick={onApply}
          >
            Apply Code
          </button>
        </div>
        {note && (
          <p className="text-xs font-light text-muted-foreground">{note}</p>
        )}
      </div>
    );
  }
);

CouponInput.displayName = "CouponInput";

export { CouponInput, inputVariants };
