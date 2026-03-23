import { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { currencySymbol, formatDateTime, formatDuration, formatNumber, statusPillClasses } from './utils';

type Booking = any;

type TodaysAppointmentsProps = {
  isLoading?: boolean;
  isError?: boolean;
  bookings?: Booking[];
  currencyFallback?: string;
  onSeeAll?: () => void;
};

const TableHeader = () => (
  <div className="grid grid-cols-12 gap-3 px-4 py-4 text-[13px] !text-left font-semibold text-[#0A0A0A] bg-[#FAFAFA]">
    <div className="col-span-3">Name</div>
    <div className="col-span-3">Date</div>
    <div className="col-span-3">Duration</div>
    <div className="col-span-3">Status</div>
  </div>
);

const Row = ({ booking, currencyFallback }: { booking: Booking; currencyFallback?: string }) => {
  const name = booking?.contactInfo?.name || booking?.customer?.name || 'Customer';
  const dateLabel = formatDateTime(booking?.serviceDate, booking?.serviceTime);
  const duration = formatDuration(booking?.pricing?.totalDuration ?? booking?.totalDuration);
  const status = booking?.status || 'pending';
  const currency = booking?.pricing?.currency || currencyFallback;
  const payout = booking?.pricing?.vendorPayout;

  return (
    <div className="grid grid-cols-12 gap-3 px-4 py-4 border-b border-[#F0F0F0] items-center">
      <div className="col-span-4 flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-full bg-[#F4F4F5] grid place-items-center shrink-0">
          <Calendar className="h-4 w-4 text-[#6C6C6C]" />
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-[#101828] truncate">{name}</p>
          {typeof payout === 'number' && (
            <p className="text-[12px] text-[#6C6C6C]">
              {currencySymbol(currency)}{formatNumber(payout)}
            </p>
          )}
        </div>
      </div>
      <div className="col-span-4 text-[14px] text-[#101828]">{dateLabel}</div>
      <div className="col-span-2 text-[14px] text-[#101828]">{duration}</div>
      <div className="col-span-2 flex justify-end">
        <span className={`px-3 py-1.5 rounded-full text-[12px] font-semibold ${statusPillClasses(status)}`}>
          {String(status).charAt(0).toUpperCase() + String(status).slice(1)}
        </span>
      </div>
    </div>
  );
};

const Skeleton = () => {
  return (
    <div className="space-y-3">
      {[0, 1].map((i) => (
        <div key={i} className="grid grid-cols-12 gap-3 px-4 py-4 border-b border-[#F0F0F0] animate-pulse">
          <div className="col-span-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gray-200" />
            <div className="space-y-2 w-full">
              <div className="h-3 w-3/5 bg-gray-200 rounded" />
              <div className="h-3 w-2/5 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="col-span-4">
            <div className="h-3 w-4/5 bg-gray-200 rounded mt-2" />
          </div>
          <div className="col-span-2">
            <div className="h-3 w-3/5 bg-gray-200 rounded mt-2" />
          </div>
          <div className="col-span-2 flex justify-end">
            <div className="h-7 w-16 bg-gray-200 rounded-full mt-1" />
          </div>
        </div>
      ))}
    </div>
  );
};

const TodaysAppointments = ({
  isLoading,
  isError,
  bookings,
  currencyFallback,
  onSeeAll,
}: TodaysAppointmentsProps) => {
  const rows = useMemo(() => (Array.isArray(bookings) ? bookings.slice(0, 4) : []), [bookings]);

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between">
        <p className="text-[17px] font-medium text-[#0A0A0A]">Today’s appointment</p>
        <button type="button" onClick={onSeeAll} className="text-[13px] font-semibold text-[#101828] hover:underline">
          See all
        </button>
      </div>

      <div className="mt-4 rounded-2xl bg-white overflow-hidden">
        <div className="">
          <TableHeader />
        </div>

        {isLoading ? (
          <Skeleton />
        ) : isError ? (
          <div className="px-6 py-10 text-center text-[14px] text-[#BB0A0A]">Failed to load appointments</div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-10 text-center text-[14px] text-[#6C6C6C] font-medium mt-12">No appointments today</div>
        ) : (
          <div>
            {rows.map((b: any) => (
              <Row key={b?._id || b?.id || `${b?.serviceDate}-${b?.serviceTime}-${Math.random()}`} booking={b} currencyFallback={currencyFallback} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodaysAppointments;

