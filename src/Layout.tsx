import { ModalProvider } from "@/components/Modal/ModalProvider";
import LogoutModal from "./components/Modal/LogoutModal";
import AddRoleModal from "./components/Modal/AddRoleModal";
import ListingModal from "./components/Modal/ListingModal";
import ListProductModal from "./components/Modal/ListProductModal";
import ListServiceModal from "./components/Modal/ListServiceModal";
import SuccessModal from "./components/Modal/SuccessModal";
import SwitchRoleModal from "./components/Modal/SwitchRoleModal";

// import ScriptLoader from "./ScriptLoader";

export enum ModalId {
  MOBILE_MENU = "mobilemenu",
  LOGOUT_MODAL = "logout",
  ADDROLE_MODAL = "addrole",
  LISTING_MODAL = "listing",
  LISTPRODUCT_MODAL = "listproduct",
  LISTSERVICE_MODAL = "listservice",
  SUCCESS_MODAL = "success",
  SWITCH_ROLE_MODAL = "switchrole",
}

const Layout: React.FC<any> = ({ children }) => {
  return (
    <ModalProvider>
      {/* <ScriptLoader /> */}
      <LogoutModal modalId={ModalId.LOGOUT_MODAL} />
      <AddRoleModal modalId={ModalId.ADDROLE_MODAL} />
      <ListingModal modalId={ModalId.LISTING_MODAL} />
      <ListProductModal modalId={ModalId.LISTPRODUCT_MODAL} />
      <ListServiceModal modalId={ModalId.LISTSERVICE_MODAL} />
      <SuccessModal modalId={ModalId.SUCCESS_MODAL}/>
      <SwitchRoleModal modalId={ModalId.SWITCH_ROLE_MODAL} />
      {children}
    </ModalProvider>
  );
};

export default Layout;
