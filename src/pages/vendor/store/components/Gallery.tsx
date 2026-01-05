/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Store } from '@/redux/vendor/storeSlice';
import {
  useAddGalleryImageMutation,
  useRemoveGalleryImageMutation,
} from '@/redux/vendor';
import { useFileUploadMutation } from '@/redux/app';
import { toast } from 'react-toastify';

interface GalleryProps {
  store: Store;
  isReadOnly?: boolean;
}

interface GalleryImage {
  id: string;
  imageURL: string;
}

const Gallery = ({ store, isReadOnly = false }: GalleryProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);

  const [fileUpload] = useFileUploadMutation();
  const [addGalleryImage] = useAddGalleryImageMutation();
  const [removeGalleryImage, { isLoading: isDeleting }] =
    useRemoveGalleryImageMutation();

  const handleImageUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      // Step 1: Upload file
      const uploadResponse = await fileUpload(formData).unwrap();
      const uploadedUrl = uploadResponse.url;

      // Step 2: Add to gallery
      await addGalleryImage({
        storeId: store.id,
        imageURL: uploadedUrl,
      }).unwrap();

      toast.success('Image added to gallery');
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast.error(error?.data?.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!imageToDelete) return;

    try {
      await removeGalleryImage({
        storeId: store.id,
        imageId: imageToDelete,
      }).unwrap();
      toast.success('Image removed from gallery');
      setImageToDelete(null);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to remove image');
    }
  };

  const gallery = store.gallery || [];

  const handlePreviousImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const handleNextImage = () => {
    if (
      selectedImageIndex !== null &&
      selectedImageIndex < gallery.length - 1
    ) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  return (
    <div className="relative">
      <input
        id="gallery-upload"
        type="file"
        accept="image/*"
        className="hidden"
        disabled={isUploading}
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleImageUpload(e.target.files[0]);
          }
        }}
      />

      {/* Gallery Grid */}
      {gallery.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          {!isReadOnly && (
            <div
              className="w-16 h-16 cursor-pointer rounded-full flex items-center justify-center mx-auto mb-4"
              onClick={() => document.getElementById('gallery-upload')?.click()}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="48" height="48" rx="24" fill="#4C9A2A" />
                <path
                  d="M24 16V32M32 24H16"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isReadOnly ? 'No images available' : 'No images in gallery yet'}
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {isReadOnly
              ? 'This store has not added any gallery images yet'
              : 'Showcase your work by adding images to your gallery'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {gallery.map((image: GalleryImage, index: number) => (
            <div
              key={image.id}
              className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 cursor-pointer"
              onClick={() => setSelectedImageIndex(index)}
            >
              <img
                src={image.imageURL}
                alt="Gallery"
                className="w-full h-full object-cover"
              />
              {/* Delete Button - Top Right */}
              {!isReadOnly && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageToDelete(image.id);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-black bg-opacity-60 hover:bg-opacity-80 text-white rounded-full flex items-center justify-center transition-all"
                  title="Delete image"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Floating Add Button */}
      {!isReadOnly && (
        <button
          onClick={() => document.getElementById('gallery-upload')?.click()}
          disabled={isUploading}
          className="fixed bottom-8 right-8 w-14 h-14 bg-[#4C9A2A] hover:bg-[#3d7a22] text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-30 disabled:opacity-50"
          title="Add image"
        >
          {isUploading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          ) : (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          )}
        </button>
      )}

      {/* Image Preview Lightbox */}
      {selectedImageIndex !== null && gallery[selectedImageIndex] && (
        <div
          className="fixed inset-0 bg-black flex items-center justify-center z-50"
          onClick={() => setSelectedImageIndex(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setSelectedImageIndex(null)}
            className="absolute top-4 left-4 text-white hover:text-gray-300 z-10"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Previous Button */}
          {selectedImageIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePreviousImage();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
            >
              <svg
                className="w-6 h-6 text-gray-900"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {/* Image */}
          <img
            src={gallery[selectedImageIndex].imageURL}
            alt="Gallery preview"
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next Button */}
          {selectedImageIndex < gallery.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextImage();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
            >
              <svg
                className="w-6 h-6 text-gray-900"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {imageToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-3xl font-bold text-gray-900">
                Remove image?
              </h3>
              <button
                onClick={() => setImageToDelete(null)}
                className="text-gray-400 hover:text-gray-600 w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full"
                disabled={isDeleting}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <p className="text-gray-600 text-lg mb-8">
              This will permanently delete the image from your gallery
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setImageToDelete(null)}
                className="flex-1 px-6 py-4 text-gray-900 bg-gray-200 rounded-full font-semibold hover:bg-gray-300 transition-colors text-lg"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteImage}
                className="flex-1 px-6 py-4 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors text-lg"
                disabled={isDeleting}
              >
                {isDeleting ? 'Removing...' : 'Remove image'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
