/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { ChevronLeft } from 'lucide-react';
import { useUpdateStoreMutation } from '@/redux/vendor';
import { toast } from 'react-toastify';
import { Button } from '@/components/Buttons';
import HomeLayout from '@/layout/home/HomeLayout';

interface DayHours {
  day: string;
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
}

const DAYS = [
  { value: 'Monday', label: 'Monday' },
  { value: 'Tuesday', label: 'Tuesday' },
  { value: 'Wednesday', label: 'Wednesday' },
  { value: 'Thursday', label: 'Thursday' },
  { value: 'Friday', label: 'Friday' },
  { value: 'Saturday', label: 'Saturday' },
  { value: 'Sunday', label: 'Sunday' },
];

const getInitialHours = (): DayHours[] =>
  DAYS.map((day) => ({ day: day.value, isOpen: false, openingTime: '09:00', closingTime: '17:00' }));

const EditOpeningHours = () => {
  const navigate = useNavigate();
  const store = useSelector((state: RootState) => state.vendorStore.store);
  const [updateStore, { isLoading }] = useUpdateStoreMutation();
  const [openingHours, setOpeningHours] = useState<DayHours[]>(getInitialHours());

  useEffect(() => {
    if (store?.openingHours && store.openingHours.length > 0) {
      const merged = DAYS.map((day) => {
        const existing = store.openingHours.find((h: DayHours) => h.day === day.value);
        if (existing) {
          return {
            ...existing,
            openingTime: existing.openingTime?.substring(0, 5) || '09:00',
            closingTime: existing.closingTime?.substring(0, 5) || '17:00',
          };
        }
        return { day: day.value, isOpen: false, openingTime: '09:00', closingTime: '17:00' };
      });
      setOpeningHours(merged);
    } else if (store) {
      setOpeningHours(getInitialHours());
    }
  }, [store]);

  const handleToggle = (dayValue: string) =>
    setOpeningHours((prev) =>
      prev.map((h) => (h.day === dayValue ? { ...h, isOpen: !h.isOpen } : h))
    );

  const handleTimeChange = (dayValue: string, field: 'openingTime' | 'closingTime', value: string) =>
    setOpeningHours((prev) =>
      prev.map((h) => (h.day === dayValue ? { ...h, [field]: value } : h))
    );

  const handleSave = async () => {
    if (!store) { toast.error('Store not found'); return; }

    try {
      const cleanedOpeningHours = openingHours.map(({ day, isOpen, openingTime, closingTime }) => ({
        day, isOpen, openingTime, closingTime,
      }));

      await updateStore({ storeId: store.id, openingHours: cleanedOpeningHours }).unwrap();
      toast.success('Opening hours updated successfully');
      navigate(-1);
    } catch (error: any) {
      toast.error(error?.data?.message?.[0] || 'Failed to update opening hours');
    }
  };

  return (
    <HomeLayout isLoading={false} showNavBar={false}>
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#F0F0F0] px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="w-5 h-5 text-[#101828]" />
        </button>
        <h1 className="text-[17px] font-semibold text-[#101828] font-[lora] tracking-tight">
          Edit opening hours
        </h1>
      </header>

      {/* Content */}
      <div className="max-w-[500px] px-6 py-8">
        <h2 className="text-[23px] font-bold text-[#0A0A0A] mb-8 tracking-tight font-[lora]">
          Store availability
        </h2>

        {/* Days list */}
        <div>
          {DAYS.map((day) => {
            const dayData = openingHours.find((h) => h.day === day.value);
            if (!dayData) return null;

            return (
              <div key={day.value} className="border-b border-[#F0F0F0] last:border-0 py-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[15px] font-medium text-[#101828]">{day.label}</span>
                  <button
                    type="button"
                    onClick={() => handleToggle(day.value)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      dayData.isOpen ? 'bg-[#FF71AA]' : 'bg-[#D0D5DD]'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        dayData.isOpen ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {dayData.isOpen && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#FAFAFA] px-3 py-2.5 rounded-xl">
                      <label className="block text-[12px] font-medium text-[#6C6C6C] mb-1.5">From</label>
                      <input
                        type="time"
                        value={dayData.openingTime}
                        onChange={(e) => handleTimeChange(day.value, 'openingTime', e.target.value)}
                        className="w-full bg-transparent text-[14px] font-medium text-[#101828] focus:outline-none"
                      />
                    </div>
                    <div className="bg-[#FAFAFA] px-3 py-2.5 rounded-xl">
                      <label className="block text-[12px] font-medium text-[#6C6C6C] mb-1.5">To</label>
                      <input
                        type="time"
                        value={dayData.closingTime}
                        onChange={(e) => handleTimeChange(day.value, 'closingTime', e.target.value)}
                        className="w-full bg-transparent text-[14px] font-medium text-[#101828] focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8">
          <Button variant="default" size="full" onClick={handleSave} loading={isLoading} disabled={isLoading}>
            Save changes
          </Button>
        </div>
      </div>
    </div>
    </HomeLayout>
  );
};

export default EditOpeningHours;
