import { Button } from "@/components/Buttons"
import Card from "@/components/Card"
import { Typography } from "@/components/Typography"
import SplashImg from '@/assets/images/splash.svg'
import StarsGreen from '@/assets/images/starsGreen.svg'
import StarsPink from '@/assets/images/starsPink.svg'
import StarsIllus from '@/assets/images/starsIllus.svg'
import Promo from '@/assets/images/promo.svg'
import Glowfinder from '@/assets/images/glowfinder.svg'
import Booking from '@/assets/images/booking.svg'
import { useState } from "react"
import { useNavigate } from "react-router-dom"

const Splash = () => {
  const [screen, setScreen] = useState(1);
  const navigate = useNavigate();

  return (
    <div className="flex justify-center items-center px-4 md:px-20 relative h-screen">
      <Card className="rounded-sm py-5 px-4 md:px-12 w-full max-w-[900px] !shadow-none">
        <div className="space-y-2 flex justify-center flex-col items-center">
        <p className="text-center font-medium text-[1rem] text-[#667185] !mt-3">{screen === 1 ? "Welcome to glitbase" : "What you can do"}</p>
          <Typography variant="heading" className={`!leading-[46px] text-center !text-[2rem] font-medium font-[lora] mx-auto ${screen === 1 ? "!max-w-[400px]" : "!max-w-[500px]"}`}>
          {screen === 1 ? "Your hub for beauty, lifestyle, and inspiration." : "Find services, book appointments, or sell products."}
          </Typography>
        </div>

        {screen === 1 ?
        <div className="w-[300px] mx-auto my-10 relative">
            <img src={StarsPink} alt="stars" className="absolute md:-left-44 -left-32 bottom-4" />
            <img src={SplashImg} alt="splash_img" />
            <img src={StarsGreen} alt="stars" className="absolute md:-right-44 -right-32 top-4" />
        </div>
        :
        <div className="flex justify-center items-center gap-12 my-12">
            <img src={Glowfinder} alt="" className="w-[80px]" />
            <img src={Booking} alt="" className="w-[80px]" />
            <img src={Promo} alt="" className="w-[80px]" />
        </div>
        }

        <div className="flex justify-center">
            <Button
                variant="default"
                onClick={screen === 1 ? () => setScreen(2) : () => navigate('signup')}
                className={`mx-auto ${screen === 1 ? "w-[300px]" : "w-[140px]"}`}
            >
                {screen === 1 ? "Enter Glitbase" : "Get started"}
            </Button>
        </div>
      </Card>
      <img src={StarsIllus} alt="star_illus" className="absolute bottom-0 transform scale-80" />
    </div>
  )
}

export default Splash;