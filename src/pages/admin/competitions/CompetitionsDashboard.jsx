import { useEffect, useState, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import ReactPaginate from 'react-paginate'
import Papa from 'papaparse'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import GlassCard from '../../../components/GlassCard'
import api from '../../../api'
import toast from 'react-hot-toast'
import { FaSearch, FaTable, FaTh, FaFileExcel, FaFilePdf, FaPrint, FaFilter } from 'react-icons/fa'

export default function CompetitionsDashboard() {
  const [competitions, setCompetitions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [participantFilter, setParticipantFilter] = useState('all') // 'all', 'countries', 'clubs'
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'table'
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(5)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    competition_type: 'league',
    gender: 'male',
    age_group: '',
    scope: 'local',
    description: '',
    logo_url: '',
    participant_type: ''  // NEW
  })
  const [submitting, setSubmitting] = useState(false)

  const dataRef = useRef(null) // for print/PDF capture

  useEffect(() => {
    fetchCompetitions()
  }, [])

  const fetchCompetitions = async () => {
    try {
      const res = await api.get('/competitions-management/competitions?active_only=false')
      setCompetitions(res.data)
    } catch (error) {
      toast.error('Failed to load competitions')
    } finally {
      setLoading(false)
    }
  }

  // ---- Filtered data ----
  const filteredData = useMemo(() => {
    let data = competitions
    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      data = data.filter(c =>
        c.name.toLowerCase().includes(term) ||
        (c.description && c.description.toLowerCase().includes(term))
      )
    }
    // Participant type filter
    if (participantFilter !== 'all') {
      data = data.filter(c => c.participant_type === participantFilter)
    }
    return data
  }, [competitions, searchTerm, participantFilter])

  // ---- Pagination ----
  const pageCount = Math.ceil(filteredData.length / pageSize)
  const paginatedData = filteredData.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  )

  const handlePageChange = ({ selected }) => setCurrentPage(selected)

  // ---- Reset page when filters change ----
  useEffect(() => {
    setCurrentPage(0)
  }, [searchTerm, participantFilter, pageSize])

  // ---- Form handlers ----
  const resetForm = () => {
    setFormData({
      name: '',
      competition_type: 'league',
      gender: 'male',
      age_group: '',
      scope: 'local',
      description: '',
      logo_url: '',
      participant_type: ''
    })
    setEditing(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = { ...formData }
      if (!payload.age_group) delete payload.age_group
      if (!payload.participant_type) delete payload.participant_type

      if (editing) {
        await api.put(`/competitions-management/competitions/${editing.id}`, payload)
        toast.success('Competition updated')
      } else {
        await api.post('/competitions-management/competitions', payload)
        toast.success('Competition created')
      }
      setShowForm(false)
      resetForm()
      fetchCompetitions()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this competition?')) return
    try {
      await api.delete(`/competitions-management/competitions/${id}`)
      toast.success('Competition deactivated')
      fetchCompetitions()
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const openEdit = (competition) => {
    setEditing(competition)
    setFormData({
      name: competition.name,
      competition_type: competition.competition_type,
      gender: competition.gender,
      age_group: competition.age_group || '',
      scope: competition.scope || 'local',
      description: competition.description || '',
      logo_url: competition.logo_url || '',
      participant_type: competition.participant_type || ''
    })
    setShowForm(true)
  }

  // ---- Exports ----
  const exportData = filteredData.map((comp, index) => ({
    'S/N': index + 1,
    'Name': comp.name,
    'Type': comp.competition_type,
    'Gender': comp.gender,
    'Age Group': comp.age_group || 'N/A',
    'Scope': comp.scope || 'N/A',
    'Participant Type': comp.participant_type || 'N/A',
    'Status': comp.is_active ? 'Active' : 'Inactive'
  }))

  const handleExportCSV = () => {
    const csv = Papa.unparse(exportData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'competitions.csv'
    link.click()
  }

  const handleExportPDF = async () => {
    if (!dataRef.current) return
    try {
      const canvas = await html2canvas(dataRef.current, { scale: 2 })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('landscape', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save('competitions.pdf')
    } catch (error) {
      toast.error('Failed to generate PDF')
    }
  }

  const handlePrint = () => {
    const printContent = dataRef.current
    if (!printContent) return
    const win = window.open('', '_blank')
    win.document.write(`
      <html>
        <head>
          <title>Competitions</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f2f2f2; }
            .actions { display: none; }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
      </html>
    `)
    win.document.close()
    win.print()
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-16 h-16 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin" /></div>

  return (
    <div className="pt-24 space-y-6 mx-auto px-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Competitions</h1>
          <p className="text-gray-400">Manage leagues, tournaments, and friendly series</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="bg-gradient-to-r from-faz-green to-faz-orange text-white px-4 py-2 rounded-lg hover:opacity-80 transition"
        >
          + New Competition
        </button>
      </div>

      {/* ---- Toolbar: Search, Filters, View Toggle, Exports ---- */}
      <div className="flex flex-wrap items-center gap-4 bg-gray-900/50 p-4 rounded-xl border border-white/10">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-faz-orange"
          />
        </div>

        {/* Participant Type Filter */}
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-400" />
          <select
            value={participantFilter}
            onChange={(e) => setParticipantFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
          >
            <option value="all">All Types</option>
            <option value="countries">Countries</option>
            <option value="clubs">Clubs</option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex border border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-faz-green text-white' : 'bg-gray-800 text-gray-400'}`}
            title="Grid View"
          >
            <FaTh />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-2 ${viewMode === 'table' ? 'bg-faz-green text-white' : 'bg-gray-800 text-gray-400'}`}
            title="Table View"
          >
            <FaTable />
          </button>
        </div>

        {/* Exports */}
        <div className="flex gap-2">
          <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-1">
            <FaPrint /> Print
          </button>
          <button onClick={handleExportCSV} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center gap-1">
            <FaFileExcel /> Excel
          </button>
          <button onClick={handleExportPDF} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center gap-1">
            <FaFilePdf /> PDF
          </button>
        </div>
      </div>

      {/* ---- Data Area (for print/PDF capture) ---- */}
      <div ref={dataRef}>
        {filteredData.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-gray-400">No competitions match your filters.</p>
          </GlassCard>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedData.map((comp, idx) => (
              <GlassCard key={comp.id} className="p-4 hover:scale-105 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-lg">{comp.name}</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400">{comp.competition_type}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${comp.gender === 'male' ? 'bg-green-500/20 text-green-400' : 'bg-pink-500/20 text-pink-400'}`}>{comp.gender}</span>
                      {comp.age_group && <span className="px-2 py-0.5 text-xs rounded-full bg-gray-500/20 text-gray-400">{comp.age_group}</span>}
                      {comp.participant_type && <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400">{comp.participant_type}</span>}
                    </div>
                    <p className="text-sm text-gray-400 mt-2">{comp.scope}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${comp.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {comp.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <Link to={`/admin/competitions/${comp.id}`}>
                    <button className="bg-gradient-to-r from-faz-green to-faz-orange text-white px-3 py-1 rounded-lg text-sm hover:opacity-80">Manage</button>
                  </Link>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(comp)} className="text-blue-400 hover:underline text-sm">✏️</button>
                    <button onClick={() => handleDelete(comp.id)} className="text-red-400 hover:underline text-sm">🗑️</button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-700 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-300">S/N</th>
                  <th className="px-4 py-3 text-left text-gray-300">Name</th>
                  <th className="px-4 py-3 text-left text-gray-300">Type</th>
                  <th className="px-4 py-3 text-left text-gray-300">Gender</th>
                  <th className="px-4 py-3 text-left text-gray-300">Age Group</th>
                  <th className="px-4 py-3 text-left text-gray-300">Scope</th>
                  <th className="px-4 py-3 text-left text-gray-300">Participant</th>
                  <th className="px-4 py-3 text-left text-gray-300">Status</th>
                  <th className="px-4 py-3 text-left text-gray-300 actions">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {paginatedData.map((comp, idx) => (
                  <tr key={comp.id} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-gray-300">{currentPage * pageSize + idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-white">{comp.name}</td>
                    <td className="px-4 py-3 text-gray-300">{comp.competition_type}</td>
                    <td className="px-4 py-3 text-gray-300">{comp.gender}</td>
                    <td className="px-4 py-3 text-gray-300">{comp.age_group || '-'}</td>
                    <td className="px-4 py-3 text-gray-300">{comp.scope || '-'}</td>
                    <td className="px-4 py-3 text-gray-300">{comp.participant_type || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${comp.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {comp.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 actions">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(comp)} className="text-blue-400 hover:underline text-sm">✏️</button>
                        <button onClick={() => handleDelete(comp.id)} className="text-red-400 hover:underline text-sm">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---- Pagination ---- */}
      {filteredData.length > pageSize && (
        <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
          <div className="flex items-center gap-2 text-gray-400">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-white"
            >
              {[5, 10, 20, 50, 100, 500, 1000].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span className="ml-2">
              {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, filteredData.length)} of {filteredData.length}
            </span>
          </div>
          <ReactPaginate
            previousLabel="←"
            nextLabel="→"
            breakLabel="..."
            pageCount={pageCount}
            marginPagesDisplayed={2}
            pageRangeDisplayed={3}
            onPageChange={handlePageChange}
            forcePage={currentPage}
            containerClassName="flex items-center gap-1"
            pageClassName="px-3 py-1 rounded-lg bg-gray-800 text-white hover:bg-gray-700"
            activeClassName="bg-faz-green"
            previousClassName="px-3 py-1 rounded-lg bg-gray-800 text-white hover:bg-gray-700"
            nextClassName="px-3 py-1 rounded-lg bg-gray-800 text-white hover:bg-gray-700"
            disabledClassName="opacity-50 cursor-not-allowed"
          />
        </div>
      )}

      {/* ---- Modal Form (unchanged, just added participant_type) ---- */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-white/10 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">{editing ? 'Edit Competition' : 'Create Competition'}</h2>
              <button onClick={() => { setShowForm(false); resetForm() }} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Competition Name"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  value={formData.competition_type}
                  onChange={e => setFormData({ ...formData, competition_type: e.target.value })}
                  required
                >
                  <option value="league">League</option>
                  <option value="tournament">Tournament</option>
                  <option value="friendly_series">Friendly Series</option>
                </select>
                <select
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Age Group (e.g., senior, u23)"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  value={formData.age_group}
                  onChange={e => setFormData({ ...formData, age_group: e.target.value })}
                />
                <select
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  value={formData.scope}
                  onChange={e => setFormData({ ...formData, scope: e.target.value })}
                  required
                >
                  <option value="local">Local</option>
                  <option value="regional">Regional</option>
                  <option value="continental">Continental</option>
                  <option value="international">International</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  value={formData.participant_type}
                  onChange={e => setFormData({ ...formData, participant_type: e.target.value })}
                >
                  <option value="">Select Participant Type</option>
                  <option value="countries">Countries</option>
                  <option value="clubs">Clubs</option>
                </select>
                {/* empty placeholder for alignment */}
                <div></div>
              </div>
              <textarea
                placeholder="Description"
                rows="3"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
              <input
                type="url"
                placeholder="Logo URL"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                value={formData.logo_url}
                onChange={e => setFormData({ ...formData, logo_url: e.target.value })}
              />
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
    </div>
  )
}