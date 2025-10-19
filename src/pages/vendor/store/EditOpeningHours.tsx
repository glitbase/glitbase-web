/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useUpdateStoreMutation } from '@/redux/vendor';
import { toast } from 'react-toastify';

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

const EditOpeningHours = () => {
  const navigate = useNavigate();
  const store = useSelector((state: RootState) => state.vendorStore.store);
  const [updateStore, { isLoading }] = useUpdateStoreMutation();
  const [openingHours, setOpeningHours] = useState<DayHours[]>([]);

  // Initialize opening hours from store
  useEffect(() => {
    if (store?.openingHours && store.openingHours.length > 0) {
      const merged = DAYS.map((day) => {
        const existing = store.openingHours.find(
          (h: DayHours) => h.day === day.value
        );
        if (existing) {
          return {
            ...existing,
            openingTime: existing.openingTime?.substring(0, 5) || '09:00',
            closingTime: existing.closingTime?.substring(0, 5) || '17:00',
          };
        }
        return {
          day: day.value,
          isOpen: false,
          openingTime: '09:00',
          closingTime: '17:00',
        };
      });
      setOpeningHours(merged);
    } else if (store) {
      const initial = DAYS.map((day) => ({
        day: day.value,
        isOpen: false,
        openingTime: '09:00',
        closingTime: '17:00',
      }));
      setOpeningHours(initial);
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

  const handleSaveHours = async () => {
    if (!store) {
      toast.error('Store not found');
      return;
    }

    try {
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

      toast.success('Opening hours updated successfully');
      navigate('/vendor/store');
    } catch (error: any) {
      toast.error(error?.data?.message?.[0] || 'Failed to update opening hours');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b sticky top-0 bg-white z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Edit opening hours</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-full font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveHours}
                disabled={isLoading}
                className="px-6 py-2 bg-[#4C9A2A] text-white rounded-full font-medium hover:bg-[#3d7a22] disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
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
                    <div className="bg-[#FAFAFA] p-2 rounded-lg">
                      <label className="block text-[12px] text-[#667085] mb-2">
                        To
                      </label>
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
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EditOpeningHours;
