// frontend/src/pages/finance/FinanceDashboard.jsx
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api';
import GlassCard from '../../components/GlassCard';
import {
  FaChartLine, FaMoneyBillWave, FaClock, FaExclamationTriangle,
  FaSyncAlt, FaSearch, FaFilePdf, FaFileExcel, FaPrint,
  FaChevronLeft, FaChevronRight, FaCheckCircle, FaTimes,
} from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// =====================================================================
// HELPERS
// =====================================================================
function fmtMoney(n) {
  const v = Number(n || 0);
  return v.toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}
function fmtDateTime(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('en-GB'); } catch { return iso; }
}
const STATUS_STYLES = {
  paid:     { label: 'Paid',     cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
  pending:  { label: 'Pending',  cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  failed:   { label: 'Failed',   cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
  cancelled:{ label: 'Cancelled',cls: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  unknown:  { label: 'Unknown',  cls: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};
const SOURCE_STYLES = {
  ticket:     { label: 'Ticket',     cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  shop:       { label: 'Shop',       cls: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  vendor_fee: { label: 'Vendor Fee', cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
};

// =====================================================================
// MAIN
// =====================================================================
export default function FinanceDashboard() {
  const [tab, setTab] = useState('overview');
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'payments', label: 'All Payments' },
  ];

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold gradient-text">Finance Dashboard</h1>
        <p className="text-gray-500">
          Track all revenue from tickets, shop sales, and vendor fees.
        </p>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
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

      {tab === 'overview' && <OverviewTab />}
      {tab === 'payments' && <PaymentsTab />}
    </div>
  );
}

// =====================================================================
// OVERVIEW TAB
// =====================================================================
function OverviewTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [windowDays, setWindowDays] = useState(30);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await api.get('/finance/overview', { params: { days: windowDays } });
      setData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load overview');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [windowDays]);

  if (loading) {
    return <div className="flex justify-center py-20">
      <div className="w-16 h-16 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin" />
    </div>;
  }
  if (!data) return null;

  const maxDaily = Math.max(1, ...data.daily.map(d => d.amount));
  const totalMethod = data.by_method.reduce((s, m) => s + m.amount, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Period:</span>
          {[7, 30, 90, 180].map((d) => (
            <button key={d} onClick={() => setWindowDays(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                windowDays === d ? 'bg-faz-orange text-white' : 'glass hover:bg-white/10'
              }`}>
              {d}d
            </button>
          ))}
        </div>
        <button onClick={() => load(true)} disabled={refreshing}
          className="glass px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-white/10 disabled:opacity-50">
          <FaSyncAlt className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard icon={FaMoneyBillWave} label="Gross Revenue"
          value={`ZMW ${fmtMoney(data.total_gross)}`} color="from-faz-green" />
        <KpiCard icon={FaMoneyBillWave} label="FAZ Revenue"
          value={`ZMW ${fmtMoney(data.total_faz)}`} color="from-faz-orange" />
        <KpiCard icon={FaChartLine} label="This Month"
          value={`ZMW ${fmtMoney(data.this_month)}`}
          sub={data.change_pct !== 0 && (
            <span className={data.change_pct >= 0 ? 'text-green-400' : 'text-red-400'}>
              {data.change_pct >= 0 ? '↑' : '↓'} {Math.abs(data.change_pct)}% vs last month
            </span>
          )}
          color="from-blue-500" />
        <KpiCard icon={FaClock} label="Pending"
          value={`ZMW ${fmtMoney(data.total_pending)}`} color="from-yellow-500" />
        <KpiCard icon={FaExclamationTriangle} label="Failed"
          value={`ZMW ${fmtMoney(data.total_failed)}`} color="from-faz-red" />
        <KpiCard icon={FaCheckCircle} label="Transactions"
          value={data.total_transactions.toLocaleString()} color="from-faz-green" />
      </div>

      {/* Chart + breakdowns */}
      <div className="grid lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-white">Daily Revenue (last {data.window_days} days)</h3>
            <span className="text-xs text-gray-400">Paid only</span>
          </div>
          <div className="flex items-end gap-[2px] h-48">
            {data.daily.map((d, i) => {
              const pct = (d.amount / maxDaily) * 100;
              return (
                <div key={d.date}
                  className="flex-1 bg-gradient-to-t from-faz-orange to-faz-green rounded-t-sm hover:from-faz-red hover:to-faz-orange transition-colors"
                  style={{ height: `${Math.max(pct, 1)}%` }}
                  title={`${d.date}: ZMW ${fmtMoney(d.amount)} (${d.count} tx)`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{data.daily[0]?.date}</span>
            <span>{data.daily[data.daily.length - 1]?.date}</span>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-bold text-white mb-3">By Source</h3>
          <div className="space-y-3">
            {Object.entries(data.by_source).map(([k, v]) => (
              <div key={k}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{v.label}</span>
                  <span className="font-mono text-white">ZMW {fmtMoney(v.paid)}</span>
                </div>
                <div className="flex gap-2 text-[10px]">
                  <span className="text-green-400">Paid {v.count}</span>
                  {v.pending > 0 && <span className="text-yellow-400">Pending ZMW {fmtMoney(v.pending)}</span>}
                  {v.failed > 0 && <span className="text-red-400">Failed ZMW {fmtMoney(v.failed)}</span>}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <h3 className="font-bold text-white mb-3">By Payment Method</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {data.by_method.length === 0 ? (
            <p className="text-sm text-gray-400">No payment data yet.</p>
          ) : data.by_method.map((m) => {
            const pct = (m.amount / totalMethod) * 100;
            return (
              <div key={m.method}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{m.label}</span>
                  <span className="font-mono text-white">ZMW {fmtMoney(m.amount)}</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-faz-green to-faz-orange"
                    style={{ width: `${pct}%` }} />
                </div>
                <div className="text-right text-[10px] text-gray-400 mt-0.5">{pct.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color }) {
  return (
    <GlassCard>
      <Icon className={`w-8 h-8 mb-2 bg-gradient-to-r ${color} to-transparent bg-clip-text text-transparent`} />
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-lg font-bold text-white mt-0.5">{value}</p>
      {sub && <div className="text-xs mt-1">{sub}</div>}
    </GlassCard>
  );
}

// =====================================================================
// PAYMENTS TAB
// =====================================================================
function PaymentsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    source: 'all', status: 'all', method: 'all', search: '', days: 90,
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [activePayment, setActivePayment] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const from = new Date();
      from.setDate(from.getDate() - filters.days);
      const res = await api.get('/finance/payments', {
        params: {
          source: filters.source === 'all' ? undefined : filters.source,
          status: filters.status === 'all' ? undefined : filters.status,
          method: filters.method === 'all' ? undefined : filters.method,
          from: from.toISOString().slice(0, 10),
        },
      });
      setItems(res.data.items || []);
      setPage(1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters.source, filters.status, filters.method, filters.days]);

  // Client-side search filter
  const filtered = useMemo(() => {
    if (!filters.search.trim()) return items;
    const q = filters.search.toLowerCase();
    return items.filter((it) =>
      ['reference', 'customer', 'description', 'source_label', 'method_label', 'status']
        .some((k) => String(it[k] || '').toLowerCase().includes(q))
    );
  }, [items, filters.search]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(startIdx, startIdx + pageSize);

  // ---- Exports ----
  const exportHeaders = ['SN', 'Date', 'Source', 'Reference', 'Description', 'Customer', 'Method', 'Amount', 'Currency', 'Status'];
  const exportRows = filtered.map((it, i) => [
    i + 1,
    fmtDate(it.created_at),
    it.source_label,
    it.reference,
    it.description,
    it.customer,
    it.method_label,
    fmtMoney(it.amount),
    it.currency,
    STATUS_STYLES[it.status]?.label || it.status,
  ]);

  const handlePDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text('Finance — Payments', 14, 15);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()} — ${exportRows.length} record(s)`, 14, 20);
    autoTable(doc, {
      head: [exportHeaders],
      body: exportRows,
      startY: 25,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [200, 100, 30], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 248, 248] },
    });
    doc.save(`finance_payments_${Date.now()}.pdf`);
  };

  const handleExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet([exportHeaders, ...exportRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payments');
    XLSX.writeFile(wb, `finance_payments_${Date.now()}.xlsx`);
  };

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=1100,height=800');
    if (!win) { toast.error('Please allow popups'); return; }
    const html = `
      <html><head><title>Finance Payments</title>
      <style>
        body{font-family:Arial,sans-serif;padding:20px;color:#222}
        h1{font-size:20px;margin-bottom:4px}
        .meta{color:#666;font-size:12px;margin-bottom:16px}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;font-size:12px}
        th{background:#f2f2f2}
        tr:nth-child(even) td{background:#fafafa}
      </style></head>
      <body>
        <h1>Finance — Payments</h1>
        <div class="meta">Generated: ${new Date().toLocaleString()} — ${exportRows.length} record(s)</div>
        <table>
          <thead><tr>${exportHeaders.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${exportRows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
      </body></html>`;
    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 300);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <GlassCard>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-400 mb-1">Search</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input type="text"
                value={filters.search}
                onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
                placeholder="Reference, customer, description…"
                className="glass w-full pl-9 pr-3 py-2 rounded text-sm text-white placeholder-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Source</label>
            <select value={filters.source}
              onChange={(e) => setFilters({ ...filters, source: e.target.value })}
              className="glass px-3 py-2 rounded text-sm text-white">
              <option value="all">All</option>
              <option value="ticket">Tickets</option>
              <option value="shop">Shop</option>
              <option value="vendor_fee">Vendor Fees</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="glass px-3 py-2 rounded text-sm text-white">
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Method</label>
            <select value={filters.method}
              onChange={(e) => setFilters({ ...filters, method: e.target.value })}
              className="glass px-3 py-2 rounded text-sm text-white">
              <option value="all">All</option>
              <option value="system">FAZ Gateway</option>
              <option value="MTN_MOMO_ZMB">MTN MoMo</option>
              <option value="AIRTEL_OAPI_ZMB">Airtel Money</option>
              <option value="ZAMTEL_ZMB">Zamtel Money</option>
              <option value="offline">Direct (Offline)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Period</label>
            <select value={filters.days}
              onChange={(e) => setFilters({ ...filters, days: parseInt(e.target.value) })}
              className="glass px-3 py-2 rounded text-sm text-white">
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
            </select>
          </div>

          <div className="ml-auto flex gap-2">
            <button onClick={handlePDF} className="glass px-3 py-2 rounded text-sm hover:bg-white/10" title="Export PDF">
              <FaFilePdf className="text-red-400" />
            </button>
            <button onClick={handleExcel} className="glass px-3 py-2 rounded text-sm hover:bg-white/10" title="Export Excel">
              <FaFileExcel className="text-green-400" />
            </button>
            <button onClick={handlePrint} className="glass px-3 py-2 rounded text-sm hover:bg-white/10" title="Print">
              <FaPrint className="text-blue-400" />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard className="text-center py-10 text-gray-400">
          No payments match these filters.
        </GlassCard>
      ) : (
        <GlassCard className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 bg-gray-800/50">
              <tr>
                <th className="px-3 py-2 text-left text-white w-12">SN</th>
                <th className="px-3 py-2 text-left text-white">Date</th>
                <th className="px-3 py-2 text-left text-white">Source</th>
                <th className="px-3 py-2 text-left text-white">Reference</th>
                <th className="px-3 py-2 text-left text-white">Description</th>
                <th className="px-3 py-2 text-left text-white">Customer</th>
                <th className="px-3 py-2 text-left text-white">Method</th>
                <th className="px-3 py-2 text-right text-white">Amount</th>
                <th className="px-3 py-2 text-left text-white">Status</th>
                <th className="px-3 py-2 text-right text-white w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((it, idx) => {
                const status = STATUS_STYLES[it.status] || STATUS_STYLES.unknown;
                const src = SOURCE_STYLES[it.source] || {};
                return (
                  <tr key={`${it.source}-${it.id}`} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-3 py-2 text-gray-400">{startIdx + idx + 1}</td>
                    <td className="px-3 py-2 text-gray-300 text-xs">{fmtDate(it.created_at)}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${src.cls}`}>
                        {src.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-300">{String(it.reference).slice(0, 8)}</td>
                    <td className="px-3 py-2 text-gray-300 truncate max-w-[220px]" title={it.description}>{it.description}</td>
                    <td className="px-3 py-2 text-gray-300 text-xs truncate max-w-[180px]" title={it.customer}>{it.customer}</td>
                    <td className="px-3 py-2 text-gray-300 text-xs">{it.method_label}</td>
                    <td className="px-3 py-2 text-right font-mono text-white">{it.currency} {fmtMoney(it.amount)}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${status.cls}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => setActivePayment(it)}
                        className="text-xs px-2 py-1 rounded bg-faz-orange/20 text-faz-orange hover:bg-faz-orange hover:text-white transition">
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </GlassCard>
      )}

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Rows per page:</span>
          <select value={pageSize}
            onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1); }}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm">
            {[5, 10, 20, 50, 100, 200, 500].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="ml-2">
            {total === 0 ? '0' : `${startIdx + 1}–${Math.min(startIdx + pageSize, total)}`} of {total}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}
            className="glass px-3 py-1 rounded text-sm disabled:opacity-40">
            <FaChevronLeft />
          </button>
          <span className="text-sm text-gray-300">Page {currentPage} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
            className="glass px-3 py-1 rounded text-sm disabled:opacity-40">
            <FaChevronRight />
          </button>
        </div>
      </div>

      {/* Detail modal */}
      {activePayment && (
        <PaymentDetailModal
          payment={activePayment}
          onClose={() => setActivePayment(null)}
          onUpdated={(updated) => {
            setItems((prev) => prev.map((x) =>
              x.id === updated.id && x.source === updated.source ? updated : x
            ));
            setActivePayment(null);
          }}
        />
      )}
    </div>
  );
}

// =====================================================================
// PAYMENT DETAIL MODAL
// =====================================================================
function PaymentDetailModal({ payment, onClose, onUpdated }) {
  const [mode, setMode] = useState('view');  // 'view' | 'mark'
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleMark = async () => {
    if (!reference.trim()) { toast.error('Reference is required'); return; }
    setSubmitting(true);
    try {
      const res = await api.put(
        `/finance/payments/${payment.source}/${payment.id}/mark-received`,
        { reference: reference.trim() }
      );
      toast.success('Payment marked as received');
      onUpdated(res.data.payment);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to mark payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/10">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h3 className="font-bold text-white">Payment Detail</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <FaTimes />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Source:</span> <span className="text-white">{payment.source_label}</span></div>
            <div><span className="text-gray-500">Reference:</span> <span className="font-mono text-white text-xs">{payment.reference}</span></div>
            <div className="col-span-2"><span className="text-gray-500">Description:</span> <span className="text-white">{payment.description}</span></div>
            <div><span className="text-gray-500">Customer:</span> <span className="text-white text-xs">{payment.customer}</span></div>
            <div><span className="text-gray-500">Method:</span> <span className="text-white">{payment.method_label}</span></div>
            <div><span className="text-gray-500">Amount:</span> <span className="text-white font-mono">{payment.currency} {fmtMoney(payment.amount)}</span></div>
            <div><span className="text-gray-500">FAZ Share:</span> <span className="text-faz-orange font-mono">{payment.currency} {fmtMoney(payment.faz_share)}</span></div>
            <div><span className="text-gray-500">Status:</span>
              <span className={`ml-1 text-[10px] px-2 py-0.5 rounded-full border ${STATUS_STYLES[payment.status]?.cls}`}>
                {STATUS_STYLES[payment.status]?.label}
              </span>
            </div>
            <div><span className="text-gray-500">Created:</span> <span className="text-white text-xs">{fmtDateTime(payment.created_at)}</span></div>
            <div><span className="text-gray-500">Paid:</span> <span className="text-white text-xs">{fmtDateTime(payment.paid_at)}</span></div>
            {payment.payment_reference && (
              <div className="col-span-2"><span className="text-gray-500">Payment Ref:</span> <span className="font-mono text-white text-xs">{payment.payment_reference}</span></div>
            )}
          </div>

          {payment.can_mark_received && mode === 'view' && (
            <div className="pt-3 border-t border-white/10">
              <p className="text-xs text-gray-400 mb-2">
                This is an offline payment. If you've confirmed it was received (via bank statement or mobile money receipt), you can mark it as paid here.
              </p>
              <button onClick={() => setMode('mark')}
                className="btn-primary w-full">
                <FaCheckCircle className="mr-1" /> Mark as Received
              </button>
            </div>
          )}

          {mode === 'mark' && (
            <div className="pt-3 border-t border-white/10 space-y-2">
              <label className="block text-xs text-gray-400">Reference (bank ref / receipt no.)</label>
              <input type="text" value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. BANK-2026-00123"
                className="glass w-full px-3 py-2 rounded text-sm text-white" />
              <div className="flex gap-2">
                <button onClick={() => setMode('view')} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleMark} disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Saving…' : 'Confirm'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}