import React, { useEffect, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import Card from "../Card";
import { useSearchParams } from "react-router-dom";

// Define tabVariants using class-variance-authority with Tailwind classes
const tabVariants = cva(
  "transition-all duration-300 ease-in-out cursor-pointer flex items-center justify-center", // Base styles
  {
    variants: {
      variant: {
        default: "bg-white",
        primary: "bg-primary text-white",
        outlined: "border border-gray-200",
      },
      padding: {
        sm: "p-2",
        md: "p-4",
        lg: "p-6",
      },
      borderRadius: {
        none: "rounded-none",
      },
      active: {
        true: "!bg-[#F4BD3D] text-white font-medium border-b-[2.5px] border-b-[#2652E7]",
        false: "text-[#667085] font-medium border-b-[0.5px] border-b-[#BEBDBD]",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
      active: false,
    },
  }
);

// Define TabProps interface
interface TabProps extends VariantProps<typeof tabVariants> {
  label: string;
  index: number;
  activeTab: number;
  onTabClick: (index: number) => void; // Custom handler
  className: string;
}

// Individual Tab component
const Tab: React.FC<TabProps> = ({
  label,
  index,
  activeTab,
  onTabClick,
  variant,
  padding,
  borderRadius,
  className,
  ...props
}) => {
  const isActive = activeTab === index;

  const handleClick = () => {
    onTabClick(index); // Pass the index when clicked
  };

  return (
    <div
      onClick={handleClick}
      className={`${tabVariants({
        variant,
        padding,
        borderRadius,
        active: isActive,
        className,
      })} px-[2.2rem] h-[64px] text-[16px]`}
      {...props}
    >
      {label}
    </div>
  );
};

// Define TabsProps interface
interface TabsProps {
  tabs: string[]; // Array of tab labels
  content: React.ReactNode[]; // Array of content corresponding to each tab
  variant?: VariantProps<typeof tabVariants>["variant"];
  padding?: VariantProps<typeof tabVariants>["padding"];
  borderRadius?: VariantProps<typeof tabVariants>["borderRadius"];
}

// Tabs Component
const Tabs: React.FC<TabsProps> = ({
  tabs,
  content,
  variant,
  padding,
  borderRadius,
}) => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(0);
  useEffect(() => {
    if (tab) {
      setActiveTab(parseInt(tab));
    }
  }, [tab]);
  return (
    <div>
      {/* Tab Headers */}
      <div className="flex border-b-[0.5px] bg-[#FFF] border-b-[#BEBDBD] overflow-scroll">
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            label={tab}
            index={index}
            activeTab={activeTab}
            onTabClick={setActiveTab}
            variant={variant}
            padding={padding}
            borderRadius={borderRadius}
            className="whitespace-nowrap no-scrollbar"
          />
        ))}
      </div>

      {/* Tab Content */}
      <Card className="mt-4">{content[activeTab]}</Card>
    </div>
  );
};

export default Tabs;
