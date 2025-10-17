import React from 'react';
import Select, { MultiValue, SingleValue, ActionMeta } from 'react-select';
import { cva, type VariantProps } from 'class-variance-authority';

const selectVariants = cva(
  'flex min-h-[40px] items-center w-full rounded-lg border bg-white px-1 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-input',
        focused: 'border-primary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface CustomSelectProps extends VariantProps<typeof selectVariants> {
  options: { value: string; label: string }[];
  onChange: (
    newValue:
      | MultiValue<{ value: string; label: string }>
      | SingleValue<{ value: string; label: string }>,
    actionMeta: ActionMeta<{ value: string; label: string }>
  ) => void;
  value:
    | MultiValue<{ value: string; label: string }>
    | SingleValue<{ value: string; label: string }>
    | null;
  placeholder: string;
  Icon?: React.ElementType;
  className?: string;
  label?: string;
  required?: boolean;
  styles?: any;
  isMulti?: boolean;
}

const CustomSelect = React.forwardRef<HTMLSelectElement, CustomSelectProps>(
  ({
    options,
    onChange,
    value,
    placeholder,
    // Icon,
    className,
    label,
    required,
    isMulti,
    ...props
  }) => {
    const customStyles = {
      control: (provided: any) => ({
        ...provided,
        borderRadius: '0.375rem',
        border: 'none',
        boxShadow: 'none',
        fontSize: '12px',
        minHeight: '26px',
        '&:hover': {
          border: 'none',
        },
      }),
      placeholder: (provided: any) => ({
        ...provided,
        fontSize: '12px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }),
      multiValue: (provided: any) => ({
        ...provided,
        fontSize: '12px',
        borderRadius: '0.375rem',
      }),
      option: (provided: any, state: any) => ({
        ...provided,
        backgroundColor: state.isSelected ? '#F2FFEC' : 'white',
        color: state.isSelected ? '#101828' : '#141414',
        fontSize: '12px',
        '&:active': {
          backgroundColor: '#F2FFEC',
          color: 'white',
        },
      }),
    };

    return (
      <div>
        {label && (
          <label className="mb-1 block text-[12px] font-medium text-[#1f1f1f]">
            {label}
            {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div
          className={`${selectVariants({ className })} ${
            isMulti ? 'min-h-0' : 'h-10'
          }`}
        >
          <Select
            options={options}
            styles={customStyles}
            onChange={onChange}
            menuPlacement="bottom"
            value={value}
            placeholder={placeholder}
            components={{ IndicatorSeparator: null }}
            isMulti={isMulti}
            className="w-full"
            {...props}
          />
        </div>
      </div>
    );
  }
);

CustomSelect.displayName = 'CustomSelect';

export { CustomSelect, selectVariants };
