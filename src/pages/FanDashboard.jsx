// frontend/src/pages/FanDashboard.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import GlassCard from '../components/GlassCard';
import api from '../api';
import {
  FaTicketAlt, FaShoppingBag, FaIdCard, FaSyncAlt, FaExclamationTriangle,
  FaArrowRight, FaBoxOpen, FaCheckCircle, FaClock, FaTimesCircle,
  FaUserCircle, FaSignOutAlt,
} from 'react-icons/fa';

const TICKETS_URL = (import.meta.env.VITE_API_FRONTEND_TICKETS || '').replace(/\/$/, '');
const SHOP_URL = (import.meta.env.VITE_API_FRONTEND_SHOP || '').replace(/\/$/, '');

const SHOP_STATUS_META = {
  paid:      { label: 'Paid',      cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
  pending:   { label: 'Pending',   cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  failed:    { label: 'Failed',    cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
  cancelled: { label: 'Cancelled', cls: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

const TICKET_STATUS_META = {
  paid:      { label: 'Paid',      cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
  pending:   { label: 'Pending',   cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  failed:    { label: 'Failed',    cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
  cancelled: { label: 'Cancelled', cls: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  demo:      { label: 'Paid',      cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
};

const ACC_STATUS_META = {
  pending:   { label: 'Pending',   cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  approved:  { label: 'Approved',  cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
  rejected:  { label: 'Rejected',  cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
  cancelled: { label: 'Cancelled', cls: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

function fmtDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

export default function FanDashboard() {
  const { user, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [shopOrders, setShopOrders] = useState([]);
  const [ticketOrders, setTicketOrders] = useState([]);
  const [accreditations, setAccreditations] = useState([]);
  const [ticketOrderDetail, setTicketOrderDetail] = useState({}); // orderId -> full detail

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const [shopRes, ticketRes, accRes] = await Promise.all([
        api.get('/ecommerce/orders').catch((e) => ({ data: [], _err: e })),
        api.get('/ticketing/orders', { params: { mine: 'true' } }).catch((e) => ({ data: [], _err: e })),
        api.get('/accreditation/my').catch((e) => ({ data: [], _err: e })),
      ]);

      setShopOrders(Array.isArray(shopRes.data) ? shopRes.data : []);
      const ticketList = Array.isArray(ticketRes.data) ? ticketRes.data : [];
      setTicketOrders(ticketList);
      setAccreditations(Array.isArray(accRes.data) ? accRes.data : []);

      // Ticket orders may or may not include items — enrich with per-ticket detail
      const detailMap = {};
      await Promise.all(
        ticketList.slice(0, 20).map(async (o) => {
          try {
            const d = await api.get(`/ticketing/orders/${o.id}`);
            detailMap[o.id] = d.data;
          } catch { /* ignore individual failures */ }
        })
      );
      setTicketOrderDetail(detailMap);
    } catch (err) {
      console.error(err);
      setError('Could not load your dashboard. Try refreshing.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalSpent = (() => {
    let s = 0;
    for (const o of shopOrders) if (o.payment_status === 'paid') s += Number(o.total_amount || 0);
    for (const o of ticketOrders) if (o.payment_status === 'paid' || o.payment_status === 'demo') s += Number(o.total_amount || 0);
    return s;
  })();

  const ticketCount = (() => {
    let n = 0;
    for (const id of Object.keys(ticketOrderDetail)) {
      const o = ticketOrderDetail[id];
      for (const item of (o.items || [])) n += (item.quantity || 0);
    }
    return n;
  })();

  if (loading) {
    return (
      <>
        <div className="pt-24 min-h-screen container mx-auto px-6">
          <div className="flex justify-center py-20">
            <div className="w-16 h-16 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin" />
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="pt-24 min-h-screen container mx-auto px-6 pb-16">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl mb-8 bg-gradient-to-br from-faz-green via-faz-black to-faz-orange text-white shadow-2xl">
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-white rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative p-6 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-widest text-faz-orange font-bold mb-2">
                <FaUserCircle className="inline mr-1" /> My Portal
              </p>
              <h1 className="text-3xl md:text-5xl font-extrabold mb-3 leading-tight">
                Welcome{user?.first_name ? `, ${user.first_name}` : ''}!
              </h1>
              <p className="text-white/90 text-sm md:text-lg mb-4">
                Everything tied to your account in one place — purchases, tickets, and accreditation cards.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => load(true)}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  <FaSyncAlt className={refreshing ? 'animate-spin' : ''} />
                  {refreshing ? 'Refreshing…' : 'Refresh'}
                </button>
                <a
                  href={`${TICKETS_URL}/matches`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-faz-orange hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-bold transition"
                >
                  <FaTicketAlt /> Buy Tickets
                </a>
                <a
                  href={SHOP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  <FaShoppingBag /> Shop
                </a>
              </div>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-white px-4 py-2 rounded-lg text-sm font-medium self-start md:self-center"
            >
              <FaSignOutAlt /> Sign out
            </button>
          </div>
        </section>

        {error && (
          <GlassCard className="mb-6 text-center border-faz-red/50 bg-faz-red/10">
            <div className="flex items-center justify-center gap-2 text-faz-red">
              <FaExclamationTriangle /> {error}
            </div>
          </GlassCard>
        )}

        {/* KPIs */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <GlassCard className="text-center">
            <FaBoxOpen className="text-3xl text-faz-orange mx-auto mb-2" />
            <p className="text-3xl font-bold gradient-text">{shopOrders.length}</p>
            <p className="text-xs text-gray-400 mt-1">Shop orders</p>
          </GlassCard>
          <GlassCard className="text-center">
            <FaTicketAlt className="text-3xl text-faz-green mx-auto mb-2" />
            <p className="text-3xl font-bold gradient-text">{ticketCount}</p>
            <p className="text-xs text-gray-400 mt-1">Tickets bought</p>
          </GlassCard>
          <GlassCard className="text-center">
            <FaIdCard className="text-3xl text-faz-red mx-auto mb-2" />
            <p className="text-3xl font-bold gradient-text">
              {accreditations.filter((a) => a.status === 'approved').length}
            </p>
            <p className="text-xs text-gray-400 mt-1">Approved cards</p>
          </GlassCard>
          <GlassCard className="text-center">
            <FaCheckCircle className="text-3xl text-faz-green mx-auto mb-2" />
            <p className="text-3xl font-bold gradient-text">
              ZMW {totalSpent.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Total spent</p>
          </GlassCard>
        </section>

        {/* Ticket orders */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FaTicketAlt className="text-faz-green" /> My Tickets
            </h2>
            <a
              href={`${TICKETS_URL}/dashboard`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-faz-green hover:text-faz-orange flex items-center gap-1"
            >
              Open ticket portal <FaArrowRight size={10} />
            </a>
          </div>

          {ticketOrders.length === 0 ? (
            <GlassCard className="text-center py-8 text-gray-400">
              <FaTicketAlt className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No ticket orders yet.</p>
              <a
                href={`${TICKETS_URL}/matches`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-block mt-3"
              >
                Browse Matches
              </a>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {ticketOrders.slice(0, 6).map((o) => {
                const detail = ticketOrderDetail[o.id];
                const items = detail?.items || o.items || [];
                const tickets = items.flatMap((it) => it.tickets || []);
                const status = o.payment_status || 'pending';
                const meta = TICKET_STATUS_META[status] || TICKET_STATUS_META.pending;
                const firstItem = items[0];

                return (
                  <GlassCard key={o.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-gray-400">
                        #{(o.order_number || '').slice(0, 8).toUpperCase()}
                      </p>
                      <p className="font-semibold truncate">
                        {firstItem?.match_name || 'Ticket Order'}
                        {items.length > 1 ? ` (+${items.length - 1} more)` : ''}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {fmtDate(o.created_at)} · ZMW {Number(o.total_amount || 0).toFixed(2)}
                        {tickets.length > 0 ? ` · ${tickets.length} ticket${tickets.length !== 1 ? 's' : ''}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase font-semibold ${meta.cls}`}>
                        {meta.label}
                      </span>
                      {status === 'paid' || status === 'demo' ? (
                        <a
                          href={`${TICKETS_URL}/order/${o.order_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-faz-green hover:bg-green-700 text-white font-semibold px-3 py-1.5 rounded-lg"
                        >
                          View Tickets
                        </a>
                      ) : (
                        <a
                          href={`${TICKETS_URL}/pay/${o.order_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-faz-orange hover:bg-orange-600 text-white font-semibold px-3 py-1.5 rounded-lg"
                        >
                          Complete Payment
                        </a>
                      )}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </section>

        {/* Shop orders */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FaShoppingBag className="text-faz-orange" /> My Shop Orders
            </h2>
            <a
              href={`${SHOP_URL}/orders`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-faz-green hover:text-faz-orange flex items-center gap-1"
            >
              Open shop <FaArrowRight size={10} />
            </a>
          </div>

          {shopOrders.length === 0 ? (
            <GlassCard className="text-center py-8 text-gray-400">
              <FaShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No shop orders yet.</p>
              <a
                href={SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-block mt-3"
              >
                Browse the Shop
              </a>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {shopOrders.slice(0, 6).map((o) => {
                const status = o.payment_status || 'pending';
                const meta = SHOP_STATUS_META[status] || SHOP_STATUS_META.pending;
                return (
                  <GlassCard key={o.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-gray-400">
                        #{(o.order_number || '').slice(0, 8).toUpperCase()}
                      </p>
                      <p className="font-semibold truncate">
                        {o.advert?.title || 'Shop order'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {fmtDate(o.created_at)} · {o.currency || 'ZMW'} {Number(o.total_amount || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase font-semibold ${meta.cls}`}>
                        {meta.label}
                      </span>
                      <a
                        href={`${SHOP_URL}/order/${o.order_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-faz-green hover:bg-green-700 text-white font-semibold px-3 py-1.5 rounded-lg"
                      >
                        View Order
                      </a>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </section>

        {/* Accreditations */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FaIdCard className="text-faz-red" /> My Accreditation Cards
            </h2>
          </div>

          {accreditations.length === 0 ? (
            <GlassCard className="text-center py-8 text-gray-400">
              <FaIdCard className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No accreditation cards yet.</p>
              <Link to="/media/accreditation" className="btn-primary inline-block mt-3">
                Apply for Accreditation
              </Link>
            </GlassCard>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {accreditations.slice(0, 6).map((a) => {
                const meta = ACC_STATUS_META[a.status] || ACC_STATUS_META.pending;
                return (
                  <GlassCard key={a.id}>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-faz-green/20 flex items-center justify-center flex-shrink-0">
                        <FaIdCard className="text-faz-green" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{a.full_name}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {a.category_label}{a.service_provider_type_label ? ` · ${a.service_provider_type_label}` : ''}
                        </p>
                        {a.match && (
                          <p className="text-xs text-gray-300 truncate mt-0.5">
                            {a.match.home_team} vs {a.match.away_team}
                          </p>
                        )}
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase font-semibold flex-shrink-0 ${meta.cls}`}>
                        {meta.label}
                      </span>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </section>
      </div>
      <Footer />
    </>
  );
}