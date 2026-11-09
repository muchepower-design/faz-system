import React, { useState, useEffect } from 'react';
import GlassCard from './GlassCard';
import { FaBroadcastTower, FaFutbol, FaFlagCheckered } from 'react-icons/fa';

const LiveScoreWidget = ({ matchId }) => {
  const [liveEvents, setLiveEvents] = useState([]);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [matchStatus, setMatchStatus] = useState('live');
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const socket = new WebSocket(`ws://localhost:8000/ws/live/${matchId}`);
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'event') {
        setLiveEvents(prev => [...prev, data.event]);
        if (data.event.event_type === 'goal') {
          // Update score – you need to know which team the player belongs to
          // For simplicity, we assume the backend sends team info. Here we'll just increment later via API fetch.
        }
      } else if (data.type === 'score_update') {
        setHomeScore(data.home_score);
        setAwayScore(data.away_score);
      } else if (data.type === 'match_status') {
        setMatchStatus(data.status);
      }
    };
    setWs(socket);
    return () => socket.close();
  }, [matchId]);

  return (
    <GlassCard className="p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold flex items-center gap-2"><FaBroadcastTower className="text-faz-red animate-pulse" /> Live Updates</h3>
        <span className="text-sm glass px-2 py-1 rounded">{matchStatus.toUpperCase()}</span>
      </div>
      <div className="flex justify-between text-center mb-4">
        <div><p className="text-3xl font-bold">{homeScore}</p></div>
        <div><p className="text-xl">-</p></div>
        <div><p className="text-3xl font-bold">{awayScore}</p></div>
      </div>
      <div className="max-h-40 overflow-y-auto space-y-1 text-sm">
        {liveEvents.map((ev, idx) => (
          <div key={idx} className="glass p-1 px-2">
            {ev.minute}' – {ev.event_type === 'goal' ? '⚽ Goal' : ev.event_type} : {ev.player_name}
            {ev.assist_player && ` (assist: ${ev.assist_player})`}
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

export default LiveScoreWidget;