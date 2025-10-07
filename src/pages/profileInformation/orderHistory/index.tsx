import { useAppSelector } from "@/hooks/redux-hooks";
import { useState } from "react";
import OngoingOrders from "./ongoingOrders";
import CompletedOrders from "./completedOrders";
import RejectedOrders from "./rejectedOrders";

const OrderTab = () => {
  const user = useAppSelector((state) => state.auth.user);
  const [activeTab, setActiveTab] = useState<number>(1);

  const tabs = [
    { id: 1, label: "Ongoing", content: <OngoingOrders /> },
    { id: 2, label: "Completed", content: <CompletedOrders /> },
    { id: 3, label: "Rejected", content: <RejectedOrders /> },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="flex flex-wrap inline-flex border-b gap-2 mb-9">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`cursor-pointer px-4 py-2 font-[raleway] font-semibold text-[14px] text-[#344054] ${
              activeTab === tab.id ? "text-[#60983C] border-b border-[#60983C]" : "bg-transparent"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      <div>{tabs.find((tab) => tab.id === activeTab)?.content}</div>
    </div>
  );
};

export default OrderTab;