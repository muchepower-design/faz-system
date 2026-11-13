// frontend/src/pages/admin/AuditLog.jsx
import React, { useEffect, useState, useMemo } from 'react';
import GlassCard from '../../components/GlassCard';
import api from '../../api';
import {
  FaSearch, FaSyncAlt, FaFileCsv, FaFilePdf, FaPrint,
  FaChevronLeft, FaChevronRight, FaShieldAlt,
} from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function fmtDateTime(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('en-GB'); } catch { return iso; }
}

function actionBadge(action) {
  if (!action) return 'bg-gray-500/20 text-gray-400';
  if (action.startsWith('user.delete') || action.includes('.delete') || action.includes('.reject') || action.includes('.suspend')) {
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  }
  if (action.startsWith('user.') || action.startsWith('role.')) {
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  }
  if (action.startsWith('ecommerce.')) {
    return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  }
  if (action.startsWith('accreditation.')) {
    return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
  }
  if (action.startsWith('content.') || action.startsWith('competition.')) {
    return 'bg-green-500/20 text-green-400 border-green-500/30';
  }
  return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
}

export default function AuditLog() {
  const [items, setItems] = useState([]);
  const [facets, setFacets] = useState({ actions: [], target_types: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    days: 30,
    action: 'all',
    target_type: 'all',
    q: '',
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const loadFacets = async () => {
    try {
      const res = await api.get('/admin/audit-logs/facets');
      setFacets(res.data || { actions: [], target_types: [] });
    } catch { /* ignore */ }
  };

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/audit-logs', {
        params: {
          days: filters.days,
          action: filters.action === 'all' ? undefined : filters.action,
          target_type: filters.target_type === 'all' ? undefined : filters.target_type,
          q: filters.q || undefined,
          limit: 2000,
        },
      });
      setItems(res.data?.items || []);
      setPage(1);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load audit log');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadFacets(); load(); }, []);
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ },
    [filters.days, filters.action, filters.target_type]);

  // Client-side search + pagination
  const filtered = useMemo(() => {
    if (!filters.q.trim()) return items;
    const q = filters.q.toLowerCase();
    return items.filter((it) =>
      [it.action, it.target_type, it.target_id, it.summary, it.user_email]
        .some((v) => String(v || '').toLowerCase().includes(q))
    );
  }, [items, filters.q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(startIdx, startIdx + pageSize);

  const exportHeaders = ['When', 'User', 'Role', 'Action', 'Target', 'Summary', 'IP'];
  const exportRows = filtered.map((it) => [
    fmtDateTime(it.created_at),
    it.user_email || '—',
    it.user_role || '—',
    it.action,
    `${it.target_type || ''}${it.target_id ? `:${String(it.target_id).slice(0, 8)}` : ''}`,
    it.summary || '',
    it.ip || '',
  ]);

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text('Audit Log', 14, 15);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()} — ${exportRows.length} record(s)`, 14, 20);
    autoTable(doc, {
      head: [exportHeaders],
      body: exportRows,
      startY: 25,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [200, 100, 30], textColor: 255 },
    });
    doc.save(`audit_log_${Date.now()}.pdf`);
  };

  const exportCSV = () => {
    const csv = [
      exportHeaders.join(','),
      ...exportRows.map((r) => r.map((c) => `"${String(c || '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_log_${Date.now()}.csv`;
    link.click();
  };

  const printLog = () => {
    const win = window.open('', '_blank', 'width=1100,height=800');
    if (!win) return;
    win.document.write(`
      <html><head><title>Audit Log</title>
      <style>
        body{font-family:Arial,sans-serif;padding:20px}
        h1{font-size:18px;margin:0 0 4px}
        .meta{color:#666;font-size:11px;margin-bottom:14px}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #ccc;padding:5px 7px;font-size:10px;text-align:left;vertical-align:top}
        th{background:#f2f2f2}
      </style></head>
      <body>
        <h1>Audit Log</h1>
        <div class="meta">${new Date().toLocaleString()} — ${exportRows.length} record(s)</div>
        <table>
          <thead><tr>${exportHeaders.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${exportRows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 300);
  };

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6 pb-16">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
            <FaShieldAlt /> Audit Log
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Every admin action across users, content, competitions, ecommerce, accreditation, and ticketing.
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="glass px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-white/10 disabled:opacity-50"
        >
          <FaSyncAlt className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <GlassCard className="mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-400 mb-1">Search</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                value={filters.q}
                onChange={(e) => { setFilters({ ...filters, q: e.target.value }); setPage(1); }}
                placeholder="User, summary, target…"
                className="glass w-full pl-9 pr-3 py-2 rounded text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Window</label>
            <select
              value={filters.days}
              onChange={(e) => setFilters({ ...filters, days: parseInt(e.target.value) })}
              className="glass px-3 py-2 rounded text-sm text-white"
            >
              {[7, 30, 90, 180, 365].map((d) => (
                <option key={d} value={d}>Last {d} day{d !== 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Action</label>
            <select
              value={filters.action}
              onChange={(e) => { setFilters({ ...filters, action: e.target.value }); setPage(1); }}
              className="glass px-3 py-2 rounded text-sm text-white"
            >
              <option value="all">All actions</option>
              {facets.actions.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Target</label>
            <select
              value={filters.target_type}
              onChange={(e) => { setFilters({ ...filters, target_type: e.target.value }); setPage(1); }}
              className="glass px-3 py-2 rounded text-sm text-white"
            >
              <option value="all">All targets</option>
              {facets.target_types.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="ml-auto flex gap-2">
            <button onClick={exportCSV} className="glass px-3 py-2 rounded text-sm hover:bg-white/10" title="CSV">
              <FaFileCsv className="text-green-400" />
            </button>
            <button onClick={exportPDF} className="glass px-3 py-2 rounded text-sm hover:bg-white/10" title="PDF">
              <FaFilePdf className="text-red-400" />
            </button>
            <button onClick={printLog} className="glass px-3 py-2 rounded text-sm hover:bg-white/10" title="Print">
              <FaPrint className="text-blue-400" />
            </button>
          </div>
        </div>
      </GlassCard>

      {error && (
        <GlassCard className="mb-4 text-center border-faz-red/50 bg-faz-red/10 text-faz-red">
          {error}
        </GlassCard>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-16 h-16 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard className="text-center py-10 text-gray-400">
          No audit events match these filters.
        </GlassCard>
      ) : (
        <GlassCard className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 bg-gray-800/50">
              <tr>
                <th className="px-3 py-2 text-left text-white w-12">SN</th>
                <th className="px-3 py-2 text-left text-white whitespace-nowrap">When</th>
                <th className="px-3 py-2 text-left text-white">User</th>
                <th className="px-3 py-2 text-left text-white">Action</th>
                <th className="px-3 py-2 text-left text-white">Target</th>
                <th className="px-3 py-2 text-left text-white">Summary</th>
                <th className="px-3 py-2 text-left text-white">IP</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((it, idx) => (
                <tr key={it.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-3 py-2 text-gray-400">{startIdx + idx + 1}</td>
                  <td className="px-3 py-2 text-gray-300 text-xs whitespace-nowrap">
                    {fmtDateTime(it.created_at)}
                  </td>
                  <td className="px-3 py-2 text-gray-300 text-xs">
                    <div className="truncate max-w-[180px]" title={it.user_email || ''}>
                      {it.user_email || '—'}
                    </div>
                    <div className="text-[10px] text-gray-500">{it.user_role || ''}</div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${actionBadge(it.action)}`}>
                      {it.action}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-400 text-xs">
                    {it.target_type || '—'}
                    {it.target_id && (
                      <span className="text-gray-500 font-mono ml-1">
                        {String(it.target_id).slice(0, 8)}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-300 text-xs truncate max-w-[380px]"
                      title={it.summary || ''}>
                    {it.summary || '—'}
                  </td>
                  <td className="px-3 py-2 text-gray-500 text-xs font-mono">
                    {it.ip || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1); }}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm"
            >
              {[10, 25, 50, 100, 200].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className="ml-2">
              {filtered.length === 0 ? '0' : `${startIdx + 1}–${Math.min(startIdx + pageSize, filtered.length)}`} of {filtered.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}
                    className="glass px-3 py-1 rounded text-sm disabled:opacity-40">
              <FaChevronLeft />
            </button>
            <span className="text-sm text-gray-300">Page {currentPage} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
                    className="glass px-3 py-1 rounded text-sm disabled:opacity-40">
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}