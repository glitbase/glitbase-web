import React, { useState, useRef, useEffect } from "react";
import { cva, type VariantProps } from "class-variance-authority";

const timePickerVariants = cva(
  "flex h-[40px] w-full rounded-lg border shadow-sm border-input bg-white px-3 py-1 placeholder:text-[12px] text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-background",
        ghost: "border-none shadow-none",
      },
      state: {
        error: "border-destructive ",
        default: "",
      },
    },
    defaultVariants: {
      variant: "default",
      state: "default",
    },
  }
);

interface CustomTimePickerProps
  extends VariantProps<typeof timePickerVariants> {
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  id?: string;
  index?: number;
  variant?: "default" | "ghost";
  className?: string;
}

const CustomTimePicker = React.forwardRef<
  HTMLDivElement,
  CustomTimePickerProps
>(
  (
    {
      value,
      onChange,
      label,
      placeholder,
      required,
      error,
      disabled,
      id,
      variant,
      className,
      // ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hours, setHours] = useState("12");
    const [minutes, setMinutes] = useState("00");
    const [period, setPeriod] = useState("AM");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isPeriodOpen, setIsPeriodOpen] = useState(false);

    useEffect(() => {
      if (value) {
        const [hourVal, minuteVal] = value.split(":");
        let hourNum = parseInt(hourVal, 10);
        let periodVal = "AM";

        if (hourNum >= 12) {
          periodVal = "PM";
          if (hourNum > 12) hourNum -= 12;
        }
        if (hourNum === 0) hourNum = 12;

        const hourStr = hourNum.toString();
        if (hours !== hourStr) setHours(hourStr);
        if (minutes !== minuteVal) setMinutes(minuteVal);
        if (period !== periodVal) setPeriod(periodVal);
      }
    }, [value]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setIsPeriodOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const preventPropagation = (e: React.UIEvent<HTMLDivElement>) => {
      e.stopPropagation();
    };

    const handleTimeChange = (
      newHours: string,
      newMinutes: string,
      newPeriod: string
    ) => {
      let hourValue = parseInt(newHours, 10);

      if (newPeriod === "PM" && hourValue < 12) hourValue += 12;
      if (newPeriod === "AM" && hourValue === 12) hourValue = 0;

      const formattedTime = `${hourValue
        .toString()
        .padStart(2, "0")}:${newMinutes}`;

      onChange({
        target: {
          value: formattedTime,
        },
      });
    };

    //  useEffect(() => {
    //   const isInitialRender = useRef(true);

    //   if (isInitialRender.current) {
    //     isInitialRender.current = false;
    //     return;
    //   }

    //   if (hours && minutes && period) {
    //     handleTimeChange(hours, minutes, period);
    //   }
    // }, [hours, minutes, period]);

    const hourOptions = Array.from({ length: 12 }, (_, i) =>
      (i + 1).toString().padStart(1, "0")
    );
    const minuteOptions = ["00", "15", "30", "45"];

    const displayTime =
      hours && minutes ? `${hours}:${minutes}` : placeholder || "Select time";

    const togglePeriodDropdown = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!disabled) {
        setIsPeriodOpen(!isPeriodOpen);
        setIsOpen(false);
      }
    };

    const toggleTimeDropdown = () => {
      if (!disabled) {
        setIsOpen(!isOpen);
        setIsPeriodOpen(false);
      }
    };

    return (
      <div className="relative" ref={dropdownRef}>
        {label && (
          <label
            className="mb-1 block text-[12px] font-medium text-[#1f1f1f]"
            htmlFor={id}
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        <div
          className={timePickerVariants({
            variant,
            state: error ? "error" : "default",
            className,
          })}
          ref={ref}
        >
          <div className="flex w-full items-center justify-between">
            <div
              className="cursor-pointer flex-grow"
              onClick={toggleTimeDropdown}
            >
              <span className={`${!value ? "text-muted-foreground" : ""}`}>
                {displayTime}
              </span>
            </div>

            {/* AM/PM selector - clicking this opens the AM/PM dropdown */}
            <div
              className="flex items-center cursor-pointer relative"
              onClick={togglePeriodDropdown}
            >
              <span className="mr-1 text-sm">{period}</span>
              {/* <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg> */}

              {/* AM/PM dropdown */}
              {isPeriodOpen && !disabled && (
                <div
                  className="absolute right-0 top-8 z-10 w-16 bg-white shadow-lg rounded-md border border-input"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className={`w-full text-center py-2 ${
                      period === "AM"
                        ? "bg-blue-100 text-blue-700"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPeriod("AM");
                      handleTimeChange(hours, minutes, "AM");
                      setIsPeriodOpen(false);
                    }}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    className={`w-full text-center py-2 ${
                      period === "PM"
                        ? "bg-blue-100 text-blue-700"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPeriod("PM");
                      handleTimeChange(hours, minutes, "PM");
                      setIsPeriodOpen(false);
                    }}
                  >
                    PM
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

        {/* Hour and Minute dropdown */}
        {isOpen && !disabled && (
          <div
            className="absolute z-10 mt-1 overflow-y-auto overflow-hidden max-h-[200px] w-full bg-white shadow-lg rounded-md border border-input p-3"
            onClick={(e) => e.stopPropagation()}
            onWheel={preventPropagation}
            onTouchMove={preventPropagation}
          >
            <div className="flex flex-col">
              {/* Hours selection */}
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-2">Hours</p>
                <div className="grid grid-cols-4 gap-2">
                  {hourOptions.map((hour) => (
                    <button
                      key={hour}
                      type="button"
                      className={`text-center py-2 rounded-md ${
                        hours === hour
                          ? "bg-blue-100 text-blue-700"
                          : "hover:bg-gray-100 bg-gray-50"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setHours(hour);
                        handleTimeChange(hour, minutes, period);
                        setIsOpen(false);
                      }}
                    >
                      {hour}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minutes selection */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Minutes</p>
                <div className="grid grid-cols-4 gap-2">
                  {minuteOptions.map((minute) => (
                    <button
                      key={minute}
                      type="button"
                      className={`text-center py-2 rounded-md ${
                        minutes === minute
                          ? "bg-blue-100 text-blue-700"
                          : "hover:bg-gray-100 bg-gray-50"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMinutes(minute);
                        handleTimeChange(hours, minute, period);
                        setIsOpen(false);
                      }}
                    >
                      {minute}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

CustomTimePicker.displayName = "CustomTimePicker";

export { CustomTimePicker, timePickerVariants };
