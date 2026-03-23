import { Button } from '@/components/Buttons';
import Card from '@/components/Card';
import { Typography } from '@/components/Typography';
import SplashImg from '@/assets/images/splash.svg';
import StarsGreen from '@/assets/images/starsGreen.svg';
import StarsPink from '@/assets/images/starsPink.svg';
import StarsIllus from '@/assets/images/starsIllus.svg';
import Promo from '@/assets/images/promo.svg';
import Glowfinder from '@/assets/images/glowfinder.svg';
import Booking from '@/assets/images/booking.svg';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { markFirstVisitCompleted } from '@/utils/helpers';
import { AUTH } from '@/pages/auth/authPageStyles';

const Splash = () => {
  const [screen, setScreen] = useState(1);
  const navigate = useNavigate();

  return (
    <div
      className={`${AUTH.main} relative flex justify-center items-center px-4 sm:px-6 md:px-12 lg:px-20 py-6 overflow-y-auto`}
    >
      <Card className="rounded-sm py-4 sm:py-5 px-3 sm:px-6 md:px-12 w-full max-w-[900px] !shadow-none z-[1]">
        <div className="space-y-2 flex justify-center flex-col items-center px-1">
          <p className="text-center font-medium text-[0.95rem] md:text-[1rem] text-[#6C6C6C] !mt-2 md:!mt-3">
            {screen === 1 ? 'Welcome to glitbase' : 'What you can do'}
          </p>
          <Typography
            variant="heading"
            className={`text-center font-medium font-[lora] mx-auto leading-tight sm:leading-snug md:!leading-[2.75rem] !text-[1.35rem] sm:!text-[1.65rem] md:!text-[2rem] ${
              screen === 1 ? 'max-w-[min(400px,100%)]' : 'max-w-[min(500px,100%)]'
            }`}
          >
            {screen === 1
              ? 'Your hub for beauty, lifestyle, and inspiration.'
              : 'Find services, book appointments, or sell products.'}
          </Typography>
        </div>

        {screen === 1 ? (
          <div className="w-[min(300px,88vw)] max-w-[300px] mx-auto my-6 sm:my-10 relative">
            <img
              src={StarsPink}
              alt="stars"
              className="absolute w-[min(120px,28vw)] sm:w-auto md:-left-44 -left-[28%] sm:-left-32 bottom-2 sm:bottom-4 opacity-90"
            />
            <img src={SplashImg} alt="splash_img" className="w-full h-auto" />
            <img
              src={StarsGreen}
              alt="stars"
              className="absolute w-[min(120px,28vw)] sm:w-auto md:-right-44 -right-[28%] sm:-right-32 top-2 sm:top-4 opacity-90"
            />
          </div>
        ) : (
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10 md:gap-12 my-8 sm:my-12 px-2">
            <img src={Glowfinder} alt="" className="w-[64px] sm:w-[72px] md:w-[80px]" />
            <img src={Booking} alt="" className="w-[64px] sm:w-[72px] md:w-[80px]" />
            <img src={Promo} alt="" className="w-[64px] sm:w-[72px] md:w-[80px]" />
          </div>
        )}

        <div className="flex justify-center pb-2">
          <Button
            variant="default"
            onClick={
              screen === 1
                ? () => setScreen(2)
                : () => {
                    markFirstVisitCompleted();
                    navigate('onboard');
                  }
            }
            className={`mx-auto w-full max-w-[300px] sm:w-auto ${screen === 1 ? 'sm:min-w-[240px]' : 'min-w-[140px]'}`}
          >
            {screen === 1 ? 'Enter Glitbase' : 'Get started'}
          </Button>
        </div>
      </Card>
      <img
        src={StarsIllus}
        alt="star_illus"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 max-w-[min(100%,420px)] w-full pointer-events-none opacity-90 scale-[0.65] sm:scale-75 md:scale-80"
      />
    </div>
  );
};

export default Splash;
