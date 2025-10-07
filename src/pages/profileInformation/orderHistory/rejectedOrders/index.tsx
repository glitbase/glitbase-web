import { Typography } from "@/components/Typography";
import TrackIcon from "@/assets/images/track.svg";

const RejectedOrders = () => {
  return (
    <div>
      <div className="flex flex-col pb-4 border-b gap-4">
        <div className="flex justify-between">
          <div className="flex gap-4">
            <Typography className="font-[lora] font-medium text-[20px]">
              Coachella’s hair straightener
            </Typography>
            <p className="font-[raleway] text-[14px]">(2 Units)</p>
          </div>
          <div className="font-[inter] text-[#D42620] font-medium text-[14px] px-3 py-1 bg-[#FBEAE9] rounded-[20px]">
            Rejected
          </div>
        </div>
        <div className="flex justify-between">
          <Typography className="font-[raleway] font-semibold text-[18px]">
            ₦20,000
          </Typography>
          <div className="flex gap-4 cursor-pointer">
            <Typography className="font-[raleway] text-[#EE79A9] font-semibold text-[14px]">
              Details
            </Typography>
            <img src={TrackIcon} />
          </div>
        </div>
      </div>
      ;
    </div>
  );
  };
  
  export default RejectedOrders;