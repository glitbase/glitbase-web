import { useAuth } from "@/AuthContext";
import { Button } from "@/components/Buttons";
import { GoBack } from "@/components/GoBack";
import ProtectedRouteProvider from "@/routes/ProtectedRouteProvider";
import { useAppSelector, useAppDispatch } from "@/hooks/redux-hooks";
import { Typography } from "@/components/Typography";
import { useUpdateUserMutation, useUserProfileQuery } from "@/redux/auth";
import { trackAction } from "@/utils/AmpHelper";
import { handleError } from "@/utils/notify";
import { FormEvent, useState, useEffect } from "react";
import { toast } from "react-toastify";
import Logo from "@/assets/images/logo.svg";
import { setUser, setAuthenticated } from "@/redux/auth/authSlice";
import "./index.css";
import PageLoader from "@/PageLoader";

const AddRole = () => {
  const dispatch = useAppDispatch();
  const { setTokens } = useAuth();
  const [updateUser, { isLoading }] = useUpdateUserMutation();
  const user = useAppSelector((state) => state.auth.user);
  const { data, isFetching, isError } = useUserProfileQuery(undefined, {
    skip: !!user,
  });

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  useEffect(() => {
    if (!user && data?.data?.user) {
      dispatch(setAuthenticated());
      dispatch(setUser(data.data.user));
    }
  }, [data, dispatch, user]);

  const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`;
  const userRoles = user?.roles || [];
  const isCustomer = userRoles.includes("customer");
  const isVendor = userRoles.includes("vendor");

  const getRoleText = () => {
    if (isCustomer && !isVendor) {
      return "We noticed you have a regular user account with us already, Please enable the vendor role for this account instead.";
    }
    if (isVendor && !isCustomer) {
      return "We noticed you have a vendor account with us already, Please enable the customer role for this account instead.";
    }
    return "You already have both customer and vendor roles assigned to your account.";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    try {
      const data = await updateUser({ role: selectedRole }).unwrap();
      trackAction("User Role Update", { role: selectedRole });
      setTokens(data.tokens);
      toast.success("Role successfully added!");
      window.location.href = '/'
    } catch (error: any) {
      handleError(error?.data);
    }
  };

  if (isFetching) {
    return <PageLoader />
  }

  if (isError) {
    return toast.error("Role successfully added!");
  }

  return (
    <ProtectedRouteProvider isLoading={isFetching}>
      <main className="h-screen w-full !bg-[white]">
        <div className="flex justify-between py-8 px-12">
          <GoBack text="Back" className="!text-[#60983C]" />
        </div>
        <div className="px-4 mx-auto pb-2 max-w-[470px] h-fit flex flex-col items-center mt-[10px] xl:mt-[10px]">
          <div className="space-y-2 flex justify-center flex-col items-center">
            <img src={Logo} alt="logo" />
            <Typography
              variant="heading"
              className="text-center !text-[24px] font-medium font-[lora]"
            >
              {user?.roles[0] === 'customer' ? 'User' : 'Vendor'} account detected
            </Typography>
            <Typography
              variant="body"
              className="text-[#344054] text-center text-[16px] mt-2 leading-[24px]"
            >
              {getRoleText()}
            </Typography>
            {user?.firstName && (
              <div
                className="flex justify-center items-center rounded-full mt-5 bg-[#FF59A2] text-white"
                style={{ width: "50px", height: "50px" }}
              >
                <span className="text-[26px] font-bold">
                  {user.firstName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="justify-center flex flex-col items-center">
              <p className="font-[lora] text-[14px]">{fullName}</p>
              <p className="text-[#98A2B3] text-[10px] font-semibold">
                {user?.email}
              </p>
            </div>
          </div>
          <form className="w-full py-5 xl:py-5">
            <div className="border rounded-[10px] px-5 py-5">
              <Typography
                variant="heading"
                className="!text-[18px] font-medium font-[lora] mb-5"
              >
                Your role permissions
              </Typography>

              <div className="flex space-y-5 flex-col">
                {/* Customer Role */}
                <div className="flex justify-between">
                  <div>
                    <p className="text-[16px] font-[lora]">User</p>
                    <p className="text-[14px] text-[#79747E]">
                      Buy products and services
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={isCustomer || selectedRole === "customer"}
                    disabled={isCustomer}
                    onChange={() =>
                      setSelectedRole(
                        selectedRole === "customer" ? null : "customer"
                      )
                    }
                  />
                </div>

                {/* Vendor Role */}
                <div className="flex justify-between">
                  <div>
                    <p className="text-[16px] font-[lora]">
                      Vendor/service provider
                    </p>
                    <p className="text-[14px] text-[#79747E]">
                      Sell products and services
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={isVendor || selectedRole === "vendor"}
                    disabled={isVendor}
                    onChange={() =>
                      setSelectedRole(
                        selectedRole === "vendor" ? null : "vendor"
                      )
                    }
                  />
                </div>
              </div>
            </div>
            <div className="my-12">
              <Button
                variant="default"
                size={"full"}
                loading={isLoading}
                disabled={isLoading || !selectedRole}
                onClick={handleSubmit}
              >
                Continue
              </Button>
            </div>
          </form>
        </div>
      </main>
    </ProtectedRouteProvider>
  );
};

export default AddRole;
