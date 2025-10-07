import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { HiArrowNarrowLeft } from "react-icons/hi";
import { useNavigate } from "react-router";

const goBackVariants = cva("flex items-center cursor-pointer", {
  variants: {
    variant: {
      withBackground: "bg-gray-200 hover:bg-gray-300",
      default: "text-black",
      primary: "text-primary",
      secondary: "text-secondary",
    },
    size: {
      sm: "p-2 text-sm",
      md: "p-3 text-[14px] font-[600]",
      lg: "p-4 text-lg",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

interface GoBackProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof goBackVariants> {
  onBack?: () => void;
  text: string;
}

const GoBack: React.FC<GoBackProps> = ({
  onBack,
  text,
  variant,
  size,
  className,
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
      <HiArrowNarrowLeft className="mr-2" />
      <span>{text}</span>
    </button>
  );
};

export { GoBack, goBackVariants };
