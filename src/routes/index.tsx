import Layout from "@/Layout";
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

const AuthRouter = React.lazy(() => import("./auth"));
const MainAppRouter = React.lazy(() => import("./main"));

const MainRoute = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/auth/*" element={<AuthRouter isLoading={false} />} />
          <Route path="/*" element={<MainAppRouter />} />
          {/* <Route path="*" element={<Navigate to="/auth/login" replace />} /> */}
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default MainRoute;
