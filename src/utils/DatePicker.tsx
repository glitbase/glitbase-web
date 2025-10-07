import { useEffect, useRef, useState } from "react";
// @ts-ignore
import { Calendar } from "./Cal";
import { enUS } from "date-fns/locale";
import moment from "moment";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const DatePicker = () => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(null);

  const popoverRef: any = useRef(null);

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        toggleDatePicker();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popoverRef]);

  const toggleDatePicker = () => {
    setOpen(!open);
  };

  return (
    <div className="relative">
      <label className="text-base  text-left font-normal text-[#1F1F1F] ">
        Mailed Date
      </label>
      <div
        onClick={() => {
          toggleDatePicker();
        }}
        className="border-[#302D6340] cursor-pointer mt-2 h-14 bg-white  flex items-center justify-start text-2xl font-extrabold outline-none border-[1px] rounded-[4px] w-auto text-black px-2  focus:border-primary focus:border-2"
      >
        {!date ? (
          <div className="text-base font-normal text-black">mm/dd/yyyy</div>
        ) : (
          <div className="text-base font-normal text-black">
            {moment(date).format("MM / DD / YYYY")}
          </div>
        )}
      </div>

      {open && (
        <div className={`absolute -top-20 shadow-md `} ref={popoverRef}>
          <Calendar
            onChange={(date: any) => {
              setDate(date);
              toggleDatePicker();
            }}
            minDate={new Date()}
            maxDate={new Date(2100, 0, 1)}
            dateDisplayFormat="d"
            monthDisplayFormat="MMM yyyy"
            weekStartsOn={1}
            locale={enUS}
          />
        </div>
      )}
    </div>
  );
};

export default DatePicker;
