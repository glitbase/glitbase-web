import { FC } from "react";
import { useModal } from "./ModalProvider";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { ModalId } from "@/Layout";
import cancelx from "@/assets/images/cancelx.png";
import product from "@/assets/images/product.svg";
import service from "@/assets/images/service.svg";
import { Typography } from "../Typography";

interface ModalComponentProps {
  modalId: string;
}

const ListingModal: FC<ModalComponentProps> = ({ modalId }) => {
  const { modalStates, hideModal, showModal } = useModal();
  const isOpen = modalStates[modalId]?.isOpen;

  const handleSelectProduct = () => {
    hideModal(modalId);
    showModal(ModalId.LISTPRODUCT_MODAL);
  };

  const handleSelectService = () => {
    hideModal(modalId);
    showModal(ModalId.LISTSERVICE_MODAL);
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
            className="py-[34px] rounded-[28px] bg-white shadow-md backdrop-blur-2xl duration-300 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0 w-[500px]"
          >
            <div className="w-full">
              <div className="flex gap-4 px-[34px] py-[20px]">
                <img
                  src={cancelx}
                  onClick={() => {
                    hideModal(modalId);
                  }}
                  className="w-[15px] mt-1 h-[15px] cursor-pointer"
                />
                <div className="text-[20px] leading-[26px] text-left font-500 font-[lora] text-black">
                  What are you listing?
                </div>
              </div>
              <div className="border border-[1px] w-full mt-[20px]" />
              <div className="flex space-x-4 px-[34px] pb-[20px] pt-[45px] w-full">
                <div
                  onClick={handleSelectProduct}
                  className="cursor-pointer flex flex-col space-y-2 rounded-[28px] shadow-lg p-6 flex-grow"
                >
                  <img src={product} className="w-[27px] h-[25px]" />
                  <Typography className="text-[#3D89DF] text-[16px] font-semibold font-[lora]">Product</Typography>
                  <p className="text-[#98A2B3] text-[14px]">List a product</p>
                </div>
                <div
                  onClick={handleSelectService}
                  className="cursor-pointer flex flex-col space-y-2 rounded-[28px] shadow-lg p-6 flex-grow"
                >
                  <img src={service} className="w-[27px] h-[25px]" />
                  <Typography className="text-[#B73F79] text-[16px] font-semibold font-[lora]">Service</Typography>
                  <p className="text-[#98A2B3] text-[14px]">List a service</p>
                </div>
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

export default ListingModal;
