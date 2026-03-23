/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate } from 'react-router-dom';
import { Store } from '@/redux/vendor/storeSlice';

interface AboutProps {
  store: Store;
  isReadOnly?: boolean;
}

const About = ({ store, isReadOnly = false }: AboutProps) => {
  const navigate = useNavigate();

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  const displayOpeningHours = daysOfWeek.map((day) => {
    const found = store.openingHours?.find(
      (oh) => oh.day.toLowerCase() === day.toLowerCase()
    );
    return {
      day,
      isOpen: found?.isOpen || false,
      openingTime: found?.openingTime || '',
      closingTime: found?.closingTime || '',
    };
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Location */}
      {store.location && (
        <div className="bg-white rounded-lg">

          {/* Map */}
          {store.location.geoPoint?.coordinates && (
            <div className="w-full h-64 bg-gray-200 rounded-lg overflow-hidden">
              <iframe
                title="Store Location"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.google.com/maps?q=${store.location.geoPoint.coordinates[1]},${store.location.geoPoint.coordinates[0]}&z=15&output=embed`}
                allowFullScreen
              />
            </div>
          )}

          {/* Address */}
          <div className="my-4 flex justify-between items-center">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-[#0A0A0A] mt-0.5 mr-2 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <div>
                <p className="font-semibold text-[#0A0A0A] text-[14px]">
                  {store.location.name || store.location.address}
                </p>
                <p className="text-[#6C6C6C] text-[14px] font-medium">
                  {store.location.address}, {store.location.city}, {store.location.state}{' '}
                  {store.location.zipcode}
                </p>
              </div>
            </div>
            {!isReadOnly && (
              <button
                onClick={() => navigate('/vendor/store/edit-location')}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                title="Edit location"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Opening Hours */}
      <div className="bg-white rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[16px] font-semibold text-[#0A0A0A] mt-4">Opening Hours</h2>
          {!isReadOnly && (
            <button
              onClick={() => navigate('/vendor/store/edit-opening-hours')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
              title="Edit opening hours"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}
        </div>
        <div className="space-y-3">
          {displayOpeningHours.map((oh) => (
            <div
              key={oh.day}
              className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
            >
              <span className="font-medium text-[#0A0A0A] text-[14px]">{oh.day}</span>
              {oh.isOpen ? (
                <span className="text-[#6C6C6C] text-[14px] font-medium">
                  {formatTime(oh.openingTime)} - {formatTime(oh.closingTime)}
                </span>
              ) : (
                <span className="text-[#6C6C6C] text-[14px] font-medium">Closed</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;
