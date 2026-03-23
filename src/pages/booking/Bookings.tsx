import { useAppSelector } from "@/hooks/redux-hooks";
import CustomerBookings from "./CustomerBookings";
import VendorBookings from "./VendorBookings";
import HomeLayout from "@/layout/home/HomeLayout";

const Bookings = () => {
  const isVendor = useAppSelector((s) => s.auth.user?.activeRole === "vendor");

  return (
    <HomeLayout isLoading={false} showNavBar={true} showSearch={false}>
    <div className="min-h-[100dvh] min-h-screen bg-white flex flex-col">
      <div className={`px-3 sm:px-6 md:px-8 pt-6 sm:pt-8 pb-3 sm:pb-4 shrink-0 ${!isVendor ? '-mt-12' : ''}`}>
        <h1 className="text-[1.1rem] sm:text-xl md:text-[22px] font-semibold text-[#0A0A0A] font-[lora] tracking-tight">
          Bookings
        </h1>
      </div>

      {isVendor ? (
        <div className="px-4 sm:px-6 md:px-8 pb-6 md:pb-8 flex-1 min-h-0">
          <VendorBookings />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col px-0 sm:px-2 md:px-4 lg:px-8 pb-4 md:pb-8">
          <CustomerBookings />
        </div>
      )}
    </div>
    </HomeLayout>
  );
};

export default Bookings;
