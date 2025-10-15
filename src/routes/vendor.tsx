import { Route, Routes } from 'react-router-dom';
import {
  StoreSetup,
  CategoriesSetup,
  VisibilitySetup,
  LocationSetup,
  PayoutSetup,
  SubscriptionSetup,
} from '@/pages/vendor/onboarding';

const VendorRoutes = () => {
  return (
    <Routes>
      <Route path="onboarding" element={<StoreSetup />} />
      <Route path="onboarding/categories" element={<CategoriesSetup />} />
      <Route path="onboarding/visibility" element={<VisibilitySetup />} />
      <Route path="onboarding/location" element={<LocationSetup />} />
      <Route path="onboarding/payout" element={<PayoutSetup />} />
      <Route path="onboarding/subscription" element={<SubscriptionSetup />} />
      <Route path="payout-setup" element={<PayoutSetup />} />
      <Route path="subscription-setup" element={<SubscriptionSetup />} />
    </Routes>
  );
};

export default VendorRoutes;
