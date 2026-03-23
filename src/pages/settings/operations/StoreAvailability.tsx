/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import HomeLayout from '@/layout/home/HomeLayout';
import { Button } from '@/components/Buttons';
import { useGetMyStoreQuery, useUpdateStoreMutation } from '@/redux/vendor';

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

const StoreAvailability = () => {
  const navigate = useNavigate();
  const { data: storeData, refetch } = useGetMyStoreQuery({});
  const [updateStore, { isLoading }] = useUpdateStoreMutation();

  const store = storeData?.store;

  const [openingHours, setOpeningHours] = useState<DayHours[]>(getInitialHours());
  const [hasExistingHours, setHasExistingHours] = useState(false);

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
      setHasExistingHours(true);
    } else if (store) {
      setOpeningHours(getInitialHours());
      setHasExistingHours(false);
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

  const allDaysConfigured = () =>
    hasExistingHours || openingHours.some((h) => h.isOpen);

  const handleSave = async () => {
    try {
      const cleanedOpeningHours = openingHours.map(({ day, isOpen, openingTime, closingTime }) => ({
        day, isOpen, openingTime, closingTime,
      }));

      await updateStore({ storeId: store.id, openingHours: cleanedOpeningHours }).unwrap();
      toast.success('Store hours updated successfully');
      setHasExistingHours(true);
      refetch();
    } catch (error) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || 'Failed to update store hours');
    }
  };

  return (
    <HomeLayout isLoading={false} showNavBar={false}>
      <div className="min-h-screen bg-white">
        <div className="max-w-[500px] px-6 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[14px] mb-6">
            <button
              onClick={() => navigate('/settings')}
              className="text-[#6C6C6C] hover:text-[#344054] font-medium"
            >
              Settings
            </button>
            <span className="text-[#6C6C6C]">/</span>
            <button
              onClick={() => navigate('/settings', { state: { tab: 'operations' } })}
              className="text-[#6C6C6C] hover:text-[#344054] font-medium"
            >
              Operations
            </button>
            <span className="text-[#6C6C6C]">/</span>
            <span className="text-[#101828] font-medium">Store availability</span>
          </div>

          {/* Title */}
          <h1 className="text-[23px] font-bold text-[#0A0A0A] mb-8 tracking-tight font-[lora]">
            Store availability
          </h1>

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
                        <label className="block text-[12px] font-medium text-[#6C6C6C] mb-1.5">
                          From
                        </label>
                        <input
                          type="time"
                          value={dayData.openingTime}
                          onChange={(e) => handleTimeChange(day.value, 'openingTime', e.target.value)}
                          className="w-full bg-transparent text-[14px] font-medium text-[#101828] focus:outline-none"
                        />
                      </div>
                      <div className="bg-[#FAFAFA] px-3 py-2.5 rounded-xl">
                        <label className="block text-[12px] font-medium text-[#6C6C6C] mb-1.5">
                          To
                        </label>
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

          {/* Save */}
          <div className="mt-8">
            <Button
              onClick={handleSave}
              disabled={isLoading || !allDaysConfigured()}
              variant="default"
              size="full"
              loading={isLoading}
            >
              Save changes
            </Button>
            {!hasExistingHours && !allDaysConfigured() && (
              <p className="mt-2 text-[12px] text-[#6C6C6C] font-medium text-center">
                Please set at least one day as open to save your store hours
              </p>
            )}
          </div>
        </div>
      </div>
    </HomeLayout>
  );
};

export default StoreAvailability;
