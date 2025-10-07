import { Button } from "@/components/Buttons";
import Card from "@/components/Card";
import { PasswordInput } from "@/components/Inputs/PasswordInput";
import { Typography } from "@/components/Typography";
import { useAppDispatch } from "@/hooks/redux-hooks";
import { useResetPasswordMutation } from "@/redux/auth";
import { setNextpage } from "@/redux/auth/authSlice";
import { handleError, sendMessage } from "@/utils/notify";
import { validateFields } from "@/utils/validator";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import passwordLock from '@/assets/images/passwordLock.svg'
import { GoBack } from "@/components/GoBack";

function ResetPassword() {
  const dispatch = useAppDispatch();
  const [payload, setPayload] = useState({
    password: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [errors, setErrors] = useState<any>(null);
  const [touched, setTouched] = useState<any>([]);
  const userData = JSON.parse(localStorage.getItem("otp") as string);

  useEffect(() => {
    let x = validateFields(["password", "confirmPassword"], payload);

    setErrors(x);
  }, [payload]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await resetPassword({
        password: payload.password,
        email: userData.email,
        otp: userData.otp,
      }).unwrap();
      dispatch(setNextpage(`/auth/reset-success`));
      sendMessage("Your password was reset successfully", "success");
    } catch (error: any) {
      dispatch(setNextpage(null));
      handleError(error?.data);
    }
  };

  return (
    <main className="lg:h-screen w-full flex justify-center items-center">
      <Card
        borderRadius={"lg"}
        className="2xl:w-[604px] w-[504px] flex flex-col items-center !shadow-none"
      >
        <img src={passwordLock} className="w-[80px] mb-[2rem]" />
        <Typography
            variant="heading"
            className="text-center !text-[2rem] font-medium font-[lora]"
          >
            Set new password
          </Typography>
          <Typography
            variant="body"
            className="text-[#344054] font-400 font-regular text-center text-[16px] mt-2"
          >
            Your old and new passwords must not be the same
          </Typography>
        <form className="w-full grid grid-cols-1 py-10 space-y-5">
          <div className="mt-5">
            <PasswordInput
              value={payload.password}
              onChange={(e) => {
                setTouched([...touched, "password"]);
                setPayload({ ...payload, password: e.target.value });
              }}
              error={
                touched.includes("password") && (errors?.errors?.password ?? "")
              }
              label="New password"
              placeholder="Enter new password"
            />
          </div>
          <div className="mt-5">
            <PasswordInput
              value={payload.confirmPassword}
              onChange={(e) => {
                setTouched([...touched, "confirmPassword"]);
                setPayload({ ...payload, confirmPassword: e.target.value });
              }}
              error={
                touched.includes("confirmPassword") &&
                (errors?.errors?.confirmPassword ?? "")
              }
              label="Confirm new password"
              placeholder="Confirm new password"
            />
          </div>
          
          <div className="!mt-10">
            <Button
              variant="default"
              className="w-full"
              loading={isLoading}
              disabled={isLoading || !errors?.isValid}
              onClick={handleSubmit}
            >
              Reset password
            </Button>
          </div>
          <div className="mt-10 flex justify-center space-x-2">
            <GoBack onBack={() => navigate('/auth/login')} text="Back to login" className="!text-[#344054]" />
          </div>
        </form>
      </Card>
    </main>
  );
}

export default ResetPassword;
