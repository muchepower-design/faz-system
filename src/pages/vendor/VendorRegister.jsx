// frontend/src/pages/vendor/VendorRegister.jsx
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { vendorAPI } from '../../api';
import { Card, Button, Input, Spinner } from '../../components/ui';
import ImageInput from '../../components/ImageInput';
import { MapPin } from 'lucide-react';

export default function VendorRegister() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [hasVendor, setHasVendor] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const [form, setForm] = useState({
    business_name: '',
    description: '',
    contact_phone: '',
    contact_email: '',
    contact_whatsapp: '',
    location_name: '',
    latitude: '',
    longitude: '',
    logo_url: '',
    banner_url: '',
    website_url: '',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setChecking(false); return; }
    vendorAPI.getMe()
      .then(() => setHasVendor(true))
      .catch(() => setHasVendor(false))
      .finally(() => setChecking(false));
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        contact_email: f.contact_email || user.email || '',
        contact_phone: f.contact_phone || user.phone || '',
      }));
    }
  }, [user]);

  const detectLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        toast.success('Location detected');
        setDetecting(false);
      },
      () => { toast.error('Could not detect location'); setDetecting(false); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await vendorAPI.register(form);
      toast.success('Vendor application submitted. Awaiting admin approval.');
      navigate('/vendor/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || checking) {
    return <div className="flex justify-center py-20"><Spinner size="xl" /></div>;
  }

  if (!user) {
    return (
      <div className="pt-24 min-h-screen container mx-auto px-6 py-8 max-w-lg">
        <Card padding="lg" className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Become a FAZ Vendor</h1>
          <p className="text-gray-500 mb-6">You need an account to apply as a vendor.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/login"><Button>Login</Button></Link>
            <Link to="/register"><Button variant="outline">Register</Button></Link>
          </div>
        </Card>
      </div>
    );
  }

  if (hasVendor) {
    return (
      <div className="pt-24 min-h-screen container mx-auto px-6 py-8 max-w-lg">
        <Card padding="lg" className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">You already have a vendor account</h1>
          <p className="text-gray-500 mb-6">Manage your adverts and orders in the vendor dashboard.</p>
          <Link to="/vendor/dashboard"><Button>Go to Vendor Dashboard</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold gradient-text mb-2">Become a FAZ Vendor</h1>
        <p className="text-gray-500">
          Sell your products and services to Zambia's football community.
          Your account will be reviewed by the FAZ team before it goes live.
        </p>
      </div>

      <Card padding="lg">
        <form onSubmit={submit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Business name"
              value={form.business_name}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })}
              required
            />
            <Input
              label="Website (optional)"
              value={form.website_url}
              onChange={(e) => setForm({ ...form, website_url: e.target.value })}
              placeholder="https://"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              About your business
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-faz-orange/30"
              placeholder="What do you sell? What makes you unique?"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Contact email"
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              required
            />
            <Input
              label="Contact phone"
              value={form.contact_phone}
              onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
              required
            />
          </div>

          <Input
            label="WhatsApp (optional)"
            value={form.contact_whatsapp}
            onChange={(e) => setForm({ ...form, contact_whatsapp: e.target.value })}
          />

          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-800 mb-3">Primary Business Location</h3>

            <Input
              label="Location description"
              value={form.location_name}
              onChange={(e) => setForm({ ...form, location_name: e.target.value })}
              placeholder="e.g. Mulungushi Village, Lusaka"
            />

            <div className="grid grid-cols-2 gap-3 mt-3">
              <Input
                label="Latitude"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                placeholder="-15.3875"
              />
              <Input
                label="Longitude"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                placeholder="28.3228"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={detectLocation}
              loading={detecting}
              className="mt-3"
            >
              <MapPin className="w-4 h-4" /> Detect my current location
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 border-t pt-4">
            <ImageInput
              label="Business Logo"
              category="vendor-logo"
              value={form.logo_url}
              onChange={(url) => setForm({ ...form, logo_url: url })}
              hint="Square works best"
            />
            <ImageInput
              label="Banner (optional)"
              category="vendor-banner"
              value={form.banner_url}
              onChange={(url) => setForm({ ...form, banner_url: url })}
              hint="Wide landscape (e.g. 1600×400)"
            />
          </div>

          <div className="border-t pt-4 flex gap-3">
            <Button type="submit" loading={submitting}>
              Submit Application
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}