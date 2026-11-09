// frontend/src/pages/admin/accreditation/AccreditationAdmin.jsx
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../api';
import {
  Card, Button, Input, Modal, ModalFooter, Spinner, EmptyState, Badge,
} from '../../../components/ui';
import { resolveAssetUrl } from '../../../utils/assets';
import { Check, X, Ban, RotateCcw, Eye, Search } from 'lucide-react';

const STATUS_META = {
  pending:   { label: 'Pending',   variant: 'warning' },
  approved:  { label: 'Approved',  variant: 'success' },
  rejected:  { label: 'Rejected',  variant: 'danger'  },
  cancelled: { label: 'Cancelled', variant: 'default' },
};

export default function AccreditationAdmin() {
  const [tab, setTab] = useState('overview');
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'applications', label: 'Applications' },
  ];

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold gradient-text">Match Accreditation</h1>
        <p className="text-gray-500">
          Review, approve, cancel, and reinstate per-match accreditation cards.
        </p>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
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

      {tab === 'overview' && <OverviewTab onOpenApplications={() => setTab('applications')} />}
      {tab === 'applications' && <ApplicationsTab />}
    </div>
  );
}

function OverviewTab({ onOpenApplications }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/accreditation/admin/stats')
      .then((res) => setStats(res.data))
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Spinner size="xl" /></div>;
  if (!stats) return null;

  const cards = [
    { key: 'pending',   label: 'Pending Review', color: 'from-yellow-500' },
    { key: 'approved',  label: 'Approved',       color: 'from-faz-green'  },
    { key: 'rejected',  label: 'Rejected',       color: 'from-faz-red'    },
    { key: 'cancelled', label: 'Cancelled',      color: 'from-gray-500'   },
  ];

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.key} padding="md" className="text-center">
            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${c.color} to-transparent mx-auto mb-2`} />
            <p className="text-3xl font-bold gradient-text">{stats[c.key] ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">{c.label}</p>
          </Card>
        ))}
      </div>

      <Card padding="lg">
        <h3 className="font-bold text-gray-800 mb-2">Quick actions</h3>
        <p className="text-sm text-gray-500 mb-3">
          Review pending applications first. Approved cards can be cancelled at any time
          (for example when credentials are revoked), and cancellations can be reversed.
        </p>
        <Button onClick={onOpenApplications}>
          Open Applications
        </Button>
      </Card>
    </div>
  );
}

function ApplicationsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: 'pending', category: 'all' });
  const [active, setActive] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/accreditation/admin/list', {
        params: {
          status: filters.status === 'all' ? undefined : filters.status,
          category: filters.category === 'all' ? undefined : filters.category,
        },
      });
      setItems(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters.status, filters.category]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((it) =>
      [it.full_name, it.email, it.phone, it.id_number, it.organization,
       it.match?.home_team, it.match?.away_team, it.category_label]
        .some((v) => String(v || '').toLowerCase().includes(q))
    );
  }, [items, search]);

  return (
    <Card padding="lg">
      <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, organization…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-faz-orange/30"
          />
        </div>
        <div className="flex gap-2">
          <select value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
            <option value="all">All categories</option>
            <option value="media">Media</option>
            <option value="faz_secretariat">FAZ Secretariat</option>
            <option value="faz_exco">FAZ Exco</option>
            <option value="service_provider">Service Provider</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="xl" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🎟️"
          title="No applications"
          description="Applications that match your filters will appear here."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((acc) => {
            const meta = STATUS_META[acc.status] || STATUS_META.pending;
            const match = acc.match;
            return (
              <div key={acc.id}
                className="border border-gray-200 rounded-lg p-3 flex justify-between items-center flex-wrap gap-3 hover:bg-gray-50">
                <div className="flex items-center gap-3 min-w-0">
                  {acc.passport_photo_url ? (
                    <img src={resolveAssetUrl(acc.passport_photo_url)}
                         alt="" className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                      👤
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{acc.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {acc.category_label}
                      {acc.service_provider_type_label ? ` · ${acc.service_provider_type_label}` : ''}
                      {' · '}{acc.email || acc.phone || '—'}
                    </p>
                    {match && (
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">
                        {match.home_team} vs {match.away_team}
                        {match.match_date ? ` · ${new Date(match.match_date).toLocaleDateString()}` : ''}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                  <Button size="sm" variant="outline" onClick={() => setActive(acc)}>
                    <Eye className="w-3 h-3" /> View
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {active && (
        <AccreditationModal
          acc={active}
          onClose={() => { setActive(null); load(); }}
        />
      )}
    </Card>
  );
}

function AccreditationModal({ acc, onClose }) {
  const [data, setData] = useState(acc);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      const res = await api.get(`/accreditation/admin/${data.id}`);
      setData(res.data);
    } catch { /* ignore */ }
  };

  const run = async (action, payload) => {
    setBusy(true);
    try {
      await api.put(`/accreditation/admin/${data.id}/${action}`, payload || {});
      toast.success('Done');
      await refresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const approve = () => run('approve');
  const reject = () => {
    const r = prompt('Reason for rejection:');
    if (!r) return;
    run('reject', { reason: r });
  };
  const cancel = () => {
    const r = prompt('Reason for cancellation:');
    if (!r) return;
    run('cancel', { reason: r });
  };
  const reverse = () => {
    if (!confirm('Reverse the cancellation and restore this card to approved?')) return;
    run('reverse-cancel');
  };

  const meta = STATUS_META[data.status] || STATUS_META.pending;

  return (
    <Modal isOpen onClose={onClose} title="Accreditation Detail" size="lg">
      <div className="space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{data.full_name}</h3>
            <p className="text-sm text-gray-500">
              {data.category_label}
              {data.service_provider_type_label ? ` · ${data.service_provider_type_label}` : ''}
            </p>
          </div>
          <Badge variant={meta.variant}>{meta.label}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">Email:</span> {data.email || '—'}</div>
          <div><span className="text-gray-500">Phone:</span> {data.phone || '—'}</div>
          <div><span className="text-gray-500">Nationality:</span> {data.nationality_name || '—'}</div>
          <div><span className="text-gray-500">ID / NRC:</span> {data.id_number || '—'}</div>
          <div><span className="text-gray-500">Organization:</span> {data.organization || '—'}</div>
          <div><span className="text-gray-500">Position:</span> {data.position_title || '—'}</div>
          {data.match && (
            <>
              <div className="col-span-2">
                <span className="text-gray-500">Match:</span>{' '}
                {data.match.home_team} vs {data.match.away_team}
                {data.match.match_date ? ` — ${new Date(data.match.match_date).toLocaleString()}` : ''}
              </div>
              {data.match.venue && (
                <div className="col-span-2">
                  <span className="text-gray-500">Venue:</span> {data.match.venue}
                </div>
              )}
            </>
          )}
          <div><span className="text-gray-500">QR Token:</span> <code className="text-xs">{data.qr_token}</code></div>
          <div><span className="text-gray-500">Checked in:</span> {data.is_checked_in ? 'Yes' : 'No'}</div>
        </div>

        {data.passport_photo_url && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Photo</p>
            <img src={resolveAssetUrl(data.passport_photo_url)} alt={data.full_name}
                 className="w-32 h-32 object-cover rounded-lg border border-gray-200" />
          </div>
        )}

        {data.rejection_reason && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            <strong>Rejected:</strong> {data.rejection_reason}
          </div>
        )}
        {data.cancellation_reason && (
          <div className="bg-gray-100 border border-gray-200 text-gray-700 rounded-lg p-3 text-sm">
            <strong>Cancelled:</strong> {data.cancellation_reason}
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t pt-3">
          {data.status === 'pending' && (
            <>
              <Button onClick={approve} loading={busy}>
                <Check className="w-4 h-4" /> Approve
              </Button>
              <Button variant="danger" onClick={reject} loading={busy}>
                <X className="w-4 h-4" /> Reject
              </Button>
            </>
          )}
          {data.status === 'approved' && (
            <Button variant="danger" onClick={cancel} loading={busy}>
              <Ban className="w-4 h-4" /> Cancel Card
            </Button>
          )}
          {data.status === 'cancelled' && (
            <Button onClick={reverse} loading={busy}>
              <RotateCcw className="w-4 h-4" /> Reverse Cancellation
            </Button>
          )}
          {(data.status === 'rejected') && (
            <Button onClick={approve} loading={busy}>
              <Check className="w-4 h-4" /> Approve Anyway
            </Button>
          )}
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}