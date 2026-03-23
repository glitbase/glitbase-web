import { useState } from 'react';

export interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

export const countries: Country[] = [
  {
    name: 'Nigeria',
    code: 'NG',
    dialCode: '+234',
    flag: "https://cdn-icons-png.flaticon.com/128/5922/5922004.png",
  },
  {
    name: 'United Kingdom',
    code: 'GB',
    dialCode: '+44',
    flag: "https://cdn-icons-png.flaticon.com/128/8363/8363075.png",
  },
];

interface CountryDropdownProps {
  selectedCountry: Country | null;
  onSelectCountry: (country: Country) => void;
}

export const CountryDropdown = ({
  selectedCountry,
  onSelectCountry,
}: CountryDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-[#0A0A0A] mb-1">
      Country of residence
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 h-[50px] rounded-lg text-left flex justify-between items-center bg-[#FAFAFA] transition-colors"
      >
        <div className="flex items-center gap-2">
          {selectedCountry ? (
            <>
              <img src={selectedCountry?.flag} alt={selectedCountry?.name} className="w-5 h-5" />
              <span className="text-[#3B3B3B] font-medium text-sm">{selectedCountry?.name}</span>
            </>
          ) : (
            <span className="text-[#9D9D9D] font-medium text-sm">Country</span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-2 bg-white rounded-md shadow-sm">
            {countries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => {
                  onSelectCountry(country);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                  selectedCountry?.code === country.code ? 'bg-[#FFEFF6]' : ''
                }`}
              >
                <img src={country.flag} alt={country.name} className="w-5 h-5" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-[#0A0A0A]">{country.name}</p>
                </div>
                {selectedCountry?.code === country.code && (
                  <svg
                    className="w-5 h-5 text-[#CC5A88]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
