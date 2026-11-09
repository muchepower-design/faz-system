import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import { matchesAPI, reportsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { FaFutbol, FaCalendarCheck, FaClock, FaFlag, FaFileAlt, FaEdit } from 'react-icons/fa';

const RefereeDashboard = () => {
  const { user } = useAuth();
  const [assignedMatches, setAssignedMatches] = useState([]);
  const [submittedReports, setSubmittedReports] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [reportForm, setReportForm] = useState({ content: '', yellow_cards: [], red_cards: [], incidents: [] });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchMatches();
    }
  }, [user]);

  const fetchMatches = async () => {
    try {
      const res = await matchesAPI.getByReferee(user.id);
      setAssignedMatches(res.data);
      // Fetch existing reports
      const reportStatus = {};
      for (let match of res.data) {
        try {
          const reportRes = await reportsAPI.getByMatch(match.id);
          reportStatus[match.id] = reportRes.data;
        } catch (err) {
          // not found -> no report yet
        }
      }
      setSubmittedReports(reportStatus);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openReportModal = (match) => {
    const existing = submittedReports[match.id];
    if (existing) {
      setReportForm({
        content: existing.content,
        yellow_cards: existing.yellow_cards,
        red_cards: existing.red_cards,
        incidents: existing.incidents,
      });
    } else {
      setReportForm({ content: '', yellow_cards: [], red_cards: [], incidents: [] });
    }
    setSelectedMatch(match);
  };

  const handleReportSubmit = async () => {
    if (!reportForm.content.trim()) {
      alert('Please enter a report content');
      return;
    }
    setSubmitting(true);
    try {
      if (submittedReports[selectedMatch.id]) {
        await reportsAPI.update(submittedReports[selectedMatch.id].id, reportForm);
        alert('Report updated!');
      } else {
        await reportsAPI.create({ match_id: selectedMatch.id, ...reportForm });
        alert('Report submitted!');
      }
      await fetchMatches();
      setSelectedMatch(null);
    } catch (err) {
      alert('Failed to save report: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const addCard = (type) => {
    const player = prompt(`Enter player name for ${type} card:`);
    if (!player) return;
    const minute = prompt('Minute:');
    if (!minute) return;
    const newCard = { player, minute: parseInt(minute) };
    if (type === 'yellow') {
      setReportForm({ ...reportForm, yellow_cards: [...reportForm.yellow_cards, newCard] });
    } else {
      setReportForm({ ...reportForm, red_cards: [...reportForm.red_cards, newCard] });
    }
  };

  const removeCard = (type, index) => {
    if (type === 'yellow') {
      const newCards = [...reportForm.yellow_cards];
      newCards.splice(index, 1);
      setReportForm({ ...reportForm, yellow_cards: newCards });
    } else {
      const newCards = [...reportForm.red_cards];
      newCards.splice(index, 1);
      setReportForm({ ...reportForm, red_cards: newCards });
    }
  };

  if (loading) return <div className="pt-24 text-center">Loading your assignments...</div>;

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6">
      <h1 className="text-4xl font-bold gradient-text mb-8 flex items-center gap-3">
        <FaFlag className="text-faz-orange" /> Referee Dashboard
      </h1>

      <GlassCard className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <FaCalendarCheck className="text-faz-green" /> Your Matches
        </h2>
        {assignedMatches.length === 0 ? (
          <p className="text-gray-400">No matches assigned yet.</p>
        ) : (
          <div className="space-y-4">
            {assignedMatches.map(match => (
              <div key={match.id} className="border-b border-white/10 pb-3 last:border-0">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <p className="font-bold">{match.home_team} vs {match.away_team}</p>
                    <p className="text-sm text-gray-400">{match.venue} • {new Date(match.match_date).toLocaleString()}</p>
                    <p className="text-sm text-faz-green">Status: {match.status}</p>
                  </div>
                  <div className="flex gap-2">
                    {match.status === 'finished' ? (
                      <button
                        onClick={() => openReportModal(match)}
                        className="btn-secondary text-sm px-3 py-1 flex items-center gap-1"
                      >
                        {submittedReports[match.id] ? <FaEdit /> : <FaFileAlt />}
                        {submittedReports[match.id] ? 'Edit Report' : 'Submit Report'}
                      </button>
                    ) : (
                      <span className="text-gray-500 text-sm">Match not yet finished</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Report Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-2">Match Report</h2>
            <p className="mb-4 text-gray-300">{selectedMatch.home_team} vs {selectedMatch.away_team}</p>

            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Report Content</label>
                <textarea
                  rows="6"
                  className="glass w-full p-3 rounded"
                  value={reportForm.content}
                  onChange={(e) => setReportForm({ ...reportForm, content: e.target.value })}
                  placeholder="Describe key events, disciplinary actions, any incidents..."
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Yellow Cards</label>
                {reportForm.yellow_cards.map((card, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white/5 p-2 rounded mb-1">
                    <span>{card.player} ({card.minute}')</span>
                    <button onClick={() => removeCard('yellow', idx)} className="text-faz-red">Remove</button>
                  </div>
                ))}
                <button onClick={() => addCard('yellow')} className="btn-secondary text-sm mt-2">+ Add Yellow Card</button>
              </div>

              <div>
                <label className="block font-semibold mb-1">Red Cards</label>
                {reportForm.red_cards.map((card, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white/5 p-2 rounded mb-1">
                    <span>{card.player} ({card.minute}')</span>
                    <button onClick={() => removeCard('red', idx)} className="text-faz-red">Remove</button>
                  </div>
                ))}
                <button onClick={() => addCard('red')} className="btn-secondary text-sm mt-2">+ Add Red Card</button>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setSelectedMatch(null)} className="btn-secondary">Cancel</button>
                <button onClick={handleReportSubmit} disabled={submitting} className="btn-primary">
                  {submitting ? 'Saving...' : (submittedReports[selectedMatch.id] ? 'Update Report' : 'Submit Report')}
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default RefereeDashboard;