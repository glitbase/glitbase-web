/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAppSelector } from "@/hooks/redux-hooks";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Buttons";
import { ModalId } from "@/Layout";
import { useModal } from "@/components/Modal/ModalProvider";
import SearchDropdown from "@/components/SearchDropdown";
import SideNav from "./SideNav";
import { MobileNavProvider } from "./MobileNavContext";
import LocationSelector from "@/components/LocationSelector/index";
import { isFirstVisit } from "@/utils/helpers";
import { PlusIcon, Settings, Upload, Heart, MessageCircle, LogOut, Wallet, Menu } from "lucide-react";
import { useGetMyGlitProfileQuery } from "@/redux/glitfinder";
import { useMatchMedia } from "@/hooks/useMatchMedia";
import GlitfinderSetupModal from "@/components/Modal/GlitfinderSetupModal";
import GlitfinderSetup from "@/pages/glitfinder/GlitfinderSetup";

interface HomeLayoutProps {
  children?: React.ReactNode;
  isLoading: boolean;
  onSearch?: (value: string) => void;
  searchItems?: any[];
  onLocationChange?: () => void;
  showNavBar?: boolean;
  showSearch?: boolean;
}

const HomeLayout = ({
  children,
  isLoading,
  onSearch,
  onLocationChange,
  showNavBar = true,
  showSearch = true,
}: HomeLayoutProps) => {
  const user = useAppSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const { showModal } = useModal();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showGlitSetupModal, setShowGlitSetupModal] = useState(false);
  const [pendingGlitPath, setPendingGlitPath] = useState<string | null>(null);

  const { data: glitProfileData, isLoading: isLoadingGlitProfile } = useGetMyGlitProfileQuery(undefined, { skip: !user });
  const hasGlitProfile = !isLoadingGlitProfile && !!glitProfileData?.data?.profile;

  const isLgUp = useMatchMedia("(min-width: 1024px)");

  const menuItems = useMemo(
    () => [
      { label: "Settings", icon: Settings, path: "/settings", state: undefined, requiresGlitProfile: false },
      ...(user?.activeRole === "vendor"
        ? [
            {
              label: "Earnings",
              icon: Wallet,
              path: "/earnings",
              state: undefined,
              requiresGlitProfile: false,
            },
          ]
        : []),
      { label: "My uploads", icon: Upload, path: "/glitfinder/profile?tab=0", state: undefined, requiresGlitProfile: true },
      { label: "Liked inspirations", icon: Heart, path: "/glitfinder/profile?tab=2", state: undefined, requiresGlitProfile: true },
      { label: "Contact support", icon: MessageCircle, path: "/settings", state: { tab: "customer-support" }, requiresGlitProfile: false },
    ],
    [user?.activeRole]
  );

  const handleMenuItemClick = (item: (typeof menuItems)[number]) => {
    setMenuOpen(false);
    if (item.requiresGlitProfile && !hasGlitProfile) {
      setPendingGlitPath(item.path);
      setShowGlitSetupModal(true);
      return;
    }
    navigate(item.path, item.state ? { state: item.state } : undefined);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    if (mobileNavOpen) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (isLgUp) setMobileNavOpen(false);
  }, [isLgUp]);

  const openMobileNav = useCallback(() => setMobileNavOpen(true), []);

  const getInitials = (name: string) => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return names[0][0];
  };

  const headerActions = (
    <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
      {user && (
        <>
          <Button
            className="!bg-[#4C9A2A] !text-white !text-[13px] sm:!text-[14px] !rounded-full !px-2.5 sm:!px-4 !h-[36px] sm:!h-[40px] flex items-center gap-1 !font-medium"
            onClick={() => {}}
          >
            <PlusIcon size={17} className="sm:w-[18px] sm:h-[18px]" />
            <span className="hidden sm:inline">Create</span>
          </Button>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="p-1.5 sm:p-2.5 rounded-lg transition-colors"
              aria-expanded={menuOpen}
              aria-haspopup="true"
            >
              <svg
                className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12"
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22 18C22 15.7909 20.2091 14 18 14C15.7909 14 14 15.7909 14 18C14 20.2091 15.7909 22 18 22C20.2091 22 22 20.2091 22 18Z"
                  stroke="#0A0A0A"
                  strokeWidth="1.6"
                />
                <path
                  d="M22 30C22 27.7909 20.2091 26 18 26C15.7909 26 14 27.7909 14 30C14 32.2091 15.7909 34 18 34C20.2091 34 22 32.2091 22 30Z"
                  stroke="#0A0A0A"
                  strokeWidth="1.6"
                />
                <path
                  d="M34 18C34 15.7909 32.2091 14 30 14C27.7909 14 26 15.7909 26 18C26 20.2091 27.7909 22 30 22C32.2091 22 34 20.2091 34 18Z"
                  stroke="#0A0A0A"
                  strokeWidth="1.6"
                />
                <path
                  d="M34 30C34 27.7909 32.2091 26 30 26C27.7909 26 26 27.7909 26 30C26 32.2091 27.7909 34 30 34C32.2091 34 34 32.2091 34 30Z"
                  stroke="#0A0A0A"
                  strokeWidth="1.6"
                />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 py-3 bg-white rounded-2xl shadow-lg border border-gray-100 z-50 min-w-[min(240px,85vw)] max-h-[min(70vh,480px)] overflow-y-auto">
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleMenuItemClick(item)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-black hover:bg-gray-50 transition-colors text-[15px] font-medium"
                  >
                    <item.icon size={18} strokeWidth={2} className="shrink-0 text-[#0A0A0A]" />
                    {item.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    showModal(ModalId.LOGOUT_MODAL);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors text-[15px] font-medium text-red-600"
                >
                  <LogOut size={20} strokeWidth={1.5} className="shrink-0" />
                  Log out
                </button>
              </div>
            )}
          </div>
          <div
            onClick={() => {}}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#AE3670] flex items-center justify-center text-white font-semibold text-sm sm:text-base cursor-pointer hover:opacity-90 transition-opacity shrink-0"
          >
            {getInitials(user?.firstName)}
          </div>
        </>
      )}
      {!user && (
        <>
          <button
            type="button"
            onClick={() => {
              if (isFirstVisit()) {
                navigate("/auth/");
              } else {
                navigate("/auth/login");
              }
            }}
            className="font-semibold text-[#1D2739] text-[13px] sm:text-[14px] cursor-pointer px-2 sm:px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors whitespace-nowrap"
          >
            Login
          </button>
          <Button
            className="!bg-[#4C9A2A] !text-white !text-[13px] sm:!text-[14px] !rounded-full !px-3 sm:!px-4 !h-[36px] sm:!h-[40px] flex items-center gap-1 !font-medium"
            onClick={() => {
              if (isFirstVisit()) {
                navigate("/auth/");
              } else {
                navigate("/auth/login");
              }
            }}
          >
            Sign up
          </Button>
        </>
      )}
    </div>
  );

  return (
    <MobileNavProvider openMobileNav={openMobileNav}>
    <div className="relative pl-0 lg:pl-[245px] min-w-0">
      <SideNav
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />
      <div className="fixed left-0 right-0 lg:left-[245px] top-0 z-30 bg-white lg:bg-transparent">
        {showNavBar && (
          <div className="py-3 sm:py-4 lg:py-6 pb-2 lg:pb-1 bg-white px-3 sm:px-4 lg:px-6 border-b border-[#F0F0F0]">
            {!isLgUp ? (
              <div className="flex flex-col gap-3 w-full min-w-0">
                <div className="flex items-center justify-between gap-2 w-full min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button
                      type="button"
                      className="shrink-0 p-2 -ml-1 rounded-lg hover:bg-gray-100 text-[#0A0A0A] transition-colors"
                      aria-label="Open menu"
                      aria-expanded={mobileNavOpen}
                      onClick={() => setMobileNavOpen(true)}
                    >
                      <Menu size={22} strokeWidth={2} />
                    </button>
                    {user?.activeRole !== "vendor" && (
                      <div className="min-w-0 flex-1">
                        {/* @ts-ignore */}
                        <LocationSelector onLocationChange={onLocationChange} />
                      </div>
                    )}
                  </div>
                  {headerActions}
                </div>
                {user?.activeRole !== "vendor" && showSearch && (
                  <div className="w-full min-w-0">
                    <SearchDropdown onSearch={onSearch} />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-row items-center justify-between gap-4 w-full min-w-0">
                {user?.activeRole === "vendor" ? (
                  <div className="flex-1 min-w-0" aria-hidden />
                ) : (
                  <>
                    <div className="shrink-0 min-w-0 max-w-[min(240px,32vw)] xl:max-w-none">
                      {/* @ts-ignore */}
                      <LocationSelector onLocationChange={onLocationChange} />
                    </div>
                    {showSearch &&
                    <div className="flex-1 max-w-xl min-w-0 mx-6 xl:mx-10">
                      <SearchDropdown onSearch={onSearch} />
                    </div>}
                  </>
                )}
                {headerActions}
              </div>
            )}
          </div>
        )}
      </div>
      <div
        className={`transition-all min-w-0 ${
          showNavBar
            ? user?.activeRole === "vendor"
              ? "pt-[76px] sm:pt-[80px] lg:pt-[100px]"
              : "pt-[118px] sm:pt-[110px] lg:pt-[100px]"
            : "pt-0"
        }`}
      >
        {children}
      </div>

      <GlitfinderSetupModal
        isOpen={showGlitSetupModal}
        onClose={() => {
          setShowGlitSetupModal(false);
          setPendingGlitPath(null);
        }}
      >
        <GlitfinderSetup
          onSuccess={() => {
            setShowGlitSetupModal(false);
            if (pendingGlitPath) {
              navigate(pendingGlitPath);
              setPendingGlitPath(null);
            }
          }}
        />
      </GlitfinderSetupModal>
    </div>
    </MobileNavProvider>
  );
};
export default HomeLayout;
