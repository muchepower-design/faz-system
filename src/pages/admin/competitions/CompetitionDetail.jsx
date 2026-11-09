import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import GlassCard from '../../../components/GlassCard'
import api from '../../../api'   // <-- import the default axios instance
import toast from 'react-hot-toast'

export default function CompetitionDetail() {
  const { competitionId } = useParams()
  const [competition, setCompetition] = useState(null)
  const [seasons, setSeasons] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    status: 'upcoming',
    is_current: false
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [competitionId])

  const fetchData = async () => {
    try {
      // Remove the extra '/api' prefix – the baseURL is already '/api'
      const [compRes, seasonsRes] = await Promise.all([
        api.get(`/competitions-management/competitions/${competitionId}`),
        api.get(`/competitions-management/competitions/${competitionId}/seasons`)
      ])
      console.log('Competition:', compRes.data)
      console.log('Seasons:', seasonsRes.data)
      setCompetition(compRes.data)
      setSeasons(seasonsRes.data)
    } catch (error) {
      console.error('Fetch error:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      start_date: '',
      end_date: '',
      status: 'upcoming',
      is_current: false
    })
    setEditing(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = { ...formData }
      if (editing) {
        await api.put(`/competitions-management/seasons/${editing.id}`, payload)
        toast.success('Season updated')
      } else {
        await api.post(`/competitions-management/competitions/${competitionId}/seasons`, payload)
        toast.success('Season created')
      }
      setShowForm(false)
      resetForm()
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSeason = async (seasonId) => {
    if (!confirm('Delete this season and all its data?')) return
    try {
      await api.delete(`/competitions-management/seasons/${seasonId}`)
      toast.success('Season deleted')
      fetchData()
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-16 h-16 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin" /></div>
  if (!competition) return <div className="text-center text-gray-400">Competition not found</div>

  return (
    <div className="pt-24 space-y-6 mx-auto px-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/competitions" className="text-faz-orange hover:text-faz-green">← Back</Link>
        <h1 className="text-2xl font-bold text-white">{competition.name}</h1>
        <span className={`px-2 py-1 text-xs rounded-full ${competition.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {competition.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-400">{competition.competition_type} • {competition.gender} • {competition.scope}</p>
          {competition.age_group && <p className="text-gray-400">Age: {competition.age_group}</p>}
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="bg-gradient-to-r from-faz-green to-faz-orange text-white px-4 py-2 rounded-lg hover:opacity-80 transition"
        >
          + New Season
        </button>
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-white/10 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">{editing ? 'Edit Season' : 'Create Season'}</h2>
              <button onClick={() => { setShowForm(false); resetForm() }} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Season Name (e.g., 2025-2026)"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  value={formData.start_date}
                  onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                />
                <input
                  type="date"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  value={formData.end_date}
                  onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.is_current}
                    onChange={e => setFormData({ ...formData, is_current: e.target.checked })}
                  />
                  Current Season
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setShowForm(false); resetForm() }} className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-6 py-2 rounded-lg bg-gradient-to-r from-faz-green to-faz-orange text-white hover:opacity-80">
                  {submitting ? 'Saving...' : (editing ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {seasons.length === 0 ? (
        <GlassCard className="p-6 text-center text-gray-400">No seasons yet.</GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {seasons.map(season => (
            <GlassCard key={season.id} className="p-4 hover:scale-105 transition">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white">{season.season}</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${season.is_archived === 'active' ? 'bg-green-500/20 text-green-400' : season.is_archived === 'completed' ? 'bg-gray-500/20 text-gray-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {season.is_archived}
                    </span>
                    {season.is_archived ?
                     <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400">
                    Archived </span> :
                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400">
                    Current </span>
                    }
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    {season.started_at ? new Date(season.started_at).toLocaleDateString() : 'N/A'} - {season.ended_at ? new Date(season.ended_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <Link to={`/admin/competitions/${competitionId}/seasons/${season.id}`}>
                  <button className="bg-gradient-to-r from-faz-green to-faz-orange text-white px-3 py-1 rounded-lg text-sm hover:opacity-80">Manage</button>
                </Link>
                <button onClick={() => handleDeleteSeason(season.id)} className="text-red-400 hover:underline text-sm">🗑️</button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}