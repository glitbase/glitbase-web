import React, { useState, useRef, useEffect } from 'react';

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
}

interface MultiSelectProps {
  options: SelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  (
    {
      options,
      value,
      onChange,
      label,
      placeholder = 'Select options',
      error,
      required = false,
      className = '',
      disabled = false,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    const handleToggle = (optionValue: string) => {
      if (disabled) return;
      
      const newValue = value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue];
      onChange(newValue);
    };

    const handleRemove = (optionValue: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled) return;
      onChange(value.filter((v) => v !== optionValue));
    };

    const selectedOptions = options.filter((opt) => value.includes(opt.value));

    return (
      <div ref={ref} className={`relative ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-[#0A0A0A] mb-2">
            {label}
            {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={`w-full px-4 py-2.5 rounded-md bg-[#FAFAFA] text-[14px] text-[#9D9D9D] font-medium text-left flex justify-between items-center transition-colors ${
              error ? 'border border-red-500' : 'border border-transparent'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={
                value.length === 0
                  ? 'text-gray-400'
                  : 'text-gray-900'
              }
            >
              {value.length === 0 ? placeholder : placeholder}
            </span>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Selected Options as Chips */}
          {selectedOptions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedOptions.map((option) => (
                <div
                  key={option.value}
                  className="px-4 py-2 rounded-full bg-[#FAFAFA] text-sm text-[#0A0A0A] font-medium flex items-center gap-3"
                >
                  <span className="text-sm text-gray-900">{option.label}</span>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => handleRemove(option.value, e)}
                      className="text-[#3B3B3B] hover:text-gray-700 text-lg leading-none"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Dropdown */}
          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-sm max-h-60 overflow-y-auto">
                {options.map((option) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        handleToggle(option.value);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex justify-between items-center transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm text-[#0A0A0A] font-medium">
                          {option.label}
                        </span>
                      </div>
                      {isSelected && (
                        <svg
                          className="w-5 h-5 text-green-500 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

MultiSelect.displayName = 'MultiSelect';

export { MultiSelect };
export type { SelectOption };

