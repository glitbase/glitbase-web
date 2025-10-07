import { Button } from "@/components/Buttons";
import Card from "@/components/Card";
import { Input } from "@/components/Inputs/TextInput";
import { Typography } from "@/components/Typography";
import { useAppDispatch } from "@/hooks/redux-hooks";

import { useForgotPasswordMutation } from "@/redux/auth";
import { setNextpage } from "@/redux/auth/authSlice";
import { handleError } from "@/utils/notify";
import { validateFields } from "@/utils/validator";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import passwordLock from '@/assets/images/passwordLock.svg'
import { GoBack } from "@/components/GoBack";

const ForgotPassword = () => {
  const dispatch = useAppDispatch();
  const [payload, setPayload] = useState({
    email: "",
  });
  const navigate = useNavigate();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [errors, setErrors] = useState<any>(null);
  const [touched, setTouched] = useState<any>([]);

  useEffect(() => {
    let x = validateFields(["email"], payload);

    setErrors(x);
  }, [payload]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await forgotPassword(payload.email).unwrap();
      navigate(`/auth/forgot-password/${payload.email}/otp`);
    } catch (error: any) {
      dispatch(setNextpage(null));
      handleError(error?.data);
    }
  };
  return (
    <main className="lg:h-screen w-full flex justify-center lg:items-center">
      <Card
        borderRadius={"lg"}
        className="2xl:w-[604px] w-[504px] flex flex-col items-center mt-[14px] max-h-lg !shadow-none"
      >
        <img src={passwordLock} className="w-[80px] mb-[2rem]" />
        <div className="space-y-2 flex justify-center flex-col items-center">
        <Typography variant="heading" className="text-center !text-[2rem] font-medium font-[lora]">
        Forgot your password?
          </Typography>
          <Typography
            variant="body"
            className="text-[#344054] font-400 font-regular text-center text-[16px]"
          >
            No worries, we will send you reset instructions
          </Typography>
        </div>
        <form className="w-full py-10 space-y-5">
          <div>
            <Input
              value={payload.email}
              onChange={(e) => {
                setTouched([...touched, "email"]);
                setPayload({ ...payload, email: e.target.value });
              }}
              error={touched.includes("email") && (errors?.errors?.email ?? "")}
              label="Email address"
              placeholder="Enter email address"
            />
          </div>
          <div className="mt-10">
            <Button
              variant="default"
              size={"full"}
              loading={isLoading}
              disabled={isLoading || !errors?.isValid}
              onClick={handleSubmit}
            >
              Send reset instructions
            </Button>
          </div>
          <div className="mt-10 flex justify-center space-x-2">
            <GoBack onBack={() => navigate('/auth/login')} text="Back to login" className="!text-[#344054]" />
          </div>
        </form>
      </Card>
    </main>
  );
};
export default ForgotPassword;
