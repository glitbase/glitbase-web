/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { toast, ToastContent, TypeOptions } from 'react-toastify';
import { IoMdCheckmarkCircle } from 'react-icons/io';

export const sendMessage = (msg: ToastContent, type: TypeOptions) => {
  toast(
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        width: '100%',
      }}
    >
      <IoMdCheckmarkCircle
        style={{ color: '#4C9A2A', fontSize: '32px', flexShrink: 0 }}
      />
      {/* @ts-ignore */}
      <span>{msg}</span>
    </div>,
    {
      type: type,
      position: 'top-center',
    }
  );
};

export const handleError = (error: any) => {
  // console.log(error);
  if (error?.message) {
    if (Array.isArray(error.message)) {
      error.message.forEach((msg: string) =>
        sendMessage(msg, 'warn' as TypeOptions)
      );
    } else {
      sendMessage(error.message, 'warn' as TypeOptions);
    }
  } else if (error?.data?.message) {
    sendMessage(error.data.message, 'warn' as TypeOptions);
  } else {
    sendMessage('An unexpected error occurred.', 'warn' as TypeOptions);
  }
};
