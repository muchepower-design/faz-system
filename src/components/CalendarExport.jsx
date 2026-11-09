import React, { useState } from 'react';
import { FaCalendarPlus } from 'react-icons/fa';
import GlassCard from './GlassCard';

const CalendarExport = ({ teams }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [competition, setCompetition] = useState('');

  const exportUrl = `/api/matches/export/calendar?${selectedTeam ? `team_id=${selectedTeam}&` : ''}${competition ? `competition=${encodeURIComponent(competition)}` : ''}`;

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="btn-secondary flex items-center gap-2"
      >
        <FaCalendarPlus /> Export Calendar
      </button>
      {showOptions && (
        <GlassCard className="absolute right-0 mt-2 w-64 p-4 z-10">
          <h4 className="font-semibold mb-2">Filter matches</h4>
          <select
            className="glass w-full p-2 rounded mb-2"
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            <option value="">All Teams</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input
            type="text"
            placeholder="Competition (e.g., Super League)"
            className="glass w-full p-2 rounded mb-3"
            value={competition}
            onChange={(e) => setCompetition(e.target.value)}
          />
          <a
            href={exportUrl}
            download
            className="btn-primary block text-center text-sm"
            onClick={() => setShowOptions(false)}
          >
            Download .ics
          </a>
        </GlassCard>
      )}
    </div>
  );
};

export default CalendarExport;