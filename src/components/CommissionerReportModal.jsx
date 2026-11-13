// frontend/src/components/CommissionerReportModal.jsx
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api';
import GlassCard from './GlassCard';
import { FaTimes, FaPlus, FaTrash, FaSave } from 'react-icons/fa';

export default function CommissionerReportModal({ match, onClose, onSaved }) {
  const [content, setContent] = useState('');
  const [yellowCards, setYellowCards] = useState([]);
  const [redCards, setRedCards] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [existingId, setExistingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!match) return;
    api.get(`/reports/match-reports/match/${match.id}`)
      .then((res) => {
        const r = res.data;
        setExistingId(r.id);
        setContent(r.content || '');
        setYellowCards(r.yellow_cards || []);
        setRedCards(r.red_cards || []);
        setIncidents(r.incidents || []);
      })
      .catch(() => { /* none yet — fine */ })
      .finally(() => setLoading(false));
  }, [match]);

  const addCard = (type) => {
    const player = prompt(`Player name for ${type} card:`);
    if (!player) return;
    const minute = prompt('Minute:');
    if (!minute) return;
    const card = { player, minute: parseInt(minute, 10) || 0 };
    if (type === 'yellow') setYellowCards((c) => [...c, card]);
    else setRedCards((c) => [...c, card]);
  };

  const removeCard = (type, idx) => {
    if (type === 'yellow') setYellowCards((c) => c.filter((_, i) => i !== idx));
    else setRedCards((c) => c.filter((_, i) => i !== idx));
  };

  const addIncident = () => {
    const text = prompt('Describe the incident:');
    if (!text) return;
    setIncidents((c) => [...c, { text, at: new Date().toISOString() }]);
  };

  const submit = async () => {
    if (!content.trim()) { toast.error('Report content is required'); return; }
    setSubmitting(true);
    try {
      const payload = { content, yellow_cards: yellowCards, red_cards: redCards, incidents };
      if (existingId) {
        await api.put(`/reports/match-reports/${existingId}`, payload);
        toast.success('Report updated');
      } else {
        await api.post('/reports/match-reports', { match_id: match.id, ...payload });
        toast.success('Report submitted');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <GlassCard className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold">{existingId ? 'Edit Report' : 'Submit Match Report'}</h2>
            <p className="text-sm text-gray-400">{match.home_team} vs {match.away_team}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <FaTimes />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-10 h-10 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Report Content</label>
              <textarea
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="glass w-full p-3 rounded text-white"
                placeholder="Key events, disciplinary actions, injuries, unusual incidents…"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Yellow Cards</label>
                <button onClick={() => addCard('yellow')} className="text-sm text-faz-orange hover:underline flex items-center gap-1">
                  <FaPlus size={10} /> Add
                </button>
              </div>
              {yellowCards.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No yellow cards</p>
              ) : (
                <div className="space-y-1">
                  {yellowCards.map((c, i) => (
                    <div key={i} className="flex justify-between items-center bg-white/5 p-2 rounded text-sm">
                      <span>{c.player} ({c.minute}')</span>
                      <button onClick={() => removeCard('yellow', i)} className="text-faz-red">
                        <FaTrash size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Red Cards</label>
                <button onClick={() => addCard('red')} className="text-sm text-faz-orange hover:underline flex items-center gap-1">
                  <FaPlus size={10} /> Add
                </button>
              </div>
              {redCards.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No red cards</p>
              ) : (
                <div className="space-y-1">
                  {redCards.map((c, i) => (
                    <div key={i} className="flex justify-between items-center bg-white/5 p-2 rounded text-sm">
                      <span>{c.player} ({c.minute}')</span>
                      <button onClick={() => removeCard('red', i)} className="text-faz-red">
                        <FaTrash size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Incidents</label>
                <button onClick={addIncident} className="text-sm text-faz-orange hover:underline flex items-center gap-1">
                  <FaPlus size={10} /> Add
                </button>
              </div>
              {incidents.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No incidents</p>
              ) : (
                <div className="space-y-1">
                  {incidents.map((it, i) => (
                    <div key={i} className="flex justify-between items-center bg-white/5 p-2 rounded text-sm">
                      <span className="flex-1 truncate">{it.text}</span>
                      <button onClick={() => setIncidents((c) => c.filter((_, j) => j !== i))} className="text-faz-red ml-2">
                        <FaTrash size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button onClick={onClose} className="btn-secondary">Cancel</button>
              <button onClick={submit} disabled={submitting} className="btn-primary flex items-center gap-2">
                <FaSave /> {submitting ? 'Saving…' : (existingId ? 'Update Report' : 'Submit Report')}
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}