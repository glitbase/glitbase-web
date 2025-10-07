import React, { useState } from 'react';

export interface Country {
  name: string;
  flag: string;
  dialCode: string;
  code: string;
}

export const countries: Country[] = [
  {
    name: 'Nigeria',
    flag: '🇳🇬',
    dialCode: '+234',
    code: 'NG',
  },
  {
    name: 'United Kingdom',
    flag: '🇬🇧',
    dialCode: '+44',
    code: 'GB',
  },
];

interface CountrySelectorProps {
  selectedCountry: Country;
  onSelectCountry: (country: Country) => void;
  phoneNumber: string;
  onPhoneNumberChange: (value: string) => void;
  error?: string;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  selectedCountry,
  onSelectCountry,
  phoneNumber,
  onPhoneNumberChange,
  error,
}) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Phone number
      </label>
      <div
        className={`flex items-center border rounded-md shadow-sm focus-within:border-indigo-300 focus-within:ring focus-within:ring-indigo-200 focus-within:ring-opacity-50 ${
          error ? 'border-red-500' : 'border-gray-200'
        }`}
      >
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3 py-2 border-r border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <span className="text-xl">{selectedCountry.flag}</span>
          <span className="text-sm text-gray-700">{selectedCountry.dialCode}</span>
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, ''); // Only numbers
            onPhoneNumberChange(value);
          }}
          placeholder="Phone Number"
          maxLength={11}
          className="flex-1 px-3 py-2 border-none focus:ring-0 focus:outline-none"
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {/* Country Selection Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Select Country</h3>
            <div className="space-y-2">
              {countries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => {
                    onSelectCountry(country);
                    setShowModal(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors ${
                    selectedCountry.code === country.code ? 'bg-[#FFEFF6] border border-[#EE79A9]' : ''
                  }`}
                >
                  <span className="text-2xl">{country.flag}</span>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{country.name}</p>
                    <p className="text-sm text-gray-600">{country.dialCode}</p>
                  </div>
                  {selectedCountry.code === country.code && (
                    <div className="w-5 h-5 rounded-full bg-[#EE79A9] flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="mt-4 w-full py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
