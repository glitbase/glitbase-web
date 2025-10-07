import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "react-toastify/dist/ReactToastify.css";
import App from "./App.tsx";
import { AuthProvider } from "./AuthContext.tsx";
import { Provider } from "react-redux";
import { store } from "./redux/store.ts";
import { ToastContainer } from "react-toastify";
import { GoogleOAuthProvider } from '@react-oauth/google';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <Provider store={store}>
      <ToastContainer
        stacked
        progressClassName={"bg-primary"}
        progressStyle={{ backgroundColor: "#5B32E5" }}
      />
      <AuthProvider>
        <App />
      </AuthProvider>
    </Provider>
    </GoogleOAuthProvider>
  </StrictMode>
);
