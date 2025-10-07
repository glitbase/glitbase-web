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

const HomeLayout = ({
  children,
  isLoading,
  onSearch,
  searchItems,
  onLocationChange,
}: {
  children?: React.ReactNode;
  isLoading: boolean;
  onSearch?: (value: string) => void;
  searchItems?: any[];
  onLocationChange?: () => void;
}) => {
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
        <div className="fixed w-full left-[245px] right-0 top-0 z-10">
          <div className="h-[80px] bg-white flex items-center justify-between px-8">
            {/* Left: Location Selector */}
            <div className="flex items-center">
              <LocationSelector onLocationChange={onLocationChange} />
            </div>

            {/* Center: Search Bar */}
            <div className="flex-1 max-w-xl mx-12">
              <SearchDropdown onSearch={onSearch} items={searchItems || []} />
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {user?.activeRole === 'vendor' && (
                <Button
                  className="!bg-[#12B76A] !text-white !text-[14px] !rounded-full !px-6 !h-[48px] flex items-center gap-2 !font-medium"
                  onClick={handleListing}
                >
                  <span className="text-xl font-normal">+</span> Create
                </Button>
              )}

              <button
                onClick={() => {}}
                className="p-2.5 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <RiAppsLine size={24} className="text-[#1D2739]" />
              </button>

              {user && (
                <div
                  onClick={() => navigate('/home/profile?activeTab=1')}
                  className="w-12 h-12 rounded-full bg-[#D946A6] flex items-center justify-center text-white font-semibold text-base cursor-pointer hover:opacity-90 transition-opacity"
                >
                  {getInitials(user?.firstName + ' ' + user?.lastName)}
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
                    onClick={() => navigate('/auth')}
                    className="font-medium text-white text-[14px] cursor-pointer bg-[#12B76A] px-6 py-3 rounded-full hover:bg-[#0F9A5A] transition-colors"
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>
          </div>
          {pathname === '/' && (
            <h3 className="font-[lora] text-semibold text-[#1D2739] text-[1.2rem] py-4 px-12 border-t border-[#D0D5DD] bg-[#FFF]">
              Welcome to the{' '}
              <span className="text-[#B73F79]">glitbase marketplace</span>
              <BsStars className="inline ml-2 -mt-2" color="#F56630" />
            </h3>
          )}
          {(!user || user?.activeRole === 'customer') && (
            <div
              className={`pt-6 transition-all border-t border-b bg-[#FFF] border-[#D0D5DD] overflow-x-scroll scrollbar-hide ${
                currCategory ? 'h-[210px]' : ''
              }`}
            >
              <div
                className={
                  'relative flex  overflow-x-scroll scrollbar-hide px-9 h-[40px]'
                }
              >
                {mixedCategories?.map((category: any) => (
                  <p
                    key={category.label}
                    onMouseOver={() => setCurrCategory(category.label)}
                    onMouseOut={() => setCurrCategory('')}
                    className="text-[#344054] text-[12px] font-[600] cursor-pointer mx-4 whitespace-nowrap hover:text-[#B73F79] hover:underline transition-all]"
                  >
                    {category.label}
                  </p>
                ))}
                <div className="fixed top-[130px] right-0 h-[40px] w-20 bg-gradient-to-l from-[#FFF] to-transparent pointer-events-none"></div>
              </div>
              {currCategory && (
                <div
                  className="h-[130px] flex items-center justify-between px-14 border-t border-[#D0D5DD] pt-4"
                  onMouseEnter={() => setCurrCategory(currCategory)}
                  onMouseLeave={() => setCurrCategory('')}
                >
                  <div className="grid grid-cols-3 gap-4 max-w-[600px]">
                    <p className="text-[#FFF] text-[14px] font-[600] w-fit px-5 py-1 rounded-2xl cursor-pointer mx-4 whitespace-nowrap hover:underline transition-all bg-[#B73F79]">
                      All
                    </p>
                    {mixedCategories
                      ?.find((category: any) => category.label === currCategory)
                      ?.subcategories?.map((subCategory: any) => (
                        <p
                          key={subCategory}
                          className="text-[#344054] text-[12px] font-[600] cursor-pointer mx-4 whitespace-nowrap hover:text-[#B73F79] hover:underline transition-all"
                        >
                          {subCategory}
                        </p>
                      ))}
                  </div>
                  {/* <div>
                        <div className="w-[150px] h-[92px]" style={{backgroundImage: `url(${SliderImg})`, backgroundSize: 'cover', backgroundPosition: 'center'}} />
                        <h3 className="font-[Lora] font-semibold text-[#1D2739] text-[.9rem] mt-2">Introducing Glitbase V1.1 <BsStars className="inline ml-2 -mt-2" color="#F56630" /></h3>
                    </div> */}
                </div>
              )}
            </div>
          )}
        </div>
        <div
          className={
            currCategory
              ? 'pt-[280px] transition-all'
              : user?.activeRole === 'customer'
              ? 'pt-[200px] transition-all'
              : 'pt-[80px] transition-all'
          }
        >
          {children}
        </div>
      </div>
    </ProtectedRouteProvider>
  );
};
export default HomeLayout;
