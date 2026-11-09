// frontend/src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import {
  FaNewspaper, FaFutbol, FaUsers, FaChartLine,
  FaPlus, FaEdit, FaTrash, FaSignOutAlt, FaUpload,
  FaDatabase, FaUserPlus, FaTrophy, FaHandshake,
  FaArrowRight, FaThLarge, FaList, FaSearch, FaFilePdf,
  FaFileExcel, FaPrint, FaChevronLeft, FaChevronRight,
  FaFileAlt,FaUserEdit,
} from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';


// =====================================================================
// Searchable Select
// =====================================================================
const SearchableSelect = ({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  disabled = false,
  required = false,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const normalized = useMemo(() =>
    (options || []).map(opt => {
      if (typeof opt === 'object' && opt !== null) {
        if ('value' in opt && 'label' in opt) return { value: opt.value, label: opt.label };
        if ('id' in opt && 'name' in opt) return { value: opt.id, label: opt.name };
      }
      return { value: opt, label: String(opt) };
    }),
    [options]
  );

  const selected = useMemo(
    () => normalized.find(o => String(o.value) === String(value)),
    [normalized, value]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return normalized;
    const q = query.toLowerCase();
    return normalized.filter(o => o.label.toLowerCase().includes(q));
  }, [normalized, query]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
      setHighlighted(0);
    }
  }, [open]);

  const handleSelect = (opt) => {
    onChange(opt.value);
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlighted]) handleSelect(filtered[highlighted]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {required && (
        <input
          tabIndex={-1}
          required
          value={value || ''}
          onChange={() => {}}
          className="absolute inset-0 opacity-0 pointer-events-none"
        />
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={`glass w-full px-4 py-3 rounded text-left text-white flex items-center justify-between ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
        }`}
      >
        <span className={selected ? 'text-white' : 'text-gray-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-72 flex flex-col">
          <div className="p-2 border-b border-gray-700">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setHighlighted(0); }}
              onKeyDown={handleKeyDown}
              placeholder="Search…"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-faz-orange"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">No matches</div>
            ) : (
              filtered.map((opt, idx) => (
                <button
                  type="button"
                  key={`${opt.value}-${idx}`}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setHighlighted(idx)}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    idx === highlighted ? 'bg-gray-700 text-white' : 'text-gray-200'
                  } ${String(opt.value) === String(value) ? 'font-semibold text-faz-orange' : ''}`}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};


// =====================================================================
// PaginatedDataView — search, grid/table toggle, exports, pagination, SN
// =====================================================================
const PaginatedDataView = ({
  title,
  items,
  columns,          // [{ key, header, render(item), accessor(item) }]
  renderGridItem,   // (item, index) => ReactNode
  keyField = 'id',
  defaultPageSize = 5,
}) => {
  const [view, setView] = useState('table');           // 'table' | 'grid'
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [page, setPage] = useState(1);

  // Filter by search across all columns
  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(item =>
      columns.some(col => {
        const val = col.accessor ? col.accessor(item) : item[col.key];
        return String(val ?? '').toLowerCase().includes(q);
      })
    );
  }, [items, search, columns]);

  // Reset to page 1 when filter or page size changes
  useEffect(() => { setPage(1); }, [search, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(startIdx, startIdx + pageSize);

    // ---- Export helpers ----
  // Non-exportable columns: any column with key='actions' or exportable={false}
  const exportColumns = useMemo(
    () => columns.filter(c => c.exportable !== false && c.key !== 'actions'),
    [columns]
  );

  const buildExportMatrix = () => {
    const headers = ['SN', ...exportColumns.map(c => c.header)];      // was columns.map
    const rows = filtered.map((item, i) => {
      const cells = exportColumns.map(col => {                        // was columns.map
        const val = col.accessor ? col.accessor(item) : item[col.key];
        return val == null ? '' : String(val);
      });
      return [i + 1, ...cells];
    });
    return { headers, rows };
  };

  const handlePrint = () => {
    const { headers, rows } = buildExportMatrix();
    const win = window.open('', '_blank', 'width=1000,height=700');
    if (!win) { toast.error('Popup blocked — allow popups to print'); return; }
    const html = `
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #222; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          .meta { color: #666; font-size: 12px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; font-size: 12px; }
          th { background: #f2f2f2; }
          tr:nth-child(even) td { background: #fafafa; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta">Generated: ${new Date().toLocaleString()} — ${rows.length} record(s)</div>
        <table>
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>
            ${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 300);
  };

  const handlePDF = () => {
    const { headers, rows } = buildExportMatrix();
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text(title, 14, 15);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 20);
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 25,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [200, 100, 30], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 248, 248] },
    });
    doc.save(`${title.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
  };

  const handleExcel = () => {
    const { headers, rows } = buildExportMatrix();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}_${Date.now()}.xlsx`);
  };

  // ---- Render ----
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder={`Search ${title.toLowerCase()}…`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="glass w-full pl-9 pr-3 py-2 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-faz-orange"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('table')}
            className={`px-3 py-2 rounded text-sm flex items-center gap-1 ${view === 'table' ? 'bg-faz-orange text-white' : 'glass hover:bg-white/10'}`}
            title="Table view"
          >
            <FaList />
          </button>
          <button
            onClick={() => setView('grid')}
            className={`px-3 py-2 rounded text-sm flex items-center gap-1 ${view === 'grid' ? 'bg-faz-orange text-white' : 'glass hover:bg-white/10'}`}
            title="Grid view"
          >
            <FaThLarge />
          </button>

          <span className="mx-2 text-gray-500">|</span>

          <button onClick={handlePDF} className="glass px-3 py-2 rounded text-sm flex items-center gap-1 hover:bg-white/10" title="Export PDF">
            <FaFilePdf className="text-red-400" />
          </button>
          <button onClick={handleExcel} className="glass px-3 py-2 rounded text-sm flex items-center gap-1 hover:bg-white/10" title="Export Excel">
            <FaFileExcel className="text-green-400" />
          </button>
          <button onClick={handlePrint} className="glass px-3 py-2 rounded text-sm flex items-center gap-1 hover:bg-white/10" title="Print">
            <FaPrint className="text-blue-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <GlassCard className="text-center py-10 text-gray-400">
          No records found.
        </GlassCard>
      ) : view === 'table' ? (
        <GlassCard className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-white w-16">SN</th>
                {columns.map(col => (
                  <th key={col.key} className="px-4 py-3 text-left text-white">{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item, idx) => (
                <tr key={item[keyField]} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 text-gray-400">{startIdx + idx + 1}</td>
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3 text-gray-200">
                      {col.render ? col.render(item) : (col.accessor ? col.accessor(item) : item[col.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pageItems.map((item, idx) => (
            <motion.div
              key={item[keyField]}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              {renderGridItem ? renderGridItem(item, startIdx + idx) : (
                <GlassCard className="p-4">
                  {columns.map(col => (
                    <div key={col.key} className="mb-2">
                      <span className="text-xs text-gray-400">{col.header}: </span>
                      <span className="text-sm text-white">
                        {col.render ? col.render(item) : (col.accessor ? col.accessor(item) : item[col.key])}
                      </span>
                    </div>
                  ))}
                </GlassCard>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={e => setPageSize(parseInt(e.target.value))}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white"
          >
            {[5, 10, 20, 50, 100, 200, 500].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="ml-2">
            {startIdx + 1}–{Math.min(startIdx + pageSize, filtered.length)} of {filtered.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="glass px-3 py-1 rounded text-sm disabled:opacity-40"
          >
            <FaChevronLeft />
          </button>
          <span className="text-sm text-gray-300">
            Page {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="glass px-3 py-1 rounded text-sm disabled:opacity-40"
          >
            <FaChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
};


// =====================================================================
// NationalTeamForm
// =====================================================================
const NationalTeamForm = ({ onSubmit, formData, setFormData, editing, onCancel, countries }) => (
  <GlassCard className="mb-6">
    <h3 className="text-2xl font-bold mb-4">{editing ? 'Edit National Team' : 'Add National Team'}</h3>
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <input type="text" placeholder="Name (e.g. Zambia)" value={formData.name || ''}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="glass w-full p-3 rounded" required />
        <input type="text" placeholder="Short name (e.g. ZAM)" value={formData.short_name || ''}
          onChange={e => setFormData({ ...formData, short_name: e.target.value })}
          className="glass w-full p-3 rounded" required />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Country</label>
        <SearchableSelect
          value={formData.country_id || ''}
          onChange={val => setFormData({ ...formData, country_id: val })}
          options={countries}
          placeholder="Select country…"
          required
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <select value={formData.gender || 'male'}
          onChange={e => setFormData({ ...formData, gender: e.target.value })}
          className="glass w-full p-3 rounded">
          <option value="male">Men's</option>
          <option value="female">Women's</option>
          <option value="mixed">Mixed</option>
        </select>
        <input type="text" placeholder="Age group (e.g. Senior, U20, U17)"
          value={formData.age_group || ''}
          onChange={e => setFormData({ ...formData, age_group: e.target.value })}
          className="glass w-full p-3 rounded" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <input type="text" placeholder="Coach" value={formData.coach || ''}
          onChange={e => setFormData({ ...formData, coach: e.target.value })}
          className="glass w-full p-3 rounded" />
        <input type="text" placeholder="FIFA code (e.g. ZAM)" value={formData.fifa_code || ''}
          onChange={e => setFormData({ ...formData, fifa_code: e.target.value })}
          className="glass w-full p-3 rounded" required />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <input type="text" placeholder="Nickname (e.g. Chipolopolo)"
          value={formData.nickname || ''}
          onChange={e => setFormData({ ...formData, nickname: e.target.value })}
          className="glass w-full p-3 rounded" />
        <input type="url" placeholder="Flag image URL"
          value={formData.flag_image_url || ''}
          onChange={e => setFormData({ ...formData, flag_image_url: e.target.value })}
          className="glass w-full p-3 rounded" />
      </div>

      <div className="flex gap-3">
        <button type="submit" className="btn-primary">Save</button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </form>
  </GlassCard>
);


// =====================================================================
// ClubForm
// =====================================================================
const ClubForm = ({ onSubmit, formData, setFormData, editing, onCancel, countries }) => (
  <GlassCard className="mb-6">
    <h3 className="text-2xl font-bold mb-4">{editing ? 'Edit Club' : 'Add Club'}</h3>
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <input type="text" placeholder="Club name (e.g. ZESCO United)"
          value={formData.name || ''}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="glass w-full p-3 rounded" required />
        <input type="text" placeholder="Short name (e.g. ZESCO)"
          value={formData.short_name || ''}
          onChange={e => setFormData({ ...formData, short_name: e.target.value })}
          className="glass w-full p-3 rounded" />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Country</label>
        <SearchableSelect
          value={formData.country_id || ''}
          onChange={val => setFormData({ ...formData, country_id: val })}
          options={countries}
          placeholder="Select country…"
          required
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <select value={formData.gender || 'male'}
          onChange={e => setFormData({ ...formData, gender: e.target.value })}
          className="glass w-full p-3 rounded">
          <option value="male">Men's</option>
          <option value="female">Women's</option>
          <option value="mixed">Mixed</option>
        </select>
        <input type="text" placeholder="Age category (e.g. Senior, Youth)"
          value={formData.age || ''}
          onChange={e => setFormData({ ...formData, age: e.target.value })}
          className="glass w-full p-3 rounded" />
      </div>

      <input type="url" placeholder="Logo URL"
        value={formData.logo_url || ''}
        onChange={e => setFormData({ ...formData, logo_url: e.target.value })}
        className="glass w-full p-3 rounded" />

      <textarea placeholder="Description" rows="3"
        value={formData.description || ''}
        onChange={e => setFormData({ ...formData, description: e.target.value })}
        className="glass w-full p-3 rounded" />

      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input type="checkbox"
          checked={formData.is_active !== false}
          onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
        Active
      </label>

      <div className="flex gap-3">
        <button type="submit" className="btn-primary">Save</button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </form>
  </GlassCard>
);

// =====================================================================
// UserForm
// =====================================================================
const USER_ROLES = [
  { value: 'admin',             label: 'Admin' },
  { value: 'super_admin',       label: 'Super Administrator' },
  { value: 'faz_admin',         label: 'FAZ Administrator' },
  { value: 'finance_officer',   label: 'Finance Officer' },
  { value: 'match_commissioner',label: 'Match Commissioner' },
  { value: 'media_officer',     label: 'Media Officer' },
  { value: 'club_rep',          label: 'Club Representative' },
  { value: 'referee',           label: 'Referee' },
  { value: 'club_admin',        label: 'Club Administrator' },
  { value: 'club_officer',      label: 'Club Officer' },
  { value: 'scanner',           label: 'Ticket Scanner' },
  { value: 'vendor',            label: 'Vendor' },
  { value: 'customer',          label: 'Customer' },
  { value: 'viewer',            label: 'Viewer' },
];

// =====================================================================
// UserForm — multi-role selection, roles pulled from the DB
// =====================================================================
const UserForm = ({
  onSubmit,
  formData,
  setFormData,
  editing,
  onCancel,
  submitting,
  roles,
  rolesLoading,
  rolesError,
}) => {
  const selectedRoleIds = formData.role_ids || [];

  const toggleRole = (id) => {
    const current = selectedRoleIds;
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    setFormData({ ...formData, role_ids: next });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedRoleIds.length === 0) {
      // Prevent silent "no role" creation — the primary role comes from the first selected
      alert('Please select at least one role.');
      return;
    }
    onSubmit(e);
  };

  return (
    <GlassCard className="mb-6">
      <h3 className="text-2xl font-bold mb-4">
        {editing ? 'Edit User' : 'Add User'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Full name"
            value={formData.full_name || ''}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="glass w-full p-3 rounded"
            required
          />
          <input
            type="email"
            placeholder="Email address"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="glass w-full p-3 rounded"
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="glass w-full p-3 rounded"
          />
          <input
            type="password"
            placeholder={editing ? 'New password (leave blank to keep)' : 'Password'}
            value={formData.password || ''}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="glass w-full p-3 rounded"
            required={!editing}
            minLength={6}
          />
        </div>

        {/* Multi-role picker */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Roles{' '}
            <span className="text-gray-500">
              ({selectedRoleIds.length} selected — first becomes primary)
            </span>
          </label>

          {rolesLoading ? (
            <div className="glass p-4 rounded text-center text-gray-400">
              Loading roles…
            </div>
          ) : rolesError ? (
            <div className="glass p-4 rounded text-center text-red-400">
              {rolesError}
            </div>
          ) : roles.length === 0 ? (
            <div className="glass p-4 rounded text-center text-red-400">
              No roles configured. Run the startup seed or add roles via cPanel/psql.
            </div>
          ) : (
            <div className="glass p-3 rounded grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto">
              {roles.map((r) => {
                const checked = selectedRoleIds.includes(r.id);
                return (
                  <label
                    key={r.id}
                    className={`flex items-start gap-2 p-2 rounded cursor-pointer transition ${
                      checked
                        ? 'bg-faz-orange/20 border border-faz-orange/40'
                        : 'hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRole(r.id)}
                      className="mt-1 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {r.name}
                      </p>
                      {r.description && (
                        <p className="text-xs text-gray-400 truncate">
                          {r.description}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={formData.is_active !== false}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          />
          Active
        </label>

        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={submitting}>
  {submitting ? 'Saving…' : (editing ? 'Update' : 'Save')}
</button>
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </GlassCard>
  );
};


// =====================================================================
// UsersTab — fetches roles, shows all user roles, supports create/delete
// =====================================================================
const UsersTab = ({ users, onCreate, onUpdate, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ role_ids: [], is_active: true });
  const [submitting, setSubmitting] = useState(false);

  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setRolesLoading(true);
    api.get('/admin/roles')
      .then((res) => {
        if (!cancelled) {
          setRoles(res.data || []);
          setRolesError('');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setRolesError(err.response?.data?.error || 'Failed to load roles');
          setRoles([]);
        }
      })
      .finally(() => {
        if (!cancelled) setRolesLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const openCreate = () => {
    setEditing(null);
    const defaultCustomer = roles.find((r) => r.name === 'customer');
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      password: '',
      role_ids: defaultCustomer ? [defaultCustomer.id] : [],
      is_active: true,
    });
    setShowForm(true);
  };

  const openEdit = (u) => {
    if (rolesLoading) {
      toast.error('Loading roles, please wait…');
      return;
    }
    if (roles.length === 0) {
      toast.error('No roles available. Add a role first.');
      return;
    }

    // Map the user's current role NAMES to role IDs from the DB
    const userRoleNames =
      u.roles && u.roles.length ? u.roles : (u.role ? [u.role] : []);
    const userRoleIds = userRoleNames
      .map((name) => roles.find((r) => r.name === name)?.id)
      .filter(Boolean);

    setEditing(u);
    setFormData({
      full_name: u.full_name || '',
      email: u.email || '',
      phone: u.phone || '',
      password: '',                   // blank = don't change
      role_ids: userRoleIds,
      is_active: u.is_active !== false,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({ role_ids: [], is_active: true });
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await onUpdate(editing.id, formData);
      } else {
        await onCreate(formData);
      }
      resetForm();
    } catch {
      /* toast handled in parent */
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'full_name', header: 'Full Name', accessor: (u) => u.full_name || '—' },
    { key: 'email',     header: 'Email',     accessor: (u) => u.email || '—' },
    { key: 'phone',     header: 'Phone',     accessor: (u) => u.phone || '—' },
    {
      key: 'roles',
      header: 'Roles',
      accessor: (u) =>
        (u.roles && u.roles.length ? u.roles : (u.role ? [u.role] : [])).join(', '),
      render: (u) => {
        const rs = u.roles && u.roles.length ? u.roles : (u.role ? [u.role] : []);
        if (rs.length === 0) return <span className="text-gray-400">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {rs.map((r) => (
              <span
                key={r}
                className="text-xs px-2 py-0.5 rounded-full bg-faz-green/20 text-faz-green whitespace-nowrap"
              >
                {r}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (u) => (u.is_active !== false ? 'Active' : 'Inactive'),
      render: (u) => (
        <span
          className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
            u.is_active !== false
              ? 'bg-green-500/20 text-green-400'
              : 'bg-gray-500/20 text-gray-400'
          }`}
        >
          {u.is_active !== false ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      exportable: false,
      accessor: () => '',
      render: (u) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEdit(u)}
            className="p-2 hover:text-faz-green"
            title="Edit user"
          >
            <FaEdit />
          </button>
          <button
            onClick={() => onDelete(u)}
            className="p-2 hover:text-faz-red"
            title="Delete user"
          >
            <FaTrash />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold gradient-text">Users</h2>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <FaUserPlus /> Add User
        </button>
      </div>

      {showForm && (
        <UserForm
          onSubmit={handleSubmit}
          formData={formData}
          setFormData={setFormData}
          editing={editing}
          onCancel={resetForm}
          submitting={submitting}
          roles={roles}
          rolesLoading={rolesLoading}
          rolesError={rolesError}
        />
      )}

      <PaginatedDataView
        title="Users"
        items={users}
        columns={columns}
        keyField="id"
        defaultPageSize={5}
        renderGridItem={(u) => {
          const rs = u.roles && u.roles.length ? u.roles : (u.role ? [u.role] : []);
          return (
            <GlassCard className="p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-faz-green to-faz-orange flex items-center justify-center text-xl font-bold text-white mx-auto mb-3">
                {(u.full_name?.[0] || u.email?.[0] || 'U').toUpperCase()}
              </div>
              <h3 className="text-lg font-bold truncate">{u.full_name || '—'}</h3>
              <p className="text-sm text-gray-400 truncate">{u.email}</p>
              <p className="text-xs text-gray-500 mt-1">{u.phone || 'No phone'}</p>
              <div className="flex flex-wrap gap-1 justify-center mt-3">
                {rs.map((r) => (
                  <span
                    key={r}
                    className="text-xs px-2 py-1 rounded-full bg-faz-green/20 text-faz-green"
                  >
                    {r}
                  </span>
                ))}
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    u.is_active !== false
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {u.is_active !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex gap-2 justify-center mt-4">
                <button
                  onClick={() => openEdit(u)}
                  className="p-2 glass rounded hover:bg-white/10"
                  title="Edit user"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => onDelete(u)}
                  className="p-2 glass rounded hover:bg-red-500/20"
                  title="Delete user"
                >
                  <FaTrash />
                </button>
              </div>
            </GlassCard>
          );
        }}
      />
    </div>
  );
};


// =====================================================================
// RolesTab — CRUD for the roles table
// =====================================================================
const _LOCKED_ROLE_NAMES = new Set(['super_admin', 'admin', 'faz_admin']);
const _PROTECTED_ROLE_NAMES = new Set([
  'super_admin', 'admin', 'faz_admin', 'customer', 'vendor', 'viewer',
]);

const RolesTab = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/roles');
      setRoles(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setFormData({ name: '', description: '' });
    setShowForm(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setFormData({ name: r.name, description: r.description || '' });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({ name: '', description: '' });
    setShowForm(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/admin/roles/${editing.id}`, formData);
        toast.success('Role updated');
      } else {
        await api.post('/admin/roles', formData);
        toast.success('Role created');
      }
      resetForm();
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (r) => {
    // If in use, warn the admin before force-deleting
    if ((r.users_count || 0) > 0) {
      const ok = window.confirm(
        `Role "${r.name}" is currently assigned to ${r.users_count} user(s).\n\n` +
        `Deleting it will remove this role from those users. ` +
        `Users whose primary role was "${r.name}" will fall back to their next role ` +
        `(or "viewer" if they have none).\n\n` +
        `Continue?`
      );
      if (!ok) return;
      try {
        const res = await api.delete(`/admin/roles/${r.id}?force=true`);
        toast.success(
          `Role deleted. ${res.data.users_updated || 0} user(s) updated.`
        );
        load();
      } catch (err) {
        toast.error(err.response?.data?.error || 'Delete failed');
      }
      return;
    }

    if (!window.confirm(`Delete role "${r.name}"?`)) return;
    try {
      await api.delete(`/admin/roles/${r.id}`);
      toast.success('Role deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-16 h-16 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin" />
      </div>
    );
  }

  const nameLocked = editing && _LOCKED_ROLE_NAMES.has(editing.name);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Roles</h2>
          <p className="text-sm text-gray-400 mt-1">
            {roles.length} role{roles.length !== 1 ? 's' : ''} · users can have multiple roles
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <FaPlus /> Add Role
        </button>
      </div>

      {showForm && (
        <GlassCard className="mb-6">
          <h3 className="text-2xl font-bold mb-4">
            {editing ? 'Edit Role' : 'Add Role'}
          </h3>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Name (lowercase, underscores)
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value.toLowerCase() })
                }
                placeholder="e.g. match_commissioner"
                className="glass w-full p-3 rounded font-mono"
                required
                pattern="^[a-z][a-z0-9_]*$"
                title="Lowercase, starts with a letter, only letters/digits/underscores"
                disabled={!!nameLocked}
              />
              {nameLocked && (
                <p className="text-xs text-yellow-400 mt-1">
                  This system-critical role's name cannot be changed. You can still edit its description.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="What is this role for?"
                className="glass w-full p-3 rounded"
              />
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      <GlassCard className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 bg-gray-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-white w-16">SN</th>
              <th className="px-4 py-3 text-left text-white">Name</th>
              <th className="px-4 py-3 text-left text-white">Description</th>
              <th className="px-4 py-3 text-left text-white w-24">Users</th>
              <th className="px-4 py-3 text-right text-white w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r, idx) => {
              const isProtected = _PROTECTED_ROLE_NAMES.has(r.name);
              const isLocked = _LOCKED_ROLE_NAMES.has(r.name);
              return (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-faz-orange">{r.name}</span>
                    {isProtected && (
                      <span className="ml-2 text-[10px] uppercase bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
                        system
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {r.description || <span className="text-gray-500 italic">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-300 font-mono">
                    {r.users_count ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => openEdit(r)}
                        className="p-2 hover:text-faz-green"
                        title="Edit role"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => remove(r)}
                        disabled={isProtected}
                        className="p-2 hover:text-faz-red disabled:opacity-30 disabled:cursor-not-allowed"
                        title={
                          isProtected
                            ? 'System role — cannot be deleted'
                            : isLocked
                              ? 'Locked role'
                              : 'Delete role'
                        }
                      >
                        <FaTrash />
                      </button>

                      <button
  onClick={() => openEditRoles(u)}
  className="p-2 hover:text-faz-blue"
  title="Edit roles"
>
  <FaUserEdit />
</button>

                    </div>
                  </td>
                </tr>
              );
            })}
            {roles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No roles configured. Click <strong>Add Role</strong> to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
};


// =====================================================================
// AdminDashboard
// =====================================================================
const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [compLoading, setCompLoading] = useState(false);

  // Data
  const [news, setNews] = useState([]);
  const [matches, setMatches] = useState([]);
  const [nationalTeams, setNationalTeams] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [countries, setCountries] = useState([]);
  const [users, setUsers] = useState([]);
  const [competitions, setCompetitions] = useState([]);

  // Forms
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  // ---- Initial load ----
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [newsRes, matchesRes, ntsRes, clubsRes, countriesRes] = await Promise.all([
        api.get('/news').catch(() => ({ data: [] })),
        api.get('/matches/').catch(() => ({ data: [] })),
        api.get('/national-teams/').catch(() => ({ data: [] })),
        api.get('/clubs/').catch(() => ({ data: [] })),
        api.get('/countries/').catch(() => ({ data: [] })),
      ]);

      setNews(newsRes.data || []);
      setMatches(matchesRes.data || []);
      setNationalTeams(ntsRes.data || []);
      setClubs(clubsRes.data || []);
      setCountries(countriesRes.data || []);

      try {
        const usersRes = await api.get('/ticketing/admin/users');
        setUsers(usersRes.data || []);
      } catch {
        setUsers([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to load some data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompetitions = async () => {
    setCompLoading(true);
    try {
      const res = await api.get('/competitions-management/competitions', {
        params: { active_only: false }
      });
      setCompetitions(res.data || []);
    } catch (error) {
      console.error('Error fetching competitions:', error);
    } finally {
      setCompLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'competitions' && competitions.length === 0) {
      fetchCompetitions();
    }
  }, [activeTab]);

  // ---- Helpers ----
  const countryName = useCallback((countryId) => {
    const c = countries.find(x => x.id === countryId);
    return c?.name || '—';
  }, [countries]);

  const resetForm = () => {
    setFormData({});
    setEditingItem(null);
    setShowForm(false);
  };

  // ---- CRUD ----
  const handleSubmitNationalTeam = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        short_name: formData.short_name,
        country_id: formData.country_id,
        gender: formData.gender,
        age_group: formData.age_group,
        coach: formData.coach,
        fifa_code: formData.fifa_code,
        nickname: formData.nickname,
        flag_image_url: formData.flag_image_url,
      };
      if (editingItem) {
        await api.put(`/national-teams/${editingItem.id}`, payload);
        toast.success('National team updated');
      } else {
        await api.post('/national-teams/', payload);
        toast.success('National team created');
      }
      resetForm();
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Save failed');
    }
  };

  const handleSubmitClub = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        short_name: formData.short_name,
        country_id: formData.country_id,
        gender: formData.gender,
        age: formData.age,
        logo_url: formData.logo_url,
        description: formData.description,
        is_active: formData.is_active !== false,
      };
      if (editingItem) {
        await api.put(`/clubs/${editingItem.id}`, payload);
        toast.success('Club updated');
      } else {
        await api.post('/clubs/', payload);
        toast.success('Club created');
      }
      resetForm();
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Save failed');
    }
  };

  const handleDeleteNationalTeam = async (id) => {
    if (!window.confirm('Delete this national team?')) return;
    try {
      await api.delete(`/national-teams/${id}`);
      toast.success('Deleted');
      fetchAllData();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleDeleteClub = async (id) => {
    if (!window.confirm('Delete this club?')) return;
    try {
      await api.delete(`/clubs/${id}`);
      toast.success('Deleted');
      fetchAllData();
    } catch {
      toast.error('Delete failed');
    }
  };

    const handleCreateUser = async (formData) => {
    try {
      await api.post('/admin/users', {
        full_name: formData.full_name,
        username: formData.email,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || null,
        //role: formData.role || 'customer',
        role_ids: formData.role_ids || [],
        is_active: formData.is_active !== false,
      });
      toast.success('User created');
      // Refresh users list
      try {
        const usersRes = await api.get('/ticketing/admin/users');
        setUsers(usersRes.data || []);
      } catch {
        /* keep old list if refresh fails */
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to create user');
      throw err;                    // let UsersTab know it failed
    }
  };

    const handleUpdateUser = async (userId, formData) => {
    try {
      await api.put(`/admin/users/${userId}`, {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || null,
        password: formData.password || undefined,   // only sent if non-empty
        role_ids: formData.role_ids || [],
        is_active: formData.is_active !== false,
      });
      toast.success('User updated');
      try {
        const usersRes = await api.get('/ticketing/admin/users');
        setUsers(usersRes.data || []);
      } catch { /* keep old list */ }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update user');
      throw err;
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Delete user "${user.full_name || user.email}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${user.id}`);
      toast.success('User deleted');
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete user');
    }
  };

  // ---- Stat cards ----
  const stats = {
    news: news.length,
    matches: matches.length,
    nationalTeams: nationalTeams.length,
    clubs: clubs.length,
  };

  const statCards = [
    { icon: FaNewspaper, label: 'News', value: stats.news, color: 'from-faz-green' },
    { icon: FaFutbol, label: 'Matches', value: stats.matches, color: 'from-faz-orange' },
    { icon: FaUsers, label: 'National Teams', value: stats.nationalTeams, color: 'from-faz-red' },
    { icon: FaTrophy, label: 'Clubs', value: stats.clubs, color: 'from-faz-green' },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin" />
    </div>
  );

  // ---- National Team columns ----
  const nationalTeamColumns = [
    { key: 'name', header: 'Name', accessor: (t) => t.name },
    { key: 'short_name', header: 'Short Name', accessor: (t) => t.short_name || '—' },
    { key: 'country', header: 'Country', accessor: (t) => countryName(t.country_id) },
    { key: 'gender', header: 'Gender', accessor: (t) => t.gender || '—' },
    { key: 'age_group', header: 'Age Group', accessor: (t) => t.age_group || t.age || '—' },
    { key: 'fifa_code', header: 'FIFA Code', accessor: (t) => t.fifa_code || '—' },
    {
      key: 'actions',
      header: 'Actions',
      render: (t) => (
        <div className="flex gap-2">
          <button
            onClick={() => { setEditingItem(t); setFormData(t); setShowForm(true); }}
            className="p-2 hover:text-faz-green"
            title="Edit"
          >
            <FaEdit />
          </button>
          <button
            onClick={() => handleDeleteNationalTeam(t.id)}
            className="p-2 hover:text-faz-red"
            title="Delete"
          >
            <FaTrash />
          </button>
        </div>
      ),
      accessor: () => '',
    },
  ];

  // ---- Club columns ----
  const clubColumns = [
    { key: 'name', header: 'Club Name', accessor: (c) => c.name },
    { key: 'short_name', header: 'Short Name', accessor: (c) => c.short_name || '—' },
    { key: 'country', header: 'Country', accessor: (c) => countryName(c.country_id) },
    { key: 'gender', header: 'Gender', accessor: (c) => c.gender || '—' },
    { key: 'age', header: 'Age', accessor: (c) => c.age || '—' },
    {
      key: 'status',
      header: 'Status',
      render: (c) => (
        <span className={`text-xs px-2 py-1 rounded-full ${
          c.is_active !== false
            ? 'bg-green-500/20 text-green-400'
            : 'bg-gray-500/20 text-gray-400'
        }`}>
          {c.is_active !== false ? 'Active' : 'Inactive'}
        </span>
      ),
      accessor: (c) => (c.is_active !== false ? 'Active' : 'Inactive'),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (c) => (
        <div className="flex gap-2">
          <button
            onClick={() => { setEditingItem(c); setFormData(c); setShowForm(true); }}
            className="p-2 hover:text-faz-green"
            title="Edit"
          >
            <FaEdit />
          </button>
          <button
            onClick={() => handleDeleteClub(c.id)}
            className="p-2 hover:text-faz-red"
            title="Delete"
          >
            <FaTrash />
          </button>
        </div>
      ),
      accessor: () => '',
    },
  ];

  return (
    <div className="pt-24 min-h-screen">
      <div className="container mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold gradient-text">Admin Dashboard</h1>
          <button onClick={logout} className="glass px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-500/20">
            <FaSignOutAlt /> Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {['overview', 'news', 'matches', 'teams', 'clubs', 'roles', 'users', 'competitions', 'bulk-import', 'content'].map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setShowForm(false); setEditingItem(null); setFormData({}); }}
              className={`px-6 py-2 rounded-full transition-all duration-300 ${
                activeTab === tab ? 'bg-gradient-to-r from-faz-green to-faz-orange text-white' : 'glass hover:bg-white/20'
              }`}
            >
              {tab === 'bulk-import' ? 'Bulk Import' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statCards.map((stat, i) => (
                <GlassCard key={i} className="text-center">
                  <stat.icon className={`text-5xl mx-auto mb-4 bg-gradient-to-r ${stat.color} to-transparent bg-clip-text text-transparent`} />
                  <h3 className="text-4xl font-bold gradient-text mb-2">{stat.value}</h3>
                  <p className="text-gray-300">{stat.label}</p>
                </GlassCard>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Link to="/admin/competitions">
                <GlassCard className="text-center hover:scale-105 transition hover:bg-white/10 cursor-pointer">
                  <FaTrophy className="text-5xl text-faz-orange mx-auto mb-3" />
                  <h3 className="text-xl font-bold">Manage Competitions</h3>
                  <p className="text-gray-400 text-sm">Leagues, tournaments, and cups</p>
                </GlassCard>
              </Link>
              <button onClick={() => setActiveTab('teams')} className="text-left">
                <GlassCard className="text-center hover:scale-105 transition hover:bg-white/10 cursor-pointer">
                  <FaUsers className="text-5xl text-faz-green mx-auto mb-3" />
                  <h3 className="text-xl font-bold">National Teams</h3>
                  <p className="text-gray-400 text-sm">Manage country squads</p>
                </GlassCard>
              </button>
              <button onClick={() => setActiveTab('clubs')} className="text-left">
                <GlassCard className="text-center hover:scale-105 transition hover:bg-white/10 cursor-pointer">
                  <FaHandshake className="text-5xl text-faz-red mx-auto mb-3" />
                  <h3 className="text-xl font-bold">Clubs</h3>
                  <p className="text-gray-400 text-sm">Manage domestic clubs</p>
                </GlassCard>
              </button>
            </div>


            <div className="mt-6">
  <Link to="/admin/ecommerce">
    <GlassCard className="text-center hover:scale-105 transition hover:bg-white/10 cursor-pointer">
      <div className="text-5xl mb-3">🛒</div>
      <h3 className="text-xl font-bold">E-commerce</h3>
      <p className="text-gray-400 text-sm">Vendors · Adverts · Orders · Match Attachments</p>
    </GlassCard>
  </Link>
</div>


          </>
        )}

        {/* News — unchanged simple list */}
        {activeTab === 'news' && (
          <div className="space-y-4">
            {news.map(item => (
              <GlassCard key={item.id} className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.excerpt}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Matches — unchanged */}
        {activeTab === 'matches' && (
          <div className="space-y-4">
            {matches.slice(0, 50).map(m => (
              <GlassCard key={m.id} className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{m.home_team} vs {m.away_team}</p>
                  <p className="text-gray-400 text-sm">
                    {m.venue} — {m.match_date ? new Date(m.match_date).toLocaleDateString() : 'TBA'}
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* ============ TEAMS (National Teams) ============ */}
        {activeTab === 'teams' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold gradient-text">National Teams</h2>
              <button
                onClick={() => { setEditingItem(null); setFormData({}); setShowForm(true); }}
                className="btn-primary flex items-center gap-2"
              >
                <FaPlus /> Add National Team
              </button>
            </div>

            {showForm && (
              <NationalTeamForm
                onSubmit={handleSubmitNationalTeam}
                formData={formData}
                setFormData={setFormData}
                editing={editingItem}
                onCancel={resetForm}
                countries={countries}
              />
            )}

            <PaginatedDataView
              title="National Teams"
              items={nationalTeams}
              columns={nationalTeamColumns}
              keyField="id"
              defaultPageSize={5}
              renderGridItem={(t) => (
                <GlassCard className="p-4 text-center">
                  <div className="flex justify-center mb-3">
                    {t.flag_image_url ? (
                      <img src={t.flag_image_url} alt={t.name} className="w-16 h-16 rounded-full object-cover border border-white/20" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-faz-green to-faz-orange flex items-center justify-center text-2xl">
                        ⚽
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-bold">{t.name}</h3>
                  <p className="text-sm text-gray-400">{countryName(t.country_id)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t.gender || '—'} • {t.age_group || t.age || '—'}
                  </p>
                  <p className="text-xs text-faz-orange mt-1">{t.fifa_code || ''}</p>
                  <div className="flex gap-2 justify-center mt-4">
                    <button
                      onClick={() => { setEditingItem(t); setFormData(t); setShowForm(true); }}
                      className="p-2 glass rounded hover:bg-white/10"
                    ><FaEdit /></button>
                    <button
                      onClick={() => handleDeleteNationalTeam(t.id)}
                      className="p-2 glass rounded hover:bg-red-500/20"
                    ><FaTrash /></button>
                  </div>
                </GlassCard>
              )}
            />
          </div>
        )}

        {/* ============ CLUBS ============ */}
        {activeTab === 'clubs' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold gradient-text">Clubs</h2>
              <button
                onClick={() => { setEditingItem(null); setFormData({}); setShowForm(true); }}
                className="btn-primary flex items-center gap-2"
              >
                <FaPlus /> Add Club
              </button>
            </div>

            {showForm && (
              <ClubForm
                onSubmit={handleSubmitClub}
                formData={formData}
                setFormData={setFormData}
                editing={editingItem}
                onCancel={resetForm}
                countries={countries}
              />
            )}

            <PaginatedDataView
              title="Clubs"
              items={clubs}
              columns={clubColumns}
              keyField="id"
              defaultPageSize={5}
              renderGridItem={(c) => (
                <GlassCard className="p-4 text-center">
                  <div className="flex justify-center mb-3">
                    {c.logo_url ? (
                      <img src={c.logo_url} alt={c.name} className="w-16 h-16 rounded-full object-cover border border-white/20" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-faz-orange to-faz-red flex items-center justify-center text-2xl">
                        🏆
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-bold">{c.name}</h3>
                  <p className="text-sm text-gray-400">{countryName(c.country_id)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {c.gender || '—'} • {c.age || '—'}
                  </p>
                  <span className={`inline-block text-xs px-2 py-1 rounded-full mt-2 ${
                    c.is_active !== false
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {c.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                  <div className="flex gap-2 justify-center mt-4">
                    <button
                      onClick={() => { setEditingItem(c); setFormData(c); setShowForm(true); }}
                      className="p-2 glass rounded hover:bg-white/10"
                    ><FaEdit /></button>
                    <button
                      onClick={() => handleDeleteClub(c.id)}
                      className="p-2 glass rounded hover:bg-red-500/20"
                    ><FaTrash /></button>
                  </div>
                </GlassCard>
              )}
            />
          </div>
        )}

                {/* Users — full CRUD-style tabular + grid view */}
        {activeTab === 'users' && (
          <UsersTab
            users={users}
            onCreate={handleCreateUser}
            onUpdate={handleUpdateUser}
            onDelete={handleDeleteUser}
          />
        )}

         {/* Roles — CRUD for the roles table */}
        {activeTab === 'roles' && <RolesTab />}

        {/* Competitions tab */}
        {activeTab === 'competitions' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold gradient-text">Competitions</h2>
              <Link to="/admin/competitions" className="btn-primary flex items-center gap-2">
                <FaTrophy /> Full Management
              </Link>
            </div>
            {compLoading ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin mx-auto" />
              </div>
            ) : competitions.length === 0 ? (
              <GlassCard className="text-center py-8 text-gray-400">No competitions found.</GlassCard>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {competitions.slice(0, 9).map(comp => (
                  <Link key={comp.id} to={`/admin/competitions/${comp.id}`}>
                    <GlassCard className="hover:scale-105 transition p-4">
                      <h3 className="font-bold">{comp.name}</h3>
                      <p className="text-sm text-gray-400">{comp.competition_type} • {comp.gender}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        comp.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {comp.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </GlassCard>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bulk import */}
        {activeTab === 'bulk-import' && (
          <GlassCard>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FaDatabase /> Bulk Import Historical Data
            </h2>
            <p className="text-gray-400 text-sm">Use the CSV / JSON importers on the dedicated pages.</p>
          </GlassCard>
        )}

        {/* Content management */}
        {activeTab === 'content' && (
          <GlassCard>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FaFileAlt /> Content Management
            </h2>
            <p className="text-gray-400 text-sm">Manage static pages, banners, and other content.</p>
          
          <Link to="/admin/content">
  <GlassCard className="text-center hover:scale-105 transition hover:bg-white/10 cursor-pointer">
    <div className="text-5xl mb-3">📝</div>
    <h3 className="text-xl font-bold">Content Manager</h3>
    <p className="text-gray-400 text-sm">
      Hero slides · Partners · Governance · Pages
    </p>
  </GlassCard>
</Link>
          
          </GlassCard>

        )}
      </div>
    </div>
  );
};

export default AdminDashboard;