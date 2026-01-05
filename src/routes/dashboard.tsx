import React from 'react';

import { Navigate, Route, Routes } from 'react-router-dom';

const Dashboard = React.lazy(() => import('@/pages/dashboard'));

const DashboardPortal = () => {
  return (
    <Routes>
      <Route path="overview" element={<Dashboard />} />
      <Route path="/" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default DashboardPortal;
