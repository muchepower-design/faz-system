// frontend/src/pages/vendor/AdvertPaymentModal.jsx
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { vendorAPI, ecommercePublicAPI } from '../../api';
import { Button, Modal, ModalFooter, Input, Spinner } from '../../components/ui';
import { CreditCard, CheckCircle, XCircle, Smartphone } from 'lucide-react';

import airtelLogo from '../assets/momo/logos/momo_airtel.png'
import mtnLogo from '../assets/momo/logos/momo_mtn.png'
import zamtelLogo from '../assets/momo/logos/momo_zamtel.jpg'

const providerLogos = {
  'AIRTEL_OAPI_ZMB': airtelLogo,
  'MTN_MOMO_ZMB': mtnLogo,
  'ZAMTEL_ZMB': zamtelLogo,
}

const PROVIDER_NAMES = {
  'AIRTEL_OAPI_ZMB': 'Airtel Money',
  'MTN_MOMO_ZMB': 'MTN Mobile Money',
  'ZAMTEL_ZMB': 'Zamtel Money',
};

export default function AdvertPaymentModal({ advert, onClose }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState([]);
  const [feeInfo, setFeeInfo] = useState(null);
  const [advertPayment, setAdvertPayment] = useState(null);
  const [provider, setProvider] = useState('');
  const [phone, setPhone] = useState('');
  const [processing, setProcessing] = useState(false);
  const [pollStatus, setPollStatus] = useState(null); // null | 'WAITING' | 'COMPLETED' | 'FAILED'
  const [error, setError] = useState('');
  const pollRef = useRef(null);
  const autoCloseRef = useRef(null);

  const isValidPhone = /^0\d{9}$/.test(phone);
  const feeAmount = feeInfo?.listing_fee_required ?? 0;
  const currency = advert.currency || 'ZMW';

  // ---- Load fee info + providers on mount ----
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [feeRes, provRes] = await Promise.all([
          vendorAPI.getFeeStatus(advert.id),
          ecommercePublicAPI.getPaymentProviders(),
        ]);
        if (cancelled) return;

        const fee = feeRes.data;
        setFeeInfo(fee);

        // Already paid? Show success state immediately.
        if (fee.listing_fee_paid) {
          setPollStatus('COMPLETED');
        } else if (fee.pending_payment) {
          // Reuse a pending AdvertPayment from a previous attempt
          setAdvertPayment(fee.pending_payment);
        }

        setProviders(provRes.data || []);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || 'Failed to load payment information');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
      if (autoCloseRef.current) clearTimeout(autoCloseRef.current);
    };
  }, [advert.id]);

  // ---- Poll Pawapay status every 5s ----
  const startPolling = (depositId) => {
    setPollStatus('WAITING');
    pollRef.current = setInterval(async () => {
      try {
        const res = await ecommercePublicAPI.checkPaymentStatus(depositId);
        if (res.data.status === 'COMPLETED') {
          clearInterval(pollRef.current);
          setPollStatus('COMPLETED');
          toast.success('Listing fee paid successfully!');
          autoCloseRef.current = setTimeout(() => onClose(true), 1800);
        } else if (res.data.success === false) {
          clearInterval(pollRef.current);
          setPollStatus('FAILED');
          setError(res.data.failureReason?.failureMessage || 'Payment failed');
        }
      } catch {
        clearInterval(pollRef.current);
        setPollStatus('FAILED');
        setError('Failed to verify payment status');
      }
    }, 5000);
  };

  // ---- Submit the payment ----
  const pay = async () => {
    if (!provider) { toast.error('Choose a payment provider'); return; }
    if (!isValidPhone) { toast.error('Enter a valid 10-digit phone number starting with 0'); return; }

    setProcessing(true);
    setError('');

    try {
      // Step 1: ensure an AdvertPayment record exists and is pending
      let ap = advertPayment;
      if (!ap || ap.status !== 'pending') {
        const apRes = await vendorAPI.payListingFee(advert.id);
        ap = apRes.data;
        setAdvertPayment(ap);
      }

      // Step 2: initiate Pawapay deposit against that AdvertPayment
      const res = await ecommercePublicAPI.initiatePayment({
        target: 'advert_fee',
        target_id: ap.id,
        provider,
        phone_number: '26' + phone,
        amount: String(ap.amount),
        customer_email: user?.email || '',
      });

      if (res.data.success) {
        toast.success('Payment request sent. Check your phone to approve.');
        startPolling(res.data.depositId);
      } else {
        setPollStatus('FAILED');
        setError(res.data.failureReason?.failureMessage || 'Payment failed');
      }
    } catch (err) {
      setPollStatus('FAILED');
      setError(err.response?.data?.error || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  // ---- Retry after failure — force a fresh AdvertPayment ----
  const retry = () => {
    setPollStatus(null);
    setError('');
    setAdvertPayment(null);
  };

  // ---- Close handler — communicates success to parent ----
  const close = () => onClose(pollStatus === 'COMPLETED');

  // ==================== RENDER ====================
  return (
    <Modal isOpen onClose={close} title="Pay Listing Fee" size="md">
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="xl" />
        </div>
      ) : pollStatus === 'COMPLETED' ? (
        <div className="text-center py-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-gray-800 mb-1">Fee paid!</h3>
          <p className="text-sm text-gray-600">
            Your advert is ready to be submitted for approval.
          </p>
          <Button onClick={close} className="mt-4">Close</Button>
        </div>
      ) : pollStatus === 'FAILED' ? (
        <div className="text-center py-6">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-gray-800 mb-1">Payment failed</h3>
          <p className="text-sm text-gray-600 mb-4">{error || 'Please try again.'}</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button onClick={retry}>Try Again</Button>
          </div>
        </div>
      ) : pollStatus === 'WAITING' ? (
        <div className="text-center py-6">
          <div className="flex justify-center mb-3">
            <Spinner size="xl" />
          </div>
          <h3 className="text-lg font-bold text-blue-800 mb-1">Waiting for approval…</h3>
          <p className="text-sm text-blue-600">
            Check your phone and enter your Mobile Money PIN to approve the payment.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <CreditCard className="w-6 h-6 text-faz-orange flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  Pay the one-time listing fee to publish your advert.
                </p>
                <p className="text-lg font-bold text-faz-green mt-1">
                  {currency} {Number(feeAmount).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Advert: <strong>{advert.title}</strong>
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Money Provider
              </label>
              <div className="grid grid-cols-3 gap-2">
                {providers.length === 0 ? (
                  <p className="col-span-3 text-sm text-gray-500 italic">
                    No providers available
                  </p>
                ) : (
                  providers.map((p) => (
                    <button
                      key={p.provider}
                      type="button"
                      disabled={!p.deposit_operational}
                      onClick={() => setProvider(p.provider)}
                      className={`p-3 border-2 rounded-lg text-center transition ${
                        !p.deposit_operational
                          ? 'opacity-40 cursor-not-allowed border-gray-200'
                          : provider === p.provider
                            ? 'border-faz-orange bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                          src={providerLogos[p.provider] || '📱'}
                          alt={PROVIDER_NAMES[p.provider] || p.provider}
                          className="w-30 h-10 object-contain"
                        />
                      <p className="text-xs font-medium">
                        {PROVIDER_NAMES[p.provider] || p.provider}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <Input
              label="Mobile Money Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="0xxxxxxxxx"
              inputMode="numeric"
              hint="The phone number that will approve the payment"
            />
          </div>

          <ModalFooter>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button
              onClick={pay}
              loading={processing}
              disabled={!provider || !isValidPhone}
            >
              Pay {currency} {Number(feeAmount).toFixed(2)}
            </Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  );
}