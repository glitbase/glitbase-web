import React, { useState, useRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { FiEye, FiEyeOff } from "react-icons/fi";

const inputVariants = cva(
  "flex h-14 rounded-md border border-input bg-white px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 text-center",
  {
    variants: {
      variant: {
        default: "bg-background",
        ghost: "border-none shadow-none",
      },
      state: {
        error: "border-destructive",
        default: "",
      },
    },
    defaultVariants: {
      variant: "default",
      state: "default",
    },
  }
);

interface SSNInputProps
  extends Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      "type" | "value" | "onChange"
    >,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
}

const SSNInput = React.forwardRef<HTMLInputElement, SSNInputProps>(
  ({ className, label, error, variant, value, onChange, ...props }) => {
    const [showSSN, setShowSSN] = useState(false);
    const firstRef = useRef<HTMLInputElement>(null);
    const secondRef = useRef<HTMLInputElement>(null);
    const lastRef = useRef<HTMLInputElement>(null);

    const firstPart = value.slice(0, 3);
    const secondPart = value.slice(3, 5);
    const lastPart = value.slice(5, 9);

    const handleChange = (
      part: "first" | "second" | "last",
      inputValue: string
    ) => {
      const cleaned = inputValue.replace(/\D/g, "");
      let maxLength: number;
      let nextRef: React.RefObject<HTMLInputElement> | null = null;

      switch (part) {
        case "first":
          maxLength = 3;
          nextRef = secondRef;
          break;
        case "second":
          maxLength = 2;
          nextRef = lastRef;
          break;
        case "last":
          maxLength = 4;
          nextRef = null;
          break;
      }

      if (cleaned.length > maxLength) return;

      let newValue = "";
      if (part === "first") {
        newValue = cleaned + value.slice(3);
      } else if (part === "second") {
        newValue = value.slice(0, 3) + cleaned + value.slice(5);
      } else {
        newValue = value.slice(0, 5) + cleaned;
      }

      onChange(newValue);

      if (cleaned.length === maxLength && nextRef?.current) {
        nextRef.current.focus();
      }
    };

    return (
      <div className="relative">
        {label && (
          <label
            className="mb-2 block text-sm font-medium text-gray-900"
            htmlFor={props.id}
          >
            {label}
          </label>
        )}
        <div className="flex items-center w-full">
          {/* First 50% container */}
          <div className="flex items-center w-1/2">
            <input
              ref={firstRef}
              className={inputVariants({
                variant,
                state: error ? "error" : "default",
                className: "flex-1 " + (className || ""),
              })}
              value={firstPart}
              onChange={(e) => handleChange("first", e.target.value)}
              maxLength={3}
              inputMode="numeric"
              type={showSSN ? "text" : "password"}
              placeholder="***"
              autoComplete="off"
            />
            <span className="text-gray-500 px-2">-</span>
            <input
              ref={secondRef}
              className={inputVariants({
                variant,
                state: error ? "error" : "default",
                className: "flex-1 " + (className || ""),
              })}
              value={secondPart}
              onChange={(e) => handleChange("second", e.target.value)}
              maxLength={2}
              inputMode="numeric"
              type={showSSN ? "text" : "password"}
              placeholder="**"
              autoComplete="off"
            />
          </div>

          {/* Separator */}
          <span className="text-gray-500 px-2">-</span>

          {/* Second 50% container */}
          <div className="flex items-center w-1/2">
            <div className="relative w-full">
              <input
                ref={lastRef}
                className={inputVariants({
                  variant,
                  state: error ? "error" : "default",
                  className: "w-full pr-10 " + (className || ""),
                })}
                value={lastPart}
                onChange={(e) => handleChange("last", e.target.value)}
                maxLength={4}
                inputMode="numeric"
                type={"text"}
                placeholder="****"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowSSN(!showSSN)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={showSSN ? "Hide SSN" : "Show SSN"}
              >
                {showSSN ? (
                  <FiEyeOff className="h-5 w-5" />
                ) : (
                  <FiEye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </div>
    );
  }
);

SSNInput.displayName = "SSNInput";

export { SSNInput, inputVariants };
