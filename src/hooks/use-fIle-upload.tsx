/* eslint-disable @typescript-eslint/no-explicit-any */
import { useUpdateUserMutation } from '@/redux/auth';
import { handleError } from '@/utils/notify';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { useAppSelector } from '@/hooks/redux-hooks';
import { selectTokens } from '@/redux/auth/authSlice';

const useFileUpload = () => {
  const [updateUser, { isLoading: updateUserLoading }] =
    useUpdateUserMutation();
  const tokens = useAppSelector(selectTokens);

  const [loading, setLoading] = useState(false);

  const uploadAndUpdate = async (
    file: File | null,
    imageName: string,
    callback: () => void
  ) => {
    try {
      setLoading(true);
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      }

      const uploadResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/upload/single`,
        {
          method: 'POST',
          body: formData,
          headers: { Authorization: `Bearer ${tokens?.accessToken}` },
        }
      );

      if (!uploadResponse.ok) {
        throw new Error(`File upload failed: ${uploadResponse.statusText}`);
      }

      const uploadData = await uploadResponse.json();
      const { signedUrl } = uploadData.data;
      await updateUser({ [imageName]: signedUrl.split('?')[0] }).unwrap();

      toast.success('File uploaded and user updated successfully!');
      callback();
      setLoading(false);
    } catch (error: any) {
      handleError(error?.data);
      console.error('Upload and update failed:', error);
      toast.error('Upload and update failed. Please try again.');
      setLoading(false);
    }
  };

  return { uploadAndUpdate, isLoading: updateUserLoading || loading };
};

export default useFileUpload;
