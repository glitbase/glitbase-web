import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { ColorRing } from 'react-loader-spinner';

const buttonVariants = cva(
  'inline-flex h-[44px] items-center px-[14px] justify-center rounded-full text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:bg-[#E7E7E7] disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-[#4C9A2A] text-white hover:bg-[#3d7b22]',
        destructive:
          'bg-[#D10606] text-white hover:bg-[#b91c1c]',
        outline:
          'border border-primary text-primary hover:bg-primary/90 hover:text-primary/80',
        secondary:
          'bg-[transparent] font-[600] text-[#CC5A88] h-[36px] hover:bg-secondary/80 border border-[#FF59A2]',
        ghost: 'hover:bg-slate-50 hover:text-slate-800',
        link: 'underline-offset-4 hover:underline text-primary',
        black: 'bg-black text-white rounded-[14px] hover:bg-black/80',
        // no border variant
        noBorder: 'border-none bg-transparent text-[#CC5A88]',
        cancel: 'bg-[#F0F0F0] text-[#3B3B3B3] hover:bg-gray-50 disabled:opacity-50',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        full: 'w-full ',
        auto: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? React.Fragment : 'button';
    return (
      <Comp
        className={buttonVariants({ variant, size, className })}
        ref={asChild ? undefined : ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <ColorRing
            visible={true}
            height="30"
            width="30"
            ariaLabel="color-ring-loading"
            wrapperStyle={{}}
            wrapperClass="color-ring-wrapper"
            colors={['#60983C', '#60983C', '#60983C', '#60983C', '#60983C']}
          />
        ) : (
          children
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
