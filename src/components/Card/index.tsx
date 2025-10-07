import React, { useEffect, useRef, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";

const cardVariants = cva(
  "transition-all duration-300 ease-in-out", // Base styles
  {
    variants: {
      variant: {
        default: "bg-white",
        plain: "",
        outlined: "bg-white border border-[#EEE]",
        "outlined-dotted": "bg-white border-[1px] border-dashed border-[#D0D5DD]",
        primary: "bg-primary text-white",
        secondary: "bg-secondary text-white",
      },
      padding: {
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
        none: "p-0",
      },
      borderRadius: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
      },
      hoverEffect: {
        none: "",
        shadow: "hover:shadow-xl",
        scale: "hover:scale-105",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "lg",
      borderRadius: "md",
      hoverEffect: "none",
    },
  }
);

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  isSubscriptionActive?: boolean;
  maxHeight?: string;
  tooltip?: string | null; // Add tooltip prop
  action?: boolean;
}

const Card: React.FC<CardProps> = ({
  variant,
  padding,
  borderRadius,
  hoverEffect,
  className,
  children,
  isSubscriptionActive = true,
  action = true,
  maxHeight = "80%",
  tooltip = null, // Default is null (no tooltip)
  ...props
}) => {
  const maskRef = useRef<HTMLDivElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (!isSubscriptionActive && maskRef.current) {
      // Apply the mask to cover 80% of the card from the bottom
      maskRef.current.style.position = "absolute";
      maskRef.current.style.bottom = "0";
      maskRef.current.style.left = "0";
      maskRef.current.style.width = "100%";
      maskRef.current.style.height = maxHeight;
      maskRef.current.style.backgroundColor = "rgba(255,255,255, 0.5)"; // Semi-transparent
      maskRef.current.style.backdropFilter = "blur(8px)"; // Apply blur
      maskRef.current.style.zIndex = "10";
      maskRef.current.style.pointerEvents = "auto"; // Prevent clicks/interactions on the mask itself
    }
  }, [isSubscriptionActive, maxHeight]);

  return (
    <div
      style={{
        boxShadow: "0px 4px 10px 0px #8A8E940D",
        position: "relative",
        overflow: "hidden",
        // pointerEvents: action ? "auto" : "none",
      }}
      className={cardVariants({
        variant,
        padding,
        borderRadius,
        hoverEffect,
        className,
      })}
      {...props}
      // Show tooltip on mouse enter and hide it on mouse leave
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tooltip */}
      {tooltip && showTooltip && (
        <div className="absolute z-10 w-64 px-4 py-2 mt-12  text-sm text-black bg-white rounded-lg shadow-lg">
          {tooltip}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2">
            <div className="border-8 border-solid border-transparent border-b-white"></div>
          </div>
        </div>
      )}

      {children}

      {!isSubscriptionActive && (
        <div
          ref={maskRef}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: maxHeight,
            backgroundColor: "rgba(128, 128, 128, 0.5)",
            backdropFilter: "blur(8px)",
            zIndex: 10,
            pointerEvents: "auto",
          }}
        ></div>
      )}
    </div>
  );
};

export default Card;
