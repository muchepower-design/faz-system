import React, { useState, useEffect } from 'react';
import GlassCard from './GlassCard';
import { matchesAPI, matchEventsAPI, playersAPI } from '../api';
import { FaPlus, FaTrash } from 'react-icons/fa';

const MatchResultForm = ({ matchId, onComplete }) => {
  const [match, setMatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [players, setPlayers] = useState([]);
  const [newEvent, setNewEvent] = useState({ event_type: 'goal', player_id: '', minute: '', assist_player_id: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const matchRes = await matchesAPI.getById(matchId);
        setMatch(matchRes.data);
        
        const eventsRes = await matchEventsAPI.getByMatch(matchId);
        setEvents(eventsRes.data);
        
        // Fetch all players (no filtering)
        const playersRes = await playersAPI.getAll({});
        setPlayers(playersRes.data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [matchId]);

  const addEvent = async () => {
    if (!newEvent.player_id || !newEvent.minute) {
      alert('Please select player and minute');
      return;
    }
    try {
      const data = {
        match_id: matchId,
        event_type: newEvent.event_type,
        player_id: parseInt(newEvent.player_id),
        minute: parseInt(newEvent.minute),
        related_player_id: newEvent.assist_player_id ? parseInt(newEvent.assist_player_id) : null,
      };
      const res = await matchEventsAPI.create(data);
      setEvents([...events, res.data]);
      setNewEvent({ event_type: 'goal', player_id: '', minute: '', assist_player_id: '' });
    } catch (err) {
      alert('Failed to add event: ' + err.message);
    }
  };

  const deleteEvent = async (eventId) => {
    try {
      await matchEventsAPI.delete(eventId);
      setEvents(events.filter(e => e.id !== eventId));
    } catch (err) {
      alert('Failed to delete event: ' + err.message);
    }
  };

  const finishMatch = async () => {
    const homeScore = prompt(`Enter final score for ${match.home_team}:`, match.home_score || 0);
    const awayScore = prompt(`Enter final score for ${match.away_team}:`, match.away_score || 0);
    if (homeScore !== null && awayScore !== null) {
      try {
        await matchesAPI.updateScore(matchId, parseInt(homeScore), parseInt(awayScore), 'finished');
        onComplete();
      } catch (err) {
        alert('Failed to finish match: ' + err.message);
      }
    }
  };

  if (loading) return <GlassCard className="p-4 text-center">Loading match data...</GlassCard>;
  if (error) return <GlassCard className="p-4 text-center text-red-500">Error: {error}</GlassCard>;

  return (
    <GlassCard className="p-6 max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4">{match?.home_team} vs {match?.away_team}</h2>
      <div className="grid grid-cols-2 gap-4 mb-6 text-center">
        <div><p className="text-3xl font-bold gradient-text">{match?.home_score || 0}</p></div>
        <div><p className="text-3xl font-bold gradient-text">{match?.away_score || 0}</p></div>
      </div>

      <div className="space-y-3 mb-6">
        <select className="glass w-full p-2 rounded" value={newEvent.event_type} onChange={e => setNewEvent({...newEvent, event_type: e.target.value})}>
          <option value="goal">⚽ Goal</option>
          <option value="yellow_card">🟨 Yellow Card</option>
          <option value="red_card">🟥 Red Card</option>
        </select>

        <select className="glass w-full p-2 rounded" value={newEvent.player_id} onChange={e => setNewEvent({...newEvent, player_id: e.target.value})}>
          <option value="">Select player</option>
          {players.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {newEvent.event_type === 'goal' && (
          <select className="glass w-full p-2 rounded" value={newEvent.assist_player_id} onChange={e => setNewEvent({...newEvent, assist_player_id: e.target.value})}>
            <option value="">Assist by (optional)</option>
            {players.map(p => (
              <option key={`assist-${p.id}`} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}

        <input type="number" placeholder="Minute" className="glass w-full p-2 rounded" value={newEvent.minute} onChange={e => setNewEvent({...newEvent, minute: e.target.value})} />

        <button onClick={addEvent} className="btn-primary w-full flex items-center justify-center gap-2">
          <FaPlus /> Add Event
        </button>
      </div>

      <div className="max-h-60 overflow-y-auto space-y-2 mb-6">
        {events.sort((a,b) => a.minute - b.minute).map(ev => {
          const player = players.find(p => p.id === ev.player_id);
          const assistPlayer = ev.related_player_id ? players.find(p => p.id === ev.related_player_id) : null;
          return (
            <div key={ev.id} className="glass p-2 text-sm flex justify-between items-center">
              <span>
                {ev.minute}' – {ev.event_type === 'goal' ? '⚽' : ev.event_type === 'yellow_card' ? '🟨' : '🟥'} {player?.name}
                {assistPlayer && ` (assist: ${assistPlayer.name})`}
              </span>
              <button onClick={() => deleteEvent(ev.id)} className="text-faz-red hover:text-faz-red/70">
                <FaTrash />
              </button>
            </div>
          );
        })}
      </div>

      <button onClick={finishMatch} className="btn-secondary w-full">Finish Match</button>
    </GlassCard>
  );
};

export default MatchResultForm;