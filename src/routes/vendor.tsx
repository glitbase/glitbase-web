import { Navigate, Route, Routes } from 'react-router-dom';
import {
  StoreSetup,
  CategoriesSetup,
  VisibilitySetup,
  LocationSetup,
  PayoutSetup,
  SubscriptionSetup,
  CheckoutPage,
  CheckoutSuccess,
} from '@/pages/vendor/onboarding';
import StorePage from '@/pages/vendor/store';
import EditStoreProfile from '@/pages/vendor/store/EditStoreProfile';
import AddService from '@/pages/vendor/store/AddService';
import Services from '@/pages/vendor/services';
import EditLocation from '@/pages/vendor/store/EditLocation';
import EditOpeningHours from '@/pages/vendor/store/EditOpeningHours';
import VendorOnboardingGuard from './VendorOnboardingGuard';

/**
 * VendorRoutes
 *
 * Route structure:
 * - Onboarding routes (/vendor/onboarding/*) → NO VendorOnboardingGuard (allow incomplete vendors)
 * - Dashboard routes (/vendor/store/*) → WITH VendorOnboardingGuard (require completed onboarding)
 */
const VendorRoutes = () => {
  console.log('🛤️ VendorRoutes: Rendering', {
    path: window.location.pathname,
    hash: window.location.hash,
    search: window.location.search,
  });

  return (
    <Routes>
      {/* Onboarding routes - accessible during onboarding */}
      <Route path="onboarding" element={<StoreSetup />} />
      <Route path="onboarding/categories" element={<CategoriesSetup />} />
      <Route path="onboarding/visibility" element={<VisibilitySetup />} />
      <Route path="onboarding/location" element={<LocationSetup />} />
      <Route path="onboarding/payout" element={<PayoutSetup />} />
      <Route path="onboarding/subscription" element={<SubscriptionSetup />} />
      <Route path="onboarding/checkout" element={<CheckoutPage />} />
      <Route path="onboarding/checkout/success" element={<CheckoutSuccess />} />
      <Route path="payout-setup" element={<PayoutSetup />} />
      <Route path="subscription-setup" element={<SubscriptionSetup />} />
      <Route path="bookings" element={<Navigate to="/vendor/store" replace />} />

      {/* Dashboard routes - require completed onboarding */}
      <Route
        path="services"
        element={
          <VendorOnboardingGuard>
            <Services />
          </VendorOnboardingGuard>
        }
      />
      <Route
        path="store"
        element={
          <VendorOnboardingGuard>
            <StorePage />
          </VendorOnboardingGuard>
        }
      />
      <Route
        path="store/edit"
        element={
          <VendorOnboardingGuard>
            <EditStoreProfile />
          </VendorOnboardingGuard>
        }
      />
      <Route
        path="store/add-service"
        element={
          <VendorOnboardingGuard>
            <AddService />
          </VendorOnboardingGuard>
        }
      />
      <Route
        path="store/edit-service/:serviceId"
        element={
          <VendorOnboardingGuard>
            <AddService />
          </VendorOnboardingGuard>
        }
      />
      <Route
        path="store/edit-location"
        element={
          <VendorOnboardingGuard>
            <EditLocation />
          </VendorOnboardingGuard>
        }
      />
      <Route
        path="store/edit-opening-hours"
        element={
          <VendorOnboardingGuard>
            <EditOpeningHours />
          </VendorOnboardingGuard>
        }
      />
    </Routes>
  );
};

export default VendorRoutes;
