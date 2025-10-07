import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

const checkboxVariants = cva();

interface CustomCheckboxProps extends VariantProps<typeof checkboxVariants> {
  onChange: (option: any) => void;
  value: string | number | readonly string[] | undefined;
  label: string;
  isChecked?: boolean;
  className?: string;
}

const CustomCheckbox = React.forwardRef<HTMLSelectElement, CustomCheckboxProps>(
  ({ onChange, value, label, isChecked, className, ...props }) => {
    return (
      <div className={checkboxVariants({ className })}>
        <input
          type="checkbox"
          onChange={onChange}
          value={value}
          checked={isChecked}
          className="cursor-pointer"
          {...props}
        />
        {label && <p className="text-[1.1rem] font-medium">{label}</p>}
      </div>
    );
  }
);

CustomCheckbox.displayName = "CustomCheckbox";

export { CustomCheckbox, checkboxVariants };
