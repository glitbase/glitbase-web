/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useGetMyStoreQuery, useUpdateStoreMutation } from '@/redux/vendor';
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

const StoreAvailability = () => {
  const navigate = useNavigate();
  const { data: storeData, refetch } = useGetMyStoreQuery({});
  const [updateStore, { isLoading }] = useUpdateStoreMutation();

  const store = storeData?.store;

  // Initialize with defaults only for new users (no existing hours)
  const getInitialHours = (): DayHours[] => {
    return DAYS.map((day) => ({
      day: day.value,
      isOpen: false,
      openingTime: '09:00',
      closingTime: '17:00',
    }));
  };

  const [openingHours, setOpeningHours] = useState<DayHours[]>(
    getInitialHours()
  );
  const [hasExistingHours, setHasExistingHours] = useState(false);

  // Load existing opening hours
  useEffect(() => {
    if (store?.openingHours && store.openingHours.length > 0) {
      // User has existing hours - use them and fill missing days with isOpen: false
      const merged = DAYS.map((day) => {
        const existing = store.openingHours.find(
          (h: DayHours) => h.day === day.value
        );
        if (existing) {
          // Ensure time format is HH:mm (24-hour format) without timezone conversion
          return {
            ...existing,
            openingTime: existing.openingTime?.substring(0, 5) || '09:00',
            closingTime: existing.closingTime?.substring(0, 5) || '17:00',
          };
        }
        // For days not in existing data, set isOpen: false with default times
        // (needed in case user wants to toggle these days on later)
        return {
          day: day.value,
          isOpen: false,
          openingTime: '09:00',
          closingTime: '17:00',
        };
      });
      setOpeningHours(merged);
      setHasExistingHours(true);
    } else if (store) {
      // Store exists but no hours set - use defaults for first-time setup
      setOpeningHours(getInitialHours());
      setHasExistingHours(false);
    }
  }, [store]);

  const handleToggle = (dayValue: string) => {
    setOpeningHours((prev) =>
      prev.map((h) => (h.day === dayValue ? { ...h, isOpen: !h.isOpen } : h))
    );
  };

  const handleTimeChange = (
    dayValue: string,
    field: 'openingTime' | 'closingTime',
    value: string
  ) => {
    setOpeningHours((prev) =>
      prev.map((h) => (h.day === dayValue ? { ...h, [field]: value } : h))
    );
  };

  // Check if all days have been configured (either set as open with times, or explicitly closed)
  // Only required for vendors who haven't set hours yet
  const allDaysConfigured = () => {
    // If vendor already has hours set, they can save anytime
    if (hasExistingHours) return true;

    // For new configuration, at least one day must be marked as open
    const hasAtLeastOneOpenDay = openingHours.some((h) => h.isOpen);
    return hasAtLeastOneOpenDay;
  };

  const handleSave = async () => {
    try {
      // Strip out _id field from opening hours before sending
      const cleanedOpeningHours = openingHours.map(
        ({ day, isOpen, openingTime, closingTime }) => ({
          day,
          isOpen,
          openingTime,
          closingTime,
        })
      );

      await updateStore({
        storeId: store.id,
        openingHours: cleanedOpeningHours,
      }).unwrap();

      toast.success('Store hours updated successfully');
      setHasExistingHours(true); // Update state after successful save
      refetch();
    } catch (error) {
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message?.[0] || 'Failed to update store hours');
    }
  };

  return (
    <HomeLayout
      isLoading={false}
      showNavBar={false}
      onSearch={() => {}}
      onLocationChange={() => {}}
    >
      <div className="min-h-screen bg-white">
        <div className="max-w-[600px] mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[14px] text-[#667085] mb-6">
            <button
              onClick={() => navigate('/settings')}
              className="hover:text-[#101828]"
            >
              Settings
            </button>
            <span>/</span>
            <button
              onClick={() =>
                navigate('/settings', { state: { tab: 'operations' } })
              }
              className="hover:text-[#101828]"
            >
              Operations
            </button>
            <span>/</span>
            <span className="text-[#101828]">Store availability</span>
          </div>

          {/* Header */}
          <h1 className="text-[28px] font-semibold text-[#101828] mb-8">
            Store availability
          </h1>

          {/* Days List */}
          <div className="space-y-0">
            {DAYS.map((day) => {
              const dayData = openingHours.find((h) => h.day === day.value);
              if (!dayData) return null;

              return (
                <div
                  key={day.value}
                  className="border-b border-gray-200 last:border-b-0 py-6"
                >
                  {/* Day Header with Toggle */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[16px] font-semibold text-[#101828]">
                      {day.label}
                    </h3>
                    <button
                      onClick={() => handleToggle(day.value)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        dayData.isOpen ? 'bg-[#FF71AA]' : 'bg-[#D0D5DD]'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          dayData.isOpen ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Time Inputs */}
                  {dayData.isOpen && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#FAFAFA] p-2 rounded-lg">
                        <label className="block text-[12px] text-[#667085] mb-2">
                          From
                        </label>
                        <div className="relative">
                          <input
                            type="time"
                            value={dayData.openingTime}
                            onChange={(e) =>
                              handleTimeChange(
                                day.value,
                                'openingTime',
                                e.target.value
                              )
                            }
                            className="w-full px-4 py-2.5 bg-transparent rounded-lg text-[14px] focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="bg-[#FAFAFA] p-2 rounded-lg">
                        <label className="block text-[12px] text-[#667085] mb-2">
                          To
                        </label>
                        <div className="relative">
                          <input
                            type="time"
                            value={dayData.closingTime}
                            onChange={(e) =>
                              handleTimeChange(
                                day.value,
                                'closingTime',
                                e.target.value
                              )
                            }
                            className="w-full px-4 py-2.5 bg-transparent rounded-lg text-[14px] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Save Button */}
          <div className="mt-8">
            <button
              onClick={handleSave}
              disabled={isLoading || !allDaysConfigured()}
              className="w-full px-4 py-3 text-[16px] font-medium text-white bg-[#3D7B22] rounded-full hover:bg-[#2d5c19] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save changes'}
            </button>
            {!hasExistingHours && !allDaysConfigured() && (
              <p className="mt-2 text-[12px] text-[#667085] text-center">
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
