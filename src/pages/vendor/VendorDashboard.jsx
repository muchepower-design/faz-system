// frontend/src/pages/vendor/VendorDashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import AdvertPaymentModal from './AdvertPaymentModal';
import {
  vendorAPI, ecommercePublicAPI,
} from '../../api';
import {
  Card, Button, Input, Modal, ModalFooter, Spinner, EmptyState, Badge,
} from '../../components/ui';
import ImageInput from '../../components/ImageInput';
import VideoInput from '../../components/VideoInput';
import { resolveAssetUrl } from '../../utils/assets';
import {
  Pencil, Trash2, Plus, Upload, PlayCircle, Package, DollarSign,
  ShoppingCart, MapPin, X, AlertCircle, CreditCard,
} from 'lucide-react';

/* =====================================================================
 * Main
 * ===================================================================== */
export default function VendorDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('overview');
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadVendor = async () => {
    try {
      const res = await vendorAPI.getMe();
      setVendor(res.data);
    } catch {
      setVendor(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadVendor(); }, []);

  if (loading) return <div className="pt-24 flex justify-center"><Spinner size="xl" /></div>;

  if (!vendor) {
    return (
      <div className="pt-24 min-h-screen container mx-auto px-6 py-8 max-w-lg">
        <Card padding="lg" className="text-center">
          <AlertCircle className="w-12 h-12 text-faz-orange mx-auto mb-3" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">No vendor account found</h1>
          <p className="text-gray-500 mb-6">You haven't registered as a vendor yet.</p>
          <Link to="/vendor/register"><Button>Become a Vendor</Button></Link>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'adverts', label: 'My Adverts' },
    { id: 'orders', label: 'Orders' },
    { id: 'profile', label: 'Profile' },
  ];

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6 py-8">
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-1">{vendor.business_name}</h1>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant={
              vendor.status === 'approved' ? 'success' :
              vendor.status === 'pending' ? 'warning' : 'danger'
            }>
              {vendor.status === 'approved' ? 'Approved' :
               vendor.status === 'pending' ? 'Pending approval' :
               vendor.status === 'suspended' ? 'Suspended' : 'Rejected'}
            </Badge>
            <span className="text-gray-500">·</span>
            <span className="text-gray-500">{user?.email}</span>
          </div>
          {vendor.status === 'rejected' && vendor.rejection_reason && (
            <p className="text-sm text-red-600 mt-2">
              Reason: {vendor.rejection_reason}
            </p>
          )}
        </div>
        <Button variant="outline" onClick={logout}>Logout</Button>
      </div>

      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition ${
              tab === t.id
                ? 'text-faz-orange border-b-2 border-faz-orange'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab vendor={vendor} />}
      {tab === 'adverts' && <AdvertsTab vendor={vendor} />}
      {tab === 'orders' && <OrdersTab />}
      {tab === 'profile' && <ProfileTab vendor={vendor} onUpdate={loadVendor} />}
    </div>
  );
}

/* =====================================================================
 * OVERVIEW
 * ===================================================================== */
function OverviewTab({ vendor }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorAPI.getStats()
      .then((res) => setStats(res.data))
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Spinner size="xl" /></div>;

  const cards = [
    { icon: Package, label: 'Total Adverts', value: stats?.adverts_total ?? 0, color: 'from-faz-green' },
    { icon: DollarSign, label: 'Approved', value: stats?.adverts_approved ?? 0, color: 'from-faz-orange' },
    { icon: ShoppingCart, label: 'Orders', value: stats?.orders_total ?? 0, color: 'from-faz-red' },
    { icon: DollarSign, label: 'Revenue', value: `${stats?.currency || 'ZMW'} ${(stats?.total_revenue || 0).toFixed(2)}`, color: 'from-faz-green' },
  ];

  return (
    <div className="space-y-6">
      {vendor.status !== 'approved' && (
        <Card padding="lg" className="border-l-4 border-faz-orange">
          <div className="flex gap-3">
            <AlertCircle className="w-6 h-6 text-faz-orange flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-800">Your account is {vendor.status}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {vendor.status === 'pending' && 'Your account is awaiting admin approval. You can prepare adverts, but they won\'t be visible until approved.'}
                {vendor.status === 'rejected' && 'Your vendor account was rejected. Contact FAZ support for details.'}
                {vendor.status === 'suspended' && 'Your account has been suspended. Contact FAZ support.'}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} padding="md" className="text-center">
            <c.icon className={`w-10 h-10 mx-auto mb-3 bg-gradient-to-r ${c.color} to-transparent bg-clip-text text-transparent`} />
            <p className="text-2xl font-bold gradient-text">{c.value}</p>
            <p className="text-sm text-gray-500 mt-1">{c.label}</p>
          </Card>
        ))}
      </div>

      {stats && (
        <Card padding="lg">
          <h3 className="font-bold text-gray-800 mb-3">Quick summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-gray-500">Pending adverts:</span> <strong>{stats.adverts_pending}</strong></div>
            <div><span className="text-gray-500">Pending orders:</span> <strong>{stats.orders_pending}</strong></div>
            <div><span className="text-gray-500">Completed orders:</span> <strong>{stats.orders_completed}</strong></div>
            <div><span className="text-gray-500">Currency:</span> <strong>{stats.currency}</strong></div>
          </div>
        </Card>
      )}
    </div>
  );
}

/* =====================================================================
 * ADVERTS
 * ===================================================================== */
function AdvertsTab({ vendor }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyAdvert());
  const [submitting, setSubmitting] = useState(false);
  const [mediaModalAdvert, setMediaModalAdvert] = useState(null);
  const [matchModalAdvert, setMatchModalAdvert] = useState(null);
  const [paymentModalAdvert, setPaymentModalAdvert] = useState(null);
  const [feeStatuses, setFeeStatuses] = useState({});

  function emptyAdvert() {
    return {
      title: '', description: '', category_id: '', price: '', currency: 'ZMW',
      use_vendor_location: true, location_name: '', latitude: '', longitude: '',
      payment_method: 'both', offline_instructions: '',
      bank_name: '', bank_account_name: '', bank_account_number: '',
      mobile_money_provider: '', mobile_money_number: '',
    };
  }

  const load = async () => {
    setLoading(true);
    try {
      const [advRes, catRes] = await Promise.all([
        vendorAPI.listAdverts(),
        ecommercePublicAPI.listCategories(),
      ]);
      const adverts = advRes.data || [];
      setItems(adverts);
      setCategories(catRes.data || []);

      // Prefetch fee statuses for any advert that could need payment
      const needsFeeCheck = adverts.filter(
        (a) => a.status === 'draft' || a.status === 'rejected'
      );
      if (needsFeeCheck.length > 0) {
        const statusMap = {};
        await Promise.all(
          needsFeeCheck.map(async (a) => {
            try {
              const res = await vendorAPI.getFeeStatus(a.id);
              statusMap[a.id] = res.data;
            } catch { /* ignore individual failures */ }
          })
        );
        setFeeStatuses(statusMap);
      } else {
        setFeeStatuses({});
      }
    } catch {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const needsPayment = (a) => {
    const s = feeStatuses[a.id];
    return !!(s && s.listing_fee_required > 0 && !s.listing_fee_paid);
  };

  const fmtFee = (a) => {
    const s = feeStatuses[a.id];
    if (!s) return '';
    return `${a.currency || 'ZMW'} ${Number(s.listing_fee_required).toFixed(2)}`;
  };

  const openCreate = () => { setEditing(null); setForm(emptyAdvert()); setShowForm(true); };

  const openEdit = (a) => {
    setEditing(a);
    setForm({
      title: a.title, description: a.description,
      category_id: a.category_id || '',
      price: a.price ?? '', currency: a.currency || 'ZMW',
      use_vendor_location: a.use_vendor_location,
      location_name: a.location_name || '',
      latitude: a.latitude ?? '', longitude: a.longitude ?? '',
      payment_method: a.payment_method || 'both',
      offline_instructions: a.offline_instructions || '',
      bank_name: a.bank_name || '', bank_account_name: a.bank_account_name || '',
      bank_account_number: a.bank_account_number || '',
      mobile_money_provider: a.mobile_money_provider || '',
      mobile_money_number: a.mobile_money_number || '',
    });
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await vendorAPI.updateAdvert(editing.id, form);
        toast.success('Advert updated');
      } else {
        const res = await vendorAPI.createAdvert(form);
        toast.success('Advert created — now add media');
        setMediaModalAdvert(res.data);
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Save failed');
    } finally { setSubmitting(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this advert?')) return;
    try { await vendorAPI.deleteAdvert(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const submitAdvert = async (advert) => {
    try {
      const feeRes = await vendorAPI.getFeeStatus(advert.id);
      const fee = feeRes.data;
      if (fee.listing_fee_required > 0 && !fee.listing_fee_paid) {
        toast.error(
          `Listing fee of ${advert.currency || 'ZMW'} ${Number(fee.listing_fee_required).toFixed(2)} must be paid first.`
        );
        setPaymentModalAdvert(advert);
        return;
      }
      await vendorAPI.submitAdvert(advert.id);
      toast.success('Advert submitted for approval');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submit failed');
    }
  };

  const handlePaymentComplete = async (success) => {
    const advert = paymentModalAdvert;
    setPaymentModalAdvert(null);

    // Only proceed if payment was successful
    if (success !== true || !advert) {
      if (advert) load(); // Refresh fee status in case of failure
      return;
    }

    // Auto-submit the advert now that the fee is paid
    try {
      await vendorAPI.submitAdvert(advert.id);
      toast.success('Fee paid — advert submitted for approval!');
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
          'Fee was paid, but submit failed. Click Submit to retry.'
      );
    }
    load();
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="xl" /></div>;

  return (
    <Card padding="lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-gray-800">My Adverts ({items.length})</h2>
        <Button onClick={openCreate} disabled={vendor.status !== 'approved'}>
          <Plus className="w-4 h-4" /> New Advert
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No adverts yet"
          description={vendor.status === 'approved'
            ? "Create your first advert to start selling."
            : "You can create adverts once your account is approved."}
        />
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className="border border-gray-200 rounded-xl p-4 flex flex-wrap gap-4 items-center">
              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {a.cover_image ? (
                  <img src={resolveAssetUrl(a.cover_image)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">🛍️</div>
                )}
              </div>
              <div className="flex-1 min-w-[200px]">
                <h3 className="font-semibold text-gray-800">{a.title}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                  <Badge variant={
                    a.status === 'approved' ? 'success' :
                    a.status === 'pending' ? 'warning' :
                    a.status === 'rejected' ? 'danger' :
                    a.status === 'paused' ? 'default' : 'default'
                  }>{a.status}</Badge>
                  {a.is_premium && <Badge variant="orange">Premium</Badge>}
                  {a.status === 'draft' && needsPayment(a) && (
                    <Badge variant="warning">Fee unpaid</Badge>
                  )}
                  <span className="text-gray-500">
                    {a.price != null ? `${a.currency} ${Number(a.price).toFixed(2)}` : 'Contact for price'}
                  </span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-400">{a.media?.length || 0} media</span>
                </div>
                {a.rejection_reason && a.status === 'rejected' && (
                  <p className="text-xs text-red-600 mt-1">Reason: {a.rejection_reason}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {a.status === 'draft' && (
                  <>
                    <Button size="sm" onClick={() => openEdit(a)}>
                      <Pencil className="w-3 h-3" /> Edit
                    </Button>
                    {needsPayment(a) ? (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setPaymentModalAdvert(a)}
                      >
                        <CreditCard className="w-3 h-3" /> Pay Fee ({fmtFee(a)})
                      </Button>
                    ) : (
                      <Button size="sm" variant="primary" onClick={() => submitAdvert(a)}>
                        Submit
                      </Button>
                    )}
                  </>
                )}
                {a.status === 'approved' && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setMatchModalAdvert(a)}>
                      <MapPin className="w-3 h-3" /> Attach to Match
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => vendorAPI.pauseAdvert(a.id).then(() => { toast.success('Paused'); load(); })}>
                      Pause
                    </Button>
                  </>
                )}
                {(a.status === 'draft' || a.status === 'rejected') && (
                  <Button size="sm" variant="outline" onClick={() => setMediaModalAdvert(a)}>
                    <Upload className="w-3 h-3" /> Media
                  </Button>
                )}
                <Button size="sm" variant="danger" onClick={() => remove(a.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit form — UNCHANGED from your original file */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Edit Advert' : 'New Advert'}
        size="lg"
      >
        
                <form onSubmit={submit} className="space-y-4">
          <Input label="Title" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} required />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={4} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">— Select —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <Input label="Price (leave blank for 'contact for price')" type="number"
              value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>

          <div className="border-t pt-4">
            <label className="flex items-center gap-2 text-sm mb-3">
              <input type="checkbox" checked={form.use_vendor_location}
                onChange={(e) => setForm({ ...form, use_vendor_location: e.target.checked })} />
              Use my primary business location
            </label>
            {!form.use_vendor_location && (
              <>
                <Input label="Location for this advert" value={form.location_name}
                  onChange={(e) => setForm({ ...form, location_name: e.target.value })} />
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Input label="Latitude" value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
                  <Input label="Longitude" value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
                </div>
              </>
            )}
          </div>

          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <div className="flex gap-4 text-sm">
              {['system', 'offline', 'both'].map((m) => (
                <label key={m} className="flex items-center gap-2">
                  <input type="radio" name="payment" checked={form.payment_method === m}
                    onChange={() => setForm({ ...form, payment_method: m })} />
                  {m === 'system' ? 'Via FAZ gateway' : m === 'offline' ? 'Direct to vendor' : 'Consumer chooses'}
                </label>
              ))}
            </div>

            {(form.payment_method === 'offline' || form.payment_method === 'both') && (
              <div className="mt-4 space-y-2 bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-2">Consumers will see these details if paying you directly:</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Bank name" value={form.bank_name}
                    onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
                  <Input label="Account name" value={form.bank_account_name}
                    onChange={(e) => setForm({ ...form, bank_account_name: e.target.value })} />
                  <Input label="Account number" value={form.bank_account_number}
                    onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })} />
                  <Input label="Mobile money provider" value={form.mobile_money_provider}
                    onChange={(e) => setForm({ ...form, mobile_money_provider: e.target.value })} />
                  <Input label="Mobile money number" value={form.mobile_money_number}
                    onChange={(e) => setForm({ ...form, mobile_money_number: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Other instructions
                  </label>
                  <textarea rows={2} value={form.offline_instructions}
                    onChange={(e) => setForm({ ...form, offline_instructions: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
            )}
          </div>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editing ? 'Update' : 'Create'}</Button>
          </ModalFooter>
        </form>
        
      </Modal>

      {/* Media modal — UNCHANGED */}
      {mediaModalAdvert && (
        <MediaModal
          advert={mediaModalAdvert}
          onClose={() => { setMediaModalAdvert(null); load(); }}
        />
      )}

      {/* Match attach modal — UNCHANGED */}
      {matchModalAdvert && (
        <MatchAttachModal
          advert={matchModalAdvert}
          onClose={() => { setMatchModalAdvert(null); load(); }}
        />
      )}

      {/* Listing fee payment modal — NEW */}
      {paymentModalAdvert && (
        <AdvertPaymentModal
          advert={paymentModalAdvert}
          onClose={handlePaymentComplete}
        />
      )}
    </Card>
  );
}

/* =====================================================================
 * MEDIA MODAL
 * ===================================================================== */
function MediaModal({ advert, onClose }) {
  const [advertData, setAdvertData] = useState(advert);
  const [loading, setLoading] = useState(false);

  const reload = async () => {
    try {
      const res = await vendorAPI.getAdvert(advertData.id);
      setAdvertData(res.data);
    } catch { /* noop */ }
  };

  const addImage = async (url) => {
    if (!url) return;
    setLoading(true);
    try {
      await vendorAPI.addMedia(advertData.id, { media_type: 'image', url });
      toast.success('Image added');
      reload();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const addVideo = async (url) => {
    setLoading(true);
    try {
      await vendorAPI.addMedia(advertData.id, { media_type: 'video', url });
      toast.success('Video added');
      reload();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const deleteMedia = async (mediaId) => {
    if (!confirm('Delete this media?')) return;
    try {
      await vendorAPI.deleteMedia(advertData.id, mediaId);
      toast.success('Deleted');
      reload();
    } catch { toast.error('Failed'); }
  };

  const images = (advertData.media || []).filter((m) => m.media_type === 'image');
  const videos = (advertData.media || []).filter((m) => m.media_type === 'video');

  return (
    <Modal isOpen onClose={onClose} title={`Media — ${advertData.title}`} size="lg">
      <div className="space-y-6">
        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Images ({images.length}/10)</h4>
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {images.map((m) => (
                <div key={m.id} className="relative group">
                  <img src={resolveAssetUrl(m.url)} alt="" className="w-full h-24 object-cover rounded" />
                  <button
                    onClick={() => deleteMedia(m.id)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {images.length < 10 && (
            <ImageInput
              label="Add image"
              category="advert"
              value=""
              onChange={addImage}
              hint="Add up to 10 images"
            />
          )}
        </div>

        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Videos ({videos.length}/5)</h4>
          {videos.length > 0 && (
            <div className="space-y-2 mb-3">
              {videos.map((m) => (
                <div key={m.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                  <PlayCircle className="w-5 h-5 text-gray-500" />
                  <span className="flex-1 text-sm text-gray-700 truncate">{m.url}</span>
                  <button onClick={() => deleteMedia(m.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {videos.length < 5 && (
            <VideoInput onUploaded={addVideo} label="Upload a video" />
          )}
        </div>

        <ModalFooter>
          <Button onClick={onClose}>Done</Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}

/* =====================================================================
 * MATCH ATTACH MODAL
 * ===================================================================== */
function MatchAttachModal({ advert, onClose }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    vendorAPI.getMatchesForAttachment()
      .then((res) => setMatches(res.data || []))
      .catch(() => toast.error('Failed to load matches'))
      .finally(() => setLoading(false));
  }, []);

  const submit = async () => {
    if (!selected) { toast.error('Select a match'); return; }
    setSubmitting(true);
    try {
      await vendorAPI.requestMatchAttachment(advert.id, selected);
      toast.success('Request submitted. Admin will review.');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Request failed');
    } finally { setSubmitting(false); }
  };

  return (
    <Modal isOpen onClose={onClose} title="Attach Advert to a Match">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Attaching your advert to a match makes it a premium listing — it will appear
          at the bottom of that match's ticket page. Admin approval is required.
        </p>

        {loading ? (
          <Spinner />
        ) : matches.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No upcoming matches available.</p>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select match</label>
            <select value={selected} onChange={(e) => setSelected(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">— Choose —</option>
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.home_team} vs {m.away_team}
                  {m.match_date ? ` — ${new Date(m.match_date).toLocaleDateString()}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <ModalFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={submitting} disabled={!selected}>
            Submit Request
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}

/* =====================================================================
 * ORDERS
 * ===================================================================== */
function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [activeOrder, setActiveOrder] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await vendorAPI.listOrders(filter || undefined);
      setOrders(res.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  if (loading) return <div className="flex justify-center py-12"><Spinner size="xl" /></div>;

  const statuses = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'completed', 'cancelled'];

  return (
    <Card padding="lg">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <h2 className="font-bold text-gray-800">Orders ({orders.length})</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
          <option value="">All statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {orders.length === 0 ? (
        <EmptyState icon="📦" title="No orders" description="Orders from consumers will appear here." />
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <div key={o.id}
              onClick={() => setActiveOrder(o)}
              className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center flex-wrap gap-2">
              <div>
                <p className="font-semibold text-gray-800 text-sm">
                  #{o.order_number.slice(0, 8)} — {o.customer_name}
                </p>
                <p className="text-xs text-gray-500">
                  {o.advert?.title || 'Advert'} × {o.quantity} — {o.currency} {Number(o.total_amount).toFixed(2)}
                </p>
              </div>
              <div className="flex gap-2 items-center text-xs">
                <Badge variant={o.payment_status === 'paid' ? 'success' : 'warning'}>{o.payment_status}</Badge>
                <Badge>{o.fulfillment_status}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeOrder && (
        <OrderDetailModal order={activeOrder} onClose={() => { setActiveOrder(null); load(); }} />
      )}
    </Card>
  );
}

function OrderDetailModal({ order, onClose }) {
  const [data, setData] = useState(order);
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState(order.fulfillment_status);
  const [note, setNote] = useState('');
  const [courier, setCourier] = useState(order.courier_name || '');
  const [tracking, setTracking] = useState(order.tracking_number || '');

  useEffect(() => {
    vendorAPI.getOrder(order.id)
      .then((res) => setData(res.data))
      .catch(() => toast.error('Failed to load order details'));
  }, [order.id]);

  const update = async () => {
    setLoading(true);
    try {
      const res = await vendorAPI.updateOrderStatus(data.id, {
        status: newStatus, note,
        courier_name: courier, tracking_number: tracking,
      });
      setData(res.data);
      toast.success('Order updated');
      setNote('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally { setLoading(false); }
  };

  return (
    <Modal isOpen onClose={onClose} title={`Order #${data.order_number.slice(0, 8)}`} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">Customer:</span> <strong>{data.customer_name}</strong></div>
          <div><span className="text-gray-500">Email:</span> {data.customer_email}</div>
          <div><span className="text-gray-500">Phone:</span> {data.customer_phone}</div>
          <div><span className="text-gray-500">Total:</span> {data.currency} {Number(data.total_amount).toFixed(2)}</div>
          <div className="col-span-2"><span className="text-gray-500">Delivery:</span> {data.delivery_address}</div>
          {data.delivery_notes && (
            <div className="col-span-2"><span className="text-gray-500">Notes:</span> {data.delivery_notes}</div>
          )}
        </div>

        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Timeline</h4>
          <div className="space-y-2">
            {(data.timeline || []).map((t) => (
              <div key={t.id} className="flex items-start gap-2 text-sm">
                <div className="w-2 h-2 bg-faz-orange rounded-full mt-1.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{t.status}</p>
                  {t.note && <p className="text-gray-500 text-xs">{t.note}</p>}
                  <p className="text-gray-400 text-xs">{new Date(t.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {data.fulfillment_status !== 'completed' && data.fulfillment_status !== 'cancelled' && (
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-semibold text-gray-800">Update status</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">New status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <Input label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            {(newStatus === 'shipped') && (
              <div className="grid grid-cols-2 gap-3">
                <Input label="Courier" value={courier} onChange={(e) => setCourier(e.target.value)} />
                <Input label="Tracking number" value={tracking} onChange={(e) => setTracking(e.target.value)} />
              </div>
            )}
            <Button onClick={update} loading={loading}>Update</Button>
          </div>
        )}

        <ModalFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}

/* =====================================================================
 * PROFILE
 * ===================================================================== */
function ProfileTab({ vendor, onUpdate }) {
  const [form, setForm] = useState({
    business_name: vendor.business_name,
    description: vendor.description || '',
    contact_phone: vendor.contact_phone,
    contact_email: vendor.contact_email,
    contact_whatsapp: vendor.contact_whatsapp || '',
    location_name: vendor.location_name || '',
    latitude: vendor.latitude || '',
    longitude: vendor.longitude || '',
    logo_url: vendor.logo_url || '',
    banner_url: vendor.banner_url || '',
    website_url: vendor.website_url || '',
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await vendorAPI.updateProfile(form);
      toast.success('Profile updated');
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <Card padding="lg">
      <h2 className="font-bold text-gray-800 mb-4">Business Profile</h2>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Business name" value={form.business_name}
            onChange={(e) => setForm({ ...form, business_name: e.target.value })} required />
          <Input label="Website" value={form.website_url}
            onChange={(e) => setForm({ ...form, website_url: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea rows={3} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Contact email" value={form.contact_email}
            onChange={(e) => setForm({ ...form, contact_email: e.target.value })} required />
          <Input label="Contact phone" value={form.contact_phone}
            onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} required />
        </div>

        <Input label="WhatsApp" value={form.contact_whatsapp}
          onChange={(e) => setForm({ ...form, contact_whatsapp: e.target.value })} />

        <Input label="Location" value={form.location_name}
          onChange={(e) => setForm({ ...form, location_name: e.target.value })} />

        <div className="grid md:grid-cols-2 gap-4">
          <ImageInput label="Logo" category="vendor-logo" value={form.logo_url}
            onChange={(url) => setForm({ ...form, logo_url: url })} />
          <ImageInput label="Banner" category="vendor-banner" value={form.banner_url}
            onChange={(url) => setForm({ ...form, banner_url: url })} />
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button type="submit" loading={saving}>Save Changes</Button>
        </div>
      </form>
    </Card>
  );
}