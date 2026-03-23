import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';
import App from './App.tsx';
import { Provider } from 'react-redux';
import { store } from './redux/store.ts';
import { ToastContainer } from 'react-toastify';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { IoMdCheckmarkCircle, IoMdCloseCircle, IoMdInformationCircle, IoMdWarning } from 'react-icons/io';
import { IntercomProvider } from 'react-use-intercom';

// Custom icon component for toast notifications
const ToastIcon = ({ type }: { type?: string }) => {
  const iconProps = {
    size: 17,
    style: { flexShrink: 0 }
  };

  switch (type) {
    case 'success':
      return <IoMdCheckmarkCircle {...iconProps} className="text-[#4C9A2A]" />;
    case 'error':
      return <IoMdCloseCircle {...iconProps} className="text-[#EF4444]" />;
    case 'info':
      return <IoMdInformationCircle {...iconProps} className="text-[#3B82F6]" />;
    case 'warning':
      return <IoMdWarning {...iconProps} className="text-[#F59E0B]" />;
    default:
      return null;
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <Provider store={store}>
        {import.meta.env.VITE_INTERCOM_APP_ID ? (
          <IntercomProvider appId={import.meta.env.VITE_INTERCOM_APP_ID}>
            <ToastContainer
              position="bottom-right"
              autoClose={3000}
              hideProgressBar
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
              closeButton={true}
              icon={(props) => <ToastIcon type={props.type} />}
              style={{
                bottom: '32px',
                width: 'fit-content'
              }}
              toastStyle={{
                backgroundColor: '#1A1A1A',
                borderRadius: '12px',
                padding: '10px 12px',
                minHeight: 'auto',
                width: 'fit-content',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            />
            <App />
          </IntercomProvider>
        ) : (
          <>
            <ToastContainer
              position="bottom-right"
              autoClose={3000}
              hideProgressBar
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
              closeButton={true}
              icon={(props) => <ToastIcon type={props.type} />}
              style={{
                bottom: '32px',
                width: 'fit-content'
              }}
              toastStyle={{
                backgroundColor: '#1A1A1A',
                borderRadius: '12px',
                padding: '10px 12px',
                minHeight: 'auto',
                width: 'fit-content',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            />
            <App />
          </>
        )}
      </Provider>
    </GoogleOAuthProvider>
  </StrictMode>
);
