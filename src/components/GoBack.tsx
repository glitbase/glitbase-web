import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { HiArrowNarrowLeft } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

const goBackVariants = cva('flex items-center cursor-pointer', {
  variants: {
    variant: {
      withBackground: 'bg-gray-200 hover:bg-gray-300',
      default: 'text-black',
      primary: 'text-primary',
      secondary: 'text-secondary',
    },
    size: {
      sm: 'text-sm',
      md: 'text-[14px] font-[600]',
      lg: 'py-4 text-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

interface GoBackProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof goBackVariants> {
  onBack?: () => void;
  text?: string;
  color?: string;
}

const GoBack: React.FC<GoBackProps> = ({
  onBack,
  text,
  variant,
  size,
  className,
  color,
  ...props
}) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={onBack ? onBack : () => navigate(-1)}
      className={goBackVariants({
        variant,
        size,
        className,
      })}
      {...props}
    >
      <HiArrowNarrowLeft className="mr-2" color={color} />
      <span>{text}</span>
    </button>
  );
};

export { GoBack, goBackVariants };
