import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Calendar, Clock, MapPin } from 'lucide-react';

interface Props {
  bookingReference: string;
  userEmail: string;
  serviceDate: string;
  serviceTime: string;
  totalDuration: number;
  bookingId: string;
  serviceType: string;
  storeLocation?: string;
  homeAddress?: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function addMinutes(timeStr: string, minutesToAdd: number): string {
  const [time, period] = timeStr.split(' ');
  const [h, m] = time.split(':').map(Number);
  let h24 = h;
  if (period === 'PM' && h !== 12) h24 += 12;
  if (period === 'AM' && h === 12) h24 = 0;
  const total = h24 * 60 + m + minutesToAdd;
  const nh = Math.floor((total % (24 * 60)) / 60);
  const nm = total % 60;
  const np = nh >= 12 ? 'PM' : 'AM';
  const nh12 = nh === 0 ? 12 : nh > 12 ? nh - 12 : nh;
  return `${String(nh12).padStart(2, '0')}:${String(nm).padStart(2, '0')} ${np}`;
}

const StepSuccess: React.FC<Props> = ({
  bookingReference,
  userEmail,
  serviceDate,
  serviceTime,
  totalDuration,
  bookingId,
  serviceType,
  storeLocation,
  homeAddress,
}) => {
  const navigate = useNavigate();

  const endTime = serviceTime ? addMinutes(serviceTime, totalDuration) : '';
  const timeRange = serviceTime && endTime ? `${serviceTime} – ${endTime}` : serviceTime || '';

  return (
    <div className="flex flex-col min-h-full items-center">
      {/* Success icon */}
      <div className="mt-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-[#4C9A2A] flex items-center justify-center">
          <Check size={40} className="text-white" strokeWidth={2.5} />
        </div>
      </div>

      {/* Title */}
      <h2 className="text-[24px] font-bold text-[#0A0A0A] mb-3 text-center font-[lora] tracking-tight">
        Booking scheduled!
      </h2>

      {/* Message */}
      <p className="text-[14px] text-[#3B3B3B] font-medium text-center leading-relaxed mb-8 max-w-[900px]">
        Your booking #{bookingReference} has been successfully scheduled and complete details have been sent to {userEmail}
      </p>

      {/* Booking details */}
      <div className="w-full space-y-4 flex-1">
        {/* Date */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#F5F5F5] flex items-center justify-center flex-shrink-0">
            <Calendar size={16} className="text-[#666]" />
          </div>
          <div>
            <p className="text-[12px] text-[#888] mb-0.5">Date</p>
            <p className="text-[14px] font-medium text-[#0A0A0A]">
              {serviceDate ? formatDate(serviceDate) : '—'}
            </p>
          </div>
        </div>

        {/* Time */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#F5F5F5] flex items-center justify-center flex-shrink-0">
            <Clock size={16} className="text-[#666]" />
          </div>
          <div>
            <p className="text-[12px] text-[#888] mb-0.5">Time</p>
            <p className="text-[14px] font-medium text-[#0A0A0A]">{timeRange || '—'}</p>
          </div>
        </div>

        {/* Location based on service type */}
        {(serviceType === 'normal' || serviceType === 'pickDrop') && storeLocation && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F5F5F5] flex items-center justify-center flex-shrink-0">
              <MapPin size={16} className="text-[#666]" />
            </div>
            <div>
              <p className="text-[12px] text-[#888] mb-0.5">Provider&apos;s location</p>
              <p className="text-[14px] font-medium text-[#0A0A0A]">{storeLocation}</p>
            </div>
          </div>
        )}

        {serviceType === 'home' && homeAddress && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F5F5F5] flex items-center justify-center flex-shrink-0">
              <MapPin size={16} className="text-[#666]" />
            </div>
            <div>
              <p className="text-[12px] text-[#888] mb-0.5">Address</p>
              <p className="text-[14px] font-medium text-[#0A0A0A]">{homeAddress}</p>
            </div>
          </div>
        )}

      </div>

      {/* Footer buttons */}
      <div className="w-full pt-6 space-y-3">
        <button
          onClick={() => navigate(`/bookings?ref=${bookingReference}`)}
          className="w-full bg-[#4C9A2A] text-white rounded-full py-3.5 font-semibold text-[15px] hover:bg-[#3d7a22]"
        >
          View booking details
        </button>
        <button
          onClick={() => navigate('/')}
          className="w-full bg-[#F5F5F5] text-[#555] rounded-full py-3.5 font-semibold text-[15px] hover:bg-gray-200"
        >
          Back to home
        </button>
      </div>
    </div>
  );
};

export default StepSuccess;
