import { useEffect, useState, useCallback, useRef, useMemo, memo } from 'react'
import { useParams, Link } from 'react-router-dom'
import GlassCard from '../../../components/GlassCard'
import api from '../../../api'
import toast from 'react-hot-toast'

// ============================================================
// Searchable Select Component
// ============================================================
const SearchableSelect = memo(({
  value,
  onChange,
  options,          // array of { value, label } or { id, name } (auto-detected)
  placeholder = 'Select...',
  disabled = false,
  required = false,
  className = ''
}) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Normalize options to { value, label } form
  const normalized = useMemo(() => {
    return (options || []).map(opt => {
      if (typeof opt === 'object' && opt !== null) {
        if ('value' in opt && 'label' in opt) return { value: opt.value, label: opt.label }
        if ('id' in opt && 'name' in opt) return { value: opt.id, label: opt.name }
      }
      return { value: opt, label: String(opt) }
    })
  }, [options])

  const selected = useMemo(
    () => normalized.find(o => String(o.value) === String(value)),
    [normalized, value]
  )

  const filtered = useMemo(() => {
    if (!query.trim()) return normalized
    const q = query.toLowerCase()
    return normalized.filter(o => o.label.toLowerCase().includes(q))
  }, [normalized, query])

  // Close on click outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  // Focus input when opening
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
      setHighlighted(0)
    }
  }, [open])

  const handleSelect = (opt) => {
    onChange(opt.value)
    setOpen(false)
    setQuery('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted(h => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(h => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[highlighted]) handleSelect(filtered[highlighted])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      setQuery('')
    }
  }

  // Scroll highlighted into view
  useEffect(() => {
    if (!open) return
    const el = document.querySelector(`[data-ss-idx="${highlighted}"]`)
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' })
  }, [highlighted, open])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Hidden input to satisfy `required` validation */}
      {required && (
        <input
          tabIndex={-1}
          required
          value={value || ''}
          onChange={() => {}}
          className="absolute inset-0 opacity-0 pointer-events-none"
        />
      )}

      {/* Trigger / input */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-left text-white flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-600'}`}
      >
        <span className={selected ? 'text-white' : 'text-gray-500'}>
          {selected ? selected.label : placeholder}
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-72 flex flex-col">
          <div className="p-2 border-b border-gray-700">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setHighlighted(0) }}
              onKeyDown={handleKeyDown}
              placeholder="Search..."
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
                  data-ss-idx={idx}
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
  )
})

// ---- Modal wrapper ----
const ModalWrapper = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-white/10 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ---- Memoized forms ----
const StageForm = memo(({ formData, setFormData, onSubmit, onCancel, editing, submitting }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <input
      type="text"
      placeholder="Stage Name (e.g., Regular Season, Group Stage)"
      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
      value={formData.name || ''}
      onChange={e => setFormData({ ...formData, name: e.target.value })}
      autoFocus
      required
    />
    <div className="grid grid-cols-2 gap-4">
      <input
        type="number"
        placeholder="Order (e.g., 1, 2, 3)"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
        value={formData.stage_order || 0}
        onChange={e => setFormData({ ...formData, stage_order: parseInt(e.target.value) || 0 })}
      />
      <div className="flex items-center gap-4 mt-2">
        <label className="flex items-center gap-1 text-sm text-gray-300">
          <input type="checkbox" checked={formData.is_group_stage || false} onChange={e => setFormData({ ...formData, is_group_stage: e.target.checked })} />
          Group Stage
        </label>
        <label className="flex items-center gap-1 text-sm text-gray-300">
          <input type="checkbox" checked={formData.is_knockout || false} onChange={e => setFormData({ ...formData, is_knockout: e.target.checked })} />
          Knockout
        </label>
      </div>
    </div>
    <div className="flex justify-end gap-3 pt-4">
      <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600">Cancel</button>
      <button type="submit" disabled={submitting} className="px-6 py-2 rounded-lg bg-gradient-to-r from-faz-green to-faz-orange text-white hover:opacity-80">
        {submitting ? 'Saving...' : (editing ? 'Update' : 'Create')}
      </button>
    </div>
  </form>
))

const GroupForm = memo(({ formData, setFormData, onSubmit, onCancel, editing, submitting }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <input
      type="text"
      placeholder="Group Name (e.g., Group A, Group B)"
      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
      value={formData.name || ''}
      onChange={e => setFormData({ ...formData, name: e.target.value })}
      autoFocus
      required
    />
    <input
      type="number"
      placeholder="Order (e.g., 1, 2, 3)"
      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
      value={formData.group_order || 0}
      onChange={e => setFormData({ ...formData, group_order: parseInt(e.target.value) || 0 })}
    />
    <div className="flex justify-end gap-3 pt-4">
      <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600">Cancel</button>
      <button type="submit" disabled={submitting} className="px-6 py-2 rounded-lg bg-gradient-to-r from-faz-green to-faz-orange text-white hover:opacity-80">
        {submitting ? 'Saving...' : (editing ? 'Update' : 'Create')}
      </button>
    </div>
  </form>
))

const MatchForm = memo(({ formData, setFormData, onSubmit, onCancel, editing, submitting, teams, stageGroups, stage }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    {stage?.is_group_stage && stageGroups.length > 0 && (
      <SearchableSelect
        value={formData.group_id || ''}
        onChange={(val) => setFormData({ ...formData, group_id: val })}
        options={stageGroups}
        placeholder="-- Select Group --"
      />
    )}
    <div className="grid grid-cols-2 gap-4">
      <SearchableSelect
        value={formData.home_team_id || ''}
        onChange={(val) => setFormData({ ...formData, home_team_id: val })}
        options={teams}
        placeholder="Home Team"
        required
      />
      <SearchableSelect
        value={formData.away_team_id || ''}
        onChange={(val) => setFormData({ ...formData, away_team_id: val })}
        options={teams}
        placeholder="Away Team"
        required
      />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <input
        type="datetime-local"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
        value={formData.match_date || ''}
        onChange={e => setFormData({ ...formData, match_date: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Venue (e.g., National Heroes Stadium)"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
        value={formData.venue || ''}
        onChange={e => setFormData({ ...formData, venue: e.target.value })}
      />
    </div>
    <label className="flex items-center gap-2 text-sm text-gray-300">
      <input type="checkbox" checked={formData.is_ticketed || false} onChange={e => setFormData({ ...formData, is_ticketed: e.target.checked })} />
      Ticketed (available for purchase)
    </label>
    <div className="flex justify-end gap-3 pt-4">
      <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600">Cancel</button>
      <button type="submit" disabled={submitting} className="px-6 py-2 rounded-lg bg-gradient-to-r from-faz-green to-faz-orange text-white hover:opacity-80">
        {submitting ? 'Saving...' : (editing ? 'Update' : 'Create')}
      </button>
    </div>
  </form>
))

const RuleForm = memo(({ formData, setFormData, onSubmit, onCancel, editing, submitting, stages }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <SearchableSelect
      value={formData.from_stage_id || ''}
      onChange={(val) => setFormData({ ...formData, from_stage_id: val })}
      options={stages}
      placeholder="From Stage"
      required
    />
    <SearchableSelect
      value={formData.to_stage_id || ''}
      onChange={(val) => setFormData({ ...formData, to_stage_id: val })}
      options={stages}
      placeholder="To Stage"
      required
    />
    <SearchableSelect
      value={formData.rank_condition || 'winner'}
      onChange={(val) => setFormData({ ...formData, rank_condition: val })}
      options={[
        { value: 'winner', label: 'Winner' },
        { value: 'runner_up', label: 'Runner-up' },
        { value: 'best_runner_up', label: 'Best Runner-up' },
        { value: 'top_3', label: 'Top 3' },
        { value: 'top_4', label: 'Top 4' }
      ]}
      placeholder="Rank Condition"
    />
    <input
      type="number"
      placeholder="Number of Teams to Qualify (e.g., 1, 2)"
      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
      value={formData.number_of_teams || 1}
      onChange={e => setFormData({ ...formData, number_of_teams: parseInt(e.target.value) || 1 })}
      min="1"
    />
    <div className="flex justify-end gap-3 pt-4">
      <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600">Cancel</button>
      <button type="submit" disabled={submitting} className="px-6 py-2 rounded-lg bg-gradient-to-r from-faz-green to-faz-orange text-white hover:opacity-80">
        {submitting ? 'Saving...' : (editing ? 'Update' : 'Create')}
      </button>
    </div>
  </form>
))

// ---- Group Teams Manager Component ----
const GroupTeamsManager = ({ groupId, competitionTeams, onUpdate }) => {
  const [groupTeams, setGroupTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [adding, setAdding] = useState(false)

  const fetchGroupTeams = useCallback(async () => {
    try {
      const res = await api.get(`/competitions-management/groups/${groupId}/teams`)
      setGroupTeams(res.data)
    } catch (error) {
      toast.error('Failed to load group teams')
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    fetchGroupTeams()
  }, [fetchGroupTeams])

  const addTeam = async () => {
    if (!selectedTeamId) return
    setAdding(true)
    try {
      await api.post(`/competitions-management/groups/${groupId}/teams`, { team_id: selectedTeamId })
      toast.success('Team added to group')
      await fetchGroupTeams()
      setSelectedTeamId('')
      onUpdate?.()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add team')
    } finally {
      setAdding(false)
    }
  }

  const removeTeam = async (teamId) => {
    if (!confirm('Remove this team from the group?')) return
    try {
      await api.delete(`/competitions-management/groups/${groupId}/teams/${teamId}`)
      toast.success('Team removed')
      await fetchGroupTeams()
      onUpdate?.()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to remove team')
    }
  }

  const availableTeams = competitionTeams.filter(
    t => !groupTeams.some(gt => gt.id === t.id)
  )

  if (loading) return <div className="text-sm text-gray-400">Loading teams...</div>

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-[200px]">
          <SearchableSelect
            value={selectedTeamId}
            onChange={setSelectedTeamId}
            options={availableTeams}
            placeholder="Add team..."
          />
        </div>
        <button
          onClick={addTeam}
          disabled={!selectedTeamId || adding}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
        >
          {adding ? 'Adding...' : 'Add'}
        </button>
      </div>
      {groupTeams.length === 0 ? (
        <p className="text-sm text-gray-400">No teams assigned.</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {groupTeams.map(team => (
            <span key={team.id} className="inline-flex items-center gap-1 bg-gray-700 px-2 py-1 rounded text-sm">
              {team.name}
              <button onClick={() => removeTeam(team.id)} className="text-red-400 hover:text-red-300">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ---- Main Component ----
export default function SeasonDetail() {
  const { competitionId, seasonId } = useParams()

  const [season, setSeason] = useState(null)
  const [stages, setStages] = useState([])
  const [groupsByStage, setGroupsByStage] = useState({})
  const [matches, setMatches] = useState([])
  const [standings, setStandings] = useState(null)
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('stages')
  const [selectedStage, setSelectedStage] = useState(null)

  // Modal states
  const [showStageForm, setShowStageForm] = useState(false)
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [showMatchForm, setShowMatchForm] = useState(false)
  const [showRuleForm, setShowRuleForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Teams for the currently-selected group in the Match form
  const [selectedGroupTeams, setSelectedGroupTeams] = useState([])

  // ---------- Load all data ----------
  const fetchAllData = useCallback(async () => {
    try {
      const [seasonRes, stagesRes, matchesRes, standingsRes, teamsRes, groupsRes] = await Promise.all([
        api.get(`/competitions-management/seasons/${seasonId}`),
        api.get(`/competitions-management/seasons/${seasonId}/stages`),
        api.get(`/competitions-management/seasons/${seasonId}/matches`),
        api.get(`/competitions-management/seasons/${seasonId}/standings`),
        api.get(`/competitions-management/teams/${competitionId}?limit=200`),
        api.get(`/competitions-management/seasons/${seasonId}/groups`)
      ])
      setSeason(seasonRes.data)
      setStages(stagesRes.data)
      setMatches(matchesRes.data)
      setStandings(standingsRes.data)
      setTeams(teamsRes.data)
      setGroupsByStage(groupsRes.data || {})
    } catch (error) {
      console.error('Fetch error:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [seasonId, competitionId])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // When the group changes inside the Match form, fetch teams for that group
  useEffect(() => {
    if (showMatchForm && formData.group_id) {
      api.get(`/competitions-management/groups/${formData.group_id}/teams`)
        .then(res => setSelectedGroupTeams(res.data))
        .catch(() => setSelectedGroupTeams([]))
    } else {
      setSelectedGroupTeams([])
    }
  }, [formData.group_id, showMatchForm])

  // ---------- Form resets ----------
  const resetStageForm = () => {
    setFormData({ name: '', stage_order: 0, is_knockout: false, is_group_stage: false })
    setEditing(null)
  }
  const resetGroupForm = () => {
    setFormData({ name: '', group_order: 0 })
    setEditing(null)
  }
  const resetMatchForm = () => {
    setFormData({
      home_team_id: '',
      away_team_id: '',
      match_date: '',
      venue: '',
      group_id: '',
      is_ticketed: false
    })
    setEditing(null)
    setSelectedGroupTeams([])
  }
  const resetRuleForm = () => {
    setFormData({
      from_stage_id: '',
      to_stage_id: '',
      rank_condition: 'winner',
      number_of_teams: 1
    })
    setEditing(null)
  }

  // ---------- Stage CRUD ----------
  const handleStageSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = { ...formData }
      if (editing) {
        await api.put(`/competitions-management/stages/${editing.id}`, payload)
        toast.success('Stage updated')
      } else {
        await api.post(`/competitions-management/seasons/${seasonId}/stages`, payload)
        toast.success('Stage created')
      }
      setShowStageForm(false)
      resetStageForm()
      fetchAllData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteStage = async (stageId) => {
    if (!confirm('Delete this stage and its groups/matches?')) return
    try {
      await api.delete(`/competitions-management/stages/${stageId}`)
      toast.success('Stage deleted')
      fetchAllData()
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const openStageEdit = (stage) => {
    setEditing(stage)
    setFormData({
      name: stage.name,
      stage_order: stage.stage_order || 0,
      is_knockout: stage.is_knockout || false,
      is_group_stage: stage.is_group_stage || false
    })
    setShowStageForm(true)
  }

  // ---------- Group CRUD ----------
  const handleGroupSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = { ...formData }
      if (editing) {
        await api.put(`/competitions-management/groups/${editing.id}`, payload)
        toast.success('Group updated')
      } else {
        await api.post(`/competitions-management/stages/${selectedStage}/groups`, payload)
        toast.success('Group created')
      }
      setShowGroupForm(false)
      resetGroupForm()
      fetchAllData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteGroup = async (groupId) => {
    if (!confirm('Delete this group and its standings/matches?')) return
    try {
      await api.delete(`/competitions-management/groups/${groupId}`)
      toast.success('Group deleted')
      fetchAllData()
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  // ---------- Match CRUD ----------
  const handleMatchSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = { ...formData }
      if (!payload.group_id) delete payload.group_id

      if (editing) {
        const editMatchRes = await api.put(`/competitions-management/matches/${editing.id}`, payload)
        console.log("Edit Match Result = ", editMatchRes);
        toast.success('Match updated')
      } else {
        await api.post(`/competitions-management/stages/${selectedStage}/matches`, payload)
        toast.success('Match created')
      }
      setShowMatchForm(false)
      resetMatchForm()
      fetchAllData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteMatch = async (matchId) => {
    if (!confirm('Delete this match?')) return
    try {
      await api.delete(`/competitions-management/matches/${matchId}`)
      toast.success('Match deleted')
      fetchAllData()
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const openMatchEdit = (match) => {
    setEditing(match)
    setFormData({
      home_team_id: match.home_team_id,
      away_team_id: match.away_team_id,
      match_date: match.match_date?.slice(0, 16) || '',
      venue: match.venue || '',
      group_id: match.group_id || '',
      is_ticketed: match.is_ticketed || false
    })
    setSelectedStage(match.stage_id)
    setShowMatchForm(true)
  }

  const updateMatchScore = async (matchId, home_score, away_score) => {
    try {
      await api.put(`/competitions-management/matches/${matchId}`, {
        home_score,
        away_score,
        status: 'finished'
      })
      toast.success('Score updated & standings recalculated')
      fetchAllData()
    } catch (error) {
      toast.error('Failed to update score')
    }
  }

  // ---------- Qualification Rules ----------
  const handleRuleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editing) {
        await api.put(`/competitions-management/qualification-rules/${editing.id}`, formData)
        toast.success('Rule updated')
      } else {
        await api.post('/competitions-management/qualification-rules', formData)
        toast.success('Rule created')
      }
      setShowRuleForm(false)
      resetRuleForm()
      fetchAllData()
    } catch (error) {
      toast.error('Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteRule = async (ruleId) => {
    if (!confirm('Delete this qualification rule?')) return
    try {
      await api.delete(`/competitions-management/qualification-rules/${ruleId}`)
      toast.success('Rule deleted')
      fetchAllData()
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  // ---------- Render helpers ----------
  const renderStages = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">Stages</h3>
        <button
          onClick={() => { resetStageForm(); setShowStageForm(true) }}
          className="bg-gradient-to-r from-faz-green to-faz-orange text-white px-4 py-2 rounded-lg hover:opacity-80 transition"
        >
          + Add Stage
        </button>
      </div>

      {stages.length === 0 && (
        <GlassCard className="p-6 text-center text-gray-400">No stages yet. Add one to begin.</GlassCard>
      )}

      {stages.map(stage => {
        const stageGroups = groupsByStage[stage.id] || []
        return (
          <GlassCard key={stage.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-white">{stage.name}</h4>
                <div className="flex gap-2 mt-1">
                  <span className={`px-2 py-1 text-xs rounded-full ${stage.is_group_stage ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {stage.is_group_stage ? 'Group Stage' : 'Non-group'}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${stage.is_knockout ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {stage.is_knockout ? 'Knockout' : 'League'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openStageEdit(stage)} className="text-blue-400 hover:underline text-sm">Edit</button>
                <button onClick={() => handleDeleteStage(stage.id)} className="text-red-400 hover:underline text-sm">Delete</button>
              </div>
            </div>

            {stage.is_group_stage && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    setSelectedStage(stage.id)
                    resetGroupForm()
                    setShowGroupForm(true)
                  }}
                  className="text-sm text-green-400 hover:underline"
                >
                  + Add Group
                </button>

                <div className="mt-2 space-y-4">
                  {stageGroups.length === 0 ? (
                    <p className="text-sm text-gray-400">No groups yet.</p>
                  ) : (
                    stageGroups.map(group => (
                      <div key={group.id} className="bg-gray-800/50 px-4 py-2 rounded">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white">{group.name}</span>
                          <div>
                            <button
                              onClick={() => {
                                setEditing(group)
                                setFormData({ name: group.name, group_order: group.group_order || 0 })
                                setSelectedStage(stage.id)
                                setShowGroupForm(true)
                              }}
                              className="text-blue-400 hover:underline mr-3 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteGroup(group.id)}
                              className="text-red-400 hover:underline text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <GroupTeamsManager
                          groupId={group.id}
                          competitionTeams={teams}
                          onUpdate={fetchAllData}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </GlassCard>
        )
      })}
    </div>
  )

  const renderMatches = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">Matches</h3>
        <button
          onClick={() => {
            resetMatchForm()
            setSelectedStage(stages[0]?.id || '')
            setShowMatchForm(true)
          }}
          className="bg-gradient-to-r from-faz-green to-faz-orange text-white px-4 py-2 rounded-lg hover:opacity-80 transition"
        >
          + Add Match
        </button>
      </div>

      {matches.length === 0 ? (
        <GlassCard className="p-6 text-center text-gray-400">No matches yet.</GlassCard>
      ) : (
        matches.map(match => {
          const home = teams.find(t => t.id === match.home_team_id)
          const away = teams.find(t => t.id === match.away_team_id)
          const stage = stages.find(s => s.id === match.stage_id)
          const stageGroups = groupsByStage[match.stage_id] || []
          const group = stageGroups.find(g => g.id === match.group_id)

          return (
            <GlassCard key={match.id} className="p-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{home?.name || 'TBD'}</span>
                    <span className="text-gray-400">vs</span>
                    <span className="font-bold text-white">{away?.name || 'TBD'}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {new Date(match.match_date).toLocaleString()}
                    {match.venue && ` • ${match.venue}`}
                    {stage && ` • ${stage.name}`}
                    {group && ` • ${group.name}`}
                  </div>
                  {match.is_ticketed && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">🎟️ Ticketed</span>}
                </div>
                <div className="flex items-center gap-4">
                  {match.status === 'finished' ? (
                    <div className="text-lg font-bold text-faz-orange">
                      {match.home_score} - {match.away_score}
                    </div>
                  ) : (
                    <button
                      className="bg-white/10 px-3 py-1 rounded hover:bg-white/20 transition"
                      onClick={() => {
                        const homeScore = prompt('Home score:', '0')
                        const awayScore = prompt('Away score:', '0')
                        if (homeScore !== null && awayScore !== null) {
                          updateMatchScore(match.id, parseInt(homeScore), parseInt(awayScore))
                        }
                      }}
                    >
                      Enter Score
                    </button>
                  )}
                  <button onClick={() => openMatchEdit(match)} className="text-blue-400 hover:underline text-sm">Edit</button>
                  <button onClick={() => handleDeleteMatch(match.id)} className="text-red-400 hover:underline text-sm">Delete</button>
                </div>
              </div>
            </GlassCard>
          )
        })
      )}
    </div>
  )

  const renderStandings = () => {
    if (!standings) return <GlassCard className="p-6 text-center text-gray-400">No standings yet.</GlassCard>

    if (typeof standings === 'object' && !Array.isArray(standings)) {
      return (
        <div className="space-y-6">
          {Object.entries(standings).map(([groupName, table]) => (
            <div key={groupName}>
              <h4 className="font-bold text-lg text-white mb-3">{groupName}</h4>
              <GlassCard className="overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead className="border-b border-white/10 bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-white">#</th>
                      <th className="px-4 py-3 text-left text-white">Team</th>
                      <th className="px-4 py-3 text-center text-white">P</th>
                      <th className="px-4 py-3 text-center text-white">W</th>
                      <th className="px-4 py-3 text-center text-white">D</th>
                      <th className="px-4 py-3 text-center text-white">L</th>
                      <th className="px-4 py-3 text-center text-white">GF</th>
                      <th className="px-4 py-3 text-center text-white">GA</th>
                      <th className="px-4 py-3 text-center text-white font-bold">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.map((entry, idx) => {
                      const team = teams.find(t => t.id === entry.team_id)
                      return (
                        <tr key={entry.id} className="border-b border-white/5">
                          <td className="px-4 py-3 text-gray-300">{idx + 1}</td>
                          <td className="px-4 py-3 font-medium text-white">{team?.name || 'Unknown'}</td>
                          <td className="px-4 py-3 text-center text-gray-300">{entry.played}</td>
                          <td className="px-4 py-3 text-center text-gray-300">{entry.won}</td>
                          <td className="px-4 py-3 text-center text-gray-300">{entry.drawn}</td>
                          <td className="px-4 py-3 text-center text-gray-300">{entry.lost}</td>
                          <td className="px-4 py-3 text-center text-gray-300">{entry.goals_for}</td>
                          <td className="px-4 py-3 text-center text-gray-300">{entry.goals_against}</td>
                          <td className="px-4 py-3 text-center font-bold text-faz-orange">{entry.points}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </GlassCard>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div>
        <h4 className="font-bold text-lg text-white mb-3">Overall Standings</h4>
        <GlassCard className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-white">#</th>
                <th className="px-4 py-3 text-left text-white">Team</th>
                <th className="px-4 py-3 text-center text-white">P</th>
                <th className="px-4 py-3 text-center text-white">W</th>
                <th className="px-4 py-3 text-center text-white">D</th>
                <th className="px-4 py-3 text-center text-white">L</th>
                <th className="px-4 py-3 text-center text-white">GF</th>
                <th className="px-4 py-3 text-center text-white">GA</th>
                <th className="px-4 py-3 text-center text-white font-bold">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((entry, idx) => {
                const team = teams.find(t => t.id === entry.team_id)
                return (
                  <tr key={entry.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-gray-300">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-white">{team?.name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-center text-gray-300">{entry.played}</td>
                    <td className="px-4 py-3 text-center text-gray-300">{entry.won}</td>
                    <td className="px-4 py-3 text-center text-gray-300">{entry.drawn}</td>
                    <td className="px-4 py-3 text-center text-gray-300">{entry.lost}</td>
                    <td className="px-4 py-3 text-center text-gray-300">{entry.goals_for}</td>
                    <td className="px-4 py-3 text-center text-gray-300">{entry.goals_against}</td>
                    <td className="px-4 py-3 text-center font-bold text-faz-orange">{entry.points}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </GlassCard>
      </div>
    )
  }

  const renderRules = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">Qualification Rules</h3>
        <button
          onClick={() => { resetRuleForm(); setShowRuleForm(true) }}
          className="bg-gradient-to-r from-faz-green to-faz-orange text-white px-4 py-2 rounded-lg hover:opacity-80 transition"
        >
          + Add Rule
        </button>
      </div>

      {stages.length === 0 ? (
        <GlassCard className="p-6 text-center text-gray-400">Add stages first.</GlassCard>
      ) : (
        stages.map(stage => {
          const rules = stage.qualification_rules_from || []
          return (
            <GlassCard key={stage.id} className="p-4">
              <h4 className="font-bold text-white">{stage.name}</h4>
              {rules.length === 0 ? (
                <p className="text-sm text-gray-400">No rules from this stage.</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {rules.map(rule => {
                    const toStage = stages.find(s => s.id === rule.to_stage_id)
                    return (
                      <li key={rule.id} className="flex justify-between items-center bg-gray-800/50 px-3 py-2 rounded">
                        <span className="text-sm text-gray-300">
                          {rule.rank_condition} → {toStage?.name || 'Unknown'}
                        </span>
                        <button onClick={() => handleDeleteRule(rule.id)} className="text-red-400 hover:underline text-sm">
                          Delete
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </GlassCard>
          )
        })
      )}
    </div>
  )

  // ---- Main render ----
  if (loading) return <div className="flex justify-center py-20"><div className="w-16 h-16 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin" /></div>
  if (!season) return <div className="text-center text-gray-400 pt-24">Season not found</div>

  const currentStage = stages.find(s => s.id === selectedStage)
  const currentStageGroups = currentStage ? (groupsByStage[currentStage.id] || []) : []

  const availableTeams = formData.group_id
    ? selectedGroupTeams
    : teams

  return (
    <div className="pt-24 space-y-6 mx-auto px-6">
      <div className="flex items-center gap-4">
        <Link to={`/admin/competitions/${competitionId}`} className="text-faz-orange hover:text-faz-green">← Back</Link>
        <h1 className="text-2xl font-bold text-white">{season.name}</h1>
        <span className={`px-3 py-1 rounded-full text-sm ${season.is_archived ? 'bg-gray-500/20 text-gray-400' : 'bg-green-500/20 text-green-400'}`}>
          {season.is_archived ? 'Archived' : 'Active'}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {['stages', 'matches', 'standings', 'rules'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium transition ${activeTab === tab ? 'text-faz-orange border-b-2 border-faz-orange' : 'text-gray-400 hover:text-white'}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {activeTab === 'stages' && renderStages()}
        {activeTab === 'matches' && renderMatches()}
        {activeTab === 'standings' && renderStandings()}
        {activeTab === 'rules' && renderRules()}
      </div>

      {/* Modals */}
      <ModalWrapper
        isOpen={showStageForm}
        onClose={() => { setShowStageForm(false); resetStageForm() }}
        title={editing ? 'Edit Stage' : 'Create Stage'}
      >
        <StageForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleStageSubmit}
          onCancel={() => { setShowStageForm(false); resetStageForm() }}
          editing={editing}
          submitting={submitting}
        />
      </ModalWrapper>

      <ModalWrapper
        isOpen={showGroupForm}
        onClose={() => { setShowGroupForm(false); resetGroupForm() }}
        title={editing ? 'Edit Group' : 'Add Group'}
      >
        <GroupForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleGroupSubmit}
          onCancel={() => { setShowGroupForm(false); resetGroupForm() }}
          editing={editing}
          submitting={submitting}
        />
      </ModalWrapper>

      <ModalWrapper
        isOpen={showMatchForm}
        onClose={() => { setShowMatchForm(false); resetMatchForm() }}
        title={editing ? 'Edit Match' : 'Add Match'}
      >
        <MatchForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleMatchSubmit}
          onCancel={() => { setShowMatchForm(false); resetMatchForm() }}
          editing={editing}
          submitting={submitting}
          teams={availableTeams}
          stageGroups={currentStageGroups}
          stage={currentStage}
        />
      </ModalWrapper>

      <ModalWrapper
        isOpen={showRuleForm}
        onClose={() => { setShowRuleForm(false); resetRuleForm() }}
        title={editing ? 'Edit Rule' : 'Add Qualification Rule'}
      >
        <RuleForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleRuleSubmit}
          onCancel={() => { setShowRuleForm(false); resetRuleForm() }}
          editing={editing}
          submitting={submitting}
          stages={stages}
        />
      </ModalWrapper>
    </div>
  )
}