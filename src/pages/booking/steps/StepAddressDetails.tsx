import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { BookingFormData } from '../CreateBooking';
import { toast } from 'react-toastify';

interface AddressData {
  address: string;
  apartment: string;
  city: string;
  postalCode: string;
  additionalDirections: string;
}

const emptyAddress = (): AddressData => ({
  address: '', apartment: '', city: '', postalCode: '', additionalDirections: '',
});

const parseAddress = (json?: string): AddressData => {
  if (!json) return emptyAddress();
  try { return { ...emptyAddress(), ...JSON.parse(json) }; }
  catch { return emptyAddress(); }
};

interface Props {
  formData: BookingFormData;
  updateFormData: (data: Partial<BookingFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const AddressForm: React.FC<{
  data: AddressData;
  onChange: (data: AddressData) => void;
  disabled?: boolean;
  label?: string;
}> = ({ data, onChange, disabled = false, label = 'Home address' }) => (
  <div className="space-y-3">
    <div>
      <label className="text-[13px] text-[#555] font-medium block mb-1">{label}</label>
      <input
        type="text"
        value={data.address}
        onChange={(e) => !disabled && onChange({ ...data, address: e.target.value })}
        disabled={disabled}
        placeholder="Street address"
        className="w-full rounded-xl bg-[#F5F5F5] border-transparent px-3 py-3 text-[14px] text-[#0A0A0A] placeholder-[#AAAAAA] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#4C9A2A]/30"
      />
    </div>
    <div>
      <label className="text-[13px] text-[#555] font-medium block mb-1">
        Apartment, suite, etc. (optional)
      </label>
      <input
        type="text"
        value={data.apartment}
        onChange={(e) => !disabled && onChange({ ...data, apartment: e.target.value })}
        disabled={disabled}
        placeholder="Apt, suite, etc."
        className="w-full rounded-xl bg-[#F5F5F5] border-transparent px-3 py-3 text-[14px] text-[#0A0A0A] placeholder-[#AAAAAA] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#4C9A2A]/30"
      />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-[13px] text-[#555] font-medium block mb-1">City</label>
        <input
          type="text"
          value={data.city}
          onChange={(e) => !disabled && onChange({ ...data, city: e.target.value })}
          disabled={disabled}
          placeholder="City"
          className="w-full rounded-xl bg-[#F5F5F5] border-transparent px-3 py-3 text-[14px] text-[#0A0A0A] placeholder-[#AAAAAA] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#4C9A2A]/30"
        />
      </div>
      <div>
        <label className="text-[13px] text-[#555] font-medium block mb-1">Postal code</label>
        <input
          type="text"
          value={data.postalCode}
          onChange={(e) => !disabled && onChange({ ...data, postalCode: e.target.value })}
          disabled={disabled}
          placeholder="Postal code"
          className="w-full rounded-xl bg-[#F5F5F5] border-transparent px-3 py-3 text-[14px] text-[#0A0A0A] placeholder-[#AAAAAA] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#4C9A2A]/30"
        />
      </div>
    </div>
    <div>
      <label className="text-[13px] text-[#555] font-medium block mb-1">
        Additional directions (optional)
      </label>
      <textarea
        value={data.additionalDirections}
        onChange={(e) => !disabled && onChange({ ...data, additionalDirections: e.target.value })}
        disabled={disabled}
        rows={3}
        placeholder="Any landmarks or special directions to help us find you..."
        className="w-full rounded-xl bg-[#F5F5F5] border-transparent px-3 py-3 text-[14px] text-[#0A0A0A] placeholder-[#AAAAAA] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#4C9A2A]/30 resize-none"
      />
    </div>
  </div>
);

const StepAddressDetails: React.FC<Props> = ({ formData, updateFormData, onNext, onBack }) => {
  const isHome = formData.serviceType === 'home';
  const isPickDrop = formData.serviceType === 'pickDrop';

  const [homeAddr, setHomeAddr] = useState<AddressData>(() => parseAddress(formData.contactAddress));
  const [pickupAddr, setPickupAddr] = useState<AddressData>(() => parseAddress(formData.pickupAddress));
  const [dropoffAddr, setDropoffAddr] = useState<AddressData>(() => parseAddress(formData.dropoffAddress));
  const [sameAsPickup, setSameAsPickup] = useState(() => {
    if (formData.pickupAddress && formData.dropoffAddress) {
      return formData.pickupAddress === formData.dropoffAddress;
    }
    return false;
  });
  const [pickupOpen, setPickupOpen] = useState(true);
  const [dropoffOpen, setDropoffOpen] = useState(false);

  useEffect(() => {
    if (sameAsPickup) setDropoffAddr({ ...pickupAddr });
  }, [pickupAddr, sameAsPickup]);

  const isValid = () => {
    if (isHome) {
      return homeAddr.address.trim() && homeAddr.city.trim() && homeAddr.postalCode.trim();
    }
    if (isPickDrop) {
      const finalDropoff = sameAsPickup ? pickupAddr : dropoffAddr;
      return (
        pickupAddr.address.trim() && pickupAddr.city.trim() && pickupAddr.postalCode.trim() &&
        finalDropoff.address.trim() && finalDropoff.city.trim() && finalDropoff.postalCode.trim()
      );
    }
    return false;
  };

  const handleContinue = () => {
    if (!isValid()) {
      toast.error('Please complete all required address fields');
      return;
    }

    if (isHome) {
      updateFormData({ contactAddress: JSON.stringify(homeAddr) });
    }
    if (isPickDrop) {
      const finalDropoff = sameAsPickup ? pickupAddr : dropoffAddr;
      updateFormData({
        pickupAddress: JSON.stringify(pickupAddr),
        dropoffAddress: JSON.stringify(finalDropoff),
      });
    }
    onNext();
  };

  return (
    <div className="flex flex-col min-h-full mt-12">
      <button onClick={onBack} className="flex items-center w-fit text-[#6B7280] hover:text-[#0A0A0A] transition-colors mb-6 -ml-1" aria-label="Go back">
        <ArrowLeft size={20} strokeWidth={2} color="#3B3B3B" />
      </button>

      <h2 className="text-[22px] font-bold text-[#0A0A0A] mb-2 font-[lora] tracking-tight">
        {isHome ? 'Enter your home address' : 'Pickup & dropoff details'}
      </h2>
      <p className="text-[15px] text-[#8A8A8A] mb-6 font-medium">
        {isHome
          ? 'Please provide your complete home address so our service provider can locate you'
          : 'Provide pickup and dropoff locations for your service'}
      </p>

      <div className="flex-1 overflow-y-auto space-y-4">
        {isHome && <AddressForm data={homeAddr} onChange={setHomeAddr} />}

        {isPickDrop && (
          <>
            {/* Pickup accordion */}
            <div>
              <button
                className="w-full flex items-center justify-between py-3 border-b border-[#F0F0F0]"
                onClick={() => setPickupOpen(!pickupOpen)}
              >
                <span className="font-medium text-[15px] text-[#0A0A0A]">Pickup location</span>
                {pickupOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {pickupOpen && (
                <div className="pt-4">
                  <AddressForm data={pickupAddr} onChange={setPickupAddr} label="Pickup address" />
                </div>
              )}
            </div>

            {/* Dropoff accordion */}
            <div>
              <button
                className="w-full flex items-center justify-between py-3 border-b border-[#F0F0F0]"
                onClick={() => setDropoffOpen(!dropoffOpen)}
              >
                <span className="font-medium text-[15px] text-[#0A0A0A]">Dropoff location</span>
                {dropoffOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {dropoffOpen && (
                <div className="pt-4 space-y-4">
                  {/* Same as pickup toggle */}
                  <button
                    className="flex items-center gap-3"
                    onClick={() => {
                      const next = !sameAsPickup;
                      setSameAsPickup(next);
                      if (!next) setDropoffAddr(emptyAddress());
                    }}
                  >
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${
                        sameAsPickup ? 'bg-[#4C9A2A] border-[#4C9A2A]' : 'border-[#D0D0D0]'
                      }`}
                    >
                      {sameAsPickup && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className="text-[14px] font-medium text-[#0A0A0A]">Same as pickup location</span>
                  </button>

                  <AddressForm
                    data={dropoffAddr}
                    onChange={setDropoffAddr}
                    disabled={sameAsPickup}
                    label="Dropoff address"
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Continue button */}
      <div className="pt-6">
        <button
          onClick={handleContinue}
          disabled={!isValid()}
          className="w-full bg-[#4C9A2A] text-white rounded-full py-3.5 font-semibold text-[15px] hover:bg-[#3d7a22] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default StepAddressDetails;
