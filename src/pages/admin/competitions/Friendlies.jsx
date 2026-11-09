import { useEffect, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import GlassCard from '../../../components/GlassCard'
import { competitionManagementAPI } from '../../../api'
import toast from 'react-hot-toast'

export default function Friendlies() {
  const { api } = useAuth()
  const [teams, setTeams] = useState([])
  const [friendlies, setFriendlies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    home_team_id: '',
    away_team_id: '',
    match_date: '',
    venue: '',
    series_name: '',
    season_name: '',
    gender: 'mixed',
    age_group: '',
    is_ticketed: false
  })

  useEffect(() => {
    fetchTeams()
    fetchFriendlies()
  }, [])

  const fetchTeams = async () => {
    try {
      const res = await api.get('/api/teams?limit=200')
      setTeams(res.data)
    } catch (error) {
      toast.error('Failed to load teams')
    }
  }

  const fetchFriendlies = async () => {
    try {
      const res = await api.get('/api/competitions-management/friendlies')
      setFriendlies(res.data)
    } catch (error) {
      toast.error('Failed to load friendlies')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      home_team_id: '',
      away_team_id: '',
      match_date: '',
      venue: '',
      series_name: '',
      season_name: '',
      gender: 'mixed',
      age_group: '',
      is_ticketed: false
    })
    setEditing(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = { ...formData }
      if (!payload.series_name) delete payload.series_name
      if (!payload.season_name) delete payload.season_name
      if (!payload.age_group) delete payload.age_group
      
      await api.post('/api/competitions-management/friendlies', payload)
      toast.success('Friendly match created')
      setShowForm(false)
      resetForm()
      fetchFriendlies()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create friendly')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-16 h-16 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin" /></div>

  return (
    <div className="pt-24 space-y-6 mx-auto px-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Friendly Matches</h1>
          <p className="text-gray-400">Create and manage friendly matches</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="bg-gradient-to-r from-faz-green to-faz-orange text-white px-4 py-2 rounded-lg hover:opacity-80 transition"
        >
          + New Friendly
        </button>
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-white/10 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Create Friendly Match</h2>
              <button onClick={() => { setShowForm(false); resetForm() }} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <select
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  value={formData.home_team_id}
                  onChange={e => setFormData({ ...formData, home_team_id: e.target.value })}
                  required
                >
                  <option value="">Home Team</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <select
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  value={formData.away_team_id}
                  onChange={e => setFormData({ ...formData, away_team_id: e.target.value })}
                  required
                >
                  <option value="">Away Team</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <input
                type="datetime-local"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                value={formData.match_date}
                onChange={e => setFormData({ ...formData, match_date: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Venue"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                value={formData.venue}
                onChange={e => setFormData({ ...formData, venue: e.target.value })}
              />

              <div className="border-t border-white/10 pt-4 mt-2">
                <p className="text-sm font-medium text-gray-300 mb-2">Friendly Series (Optional)</p>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Series Name"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    value={formData.series_name}
                    onChange={e => setFormData({ ...formData, series_name: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Season Name"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    value={formData.season_name}
                    onChange={e => setFormData({ ...formData, season_name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <select
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="mixed">Mixed</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Age Group"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    value={formData.age_group}
                    onChange={e => setFormData({ ...formData, age_group: e.target.value })}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.is_ticketed}
                  onChange={e => setFormData({ ...formData, is_ticketed: e.target.checked })}
                />
                Ticketed (available for purchase)
              </label>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setShowForm(false); resetForm() }} className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-6 py-2 rounded-lg bg-gradient-to-r from-faz-green to-faz-orange text-white hover:opacity-80">
                  {submitting ? 'Saving...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {friendlies.length === 0 ? (
        <GlassCard className="p-6 text-center text-gray-400">No friendlies yet.</GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {friendlies.map(match => {
            const home = teams.find(t => t.id === match.home_team_id)
            const away = teams.find(t => t.id === match.away_team_id)
            return (
              <GlassCard key={match.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-white">{home?.name || 'Unknown'} vs {away?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-400">{new Date(match.match_date).toLocaleString()}</p>
                    {match.venue && <p className="text-sm text-gray-400">{match.venue}</p>}
                    {match.is_ticketed && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full mt-1 inline-block">🎟️ Ticketed</span>}
                  </div>
                  <div className="text-right">
                    {match.status === 'finished' ? (
                      <span className="text-faz-orange font-bold">{match.home_score} - {match.away_score}</span>
                    ) : (
                      <span className="text-gray-400 text-sm">Scheduled</span>
                    )}
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}
    </div>
  )
}