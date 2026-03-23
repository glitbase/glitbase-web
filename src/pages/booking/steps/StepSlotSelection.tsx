import React, { useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { BookingFormData } from '../CreateBooking';
import { toast } from 'react-toastify';

interface OpeningHour {
  day: string;
  isOpen: boolean;
  openingTime?: string;
  closingTime?: string;
}

interface Props {
  formData: BookingFormData;
  updateFormData: (data: Partial<BookingFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Fallback working window when store has no opening hours (minutes from midnight). */
const DEFAULT_OPEN_MIN = 9 * 60;
const DEFAULT_CLOSE_MIN = 18 * 60;

function to12h(h: number, m: number) {
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

function minutesToLabel(totalMin: number): string {
  const h = Math.floor((totalMin % (24 * 60)) / 60);
  const m = totalMin % 60;
  return to12h(h, m);
}

function parse12hToMinutes(timeStr: string): number {
  const parts = timeStr.trim().split(/\s+/);
  if (parts.length < 2) return NaN;
  const [time, period] = [parts[0], parts[1].toUpperCase()];
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
  let h24 = h;
  if (period === 'PM' && h !== 12) h24 += 12;
  if (period === 'AM' && h === 12) h24 = 0;
  return h24 * 60 + m;
}

/** Parse "HH:mm" or "H:mm" from API (may include seconds). */
function parseClockToMinutes(t?: string): number | null {
  if (!t || typeof t !== 'string') return null;
  const segment = t.trim().split(':');
  const h = Number(segment[0]);
  const m = Number(segment[1]);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

/**
 * Generate bookable start times (minutes from midnight): first slot at window open,
 * then each next start = previous + slotLength, until appointment no longer fits before close.
 * slotLength = service duration (+ buffer when configured).
 */
function generateSlotStarts(openMin: number, closeMin: number, slotLengthMinutes: number): number[] {
  if (slotLengthMinutes <= 0 || closeMin <= openMin) return [];
  const slots: number[] = [];
  let start = openMin;
  while (start + slotLengthMinutes <= closeMin) {
    slots.push(start);
    start += slotLengthMinutes;
  }
  return slots;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const StepSlotSelection: React.FC<Props> = ({ formData, updateFormData, onNext, onBack }) => {
  const initialDate = formData.serviceDate ? new Date(formData.serviceDate + 'T00:00:00') : null;

  const [calMonth, setCalMonth] = React.useState<Date>(() => {
    const d = initialDate || new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(initialDate);
  const [selectedTime, setSelectedTime] = React.useState<string | null>(formData.serviceTime || null);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const cartItems = useSelector((state: any) => {
    if (!formData.storeId || !state.cart?.carts) return [];
    return state.cart.carts[formData.storeId] || [];
  });

  const store = useSelector((state: any) => state.vendorStore?.store);

  // Total service duration in minutes (cart); add-ons included
  const totalDuration = cartItems.reduce((total: number, item: any) => {
    const svc = item.service.durationInMinutes || 0;
    const addOns = (item.selectedAddOns || []).reduce((s: number, a: any) => {
      const d = a.duration ? a.duration.hours * 60 + (a.duration.minutes || 0) : a.durationInMinutes || 0;
      return s + d;
    }, 0);
    return total + svc + addOns;
  }, 0);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  /** Optional buffer between bookings (minutes); extends interval between slot starts when API provides it */
  const bufferMinutes = useMemo(() => {
    const b = typeof store?.bufferMinutesBetweenBookings === 'number' ? store.bufferMinutesBetweenBookings : 0;
    return Math.max(0, b);
  }, [store]);

  const slotLengthMinutes = totalDuration + bufferMinutes;

  const openingHours: OpeningHour[] = (store?.openingHours as OpeningHour[]) || [];

  const getDayInfo = (date: Date): OpeningHour | undefined => {
    const dayName = FULL_DAY_NAMES[date.getDay()];
    return openingHours.find((h) => h.day === dayName);
  };

  const isDayOpen = (date: Date) => {
    if (!openingHours.length) return true;
    const info = getDayInfo(date);
    return info?.isOpen !== false;
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  /** Working window for slot generation (minutes from midnight). */
  const getWorkingWindow = (date: Date): { openMin: number; closeMin: number } | null => {
    const info = getDayInfo(date);
    if (openingHours.length && info && info.isOpen === false) return null;

    let openMin = DEFAULT_OPEN_MIN;
    let closeMin = DEFAULT_CLOSE_MIN;

    if (info?.openingTime) {
      const parsed = parseClockToMinutes(info.openingTime);
      if (parsed !== null) openMin = parsed;
    }
    if (info?.closingTime) {
      const parsed = parseClockToMinutes(info.closingTime);
      if (parsed !== null) closeMin = parsed;
    }

    if (closeMin <= openMin) return null;
    return { openMin, closeMin };
  };

  const bookableSlots = useMemo(() => {
    if (!selectedDate || slotLengthMinutes <= 0) return [];

    const window = getWorkingWindow(selectedDate);
    if (!window) return [];

    let starts = generateSlotStarts(window.openMin, window.closeMin, slotLengthMinutes);

    const now = new Date();
    if (isSameCalendarDay(selectedDate, now)) {
      const nowMin = now.getHours() * 60 + now.getMinutes();
      starts = starts.filter((s) => s >= nowMin);
    }

    return starts;
    // openingHours identity drives getWorkingWindow; slotLengthMinutes encodes duration + buffer
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getWorkingWindow closes over openingHours
  }, [selectedDate, slotLengthMinutes, openingHours]);

  // If stored time is not a valid generated slot, clear it
  useEffect(() => {
    if (!selectedTime || !selectedDate || bookableSlots.length === 0) return;
    const selectedMins = parse12hToMinutes(selectedTime);
    if (Number.isNaN(selectedMins) || !bookableSlots.includes(selectedMins)) {
      setSelectedTime(null);
      updateFormData({ serviceTime: '' });
    }
  }, [selectedDate, bookableSlots, selectedTime, updateFormData]);

  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells: { day: number; currentMonth: boolean; date: Date }[] = [];
  for (let i = 0; i < startWeekday; i++) {
    const d = prevMonthDays - startWeekday + 1 + i;
    cells.push({ day: d, currentMonth: false, date: new Date(year, month - 1, d) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, currentMonth: true, date: new Date(year, month, d) });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, currentMonth: false, date: new Date(year, month + 1, d) });
  }

  const isCurrentMonth = () => {
    const now = new Date();
    return calMonth.getMonth() === now.getMonth() && calMonth.getFullYear() === now.getFullYear();
  };

  const handleDateSelect = (date: Date) => {
    if (!date || isPast(date) || !isDayOpen(date)) return;
    setSelectedDate(date);
    setSelectedTime(null);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    updateFormData({ serviceDate: dateStr, serviceTime: '' });
  };

  const selectSlot = (startMinutes: number) => {
    const h = Math.floor(startMinutes / 60);
    const m = startMinutes % 60;
    const timeStr = to12h(h, m);
    setSelectedTime(timeStr);
    updateFormData({ serviceTime: timeStr });
  };

  const handleContinue = () => {
    if (!selectedDate) {
      toast.error('Please select a date to continue');
      return;
    }
    if (!selectedTime) {
      toast.error('Please select a time slot to continue');
      return;
    }
    onNext();
  };

  return (
    <div className="flex flex-col min-h-full mt-6">
      <button
        onClick={onBack}
        className="flex items-center w-fit text-[#6B7280] hover:text-[#0A0A0A] transition-colors mb-6 -ml-1"
        aria-label="Go back"
      >
        <ArrowLeft size={20} strokeWidth={2} color="#3B3B3B" />
      </button>

      <h2 className="text-[24px] font-bold text-[#0A0A0A] mb-1 font-[lora] tracking-tight">Select date and time</h2>
      <p className="text-[15px] text-[#6C6C6C] mb-6 font-medium">
        Choose your preferred date and time from our available appointments
      </p>

      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold text-[15px] text-[#0A0A0A]">
          {MONTH_NAMES[calMonth.getMonth()]} {calMonth.getFullYear()}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isCurrentMonth()}
            onClick={() => setCalMonth(new Date(year, month - 1, 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30 hover:bg-gray-100"
          >
            <ChevronLeft size={18} className="text-[#0A0A0A]" />
          </button>
          <button
            type="button"
            onClick={() => setCalMonth(new Date(year, month + 1, 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100"
          >
            <ChevronRight size={18} className="text-[#0A0A0A]" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center py-1">
            <span className="text-[13px] text-[#999] font-medium">{d}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 mb-6">
        {cells.map((cell, idx) => {
          if (!cell.currentMonth) {
            return (
              <div key={idx} className="aspect-square flex items-center justify-center">
                <span className="text-[13px] text-[#D0D0D0]">{cell.day}</span>
              </div>
            );
          }

          const isSelected =
            selectedDate &&
            cell.date.getDate() === selectedDate.getDate() &&
            cell.date.getMonth() === selectedDate.getMonth() &&
            cell.date.getFullYear() === selectedDate.getFullYear();

          const today = new Date();
          const isToday =
            cell.date.getDate() === today.getDate() &&
            cell.date.getMonth() === today.getMonth() &&
            cell.date.getFullYear() === today.getFullYear();

          const disabled = isPast(cell.date) || !isDayOpen(cell.date);

          return (
            <button
              type="button"
              key={idx}
              disabled={disabled}
              onClick={() => handleDateSelect(cell.date)}
              className={`aspect-square flex items-center justify-center rounded-full transition-colors ${
                isSelected
                  ? 'bg-[#4C9A2A] text-white'
                  : isToday
                    ? 'text-[#4C9A2A] font-semibold'
                    : disabled
                      ? 'text-[#D0D0D0] line-through cursor-not-allowed'
                      : 'text-[#0A0A0A] hover:bg-gray-100'
              }`}
            >
              <span className="text-[14px] font-medium">{cell.day}</span>
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mb-4">
          <h3 className="font-bold text-[16px] text-[#0A0A0A] mb-1 font-[lora] tracking-tight">
            Open slots —{' '}
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </h3>
          <p className="text-[14px] text-[#8A8A8A] mb-3 font-medium">
          Select your preferred time from the available options. Times are based on this provider&apos;s working hours and your total booking length
            {bufferMinutes > 0 ? ' (including buffer between appointments)' : ''}.
          </p>

          {slotLengthMinutes <= 0 && (
            <p className="text-sm text-amber-700 bg-amber-50 rounded-xl px-4 py-3 mb-4">
              Add services with a duration to see bookable time slots.
            </p>
          )}

          {slotLengthMinutes > 0 && bookableSlots.length === 0 && (
            <p className="text-sm text-[#6B7280] bg-[#F5F5F5] rounded-xl px-4 py-3">
              No slots available on this day. The booking may be longer than the remaining working hours, or the day
              may be fully booked for today&apos;s time.
            </p>
          )}

          {bookableSlots.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-6">
              {bookableSlots.map((startMin) => {
                const label = minutesToLabel(startMin);
                const endLabel = minutesToLabel(startMin + totalDuration);
                const pickedMins = selectedTime ? parse12hToMinutes(selectedTime) : NaN;
                const isPicked = !Number.isNaN(pickedMins) && pickedMins === startMin;

                return (
                  <button
                    type="button"
                    key={startMin}
                    onClick={() => selectSlot(startMin)}
                    className={`rounded-2xl px-4 py-3.5 text-left transition-colors ${
                      isPicked
                        ? 'bg-[#FFF4FD] text-[#AE3670]'
                        : 'bg-[#FAFAFA] hover:bg-[#F0F0F0] text-[#3B3B3B]'
                    }`}
                  >
                    <span className="block font-semibold text-[15px] text-[#0A0A0A]">{label}</span>
                    <span className="block text-[12px] text-[#8A8A8A] mt-0.5 font-medium">
                      until {endLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="pt-4">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedDate || !selectedTime}
          className="w-full bg-[#4C9A2A] text-white rounded-full py-3.5 font-semibold text-[15px] hover:bg-[#3d7a22] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default StepSlotSelection;
