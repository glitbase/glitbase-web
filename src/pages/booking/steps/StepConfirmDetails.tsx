import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { ArrowLeft, ChevronLeft, ImagePlus, Lock, Trash2 } from 'lucide-react';
import { BookingFormData } from '../CreateBooking';
import { toast } from 'react-toastify';
import { uploadImageToCloudinary } from '@/utils/cloudinaryUtils';

interface Props {
  formData: BookingFormData;
  updateFormData: (data: Partial<BookingFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const StepConfirmDetails: React.FC<Props> = ({ formData, updateFormData, onNext, onBack }) => {
  const user = useSelector((state: any) => state.auth?.user);

  const parseContactNotes = () => {
    if (!formData.contactNotes) return null;
    try { return JSON.parse(formData.contactNotes); } catch { return null; }
  };

  const parseImages = (): string[] => {
    if (!formData.additionalImages) return [];
    try { return JSON.parse(formData.additionalImages); } catch { return []; }
  };

  const savedContact = parseContactNotes();

  const [phoneNumber, setPhoneNumber] = useState(() => {
    if (savedContact?.phoneNumber) return savedContact.phoneNumber;
    return user?.phoneNumber || '';
  });
  const [additionalNotes, setAdditionalNotes] = useState(formData.additionalNotes || '');
  const [images, setImages] = useState<string[]>(parseImages);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length >= 3) {
      toast.error('Maximum 3 images allowed');
      return;
    }

    setUploading(true);
    try {
      const remaining = 3 - images.length;
      const toUpload = Array.from(files).slice(0, remaining);
      const urls = await Promise.all(toUpload.map((f) => uploadImageToCloudinary(f)));
      setImages((prev) => [...prev, ...urls]);
    } catch {
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleContinue = () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    updateFormData({
      contactNotes: JSON.stringify({
        name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        email: user?.email || '',
        phoneNumber: phoneNumber.trim(),
      }),
      additionalNotes,
      additionalImages: JSON.stringify(images),
    });

    onNext();
  };

  return (
    <div className="flex flex-col min-h-full">
      <button onClick={onBack} className="flex items-center w-fit text-[#6B7280] hover:text-[#0A0A0A] transition-colors mb-6 -ml-1" aria-label="Go back">
        <ArrowLeft size={20} strokeWidth={2} color="#3B3B3B" />
      </button>

      <h2 className="text-[24px] font-bold text-[#0A0A0A] mb-2 font-[lora] tracking-tight">Confirm your booking details</h2>
      <p className="text-[16px] text-[#6C6C6C] mb-6 font-medium max-w-[340px]">
        Please verify your contact information before proceeding.
      </p>

      <div className="flex items-start gap-4 p-4 bg-[#FFF8E6] rounded-xl mb-8">
        <Lock size={34} color="#E4AA05" className="text-[#6C6C6C] -mt-1" />
        <p className="text-[14px] text-[#6C6C6C] font-medium">
        Please review your provider policies and FAQs before booking. Late arrivals may lose their spot and other important terms apply.
        </p>
      </div>

      <div className="flex-1 space-y-4">
        {/* Full name - disabled */}
        <div>
          <label className="text-[14px] text-[#3B3B3B] font-medium block mb-1">Full name</label>
          <div className="w-full rounded-xl bg-[#FAFAFA] px-3 py-3 opacity-60">
            <span className="text-[14px] text-[#9D9D9D] font-medium">
              {user?.firstName} {user?.lastName}
            </span>
          </div>
        </div>

        {/* Email - disabled */}
        <div>
          <label className="text-[14px] text-[#3B3B3B] font-medium block mb-1">Email address</label>
          <div className="w-full rounded-xl bg-[#F5F5F5] px-3 py-3 opacity-60">
            <span className="text-[14px] text-[#9D9D9D] font-medium">{user?.email}</span>
          </div>
        </div>

        {/* Phone number */}
        <div>
          <label className="text-[14px] text-[#3B3B3B] font-medium block mb-1">Phone number</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+44 XXXX XXXXXX"
            className="w-full rounded-xl bg-[#F5F5F5] border-transparent font-medium px-3 py-3 text-[14px] text-[#0A0A0A] placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#4C9A2A]/30"
          />
        </div>

        {/* Additional notes */}
        <div>
          <label className="text-[14px] text-[#3B3B3B] font-medium block mb-1">
            Additional notes (optional)
          </label>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            rows={3}
            placeholder="Any special requests or preferences..."
            className="w-full rounded-xl bg-[#F5F5F5] font-medium border-transparent px-3 py-3 text-[14px] text-[#0A0A0A] placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#4C9A2A]/30 resize-none"
          />
        </div>

        {/* Image upload */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleAddImage}
          />

          {images.length === 0 ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full h-[110px] rounded-xl border-2 border-dashed border-[#E0E0E0] bg-[#F5F5F5] flex flex-col items-center justify-center gap-2 hover:border-[#4C9A2A]/40 transition-colors disabled:opacity-60"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#4C9A2A]" />
              ) : (
                <>
                  <ImagePlus size={28} className="text-[#888]" />
                  <span className="text-[13px] font-medium text-[#888]">Add media</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex flex-wrap gap-3">
              {images.length < 3 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-[90px] h-[90px] rounded-xl border-2 border-dashed border-[#E0E0E0] bg-[#F5F5F5] flex items-center justify-center hover:border-[#4C9A2A]/40 transition-colors disabled:opacity-60"
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#4C9A2A]" />
                  ) : (
                    <ImagePlus size={22} className="text-[#888]" />
                  )}
                </button>
              )}
              {images.map((url, idx) => (
                <div key={idx} className="relative w-[90px] h-[90px] rounded-xl overflow-hidden">
                  <img src={url} alt="upload" className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-lg bg-black/70 flex items-center justify-center"
                  >
                    <Trash2 size={12} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Continue button */}
      <div className="pt-6">
        <button
          onClick={handleContinue}
          disabled={uploading}
          className="w-full bg-[#4C9A2A] text-white rounded-full py-3.5 font-semibold text-[15px] hover:bg-[#3d7a22] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default StepConfirmDetails;
