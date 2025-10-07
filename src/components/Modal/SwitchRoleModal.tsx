import { FC, useState } from "react";
import { useModal } from "./ModalProvider";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";

import cancel from "@/assets/images/cancel.png";
import { Button } from "../Buttons";
import { handleError } from "@/utils/notify";
import { useSwitchActiveRoleMutation } from "@/redux/auth";
import { PasswordInput } from "../Inputs/PasswordInput";
import { useAppSelector } from "@/hooks/redux-hooks";
import { useDispatch } from "react-redux";
import { useAuth } from "@/AuthContext";
import { setAuthenticated, setUser } from "@/redux/auth/authSlice";

interface ModalComponentProps {
  modalId: string;
}

const SwitchRoleModal: FC<ModalComponentProps> = ({ modalId }) => {
  const { modalStates, hideModal } = useModal();
  const isOpen = modalStates[modalId]?.isOpen;
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useDispatch()
  const { setTokens } = useAuth();

  const [password, setPassword] = useState<string>("");

  const [switchActiveRole, { isLoading }] = useSwitchActiveRoleMutation();

  const switchRole = async () => {
    try {
      const { data } = await switchActiveRole({role: user?.activeRole === 'customer' ? 'vendor' : 'customer', password}).unwrap();
      // console.log("SWITCH ROLE DATA:", data?.user);
      setTokens(data?.tokens);
      dispatch(setAuthenticated());
      dispatch(setUser(data?.user));
      window.location.reload();
    } catch (error) {
      handleError((error as any)?.data?.message || "An unexpected error occurred");
      console.error("Error switching roles:", error);
    }
  };

  if (!isOpen) return null;
  return (
    <Dialog
      open={isOpen}
      as="div"
      className="relative z-10 focus:outline-none"
      onClose={() => {
        hideModal(modalId);
      }}
    >
      <DialogBackdrop className="fixed inset-0 bg-black/70 w-full" />
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            transition
            className="p-[24px] rounded-xl bg-white shadow-md backdrop-blur-2xl duration-300 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0"
          >
            <div className="w-full max-w-[300px]">
              <div className="flex justify-center">
                <img src={cancel} className="w-[50px] h-[50px]" />
              </div>

              <div className="">
                <div className="text-[22px] leading-[26px] py-[20px] text-center font-bold text-black">
                  Are you sure you want to switch your active profile?
                </div>
                <p className="text-[14px] font-medium opacity-70 text-center text-[#3D3D3D]">
                {user?.activeRole === 'customer' ? 'You will now be able to access your vendor dashboard and manage your listings. You can switch back to your customer profile at any time.' : 'You will now be able to access your customer dashboard and manage your orders. You can switch back to your vendor profile at any time.'}
                </p>
                <div className="mt-8">
                    <PasswordInput
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    name="password"
                    label="Password"
                    placeholder="Enter password"
                    />
                </div>
                <div className="flex justify-center flex-col items-center space-y-3 pt-[24px]">
                  <Button
                    size={"full"}
                    loading={isLoading}
                    onClick={switchRole}
                    className="!text-[14px] h-[45px]"
                  >
                    Yes, I am sure
                  </Button>
                  <div
                    onClick={() => {
                      hideModal(modalId);
                    }}
                    className="text-primary text-[14px] font-medium cursor-pointer"
                  >
                    No thanks
                  </div>
                </div>
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

export default SwitchRoleModal;