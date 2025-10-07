import { useNavigate } from "react-router-dom";
import Card from "@/components/Card";
import { GoBack } from "@/components/GoBack";
import { Typography } from "@/components/Typography";
import passwordReset from "@/assets/images/passwordReset.svg";

const ResetSuccess = () => {
  const navigate = useNavigate();


  

  return (
    <div className="w-full h-full flex justify-center items-center">
      <Card
        borderRadius={"lg"}
        className="2xl:w-[604px] w-[504px] flex flex-col items-center !shadow-none"
      >
        <img src={passwordReset} className="w-[96px] mb-4" />
        <div className="flex flex-col w-[80%] py-4 space-y-6">
          <Typography
            variant="heading"
            className="text-center !text-[2rem] font-medium font-[lora]"
          >
            Password successfully changed
          </Typography>

          <Typography
            variant="body"
            className="text-[#344054] font-400 text-center text-[16px]"
          >
            Your password has successfully been reset
            <span className="font-semibold block text-[#344054] text-foreground"></span>
          </Typography>
        </div>

        <div className="mt-6 flex justify-center space-x-2">
            <GoBack onBack={() => navigate('/auth/login')} text="Back to login" className="!text-[#344054]" />
          </div>
      </Card>
    </div>
  );
};

export default ResetSuccess;