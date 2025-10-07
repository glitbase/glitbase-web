import { FC } from "react";
import { useModal } from "./ModalProvider";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import cancel from "@/assets/images/cancel.png";
import { Button } from "../Buttons";
import { useNavigate } from "react-router-dom";

interface ModalComponentProps {
  modalId: string;
}

const AddRoleModal: FC<ModalComponentProps> = ({ modalId }) => {
  const { modalStates, hideModal } = useModal();
  const isOpen = modalStates[modalId]?.isOpen;
  const navigate = useNavigate();

  const handleAddRole = () => {
    hideModal(modalId);
    navigate("/auth/login?action=add-role");
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
                  Are you trying to add another role?
                </div>
                <p className="text-[14px] font-medium opacity-70 text-center text-[#3D3D3D]">
                  You will be redirected to the login page first to add another role.
                </p>
                <div className="flex justify-center flex-col items-center space-y-3 pt-[24px]">
                  <Button
                    size={"full"}
                    onClick={handleAddRole}
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

export default AddRoleModal;