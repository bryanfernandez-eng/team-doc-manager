"use client"

import { useState, useEffect } from "react"
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore"
import { db } from "../firebase"
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  User,
  Tag,
  Calendar,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  EyeOff,
  Users,
  CheckCircle2,
  Clock,
  PlayCircle,
  PauseCircle,
  Archive,
  FileText,
  UserPlus,
  Trash,
} from "lucide-react"

const COLUMNS = [
  { id: "backlog", title: "Backlog", icon: Archive, color: "gray" },
  { id: "todo", title: "To Do", icon: PauseCircle, color: "blue" },
  { id: "inprogress", title: "In Progress", icon: PlayCircle, color: "yellow" },
  { id: "inreview", title: "In Review", icon: Clock, color: "purple" },
  { id: "done", title: "Done", icon: CheckCircle2, color: "green" },
]

const PRIORITIES = [
  { value: "low", label: "Low", color: "text-green-400 bg-green-500/15 border-green-500/30" },
  { value: "medium", label: "Medium", color: "text-yellow-400 bg-yellow-500/15 border-yellow-500/30" },
  { value: "high", label: "High", color: "text-orange-400 bg-orange-500/15 border-orange-500/30" },
  { value: "critical", label: "Critical", color: "text-red-400 bg-red-500/15 border-red-500/30" },
]

const TEAM_MEMBERS = [
  "George Ulloa",
  "Juan Lao", 
  "Shamar Weekes",
  "Abhiram Bhog",
  "Bryan Fernandez"
]

const Board = ({ isAdmin, onBack }) => {
  const [tickets, setTickets] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingTicket, setEditingTicket] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("All")
  const [assigneeFilter, setAssigneeFilter] = useState("All")
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignee: "",
    tags: "",
    priority: "medium",
    status: "backlog",
    visible: true,
  })

  useEffect(() => {
    const q = query(collection(db, "tickets"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketList = snapshot.docs.map((snap) => ({
        id: snap.id,
        ...snap.data(),
      }))
      setTickets(ticketList)
    })
    return () => unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const ticketData = {
        ...formData,
        tags: typeof formData.tags === "string" 
          ? formData.tags.split(",").map(t => t.trim()).filter(Boolean)
          : Array.isArray(formData.tags) ? formData.tags : [],
        createdAt: editingTicket ? editingTicket.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Add flags for team-created tickets
        createdByTeam: !isAdmin, // Set to true if created by team member
        deletedByTeam: false, // Initialize as false
      }

      if (editingTicket) {
        await updateDoc(doc(db, "tickets", editingTicket.id), ticketData)
        setEditingTicket(null)
      } else {
        await addDoc(collection(db, "tickets"), ticketData)
      }

      setFormData({
        title: "",
        description: "",
        assignee: "",
        tags: "",
        priority: "medium",
        status: "backlog",
        visible: true,
      })
      setShowForm(false)
    } catch (error) {
      console.error("Error saving ticket:", error)
      alert("Error saving ticket. Please try again.")
    }
  }

  const deleteTicket = async (ticketId) => {
    if (isAdmin) {
      // Admin can actually delete tickets
      if (window.confirm("Are you sure you want to permanently delete this ticket?")) {
        try {
          await deleteDoc(doc(db, "tickets", ticketId))
        } catch (error) {
          console.error("Error deleting ticket:", error)
          alert("Error deleting ticket. Please try again.")
        }
      }
    } else {
      // Team members can only "soft delete" (hide from their view)
      if (window.confirm("Are you sure you want to remove this ticket?")) {
        try {
          await updateDoc(doc(db, "tickets", ticketId), {
            deletedByTeam: true,
            updatedAt: new Date().toISOString(),
          })
        } catch (error) {
          console.error("Error hiding ticket:", error)
          alert("Error removing ticket. Please try again.")
        }
      }
    }
  }

  const restoreTicket = async (ticketId) => {
    try {
      await updateDoc(doc(db, "tickets", ticketId), {
        deletedByTeam: false,
        updatedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error restoring ticket:", error)
    }
  }

  const startEditing = (ticket) => {
    setEditingTicket(ticket)
    setFormData({
      title: ticket.title || "",
      description: ticket.description || "",
      assignee: ticket.assignee || "",
      tags: Array.isArray(ticket.tags) ? ticket.tags.join(", ") : ticket.tags || "",
      priority: ticket.priority || "medium",
      status: ticket.status || "backlog",
      visible: ticket.visible ?? true,
    })
    setShowForm(true)
  }

  const moveTicket = async (ticketId, newStatus) => {
    try {
      await updateDoc(doc(db, "tickets", ticketId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error moving ticket:", error)
    }
  }

  const toggleVisibility = async (ticketId, currentVisibility) => {
    try {
      await updateDoc(doc(db, "tickets", ticketId), {
        visible: !currentVisibility,
        updatedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error toggling visibility:", error)
    }
  }

  const cancelEdit = () => {
    setEditingTicket(null)
    setFormData({
      title: "",
      description: "",
      assignee: "",
      tags: "",
      priority: "medium",
      status: "backlog",
      visible: true,
    })
    setShowForm(false)
  }

  const filteredTickets = tickets.filter(ticket => {
    // Hide tickets deleted by team from team view, but show all to admin
    if (!isAdmin && ticket.deletedByTeam) return false
    
    if (!isAdmin && !ticket.visible) return false
    
    const matchesSearch = searchQuery.trim() === "" || 
      [ticket.title, ticket.description, ticket.assignee, ...(ticket.tags || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    
    const matchesPriority = priorityFilter === "All" || ticket.priority === priorityFilter
    const matchesAssignee = assigneeFilter === "All" || ticket.assignee === assigneeFilter
    
    return matchesSearch && matchesPriority && matchesAssignee
  })

  const getTicketsByStatus = (status) => {
    return filteredTickets.filter(ticket => ticket.status === status)
  }

  const getPriorityStyle = (priority) => {
    const p = PRIORITIES.find(p => p.value === priority)
    return p ? p.color : PRIORITIES[1].color
  }

  const TicketCard = ({ ticket }) => {
    const IconComponent = COLUMNS.find(col => col.id === ticket.status)?.icon || Archive
    
    return (
      <div className={`bg-gray-900/60 border rounded-xl p-4 hover:border-cyan-400/40 transition-all duration-200 group backdrop-blur-sm ${
        ticket.deletedByTeam ? 'border-red-500/40 bg-red-900/20' : 'border-cyan-500/20'
      }`}>
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-semibold text-white text-sm leading-tight break-words flex-1 group-hover:text-cyan-50 transition-colors">
            {ticket.title}
          </h4>
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {/* Admin-only flags */}
            {isAdmin && (
              <div className="flex gap-1 items-center">
                {ticket.createdByTeam && (
                  <div 
                    className="p-1 rounded bg-blue-500/20 border border-blue-500/30" 
                    title="Created by team member"
                  >
                    <UserPlus className="w-3 h-3 text-blue-400" />
                  </div>
                )}
                {ticket.deletedByTeam && (
                  <div 
                    className="p-1 rounded bg-orange-500/20 border border-orange-500/30" 
                    title="Marked for deletion by team"
                  >
                    <Trash className="w-3 h-3 text-orange-400" />
                  </div>
                )}
              </div>
            )}
            
            {isAdmin && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {ticket.deletedByTeam && (
                  <button
                    onClick={() => restoreTicket(ticket.id)}
                    className="p-1 rounded text-green-400 hover:bg-green-500/20 transition-colors"
                    title="Restore ticket"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => toggleVisibility(ticket.id, ticket.visible)}
                  className={`p-1 rounded text-xs transition-colors ${
                    ticket.visible 
                      ? 'text-green-400 hover:bg-green-500/20' 
                      : 'text-red-400 hover:bg-red-500/20'
                  }`}
                  title={ticket.visible ? 'Hide from team' : 'Show to team'}
                >
                  {ticket.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => startEditing(ticket)}
                  className="p-1 rounded text-blue-400 hover:bg-blue-500/20 transition-colors"
                  title="Edit ticket"
                >
                  <Edit className="w-3 h-3" />
                </button>
                <button
                  onClick={() => deleteTicket(ticket.id)}
                  className="p-1 rounded text-red-400 hover:bg-red-500/20 transition-colors"
                  title="Delete ticket permanently"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
            
            {/* Team members can only edit their own tickets and soft-delete */}
            {!isAdmin && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEditing(ticket)}
                  className="p-1 rounded text-blue-400 hover:bg-blue-500/20 transition-colors"
                  title="Edit ticket"
                >
                  <Edit className="w-3 h-3" />
                </button>
                <button
                  onClick={() => deleteTicket(ticket.id)}
                  className="p-1 rounded text-red-400 hover:bg-red-500/20 transition-colors"
                  title="Remove ticket (hide from your view)"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {ticket.description && (
          <p className="text-gray-300 text-xs mb-3 line-clamp-2">{ticket.description}</p>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityStyle(ticket.priority)}`}>
                {PRIORITIES.find(p => p.value === ticket.priority)?.label || ticket.priority}
              </span>
              {!isAdmin && !ticket.visible && (
                <span className="px-2 py-0.5 rounded text-xs font-medium border bg-red-500/15 border-red-500/30 text-red-400">
                  Hidden
                </span>
              )}
              {isAdmin && ticket.deletedByTeam && (
                <span className="px-2 py-0.5 rounded text-xs font-medium border bg-orange-500/15 border-orange-500/30 text-orange-400">
                  Team Deleted
                </span>
              )}
            </div>
          </div>

          {ticket.assignee && (
            <div className="flex items-center gap-2">
              <User className="w-3 h-3 text-gray-400" />
              <span className="text-gray-300 text-xs">{ticket.assignee}</span>
            </div>
          )}

          {ticket.tags && ticket.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {ticket.tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="px-1.5 py-0.5 bg-white/5 border border-white/10 text-white/70 text-xs rounded">
                  #{tag}
                </span>
              ))}
              {ticket.tags.length > 3 && (
                <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 text-white/70 text-xs rounded">
                  +{ticket.tags.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="pt-2 border-t border-gray-700/30">
            <select
              value={ticket.status}
              onChange={(e) => moveTicket(ticket.id, e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-600/50 text-white text-xs rounded p-1 focus:outline-none focus:border-cyan-400/50"
              title={!isAdmin && ticket.status === 'done' ? 'Only admin can mark as Done' : 'Move ticket'}
            >
              {COLUMNS.map(col => {
                // Team members can't move TO "done", but can see it if already there
                const canSelect = isAdmin || col.id !== 'done';
                const isCurrentStatus = ticket.status === col.id;
                
                return (
                  <option 
                    key={col.id} 
                    value={col.id} 
                    className="bg-gray-800"
                    disabled={!canSelect && !isCurrentStatus}
                  >
                    {col.title} {!isAdmin && col.id === 'done' ? '(Admin Only)' : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 relative overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-cyan-500/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/4 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-950/85 backdrop-blur-md border-b border-white/10">
        <div className="h-[2px] bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 opacity-60" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="text-cyan-300 hover:text-white transition-colors"
                title="Back to documents"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <Users className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white">Ticket Board</h1>
                  <p className="text-cyan-300/70 text-sm">Kanban workflow management</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 items-center flex-wrap">
              {/* Both admin and team can create tickets now */}
              <button
                onClick={() => setShowForm(true)}
                className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 px-4 py-2 rounded-lg hover:bg-cyan-500/20 hover:border-cyan-400/50 flex items-center gap-2 transition-all duration-300"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Ticket</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 bg-gray-900/70 border border-white/10 rounded-lg px-3 py-2 min-w-0 flex-1 sm:flex-none sm:w-64">
              <Search className="w-4 h-4 text-cyan-300/70 flex-shrink-0" />
              <input
                className="bg-transparent text-sm text-white placeholder:text-gray-400 focus:outline-none w-full"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 bg-gray-900/70 border border-white/10 rounded-lg px-3 py-2">
              <Filter className="w-4 h-4 text-cyan-300/70" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-transparent text-sm text-white focus:outline-none"
              >
                <option className="bg-gray-800" value="All">All Priorities</option>
                {PRIORITIES.map(p => (
                  <option className="bg-gray-800" key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-gray-900/70 border border-white/10 rounded-lg px-3 py-2">
              <User className="w-4 h-4 text-cyan-300/70" />
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="bg-transparent text-sm text-white focus:outline-none"
              >
                <option className="bg-gray-800" value="All">All Assignees</option>
                {TEAM_MEMBERS.map(member => (
                  <option className="bg-gray-800" key={member} value={member}>
                    {member}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Board */}
      <main className="relative max-w-7xl mx-auto py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-1 lg:gap-2">
          {COLUMNS.map(column => {
            const columnTickets = getTicketsByStatus(column.id)
            const IconComponent = column.icon
            
            return (
              <div key={column.id} className="bg-white/[0.02] border border-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <IconComponent className={`w-4 h-4 text-${column.color}-400`} />
                    <h3 className="font-semibold text-white text-sm">{column.title}</h3>
                  </div>
                  <span className="bg-white/5 border border-white/10 text-cyan-300 px-2 py-0.5 rounded-full text-xs font-medium">
                    {columnTickets.length}
                  </span>
                </div>
                
                <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {columnTickets.length > 0 ? (
                    columnTickets.map(ticket => (
                      <TicketCard key={ticket.id} ticket={ticket} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <IconComponent className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No tickets</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800/95 backdrop-blur-md border border-cyan-500/20 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-cyan-500/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingTicket ? "Edit Ticket" : "Create New Ticket"}
              </h2>
              <button
                onClick={cancelEdit}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-cyan-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20"
                  required
                  placeholder="Enter ticket title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-cyan-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20 resize-none"
                  rows="3"
                  placeholder="Describe the ticket requirements..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-2">Assignee</label>
                  <select
                    value={formData.assignee}
                    onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-700/50 border border-cyan-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-400/50"
                  >
                    <option value="" className="bg-gray-700">Unassigned</option>
                    {TEAM_MEMBERS.map(member => (
                      <option key={member} value={member} className="bg-gray-700">
                        {member}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-700/50 border border-cyan-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-400/50"
                  >
                    {PRIORITIES.map(p => (
                      <option key={p.value} value={p.value} className="bg-gray-700">
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-700/50 border border-cyan-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-400/50"
                  >
                    {COLUMNS.map(col => (
                      <option key={col.id} value={col.id} className="bg-gray-700">
                        {col.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-700/50 border border-cyan-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400/50"
                  placeholder="frontend, api, urgent"
                />
              </div>

              {isAdmin && (
                <label className="inline-flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.visible}
                    onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                    className="w-4 h-4 text-cyan-400 bg-gray-700 border-cyan-500/30 rounded focus:ring-cyan-400"
                  />
                  <span className="text-sm text-cyan-300 font-medium">Visible to team</span>
                </label>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 py-3 rounded-lg hover:bg-cyan-500/25 hover:border-cyan-400/50 flex items-center justify-center gap-2 transition-all duration-300 font-medium"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingTicket ? "Update" : "Create"} Ticket</span>
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 bg-gray-600/15 border border-gray-500/30 text-gray-300 py-3 rounded-lg hover:bg-gray-500/25 hover:border-gray-400/50 transition-all duration-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Board