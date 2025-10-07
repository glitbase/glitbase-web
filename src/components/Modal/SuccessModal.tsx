import { FC } from "react";
import { useModal } from "./ModalProvider";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { Button } from "../Buttons";
import { useNavigate } from "react-router-dom";

interface SuccessModalProps {
  modalId: string;
}

const SuccessModal: FC<SuccessModalProps> = ({ modalId }) => {
  const { modalStates, hideModal } = useModal();
  const isOpen = modalStates[modalId]?.isOpen;
  const props = modalStates[modalId]?.props;
  const navigate = useNavigate()

  const handleGoToHome = () => {
    hideModal(modalId);
    navigate("/");
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
            className="p-[30px] rounded-[20px] w-[500px] bg-white shadow-md backdrop-blur-2xl duration-300 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0"
          >
            <div className="w-full">
              {props?.icon && (
                <div className="flex justify-center text-center mt-[20px]">
                  {props.icon}
                </div>
              )}
              <div className="text-[20px] leading-[24px] font-medium py-[20px] text-center font-[lora] text-black">
                {props?.message}
              </div>
              <p className="text-center font-[raleway] text-[#344054] text-[16px] leading-[20px]">
                Glitbase will vet the {props?.type}
              </p>
              <p className="text-center font-[raleway] text-[#344054] mb-[22px] text-[16px] leading-[20px]">
              and get back to you
              </p>
              <div className="flex justify-center flex-col items-center space-y-3 pt-[10px]">
                <Button
                  size={"full"}
                  onClick={handleGoToHome}
                  className="!text-[14px] h-[45px] rounded-[40px]"
                >
                  Go to home
                </Button>
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

export default SuccessModal;