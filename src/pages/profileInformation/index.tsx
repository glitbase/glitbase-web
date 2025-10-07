import { useAppSelector } from "@/hooks/redux-hooks";
import { useState, useEffect } from "react";
import HomeLayout from "@/layout/home/HomeLayout";
import { useNavigate, useLocation } from "react-router-dom";
import { Typography } from "@/components/Typography";
import ProfileIcon from "@/assets/images/profile.svg";
import HistoryIcon from "@/assets/images/history.svg";
import ProfileTab from "./profile";
import OrderTab from "./orderHistory";

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading] = useState<boolean>(false);
  // const user = useAppSelector((state) => state.auth.user);

  const tabs = [
    {
      id: 1,
      label: "Profile information",
      icon: ProfileIcon,
      content: <ProfileTab />,
    },
    {
      id: 2,
      label: "Order history",
      icon: HistoryIcon,
      content: <OrderTab />,
    },
    {
      id: 3,
      label: "Booking history",
      icon: HistoryIcon,
      content: "This is the booking history.",
    },
    {
      id: 4,
      label: "Notifications",
      icon: HistoryIcon,
      content: "This is the notifications content.",
    },
    {
      id: 5,
      label: "Wallet",
      icon: HistoryIcon,
      content: "This is the wallet content.",
    },
  ];

  const [activeTab, setActiveTab] = useState<number>(1);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const activeTabParam = params.get("activeTab");
    if (activeTabParam) {
      setActiveTab(Number(activeTabParam));
    }
  }, [location.search]);

  return (
    <HomeLayout isLoading={isLoading}>
      <div className="mt-8 md:px-12 px-4 flex justify-center">
        <div className="max-w-[750px] w-full">
          <div className="flex text-[14px] mb-3 font-[inter] flex-row">
            <p
              className="text-[#B73F79] cursor-pointer"
              onClick={() => {
                navigate("/");
              }}
            >
              Home
            </p>
            <span className="mx-2 text-[#1D2739]">/</span>
            <p className="text-[#98A2B3]">
              {tabs.find((tab) => tab.id === activeTab)?.label}
            </p>
          </div>

          <Typography className="font-[lora] text-[20px] mb-5">
            User management
          </Typography>

          <div className="flex flex-wrap md:whitespace-nowrap bg-[#F7F9FC] py-3 rounded-[20px] px-2 my-1 md:my-9 gap-1.5 sm:gap-2 md:gap-1 justify-center sm:justify-start">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`cursor-pointer px-2 py-1.5 sm:px-3 md:px-4 sm:py-2 font-[lora] text-[13px] sm:text-[13px] md:text-[14px] text-[#475367] rounded-[20px] flex items-center gap-1 whitespace-nowrap ${
                  activeTab === tab.id ? "bg-white shadow-md" : "bg-transparent"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon && (
                  <img
                    src={tab.icon}
                    alt={tab.label}
                    className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4"
                  />
                )}
                {tab.label}
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="mt-5">
            {tabs.find((tab) => tab.id === activeTab)?.content}
          </div>
        </div>
      </div>
    </HomeLayout>
  );
};

export default Profile;