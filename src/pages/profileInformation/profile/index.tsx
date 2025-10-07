import { useAppSelector } from "@/hooks/redux-hooks";
import { Typography } from "@/components/Typography";
import { Input } from "@/components/Inputs/TextInput";
import { CustomSelect } from "@/components/Inputs/SelectInput";
import { useState } from "react";
import { Button } from "@/components/Buttons";

const ProfileTab = () => {
  const user = useAppSelector((state) => state.auth.user);

  const [country, setCountry] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [city, setCity] = useState<{ value: string; label: string } | null>(
    null
  );
  const [state, setState] = useState<{ value: string; label: string } | null>(
    null
  );
  const [loading] = useState(false);

  const countryOptions = [
    { label: "United States", value: "us" },
    { label: "Canada", value: "ca" },
  ];
  const cityOptions = [
    { label: "New York", value: "new-york" },
    { label: "Toronto", value: "toronto" },
  ];
  const stateOptions = [
    { label: "New York", value: "ny" },
    { label: "Ontario", value: "on" },
  ];

  return (
    <>
      <div className="mb-6">
        <Typography className="font-[lora] text-[18px] mb-5">
          Personal Information
        </Typography>
        <div className="flex justify-between gap-3">
          <div className="flex-auto">
            <Input
              value={user?.firstName}
              placeholder="Enter first name"
              readOnly
              className="py-4 font-[lora] text-[#98A2B3]"
            />
          </div>
          <div className="flex-auto">
            <Input
              value={user?.lastName}
              placeholder="Enter last name"
              readOnly
              className="py-4 font-[lora] text-[#98A2B3]"
            />
          </div>
        </div>
        <div className="mt-4">
          <Input
            value={user?.email}
            placeholder="Enter email address"
            type="email"
            readOnly
            className="py-4 font-[lora] text-[#98A2B3]"
          />
        </div>
        <div className="mt-4">
          <Input
            value={user?.phoneNumber}
            placeholder="Enter phone number"
            readOnly
            className="py-4 font-[lora] text-[#98A2B3]"
          />
        </div>
      </div>

      {user?.activeRole === "vendor" && (
        <div>
          <Typography className="font-[lora] text-[18px] mb-5">
            Location Information
          </Typography>
          <div className="mt-4">
            <Input placeholder="Address" className="py-4 font-[lora] " />
          </div>
          <div className="flex justify-between mt-4 gap-3">
            <div className="flex-auto">
              <CustomSelect
                placeholder="Country/Region"
                options={countryOptions}
                value={country}
                onChange={(selectedOption) =>
                  setCountry(
                    selectedOption as { value: string; label: string } | null
                  )
                }
                className="font-[lora] !py-6 text-[#98A2B3]"
              />
            </div>
            <div className="flex-auto">
              <CustomSelect
                placeholder="City"
                options={cityOptions}
                value={city}
                onChange={(selectedOption) =>
                  setCity(
                    selectedOption as { value: string; label: string } | null
                  )
                }
                className="!py-6 font-[lora] text-[#98A2B3]"
              />
            </div>
            <div className="flex-auto">
              <CustomSelect
                placeholder="State"
                options={stateOptions}
                value={state}
                onChange={(selectedOption) =>
                  setState(
                    selectedOption as { value: string; label: string } | null
                  )
                }
                className="!py-6 font-[lora] text-[#98A2B3]"
              />
            </div>
          </div>
          <div className="my-8">
            <Button
              variant="default"
              size="full"
              type="submit"
              className="mt-1 py-6 rounded-[60px] font-[inter]"
              loading={loading}
              disabled={loading}
            >
              Save changes
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileTab;
