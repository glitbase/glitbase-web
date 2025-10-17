/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import ProtectedRouteProvider from '@/routes/ProtectedRouteProvider';
import { useAppSelector } from '@/hooks/redux-hooks';
import { RiAppsLine } from 'react-icons/ri';
import { useFetchCategoriesQuery } from '@/redux/app';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/Buttons';
import { ModalId } from '@/Layout';
import { useModal } from '@/components/Modal/ModalProvider';
import { BsStars } from 'react-icons/bs';
import SearchDropdown from '@/components/SearchDropdown';
import SideNav from './SideNav';
import LocationSelector from '@/components/LocationSelector';

interface HomeLayoutProps {
  children?: React.ReactNode;
  isLoading: boolean;
  onSearch?: (value: string) => void;
  searchItems?: any[];
  onLocationChange?: () => void;
  showNavBar?: boolean;
}

const HomeLayout = ({
  children,
  isLoading,
  onSearch,
  onLocationChange,
  showNavBar = true,
}: HomeLayoutProps) => {
  const user = useAppSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const { showModal } = useModal();
  const { pathname } = useLocation();
  console.log('USER:', user);
  const { data: categoriesp = [] } = useFetchCategoriesQuery('product');
  const { data: categoriess = [] } = useFetchCategoriesQuery('service');
  console.log('CATEGORIES:', categoriesp, categoriess);
  const [currCategory, setCurrCategory] = useState<string>('');

  const handleListing = () => {
    showModal(ModalId.LISTING_MODAL);
  };

  const mixedCategories = [...categoriesp, ...categoriess];
  console.log(mixedCategories);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return names[0][0];
  };

  return (
    <ProtectedRouteProvider isLoading={isLoading}>
      <div className="relative pl-[245px]">
        <SideNav />
        <div className="fixed left-[245px] right-0 top-0 z-10">
          {showNavBar && (
            <div className="h-[100px] bg-white flex items-center justify-between px-6">
              {/* Left: Location Selector */}
              <div className="flex items-center">
                {/* @ts-ignore */}
                <LocationSelector onLocationChange={onLocationChange} />
              </div>

              {/* Center: Search Bar */}
              <div className="flex-1 max-w-xl mx-12">
                <SearchDropdown onSearch={onSearch} />
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <Button
                  className="!bg-[#4C9A2A] !text-white !text-[14px] !rounded-full !px-6 !h-[48px] flex items-center gap-2 !font-medium"
                  onClick={handleListing}
                >
                  <span className="text-xl font-normal">+</span> Create
                </Button>
                <button
                  onClick={() => {}}
                  className="p-2.5 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22 18C22 15.7909 20.2091 14 18 14C15.7909 14 14 15.7909 14 18C14 20.2091 15.7909 22 18 22C20.2091 22 22 20.2091 22 18Z"
                      stroke="#0A0A0A"
                      stroke-width="1.6"
                    />
                    <path
                      d="M22 30C22 27.7909 20.2091 26 18 26C15.7909 26 14 27.7909 14 30C14 32.2091 15.7909 34 18 34C20.2091 34 22 32.2091 22 30Z"
                      stroke="#0A0A0A"
                      stroke-width="1.6"
                    />
                    <path
                      d="M34 18C34 15.7909 32.2091 14 30 14C27.7909 14 26 15.7909 26 18C26 20.2091 27.7909 22 30 22C32.2091 22 34 20.2091 34 18Z"
                      stroke="#0A0A0A"
                      stroke-width="1.6"
                    />
                    <path
                      d="M34 30C34 27.7909 32.2091 26 30 26C27.7909 26 26 27.7909 26 30C26 32.2091 27.7909 34 30 34C32.2091 34 34 32.2091 34 30Z"
                      stroke="#0A0A0A"
                      stroke-width="1.6"
                    />
                  </svg>
                </button>
                {user && (
                  <div
                    onClick={() => navigate('/home/profile?activeTab=1')}
                    className="w-12 h-12 rounded-full bg-[#AE3670] flex items-center justify-center text-white font-semibold text-base cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    {getInitials(user?.firstName)}
                  </div>
                )}
                {!user && (
                  <>
                    <button
                      onClick={() => navigate('/auth/login')}
                      className="font-semibold text-[#1D2739] text-[14px] cursor-pointer px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => navigate('/auth/onboard')}
                      className="font-medium text-white text-[14px] cursor-pointer bg-[#12B76A] px-6 py-3 rounded-full hover:bg-[#0F9A5A] transition-colors"
                    >
                      Sign up
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        <div
          className={
            currCategory
              ? `${showNavBar ? 'pt-[80px]' : 'pt-[0px]'} transition-all`
              : user?.activeRole === 'customer'
              ? `${showNavBar ? 'pt-[100px]' : 'pt-[0px]'} transition-all`
              : `${showNavBar ? 'pt-[100px]' : 'pt-[0px]'} transition-all`
          }
        >
          {children}
        </div>
      </div>
    </ProtectedRouteProvider>
  );
};
export default HomeLayout;
