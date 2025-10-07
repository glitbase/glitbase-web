import { useState } from "react";

type PlainInputType = {
  value?: string | number;
  onChange?: any;
  name?: string;
  placeholder?: string;
};
const SearchInput = ({
  value,
  onChange,
  name,
  placeholder = "",
}: PlainInputType) => {
  const [focus, setFocus] = useState(false);
  return (
    <div
      className={`${
        focus ? "border-primary" : "border-[#EAF0F5]"
      } bg-[#e3e6ec59] h-[50px] rounded-[8px] w-full px-3 font-normal flex items-center space-x-3`}
    >
      <svg
        width="25"
        height="25"
        viewBox="0 0 25 25"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M11.1055 19.875C15.5237 19.875 19.1055 16.2933 19.1055 11.875C19.1055 7.45672 15.5237 3.875 11.1055 3.875C6.68719 3.875 3.10547 7.45672 3.10547 11.875C3.10547 16.2933 6.68719 19.875 11.1055 19.875Z"
          stroke="#200E32"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M21.1039 21.8734L16.7539 17.5234"
          stroke="#200E32"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        name={name}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        className={`outline-none border-none placeholder:text-[#808191] placeholder:text-[13px] placeholder:font-medium w-full h-full bg-[#e3e6ec00]`}
      />
    </div>
  );
};

export default SearchInput;
