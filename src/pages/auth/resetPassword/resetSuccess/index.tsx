import { useNavigate } from "react-router-dom";
import Card from "@/components/Card";
import { GoBack } from "@/components/GoBack";
import { Typography } from "@/components/Typography";
import passwordReset from "@/assets/images/passwordReset.svg";
import { AUTH } from "@/pages/auth/authPageStyles";

const ResetSuccess = () => {
  const navigate = useNavigate();

  return (
    <main className={AUTH.mainScroll}>
      <div className={`${AUTH.center} py-8`}>
        <Card
          borderRadius={"lg"}
          className="w-full max-w-[440px] sm:max-w-[504px] 2xl:max-w-[604px] px-4 sm:px-8 py-6 sm:py-8 flex flex-col items-center !shadow-none mx-auto"
        >
          <img
            src={passwordReset}
            alt=""
            className="w-[72px] sm:w-[96px] mb-4 shrink-0"
          />
          <div className="flex flex-col w-full max-w-[90%] sm:w-[80%] py-4 space-y-4 md:space-y-6">
            <Typography variant="heading" className={AUTH.titleCenterBold}>
              Password successfully changed
            </Typography>
            <p className={AUTH.subtitleCenter}>
              Your password has successfully been reset
            </p>
          </div>

          <div className="mt-4 md:mt-6 flex justify-center">
            <GoBack
              onBack={() => navigate('/auth/login')}
              text="Back to login"
              className="!text-[#344054] text-[0.95rem] md:text-[1rem]"
            />
          </div>
        </Card>
      </div>
    </main>
  );
};

export default ResetSuccess;