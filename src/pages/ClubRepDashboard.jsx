import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import { useAuth } from '../context/AuthContext';
import { teamsAPI, playersAPI, matchesAPI, usersAPI } from '../api';
import { 
  FaUsers, FaFutbol, FaChartLine, FaPlus, FaEdit, FaTrash, 
  FaCheckCircle, FaExclamationTriangle, FaUserPlus 
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const ClubRepDashboard = () => {
  const { user, logout } = useAuth();
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [stats, setStats] = useState({ topScorer: null, mostAssists: null });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [playerForm, setPlayerForm] = useState({
    name: '', position: '', jersey_number: '', date_of_birth: '', nationality: '', photo: ''
  });

  useEffect(() => {
    fetchClubData();
  }, []);

  const fetchClubData = async () => {
    setLoading(true);
    try {
      // Get current user with club_id
      const userRes = await usersAPI.getMe();
      const clubId = userRes.data.club_id;
      if (!clubId) {
        setMessage({ type: 'error', text: 'No club assigned to your account. Please contact admin.' });
        setLoading(false);
        return;
      }
      // Fetch team details
      const teamRes = await teamsAPI.getById(clubId);
      setTeam(teamRes.data);
      // Fetch players of this club
      const playersRes = await playersAPI.getAll({ team_id: clubId });
      setPlayers(playersRes.data);
      // Fetch upcoming matches where team is involved (by name)
      const allMatches = await matchesAPI.getAll({ status: 'upcoming' });
      const teamMatches = allMatches.data.filter(
        m => m.home_team === teamRes.data.name || m.away_team === teamRes.data.name
      );
      setUpcomingMatches(teamMatches);
      // Calculate top scorer and assister
      const topScorer = playersRes.data.reduce((max, p) => p.goals > (max?.goals || -1) ? p : max, null);
      const mostAssists = playersRes.data.reduce((max, p) => p.assists > (max?.assists || -1) ? p : max, null);
      setStats({ topScorer, mostAssists });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load club data. Please refresh.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...playerForm,
      jersey_number: parseInt(playerForm.jersey_number),
      team_id: team.id,
    };
    try {
      if (editingPlayer) {
        await playersAPI.update(editingPlayer.id, payload);
        setMessage({ type: 'success', text: 'Player updated successfully!' });
      } else {
        await playersAPI.create(payload);
        setMessage({ type: 'success', text: 'Player added successfully!' });
      }
      setShowPlayerForm(false);
      setEditingPlayer(null);
      setPlayerForm({ name: '', position: '', jersey_number: '', date_of_birth: '', nationality: '', photo: '' });
      fetchClubData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Save failed.' });
    }
  };

  const handleDeletePlayer = async (playerId) => {
    if (!window.confirm('Delete this player permanently?')) return;
    try {
      await playersAPI.delete(playerId);
      setMessage({ type: 'success', text: 'Player deleted.' });
      fetchClubData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Delete failed.' });
    }
  };

  const editPlayer = (player) => {
    setEditingPlayer(player);
    setPlayerForm({
      name: player.name,
      position: player.position,
      jersey_number: player.jersey_number,
      date_of_birth: player.date_of_birth,
      nationality: player.nationality,
      photo: player.photo || '',
    });
    setShowPlayerForm(true);
  };

  if (loading) return (
    <div className="pt-24 text-center">
      <div className="inline-block w-12 h-12 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-400">Loading club dashboard...</p>
    </div>
  );

  if (!team && !loading) return (
    <div className="pt-24 text-center text-faz-red">No club assigned. Contact your FAZ administrator.</div>
  );

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6">
      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-24 right-6 z-50 glass p-4 rounded-lg flex items-center gap-2 ${
              message.type === 'success' ? 'border-faz-green' : 'border-faz-red'
            }`}
          >
            {message.type === 'success' ? <FaCheckCircle className="text-faz-green" /> : <FaExclamationTriangle className="text-faz-red" />}
            <span>{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-gradient-to-br from-faz-green to-faz-orange rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg">
            {team?.short_name?.[0] || '?'}
          </div>
          <div>
            <h1 className="text-4xl font-bold gradient-text">{team?.name} – Club Dashboard</h1>
            <p className="text-gray-400">Welcome back, {user?.full_name || user?.username}</p>
          </div>
        </div>
        <button onClick={() => { setEditingPlayer(null); setPlayerForm({ name: '', position: '', jersey_number: '', date_of_birth: '', nationality: '', photo: '' }); setShowPlayerForm(true); }} 
          className="btn-primary flex items-center gap-2">
          <FaUserPlus /> Add Player
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <GlassCard className="text-center">
          <FaUsers className="text-3xl text-faz-green mx-auto mb-2" />
          <p className="text-gray-400">Players</p>
          <p className="text-4xl font-bold gradient-text">{players.length}</p>
        </GlassCard>
        <GlassCard className="text-center">
          <FaFutbol className="text-3xl text-faz-orange mx-auto mb-2" />
          <p className="text-gray-400">Upcoming Matches</p>
          <p className="text-4xl font-bold gradient-text">{upcomingMatches.length}</p>
        </GlassCard>
        <GlassCard className="text-center">
          <FaChartLine className="text-3xl text-faz-red mx-auto mb-2" />
          <p className="text-gray-400">Top Scorer</p>
          <p className="text-xl font-bold">{stats.topScorer?.name || 'N/A'} <span className="text-faz-green">({stats.topScorer?.goals || 0})</span></p>
          <p className="text-sm text-gray-400">Most assists: {stats.mostAssists?.name || 'N/A'} ({stats.mostAssists?.assists || 0})</p>
        </GlassCard>
      </div>

      {/* Squad Management */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Squad</h2>
        <span className="text-sm text-gray-400">{players.length} registered players</span>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.length === 0 ? (
          <GlassCard className="col-span-full text-center py-8 text-gray-400">
            No players added yet. Click "Add Player" to register your squad.
          </GlassCard>
        ) : (
          players.map(player => (
            <GlassCard key={player.id} className="hover:scale-[1.02] transition-transform">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg">{player.name}</p>
                  <p className="text-sm text-gray-400">{player.position} • #{player.jersey_number}</p>
                  <p className="text-xs text-gray-500">{player.nationality}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => editPlayer(player)} className="p-1 hover:text-faz-green transition">
                    <FaEdit />
                  </button>
                  <button onClick={() => handleDeletePlayer(player.id)} className="p-1 hover:text-faz-red transition">
                    <FaTrash />
                  </button>
                </div>
              </div>
              <div className="flex justify-between mt-3 text-sm border-t border-white/10 pt-2">
                <span className="text-faz-green">{player.goals} goals</span>
                <span className="text-faz-orange">{player.assists} assists</span>
                <span className="text-gray-400">{player.appearances} apps</span>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      {/* Upcoming Matches */}
      <h2 className="text-2xl font-semibold mt-10 mb-4">Upcoming Fixtures</h2>
      <div className="space-y-3">
        {upcomingMatches.length === 0 ? (
          <GlassCard className="text-center py-6 text-gray-400">No upcoming matches scheduled.</GlassCard>
        ) : (
          upcomingMatches.map(match => (
            <GlassCard key={match.id} className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <p className="font-semibold">{match.home_team} vs {match.away_team}</p>
                <p className="text-sm text-gray-400">{new Date(match.match_date).toLocaleString()}</p>
                <p className="text-xs">{match.venue}</p>
              </div>
              <span className={`text-sm px-3 py-1 rounded-full ${
                match.status === 'live' ? 'bg-faz-red/20 text-faz-red animate-pulse' : 'bg-faz-green/20 text-faz-green'
              }`}>
                {match.status.toUpperCase()}
              </span>
            </GlassCard>
          ))
        )}
      </div>

      {/* Player Form Modal */}
      {showPlayerForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <GlassCard className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{editingPlayer ? 'Edit Player' : 'Add New Player'}</h2>
            <form onSubmit={handlePlayerSubmit} className="space-y-4">
              <input type="text" placeholder="Full Name" className="glass w-full p-3 rounded" value={playerForm.name} onChange={e => setPlayerForm({...playerForm, name: e.target.value})} required />
              <select className="glass w-full p-3 rounded" value={playerForm.position} onChange={e => setPlayerForm({...playerForm, position: e.target.value})} required>
                <option value="">Select Position</option>
                <option>Goalkeeper</option><option>Defender</option><option>Midfielder</option><option>Forward</option>
              </select>
              <input type="number" placeholder="Jersey Number" className="glass w-full p-3 rounded" value={playerForm.jersey_number} onChange={e => setPlayerForm({...playerForm, jersey_number: e.target.value})} required />
              <input type="date" placeholder="Date of Birth" className="glass w-full p-3 rounded" value={playerForm.date_of_birth} onChange={e => setPlayerForm({...playerForm, date_of_birth: e.target.value})} required />
              <input type="text" placeholder="Nationality" className="glass w-full p-3 rounded" value={playerForm.nationality} onChange={e => setPlayerForm({...playerForm, nationality: e.target.value})} required />
              <input type="url" placeholder="Photo URL (optional)" className="glass w-full p-3 rounded" value={playerForm.photo} onChange={e => setPlayerForm({...playerForm, photo: e.target.value})} />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowPlayerForm(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Player</button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default ClubRepDashboard;