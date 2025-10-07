// ModalContext.tsx
import { createContext, useContext, useState, ReactNode, FC } from "react";

interface ModalState {
  isOpen: boolean;
  props?: { [key: string]: any }; // Add a props object to store additional data
}

type ModalStates = {
  [key: string]: ModalState;
};

interface ModalContextType {
  modalStates: ModalStates;
  showModal: (modalId: string, props?: { [key: string]: any }) => void;
  hideModal: (modalId: string) => void;
  // hideModalWithAction: (modalId: string, discardAction: () => {}) => void;
}
const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: FC<ModalProviderProps> = ({ children }) => {
  const [modalStates, setModalStates] = useState<ModalStates>({});

  const showModal = (modalId: string, props?: { [key: string]: any }) => {
    setModalStates((prevStates) => ({
      ...prevStates,
      [modalId]: { isOpen: true, props },
    }));
  };

  const hideModal = (modalId: string) => {
    setModalStates((prevStates) => ({
      ...prevStates,
      [modalId]: { isOpen: false, props: {} }, // Optionally clear props or keep them based on your needs
    }));
  };

  // const hideModalWithAction = (modalId: string, discardAction: () => {}) => {
  //   setModalStates((prevStates) => ({
  //     ...prevStates,
  //     [modalId]: { isOpen: false, props: {} }, // Optionally clear props or keep them based on your needs
  //   }));
  //   discardAction()
  // };

  return (
    <ModalContext.Provider value={{ modalStates, showModal, hideModal }}>
      {children}
    </ModalContext.Provider>
  );
};
