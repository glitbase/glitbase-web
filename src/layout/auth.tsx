import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux-hooks';
import { useEffect } from 'react';
import Spiral from '@/assets/images/spiral.svg';
import PageLoader from '@/PageLoader';
import Placeholder from '@/assets/images/placeholder.svg';
import new_logo from '@/assets/images/new_logo.svg';

const AuthLayout = ({
  children,
  isLoading,
}: {
  children?: React.ReactNode;
  isLoading: boolean;
}) => {
  const navigate = useNavigate();
  const { isAuth, nextPage } = useAppSelector((state) => state.auth);
  const location = useLocation();

  const [searchParams] = useSearchParams();
  const callbackUrl = searchParams.get('next') || '/';

  useEffect(() => {
    const isAuthRoute = location.pathname.startsWith('/auth');
    if (!isAuthRoute) {
      return;
    }

    if (nextPage) {
      navigate(nextPage);
      return;
    }

    if (isAuth) {
      navigate(callbackUrl);
    }
  }, [isAuth, nextPage, navigate, callbackUrl, location.pathname]);

  return isLoading ? (
    <div className="rounded-xl overflow-hidden">
      <PageLoader />
    </div>
  ) : (
    <div className="flex flex-col w-full overflow-hidden justify-center items-center h-screen relative xl:flex-row">
      <div className="hidden xl:flex xl:w-[420px] xl:max-w-[32rem] xl:h-full relative xl:overflow-hidden bg-[#F3EDE1] shadow-sm">
        <div className="flex flex-col justify-between h-full w-full  py-10">
          <div className="mt-[-3rem]">
            <img src={new_logo} alt="logo" className="w-[12rem]" />
          </div>
          <div className="flex-1 flex flex-col justify-center items-center mt-[-4rem]">
            <img src={Spiral} alt="spiral" className="w-[full] h-full" />
          </div>
          <div className="mt-1 px-10">
            <p className="font-[lora] font-semibold text-[1.9rem] leading-[2.4rem] text-[#1D2739]">
              Your hub for <br />{' '}
              <span className="text-[#4C9A2A] italic">beauty</span>, lifestyle
              and inspiration
            </p>
            <p className="mt-6 text-[0.95rem] text-[#3B3B3B]">
              Our founder wishes you a fantastic experience as you are about to
              use glitbase
            </p>
            <p className="mt-8 text-[1rem] text-[#101928] font-[lora]">
              Founder.
            </p>
            <img
              src={Placeholder}
              alt="Founder"
              className="mt-2 w-[56px] h-[56px] object-contain"
            />
          </div>
        </div>
      </div>
      <div className="w-full flex-1 rounded-xl">{children}</div>
    </div>
  );
};

export default AuthLayout;
