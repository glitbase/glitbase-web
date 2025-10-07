import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Typography } from "@/components/Typography";
import TrackIcon from "@/assets/images/track.svg";

const OngoingOrders = () => {
  const [currentStep] = useState(1);
  const navigate = useNavigate();

  const handleTrackOrder = (orderId: string) => {
    navigate(`/order-details/${orderId}`);
  };

  return (
    <div>
      <div className="flex flex-col gap-4">
        <div className="flex justify-between">
          <Typography className="font-[lora] font-semibold text-[20px]">
            Store name-location
          </Typography>
          <Typography className="font-[raleway] font-semibold text-[18px]">
            ₦20,000
          </Typography>
        </div>
        <div className="flex justify-between">
          <Typography className="font-[raleway] text-[#667185] text-[14px]">
            27th Mar, 2025, 3:35 pm{" "}
          </Typography>
          <Typography className="font-[raleway] text-[#667185] text-[14px]">
            ORDER #123456
          </Typography>
        </div>
        <div className="flex justify-between">
          <Typography className="font-[raleway] max-w-[160px] font-semibold text-[16px]">
            Share this code with your dispatcher
          </Typography>
          <div className="flex gap-2">
            {["7", "5", "9", "0"].map((number, index) => (
              <div
                key={index}
                className="bg-[#E7F6EC] text-[#099137] font-semibold font-[raleway] text-[18px] px-3 py-1 rounded"
              >
                {number}
              </div>
            ))}
          </div>
        </div>
        <div className="flex w-full mt-[15px]">
          <div
            className={`h-[5px] rounded-[8px] flex-1 ${
              currentStep >= 1 ? "bg-[#60983C]" : "bg-[#E4E7EC]"
            }`}
          />
          <div className="w-[10px]" />
          <div
            className={`h-[5px] flex-1 rounded-[8px] ${
              currentStep >= 2 ? "bg-[#60983C]" : "bg-[#E4E7EC]"
            }`}
          />
          <div className="w-[10px]" />
          <div
            className={`h-[5px] flex-1 rounded-[8px] ${
              currentStep >= 3 ? "bg-[#60983C]" : "bg-[#E4E7EC]"
            }`}
          />
          <div className="w-[10px]" />
          <div
            className={`h-[5px] flex-1 rounded-[8px] ${
              currentStep >= 3 ? "bg-[#60983C]" : "bg-[#E4E7EC]"
            }`}
          />
          <div className="w-[10px]" />
          <div
            className={`h-[5px] flex-1 rounded-[8px] ${
              currentStep >= 3 ? "bg-[#60983C]" : "bg-[#E4E7EC]"
            }`}
          />
        </div>
        <div className="flex justify-between border-b pb-8">
          <div className="flex gap-3">
            <Typography className="font-[raleway] font-semibold text-[#1D2739] text-[14px]">
              3:47pm
            </Typography>
            <Typography className="font-[raleway] text-[#667185] text-[14px]">
              Order processing
            </Typography>
          </div>
          <div
            className="flex gap-2 cursor-pointer"
            onClick={() => handleTrackOrder("123456")}
          >
            <Typography className="font-[raleway] text-[#EE79A9] font-semibold text-[14px]">
              TRACK ORDER
            </Typography>
            <img src={TrackIcon} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OngoingOrders;