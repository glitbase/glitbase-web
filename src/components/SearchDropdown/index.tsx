/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from 'react';
import { IoSearchOutline } from 'react-icons/io5';
import { IoClose } from 'react-icons/io5';
import { Input } from '../Inputs/TextInput';
import View from '@/assets/images/view.svg';
import Search from '@/assets/images/search.svg';
import { useNavigate } from 'react-router-dom';
import { useServiceSearch } from '@/hooks/useServiceSearch';

interface SearchDropdownProps {
  onSearch?: (value: string) => void;
  items?: any[];
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  // Use the fuzzy search hook
  const { suggestions, getTrendingSearches } =
    useServiceSearch(debouncedSearchTerm);

  // Debounce search term
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const handleSearch = useCallback(
    (term: string) => {
      if (term.trim()) {
        const updatedSearches = [
          term,
          ...recentSearches.filter((s) => s !== term),
        ].slice(0, 5);
        setRecentSearches(updatedSearches);
        localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));

        if (onSearch) {
          onSearch(term);
        }

        // Navigate to search results page
        navigate(`/search?q=${encodeURIComponent(term)}`);
        setShowDropdown(false);
      }
    },
    [recentSearches, onSearch, navigate]
  );

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    handleSearch(suggestion);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowDropdown(false);
    if (onSearch) {
      onSearch('');
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchTerm);
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <Input
          type="text"
          placeholder="Search"
          className="pl-10 pr-10 py-2 !rounded-xl w-full focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleInputKeyDown}
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <IoSearchOutline size={18} color='#3B3B3B' />
        </div>
        {searchTerm && (
          <button
            className="absolute right-3 top-1/2 bg-[#0A0A0A14] rounded-full p-1 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={clearSearch}
          >
            <IoClose size={18} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-[56px] left-0 right-0 mt-2 px-4 py-6 bg-white rounded-2xl w-full min-w-full shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Live suggestions from fuzzy search */}
          {searchTerm && suggestions.length > 0 && (
            <div className="w-full min-w-0">
              <p className="font-medium text-black">
                Searching "{searchTerm}"
              </p>
              {suggestions.map((suggestion, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between w-full px-3 py-2 hover:bg-gray-100 cursor-pointer rounded-md"
                  onClick={() => handleSuggestionClick(suggestion.name)}
                >
                  <div className="flex items-center">
                    <img
                      src={Search}
                      className="w-[20px] mt-1 mr-2 h-[20px] cursor-pointer"
                      alt="Search icon"
                    />
                    <div className="flex flex-col">
                      <span className="text-[14px] font-medium font-[lora] capitalize">
                        {suggestion.name}
                      </span>
                      {suggestion.category && (
                        <span className="text-[12px] font-medium text-gray-500 capitalize">
                          {suggestion.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <img
                    src={View}
                    className="w-[12px] mt-1 cursor-pointer"
                    alt="View icon"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Trending Searches - shown when no search term */}
          {!searchTerm && recentSearches.length === 0 && (
            <div>
              <p className="font-medium text-primary-text mb-4">
                Trending Searches
              </p>
              <div className="flex flex-wrap gap-2">
                {getTrendingSearches().map((term, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(term)}
                    className="px-4 py-2 bg-[#F5F5F5] hover:bg-[#E8E8E8] rounded-full text-[14px] font-medium text-[#3B3B3B] transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent searches */}
          {!searchTerm && recentSearches.length > 0 && (
            <div>
              <p className="font-medium text-primary-text mb-4">
                Recent searches
              </p>
              {recentSearches.map((term, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between w-full px-3 py-2 hover:bg-gray-100 cursor-pointer rounded-md"
                  onClick={() => handleSuggestionClick(term)}
                >
                  <div className="flex items-center">
                    <img
                      src={Search}
                      className="w-[20px] mt-1 mr-2 h-[20px] cursor-pointer"
                      alt="Search icon"
                    />
                    <span className="text-[14px] font-medium font-[lora]">{term}</span>
                  </div>
                  <img
                    src={View}
                    className="w-[14px] mt-1 h-[15px] cursor-pointer"
                    alt="View icon"
                  />
                </div>
              ))}
            </div>
          )}

          {searchTerm && suggestions.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No results found for "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;
