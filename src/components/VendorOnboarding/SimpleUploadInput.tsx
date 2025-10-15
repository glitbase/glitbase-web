/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef } from 'react';
import { useFileUploadMutation } from '@/redux/app';
import { toast } from 'react-toastify';

interface SimpleUploadInputProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  accept?: string;
  helperText?: string;
  variant?: 'default' | 'avatar';
}

const SimpleUploadInput = ({
  value,
  onChange,
  placeholder = 'Upload image',
  accept = 'image/*',
  helperText,
  variant = 'default',
}: SimpleUploadInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadFile, { isLoading }] = useFileUploadMutation();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must not exceed 10MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await uploadFile(formData).unwrap();
      onChange(response.fileUrl || response.url);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error?.data?.message || 'Failed to upload image');
    }
  };

  if (variant === 'avatar') {
    return (
      <div className="flex items-center gap-4">
        <div
          className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-gray-400 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          {value ? (
            <img
              src={value}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-[#60983C] border border-[#60983C] rounded-md hover:bg-[#60983C] hover:text-white transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Uploading...' : value ? 'Change' : 'Upload'}
          </button>
          {helperText && (
            <p className="text-xs text-gray-500 mt-1">{helperText}</p>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {value ? (
        <div className="relative w-full h-48 border-2 border-gray-200 rounded-lg overflow-hidden">
          <img
            src={value}
            alt="Upload preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isLoading}
              className="px-4 py-2 bg-white text-gray-900 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Uploading...' : 'Change Image'}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isLoading}
          className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 transition-colors disabled:opacity-50"
        >
          <svg
            className="w-12 h-12 text-gray-400 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-gray-600">
            {isLoading ? 'Uploading...' : placeholder}
          </p>
        </button>
      )}

      {helperText && <p className="text-xs text-gray-500 mt-2">{helperText}</p>}
    </div>
  );
};

export default SimpleUploadInput;
