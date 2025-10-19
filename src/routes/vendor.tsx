import { Route, Routes } from 'react-router-dom';
import {
  StoreSetup,
  CategoriesSetup,
  VisibilitySetup,
  LocationSetup,
  PayoutSetup,
  SubscriptionSetup,
} from '@/pages/vendor/onboarding';
import StorePage from '@/pages/vendor/store';
import EditStoreProfile from '@/pages/vendor/store/EditStoreProfile';
import AddService from '@/pages/vendor/store/AddService';
import EditLocation from '@/pages/vendor/store/EditLocation';
import EditOpeningHours from '@/pages/vendor/store/EditOpeningHours';

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
      <Route path="store" element={<StorePage />} />
      <Route path="store/edit" element={<EditStoreProfile />} />
      <Route path="store/add-service" element={<AddService />} />
      <Route path="store/edit-service/:serviceId" element={<AddService />} />
      <Route path="store/edit-location" element={<EditLocation />} />
      <Route path="store/edit-opening-hours" element={<EditOpeningHours />} />
    </Routes>
  );
};

export default VendorRoutes;
