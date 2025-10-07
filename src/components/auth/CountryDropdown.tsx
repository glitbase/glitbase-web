import React from 'react';

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

interface CountryDropdownProps {
  selectedCountry: Country;
  onSelectCountry: (country: Country) => void;
  error?: string;
}

export const CountryDropdown: React.FC<CountryDropdownProps> = ({
  selectedCountry,
  onSelectCountry,
  error,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Country of residence
      </label>
      <div className="relative">
        <select
          value={selectedCountry.code}
          onChange={(e) => {
            const country = countries.find((c) => c.code === e.target.value);
            if (country) {
              onSelectCountry(country);
            }
          }}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.flag} {country.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg
            className="h-4 w-4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};
