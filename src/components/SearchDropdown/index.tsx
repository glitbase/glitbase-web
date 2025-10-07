import { useState, useEffect, useRef } from "react";
import { IoSearchOutline } from "react-icons/io5";
import { IoClose } from "react-icons/io5";
import { Input } from "../Inputs/TextInput";
import View from "@/assets/images/view.svg";
import Search from "@/assets/images/search.svg";
import { useNavigate } from "react-router-dom";

interface SearchDropdownProps {
  onSearch?: (value: string) => void;
  items: any[]; 
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({ onSearch, items }) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const filteredResults = items?.filter(
    (item: any) =>
      item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item?.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const handleSearch = (term: string) => {
    if (term.trim()) {
      const updatedSearches = [
        term,
        ...recentSearches.filter((s) => s !== term),
      ].slice(0, 5);
      setRecentSearches(updatedSearches);
      localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));

      const results = items?.filter(
        (item: any) =>
          item?.name?.toLowerCase().includes(term.toLowerCase()) ||
          item?.description?.toLowerCase().includes(term.toLowerCase())
      );

      if (results && results.length > 0) {
        if (onSearch) {
          onSearch(term);
        }

        navigate("/", { state: { searchTerm: term } });
      } else {
        if (onSearch) {
          onSearch(term);
        }
        setShowDropdown(false);
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    handleSearch(suggestion);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setShowDropdown(false);
    if (onSearch) {
      onSearch("");
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
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
          className="pl-10 pr-10 py-2 rounded-[50px] border border-gray-300 w-full focus:outline-none focus:ring-2 focus:ring-[#B73F79] focus:border-transparent"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleInputKeyDown}
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <IoSearchOutline size={18} />
        </div>
        {searchTerm && (
          <button
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={clearSearch}
          >
            <IoClose size={18} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-[56px] left-0 right-0 mt-2 bg-white rounded-b-[20px] w-[230px] md:w-[600px] lg:w-[1000px] shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          {searchTerm && filteredResults?.length > 0 && (
            <div className="p-6">
              <p className="text-[20px] font-[lora] font-medium text-black px-3 py-2">
                Searching "{searchTerm}"
              </p>
              {filteredResults?.map((result: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 cursor-pointer rounded-md"
                  onClick={() => handleSuggestionClick(result.name)}
                >
                  <div className="flex items-center">
                    <img
                      src={Search}
                      className="w-[20px] mt-1 mr-2 h-[20px] cursor-pointer"
                      alt="Search icon"
                    />
                    <span className="text-[16px] font-[raleway]">{result.name}</span>
                  </div>
                  <img
                    src={View}
                    className="w-[15px] mt-1 h-[15px] cursor-pointer"
                    alt="View icon"
                  />
                </div>
              ))}
            </div>
          )}

          {recentSearches.length > 0 && (
            <div className="p-6 border-t border-gray-200">
              <p className="text-[20px] font-[lora] font-medium text-black px-3 py-2">
                Recent searches
              </p>
              {recentSearches.map((term, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 cursor-pointer rounded-md"
                  onClick={() => handleSuggestionClick(term)}
                >
                  <div className="flex items-center">
                    <img
                      src={Search}
                      className="w-[20px] mt-1 mr-2 h-[20px] cursor-pointer"
                      alt="Search icon"
                    />
                    <span className="text-[16px] font-[raleway]">{term}</span>
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

          {searchTerm && filteredResults?.length === 0 && (
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