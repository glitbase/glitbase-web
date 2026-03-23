import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useCompletePaymentMutation } from '@/redux/booking';
import { clearCart } from '@/redux/cart/cartSlice';
import { toast } from 'react-toastify';

/**
 * Paystack (and similar) redirect callback. Backend should set the success URL to
 * `/payment/success` or `/payment/sucess` — Paystack appends ?reference= or ?trxref=.
 * We also keep `pendingPaymentReference` + `pendingPaystackStoreId` in sessionStorage
 * from checkout as a fallback.
 */
const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [completePayment] = useCompletePaymentMutation();
  const ran = useRef(false);
  const [phase, setPhase] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const pendingRef = sessionStorage.getItem('pendingPaymentReference');
    const urlRef =
      searchParams.get('reference') ||
      searchParams.get('trxref') ||
      searchParams.get('reference_id');
    const refToUse = urlRef || pendingRef;

    if (!refToUse) {
      setPhase('error');
      toast.error('Missing payment reference. If you completed a payment, check your bookings or contact support.');
      return;
    }

    const storeId = sessionStorage.getItem('pendingPaystackStoreId') || undefined;

    completePayment({ paymentReference: refToUse })
      .unwrap()
      .then((res: { payment?: { status?: string }; booking?: { bookingReference?: string } }) => {
        if (res?.payment?.status === 'completed') {
          sessionStorage.removeItem('pendingPaymentReference');
          sessionStorage.removeItem('pendingPaystackStoreId');
          if (storeId) {
            dispatch(clearCart(storeId));
          }
          const ref = res?.booking?.bookingReference || 'N/A';
          navigate(`/bookings?ref=${encodeURIComponent(ref)}`, { replace: true });
          return;
        }
        setPhase('error');
        toast.error('Payment could not be confirmed. Please check your bookings or try again.');
      })
      .catch(() => {
        setPhase('error');
        toast.error('Payment verification failed. Please contact support if you were charged.');
      });
  }, [completePayment, dispatch, navigate, searchParams]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      {phase === 'loading' && (
        <>
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#4C9A2A] border-t-transparent mb-4" />
          <p className="text-[15px] text-[#555] font-medium text-center">Confirming your payment…</p>
        </>
      )}
      {phase === 'error' && (
        <div className="max-w-md text-center space-y-4">
          <p className="text-[16px] text-[#0A0A0A] font-semibold">We couldn&apos;t confirm this payment</p>
          <p className="text-[14px] text-[#666]">
            If money was taken, check your email or bookings. You can also return home and try again.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              type="button"
              onClick={() => navigate('/bookings', { replace: true })}
              className="rounded-full bg-[#4C9A2A] text-white px-6 py-3 font-semibold text-[14px]"
            >
              View bookings
            </button>
            <button
              type="button"
              onClick={() => navigate('/', { replace: true })}
              className="rounded-full bg-[#F5F5F5] text-[#555] px-6 py-3 font-semibold text-[14px]"
            >
              Back to home
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentSuccess;
