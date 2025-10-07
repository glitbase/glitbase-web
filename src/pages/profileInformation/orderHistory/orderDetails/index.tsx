import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import HomeLayout from "@/layout/home/HomeLayout";
import { Typography } from "@/components/Typography";
import BackIcon from "@/assets/images/back.svg";
import Delivery from "@/assets/images/delivery.svg";
import Location from "@/assets/images/location.svg";

const OrderDetails = () => {
  // const { orderId } = useParams();
  const navigate = useNavigate();
  const [isLoading] = useState<boolean>(false);

  const orderStatuses = [
    {
      status: "Order Received",
      description: "Something about the order",
      time: "3:35 pm",
      completed: true,
    },
    {
      status: "Order Processing",
      description: "Your order is being prepared",
      time: "3:50 pm",
      completed: true,
    },
    {
      status: "Rider At The Vendor",
      description: "Your order is on the way",
      time: "4:15 pm",
      completed: false,
    },
    {
      status: "Order Arrived",
      description: "Your order is on the way",
      time: "4:15 pm",
      completed: false,
    },
    {
      status: "Order Delivered",
      description: "Your order is on the way",
      time: "4:15 pm",
      completed: false,
    },
  ];

  return (
    <HomeLayout isLoading={isLoading}>
      <div className="mt-8 md:px-12 px-4 flex justify-center">
        <div className="max-w-[750px] border mb-12 px-7 py-9 rounded-[20px] w-full">
          <div className="flex gap-3">
            <img
              src={BackIcon}
              className="cursor-pointer"
              onClick={() => navigate("/home/profile?activeTab=2")}
            />
            <Typography className="font-[lora] text-[#101928] text-[20px]">
              Track Order
            </Typography>
          </div>
          <div className="flex justify-between border-y py-5 my-5">
            <div className="flex flex-col gap-2">
              <Typography className="font-[raleway] font-semibold text-[16px]">
                Olagoke Juwon
              </Typography>
              <Typography className="font-[raleway] text-[#475367] text-[14px]">
                Your order will arrive shortly
              </Typography>
            </div>

            <img src={Delivery} className="" />
          </div>
          <div className="flex justify-between border-b pb-5">
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
          <div className="flex flex-col pb-5 border-b relative">
            <div className="relative">
              <div
                className="absolute left-3 w-px bg-[#D0D5DD]"
                style={{
                  top: "0px",
                  height: `${orderStatuses.length * 80 - 22}px`,
                }}
              />

              <div
                className="absolute left-3 w-px bg-[#099137]"
                style={{
                  top: "0px",
                  height: `${
                    Math.min(
                      orderStatuses.filter((s) => s.completed).length,
                      orderStatuses.length
                    ) *
                      80 -
                    36
                  }px`,
                }}
              />

              {orderStatuses.map((item, index) => (
                <div className="flex pt-5" key={index}>
                  <div className="flex flex-col items-center mr-4 z-10">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke={item.completed ? "#099137" : "#D0D5DD"}
                        strokeWidth="2"
                        fill={item.completed ? "#0F973D" : "white"}
                      />
                      <path
                        d="M8 12L11 15L16 9"
                        stroke={item.completed ? "white" : "#D0D5DD"}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <div
                    className={`flex justify-between  w-full ${
                      item.status === "Order Delivered" ? "" : "border-b pb-5"
                    }`}
                  >
                    <div className="flex flex-col">
                      <p
                        className={`text-[16px] font-[raleway] ${
                          item.completed ? "text-[#099137]" : "text-[#475367]"
                        } font-semibold`}
                      >
                        {item.status}
                      </p>
                      <p className="text-[14px] font-[raleway] text-[#1D2739]">
                        {item.description}
                      </p>
                    </div>
                    <p className="text-[14px] font-[raleway] text-[#667185]">
                      {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="py-5">
            <Typography className="font-[lora] mb-5 text-[#101928] text-[20px]">
              Delivery details
            </Typography>
            <div className="flex gap-3">
              <img src={Location} />
              <p className="font-[raleway] text-[16px]">
                25, Mickey van str. Ipaja
              </p>
            </div>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
};

export default OrderDetails;