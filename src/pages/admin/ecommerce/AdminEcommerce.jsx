// frontend/src/pages/admin/ecommerce/AdminEcommerce.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ecommerceAdminAPI } from '../../../api';
import {
  Card, Button, Input, Modal, ModalFooter, Spinner, EmptyState, Badge,
} from '../../../components/ui';
import { resolveAssetUrl } from '../../../utils/assets';
import { Pencil, Trash2, Plus, Check, X, MapPin, RotateCcw } from 'lucide-react';

export default function AdminEcommerce() {
  const [tab, setTab] = useState('overview');
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'vendors', label: 'Vendors' },
    { id: 'adverts', label: 'Adverts' },
    { id: 'orders', label: 'Orders' },
    { id: 'categories', label: 'Categories' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold gradient-text">E-commerce Admin</h1>
        <p className="text-gray-500">Manage vendors, adverts, orders, and settings.</p>
      </div>

      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition ${
              tab === t.id
                ? 'text-faz-orange border-b-2 border-faz-orange'
                : 'text-gray-500 hover:text-gray-800'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab />}
      {tab === 'vendors' && <VendorsTab />}
      {tab === 'adverts' && <AdvertsTab />}
      {tab === 'orders' && <OrdersTab />}
      {tab === 'categories' && <CategoriesTab />}
      {tab === 'settings' && <SettingsTab />}
    </div>
  );
}

/* =====================================================================
 * OVERVIEW
 * ===================================================================== */
function OverviewTab() {
  const [stats, setStats] = useState({ vendors: 0, pendingVendors: 0, adverts: 0, pendingAdverts: 0, orders: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      ecommerceAdminAPI.listVendors(),
      ecommerceAdminAPI.listAdverts(),
      ecommerceAdminAPI.listOrders(),
    ]).then(([v, a, o]) => {
      setStats({
        vendors: v.data.length,
        pendingVendors: v.data.filter((x) => x.status === 'pending').length,
        adverts: a.data.length,
        pendingAdverts: a.data.filter((x) => x.status === 'pending').length,
        orders: o.data.length,
      });
    }).catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  const seed = async () => {
    try {
      await ecommerceAdminAPI.seedDefaults();
      toast.success('Defaults seeded');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Seed failed');
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="xl" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-5 gap-4">
        {[
          { label: 'Vendors', value: stats.vendors },
          { label: 'Pending Vendors', value: stats.pendingVendors },
          { label: 'Adverts', value: stats.adverts },
          { label: 'Pending Adverts', value: stats.pendingAdverts },
          { label: 'Orders', value: stats.orders },
        ].map((s) => (
          <Card key={s.label} padding="md" className="text-center">
            <p className="text-3xl font-bold gradient-text">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card padding="lg">
        <h3 className="font-bold text-gray-800 mb-2">Quick setup</h3>
        <p className="text-sm text-gray-500 mb-3">
          If you haven't already, seed the default categories and settings.
        </p>
        <Button onClick={seed} variant="outline">Seed Default Categories & Settings</Button>
      </Card>
    </div>
  );
}

/* =====================================================================
 * VENDORS
 * ===================================================================== */
function VendorsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try { setItems((await ecommerceAdminAPI.listVendors(filter || undefined)).data || []); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const approve = async (id) => {
    try { await ecommerceAdminAPI.approveVendor(id); toast.success('Approved'); load(); }
    catch { toast.error('Failed'); }
  };

  const reject = async (id) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    try { await ecommerceAdminAPI.rejectVendor(id, reason); toast.success('Rejected'); load(); }
    catch { toast.error('Failed'); }
  };

  const suspend = async (id) => {
    if (!confirm('Suspend this vendor? Their adverts will be hidden from the shop until reinstated.')) return;
    try { await ecommerceAdminAPI.suspendVendor(id); toast.success('Suspended'); load(); }
    catch { toast.error('Failed'); }
  };

  const unsuspend = async (id) => {
    if (!confirm('Reinstate this vendor? Their approved adverts will become visible again.')) return;
    try { await ecommerceAdminAPI.unsuspendVendor(id); toast.success('Vendor reinstated'); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="xl" /></div>;

  return (
    <Card padding="lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-gray-800">Vendors ({items.length})</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="suspended">Suspended</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {items.length === 0 ? <EmptyState icon="🏪" title="No vendors" description="Vendor applications will appear here." /> : (
        <div className="space-y-2">
          {items.map((v) => (
            <div key={v.id} className="border border-gray-200 rounded-lg p-3 flex justify-between items-center flex-wrap gap-2">
              <div className="flex-1 min-w-[200px]">
                <p className="font-semibold text-gray-800">{v.business_name}</p>
                <p className="text-xs text-gray-500">
                  {v.contact_email} · {v.location_name || 'No location'}
                </p>
                {v.status === 'rejected' && v.rejection_reason && (
                  <p className="text-xs text-red-600 mt-1">Rejected: {v.rejection_reason}</p>
                )}
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                <Badge variant={
                  v.status === 'approved' ? 'success' :
                  v.status === 'pending' ? 'warning' :
                  v.status === 'suspended' ? 'danger' :
                  v.status === 'rejected' ? 'danger' : 'default'
                }>{v.status}</Badge>

                {v.status === 'pending' && (
                  <>
                    <Button size="sm" onClick={() => approve(v.id)}>
                      <Check className="w-3 h-3" /> Approve
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => reject(v.id)}>
                      <X className="w-3 h-3" /> Reject
                    </Button>
                  </>
                )}

                {v.status === 'approved' && (
                  <Button size="sm" variant="danger" onClick={() => suspend(v.id)}>
                    Suspend
                  </Button>
                )}

                {v.status === 'suspended' && (
                  <>
                    <Button size="sm" variant="primary" onClick={() => unsuspend(v.id)}>
                      <RotateCcw className="w-3 h-3" /> Unsuspend
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => reject(v.id)}>
                      <X className="w-3 h-3" /> Reject permanently
                    </Button>
                  </>
                )}

                {v.status === 'rejected' && (
                  <Button size="sm" variant="outline" onClick={() => approve(v.id)}>
                    <RotateCcw className="w-3 h-3" /> Reinstate
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* =====================================================================
 * ADVERTS
 * ===================================================================== */
function AdvertsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [active, setActive] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setItems((await ecommerceAdminAPI.listAdverts(filter || undefined)).data || []); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  if (loading) return <div className="flex justify-center py-12"><Spinner size="xl" /></div>;

  return (
    <Card padding="lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-gray-800">Adverts ({items.length})</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
          <option value="">All</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="paused">Paused</option>
        </select>
      </div>

      {items.length === 0 ? <EmptyState icon="📦" title="No adverts" description="Vendor adverts will appear here." /> : (
        <div className="space-y-2">
          {items.map((a) => (
            <div key={a.id} onClick={() => setActive(a)}
              className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center flex-wrap gap-2">
              <div className="flex gap-3 items-center">
                <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {a.cover_image && <img src={resolveAssetUrl(a.cover_image)} alt="" className="w-full h-full object-cover" />}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{a.title}</p>
                  <p className="text-xs text-gray-500">{a.vendor?.business_name}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant={
                  a.status === 'approved' ? 'success' :
                  a.status === 'pending' ? 'warning' :
                  a.status === 'rejected' ? 'danger' : 'default'
                }>{a.status}</Badge>
                {a.is_premium && <Badge variant="orange">Premium</Badge>}
              </div>
            </div>
          ))}
        </div>
      )}

      {active && <AdvertDetailModal advert={active} onClose={() => { setActive(null); load(); }} />}
    </Card>
  );
}

function AdvertDetailModal({ advert, onClose }) {
  const [data, setData] = useState(advert);
  const [showAttach, setShowAttach] = useState(false);

  const refresh = async () => {
    try {
      const res = await ecommerceAdminAPI.getAdvert(advert.id);
      setData(res.data);
    } catch { /* noop */ }
  };

  const approve = async () => {
    try { await ecommerceAdminAPI.approveAdvert(data.id); toast.success('Approved'); refresh(); }
    catch { toast.error('Failed'); }
  };

  const reject = async () => {
    const reason = prompt('Reason:');
    if (!reason) return;
    try { await ecommerceAdminAPI.rejectAdvert(data.id, reason); toast.success('Rejected'); refresh(); }
    catch { toast.error('Failed'); }
  };

  const pause = async () => {
    try { await ecommerceAdminAPI.pauseAdvert(data.id); toast.success('Paused'); refresh(); }
    catch { toast.error('Failed'); }
  };

  const removeAttachment = async (attachId) => {
    if (!confirm('Remove this attachment?')) return;
    try {
      await ecommerceAdminAPI.removeAttachment(data.id, attachId);
      toast.success('Removed');
      refresh();
    } catch { toast.error('Failed'); }
  };

  return (
    <>
      <Modal isOpen onClose={onClose} title={data.title} size="lg">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <Badge>{data.status}</Badge>
            {data.is_premium && <Badge variant="orange">Premium</Badge>}
            <span className="text-sm text-gray-500">{data.vendor?.business_name}</span>
          </div>

          <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.description}</p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Price:</span> {data.price != null ? `${data.currency} ${Number(data.price).toFixed(2)}` : 'Contact'}</div>
            <div><span className="text-gray-500">Payment:</span> {data.payment_method}</div>
            <div><span className="text-gray-500">Location:</span> {data.location_name || '—'}</div>
            <div><span className="text-gray-500">Views:</span> {data.views_count}</div>
          </div>

          {data.media?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Media ({data.media.length})</h4>
              <div className="grid grid-cols-4 gap-2">
                {data.media.filter((m) => m.media_type === 'image').map((m) => (
                  <img key={m.id} src={resolveAssetUrl(m.url)} alt="" className="w-full h-20 object-cover rounded" />
                ))}
              </div>
            </div>
          )}

          {data.matches?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Match Attachments ({data.matches.length})</h4>
              <div className="space-y-1">
                {data.matches.map((m) => (
                  <div key={m.id} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                    <span className="font-mono text-xs">{m.match_id.slice(0, 8)}...</span>
                    <div className="flex gap-2 items-center">
                      <Badge variant={m.is_active ? 'success' : 'warning'}>
                        {m.is_active ? 'active' : 'pending'}
                      </Badge>
                      <Button size="sm" variant="danger" onClick={() => removeAttachment(m.id)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t pt-3">
            {data.status === 'pending' && (
              <>
                <Button onClick={approve}><Check className="w-4 h-4" /> Approve</Button>
                <Button variant="danger" onClick={reject}><X className="w-4 h-4" /> Reject</Button>
              </>
            )}
            {data.status === 'approved' && (
              <>
                <Button variant="outline" onClick={() => setShowAttach(true)}>
                  <MapPin className="w-4 h-4" /> Attach to Match
                </Button>
                <Button variant="outline" onClick={pause}>Pause</Button>
              </>
            )}
          </div>

          <ModalFooter>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </ModalFooter>
        </div>
      </Modal>

      {showAttach && (
        <AttachModal advert={data} onClose={() => { setShowAttach(false); refresh(); }} />
      )}
    </>
  );
}

function AttachModal({ advert, onClose }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Reuse the same helper from vendorAPI's endpoint
    import('../../../api').then(({ vendorAPI }) => {
      vendorAPI.getMatchesForAttachment()
        .then((res) => setMatches(res.data || []))
        .catch(() => toast.error('Failed to load matches'))
        .finally(() => setLoading(false));
    });
  }, []);

  const submit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await ecommerceAdminAPI.attachAdvertToMatch(advert.id, selected);
      toast.success('Attached');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setSubmitting(false); }
  };

  return (
    <Modal isOpen onClose={onClose} title="Attach to Match">
      {loading ? <Spinner /> : (
        <div className="space-y-4">
          <select value={selected} onChange={(e) => setSelected(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">— Select match —</option>
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.home_team} vs {m.away_team} {m.match_date ? `— ${new Date(m.match_date).toLocaleDateString()}` : ''}
              </option>
            ))}
          </select>
          <ModalFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={submit} loading={submitting} disabled={!selected}>Attach</Button>
          </ModalFooter>
        </div>
      )}
    </Modal>
  );
}

/* =====================================================================
 * ORDERS
 * ===================================================================== */
function OrdersTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ecommerceAdminAPI.listOrders()
      .then((res) => setItems(res.data || []))
      .catch(() => toast.error('Failed'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Spinner size="xl" /></div>;

  return (
    <Card padding="lg">
      <h2 className="font-bold text-gray-800 mb-4">Orders ({items.length})</h2>
      {items.length === 0 ? (
        <EmptyState icon="📦" title="No orders" description="Consumer orders will appear here." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-800">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-gray-700 font-semibold">Order #</th>
                <th className="px-3 py-2 text-left text-gray-700 font-semibold">Customer</th>
                <th className="px-3 py-2 text-left text-gray-700 font-semibold">Vendor</th>
                <th className="px-3 py-2 text-right text-gray-700 font-semibold">Total</th>
                <th className="px-3 py-2 text-left text-gray-700 font-semibold">Payment</th>
                <th className="px-3 py-2 text-left text-gray-700 font-semibold">Fulfillment</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs">{o.order_number.slice(0, 8)}</td>
                  <td className="px-3 py-2">{o.customer_name}</td>
                  <td className="px-3 py-2">{o.advert?.vendor?.business_name}</td>
                  <td className="px-3 py-2 text-right font-medium">{o.currency} {Number(o.total_amount).toFixed(2)}</td>
                  <td className="px-3 py-2"><Badge variant={o.payment_status === 'paid' ? 'success' : 'warning'}>{o.payment_status}</Badge></td>
                  <td className="px-3 py-2"><Badge>{o.fulfillment_status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* =====================================================================
 * CATEGORIES
 * ===================================================================== */
function CategoriesTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', icon: '', sort_order: 0, is_active: true });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setItems((await ecommerceAdminAPI.listCategories()).data || []); }
    catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', slug: '', icon: '', sort_order: 0, is_active: true }); setShowForm(true); };
  const openEdit = (c) => { setEditing(c); setForm(c); setShowForm(true); };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await ecommerceAdminAPI.updateCategory(editing.id, form);
      else await ecommerceAdminAPI.createCategory(form);
      toast.success('Saved');
      setShowForm(false);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete?')) return;
    try { await ecommerceAdminAPI.deleteCategory(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="xl" /></div>;

  return (
    <Card padding="lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-gray-800">Categories ({items.length})</h2>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Add Category</Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((c) => (
          <div key={c.id} className="border border-gray-200 rounded-lg p-3 flex justify-between items-center">
            <div>
              <p className="font-semibold text-gray-800">{c.icon} {c.name}</p>
              <p className="text-xs text-gray-500 font-mono">{c.slug}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => openEdit(c)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => remove(c.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Category' : 'New Category'}>
        <form onSubmit={submit} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated if empty" />
          <Input label="Icon (emoji)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
          <Input type="number" label="Order" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Update' : 'Create'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </Card>
  );
}

/* =====================================================================
 * SETTINGS
 * ===================================================================== */
function SettingsTab() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    ecommerceAdminAPI.getSettings()
      .then((res) => {
        const map = {};
        (res.data || []).forEach((s) => { map[s.key] = s.value; });
        setSettings(map);
      })
      .catch(() => toast.error('Failed'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await ecommerceAdminAPI.updateSettings(settings);
      toast.success('Settings saved');
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="xl" /></div>;

  const fields = [
    { key: 'listing_fee_amount', label: 'Listing fee (ZMW)', hint: 'Vendors pay this to publish a standard advert.' },
    { key: 'premium_fee_amount', label: 'Premium attachment fee (ZMW)', hint: 'Vendors pay this to attach an advert to a specific match.' },
    { key: 'platform_fee_percent', label: 'Platform fee (%)', hint: 'Consumer-side fee on system payments.' },
    { key: 'default_currency', label: 'Default currency', hint: 'e.g. ZMW' },
  ];

  return (
    <Card padding="lg">
      <h2 className="font-bold text-gray-800 mb-4">E-commerce Settings</h2>
      <div className="space-y-4 max-w-lg">
        {fields.map((f) => (
          <div key={f.key}>
            <Input
              label={f.label}
              value={settings[f.key] || ''}
              onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">{f.hint}</p>
          </div>
        ))}
        <Button onClick={save} loading={saving}>Save Settings</Button>
      </div>
    </Card>
  );
}