"use client"

import { useState, useEffect } from "react"
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore"
import { db } from "../firebase"
import {
  Plus,
  LogOut,
  Edit,
  Eye,
  EyeOff,
  ExternalLink,
  Save,
  X,
  Pin,
  PinOff,
  Trash2,
  Calendar,
  AlertCircle,
  FileText,
} from "lucide-react"

const AdminPanel = ({ onLogout }) => {
  const [documents, setDocuments] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingDoc, setEditingDoc] = useState(null)
  const [formData, setFormData] = useState({
    title: "",
    assignmentLink: "",
    canvasLink: "",
    category: "Daily Standups",
    visible: true,
    pinned: false,
    dueDate: "",
  })

  const categories = [
    "Daily Standups",
    "Other",
    "Backlog Grooming Meeting",
    "Sprint Planning Meeting",
    "Sprint Review Planning Meeting",
  ]

  // ---------- new date helpers (match TeamView) ----------
  const parseLocalYMD = (str) => {
    if (typeof str !== "string") return null
    const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!m) return null
    const y = Number(m[1])
    const mo = Number(m[2])
    const d = Number(m[3])
    return new Date(y, mo - 1, d)
  }

  const formatDueDate = (dueDateStr) => {
    const dt = parseLocalYMD(dueDateStr)
    if (!dt || isNaN(dt.getTime())) return dueDateStr
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(dt)
  }

  const localTodayYMD = () => {
    const dt = new Date()
    const y = dt.getFullYear()
    const m = String(dt.getMonth() + 1).padStart(2, "0")
    const d = String(dt.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }
  // ------------------------------------------------------

  useEffect(() => {
    const q = query(collection(db, "documents"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setDocuments(docs)
    })

    return () => unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const docData = {
        ...formData,
        createdAt: editingDoc ? editingDoc.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      if (editingDoc) {
        await updateDoc(doc(db, "documents", editingDoc.id), docData)
        setEditingDoc(null)
      } else {
        await addDoc(collection(db, "documents"), docData)
      }

      setFormData({
        title: "",
        assignmentLink: "",
        canvasLink: "",
        category: "Daily Standups",
        visible: true,
        pinned: false,
        dueDate: "",
      })
      setShowForm(false)
    } catch (error) {
      console.error("Error saving document:", error)
      alert("Error saving document. Please try again.")
    }
  }

  const toggleVisibility = async (docId, currentVisibility) => {
    try {
      await updateDoc(doc(db, "documents", docId), {
        visible: !currentVisibility,
        updatedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error toggling visibility:", error)
    }
  }

  const togglePin = async (docId, currentPinned) => {
    try {
      await updateDoc(doc(db, "documents", docId), {
        pinned: !currentPinned,
        updatedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error toggling pin:", error)
    }
  }

  const deleteDocument = async (docId) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      try {
        await deleteDoc(doc(db, "documents", docId))
      } catch (error) {
        console.error("Error deleting document:", error)
        alert("Error deleting document. Please try again.")
      }
    }
  }

  const startEditing = (document) => {
    setEditingDoc(document)
    setFormData({
      title: document.title,
      assignmentLink: document.assignmentLink || "",
      canvasLink: document.canvasLink || "",
      category: document.category,
      visible: document.visible,
      pinned: document.pinned || false,
      dueDate: document.dueDate || "",
    })
    setShowForm(true)
  }

  const cancelEdit = () => {
    setEditingDoc(null)
    setFormData({
      title: "",
      assignmentLink: "",
      canvasLink: "",
      category: "Daily Standups",
      visible: true,
      pinned: false,
      dueDate: "",
    })
    setShowForm(false)
  }

  // Get documents due today (LOCAL yyyy-mm-dd to avoid UTC drift)
  const today = localTodayYMD()
  const dueToday = documents.filter((doc) => doc.dueDate === today)

  // Get pinned documents
  const pinnedDocs = documents.filter((doc) => doc.pinned)

  // Group documents by category
  const groupedDocuments = categories.reduce((acc, category) => {
    acc[category] = documents.filter((doc) => doc.category === category)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-950 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-cyan-500/8 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/4 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <header className="relative bg-gray-950/80 backdrop-blur-sm border-b border-cyan-500/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Admin Panel</h1>
              <p className="text-cyan-300/70 text-sm">Manage team documents and assignments</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowForm(true)}
                className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 px-6 py-2.5 rounded-lg hover:bg-cyan-500/20 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/20 flex items-center gap-2 transition-all duration-300 backdrop-blur-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Add Document</span>
              </button>
              <button
                onClick={onLogout}
                className="bg-red-500/10 border border-red-500/30 text-red-300 px-6 py-2.5 rounded-lg hover:bg-red-500/20 hover:border-red-400/50 hover:shadow-lg hover:shadow-red-500/20 flex items-center gap-2 transition-all duration-300 backdrop-blur-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {dueToday.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <h2 className="text-xl font-semibold text-white">Due Today</h2>
              </div>
              <span className="bg-red-500/15 border border-red-500/30 text-red-300 px-3 py-1 rounded-full text-sm font-medium">
                {dueToday.length}
              </span>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {dueToday.map((doc) => (
                <div
                  key={doc.id}
                  className="group bg-gradient-to-br from-red-900/20 to-gray-800/60 border border-red-500/30 p-6 rounded-2xl backdrop-blur-sm hover:from-red-800/30 hover:to-gray-700/70 hover:border-red-400/50 hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="mb-4">
                    <h3 className="font-semibold text-white text-lg leading-tight text-balance group-hover:text-red-50 transition-colors duration-200 break-words">
                      {doc.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-3 mb-6">
                    {doc.assignmentLink && (
                      <a
                        href={doc.assignmentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/20 hover:border-cyan-400/50 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md hover:shadow-cyan-500/20"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Document</span>
                      </a>
                    )}
                    {doc.canvasLink && (
                      <a
                        href={doc.canvasLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 text-green-300 hover:text-green-200 hover:bg-green-500/20 hover:border-green-400/50 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md hover:shadow-green-500/20"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Canvas</span>
                      </a>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-700/50 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span
                        className={`px-3 py-1.5 rounded-lg border font-medium text-sm w-fit ${doc.visible ? "bg-green-500/15 border-green-500/30 text-green-400" : "bg-red-500/15 border-red-500/30 text-red-400"}`}
                      >
                        {doc.visible ? "Visible" : "Hidden"}
                      </span>
                      {doc.dueDate && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-md w-fit">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                          <span className="text-cyan-300 font-medium text-xs whitespace-nowrap">
                            Due {formatDueDate(doc.dueDate)}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 font-medium">
                      Created {new Date(doc.createdAt).toLocaleDateString()}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-700/30">
                      <span className="text-xs text-gray-500 font-medium">Actions</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleVisibility(doc.id, doc.visible)}
                          className={`p-2 rounded-lg border transition-all duration-200 hover:scale-105 ${doc.visible ? "bg-green-500/15 border-green-500/30 text-green-400 hover:bg-green-500/25 hover:shadow-md hover:shadow-green-500/20" : "bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25 hover:shadow-md hover:shadow-red-500/20"}`}
                          title={doc.visible ? "Hide from team" : "Show to team"}
                        >
                          {doc.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => togglePin(doc.id, doc.pinned)}
                          className="p-2 bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 rounded-lg hover:bg-yellow-500/25 hover:scale-105 hover:shadow-md hover:shadow-yellow-500/20 transition-all duration-200"
                          title="Pin document"
                        >
                          {doc.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => startEditing(doc)}
                          className="p-2 bg-blue-500/15 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/25 hover:scale-105 hover:shadow-md hover:shadow-blue-500/20 transition-all duration-200"
                          title="Edit document"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteDocument(doc.id)}
                          className="p-2 bg-red-500/15 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/25 hover:scale-105 hover:shadow-md hover:shadow-red-500/20 transition-all duration-200"
                          title="Delete document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {pinnedDocs.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                <Pin className="w-5 h-5 text-yellow-400" />
                <h2 className="text-xl font-semibold text-white">Pinned Documents</h2>
              </div>
              <span className="bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 px-3 py-1 rounded-full text-sm font-medium">
                {pinnedDocs.length}
              </span>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pinnedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="group bg-gradient-to-br from-yellow-900/20 to-gray-800/60 border border-yellow-500/30 p-6 rounded-2xl relative backdrop-blur-sm hover:from-yellow-800/30 hover:to-gray-700/70 hover:border-yellow-400/50 hover:shadow-xl hover:shadow-yellow-500/10 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="mb-4">
                    <h3 className="font-semibold text-white text-lg leading-tight text-balance group-hover:text-yellow-50 transition-colors duration-200 break-words">
                      {doc.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-3 mb-6">
                    {doc.assignmentLink && (
                      <a
                        href={doc.assignmentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/20 hover:border-cyan-400/50 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md hover:shadow-cyan-500/20"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Document</span>
                      </a>
                    )}
                    {doc.canvasLink && (
                      <a
                        href={doc.canvasLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 text-green-300 hover:text-green-200 hover:bg-green-500/20 hover:border-green-400/50 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md hover:shadow-green-500/20"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Canvas</span>
                      </a>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-700/50 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span
                        className={`px-3 py-1.5 rounded-lg border font-medium text-sm w-fit ${doc.visible ? "bg-green-500/15 border-green-500/30 text-green-400" : "bg-red-500/15 border-red-500/30 text-red-400"}`}
                      >
                        {doc.visible ? "Visible" : "Hidden"}
                      </span>
                      {doc.dueDate && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-md w-fit">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                          <span className="text-cyan-300 font-medium text-xs whitespace-nowrap">
                            Due {formatDueDate(doc.dueDate)}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 font-medium">
                      Created {new Date(doc.createdAt).toLocaleDateString()}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-700/30">
                      <span className="text-xs text-gray-500 font-medium">Actions</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleVisibility(doc.id, doc.visible)}
                          className={`p-2 rounded-lg border transition-all duration-200 hover:scale-105 ${doc.visible ? "bg-green-500/15 border-green-500/30 text-green-400 hover:bg-green-500/25 hover:shadow-md hover:shadow-green-500/20" : "bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25 hover:shadow-md hover:shadow-red-500/20"}`}
                          title={doc.visible ? "Hide from team" : "Show to team"}
                        >
                          {doc.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => togglePin(doc.id, doc.pinned)}
                          className={`p-2 rounded-lg border transition-all duration-200 hover:scale-105 ${doc.pinned ? "bg-yellow-500/15 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/25 hover:shadow-md hover:shadow-yellow-500/20" : "bg-gray-600/15 border-gray-500/30 text-gray-400 hover:bg-gray-500/25 hover:shadow-md hover:shadow-gray-500/20"}`}
                          title={doc.pinned ? "Unpin document" : "Pin document"}
                        >
                          {doc.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => startEditing(doc)}
                          className="p-2 bg-blue-500/15 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/25 hover:scale-105 hover:shadow-md hover:shadow-blue-500/20 transition-all duration-200"
                          title="Edit document"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteDocument(doc.id)}
                          className="p-2 bg-red-500/15 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/25 hover:scale-105 hover:shadow-md hover:shadow-red-500/20 transition-all duration-200"
                          title="Delete document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800/95 backdrop-blur-md border border-cyan-500/20 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl shadow-cyan-500/10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">{editingDoc ? "Edit Document" : "Add New Document"}</h2>
                <button
                  onClick={cancelEdit}
                  className="text-gray-400 hover:text-white transition-colors duration-200 p-2 hover:bg-gray-700/50 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-cyan-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 backdrop-blur-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-2">Assignment Document Link</label>
                  <input
                    type="url"
                    value={formData.assignmentLink}
                    onChange={(e) => setFormData({ ...formData, assignmentLink: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-cyan-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 backdrop-blur-sm"
                    placeholder="https://docs.google.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-2">Canvas Link</label>
                  <input
                    type="url"
                    value={formData.canvasLink}
                    onChange={(e) => setFormData({ ...formData, canvasLink: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-cyan-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 backdrop-blur-sm"
                    placeholder="https://canvas.fiu.edu/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-cyan-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 backdrop-blur-sm"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category} className="bg-gray-700 text-white">
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-2">Due Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-cyan-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 backdrop-blur-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="visible"
                      checked={formData.visible}
                      onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                      className="w-4 h-4 text-cyan-400 bg-gray-700 border-cyan-500/30 rounded focus:ring-cyan-400 focus:ring-2 mr-3"
                    />
                    <label htmlFor="visible" className="text-sm text-cyan-300 font-medium">
                      Visible to team
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="pinned"
                      checked={formData.pinned}
                      onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                      className="w-4 h-4 text-cyan-400 bg-gray-700 border-cyan-500/30 rounded focus:ring-cyan-400 focus:ring-2 mr-3"
                    />
                    <label htmlFor="pinned" className="text-sm text-cyan-300 font-medium">
                      Pin document
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 py-3 rounded-lg hover:bg-cyan-500/25 hover:border-cyan-400/50 flex items-center justify-center gap-2 transition-all duration-300 backdrop-blur-sm font-medium"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingDoc ? "Update" : "Save"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 bg-gray-600/15 border border-gray-500/30 text-gray-300 py-3 rounded-lg hover:bg-gray-500/25 hover:border-gray-400/50 transition-all duration-300 backdrop-blur-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {categories.map((category) => (
          <section key={category} className="mb-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold text-white">{category}</h2>
              <span className="bg-gray-700/40 border border-cyan-500/20 text-cyan-300 px-4 py-2 rounded-full text-sm font-medium">
                {groupedDocuments[category]?.length || 0} documents
              </span>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {groupedDocuments[category]?.length > 0 ? (
                groupedDocuments[category].map((doc) => (
                  <div
                    key={doc.id}
                    className="group bg-gradient-to-br from-gray-900/70 to-gray-800/50 border border-cyan-500/20 p-6 rounded-2xl hover:from-gray-800/80 hover:to-gray-700/60 hover:border-cyan-400/40 relative backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1"
                  >
                    <div className="mb-4">
                      <h3 className="font-semibold text-white text-lg leading-tight text-balance group-hover:text-cyan-50 transition-colors duration-200 break-words">
                        {doc.title}
                      </h3>
                    </div>

                    <div className="flex flex-wrap gap-3 mb-6">
                      {doc.assignmentLink && (
                        <a
                          href={doc.assignmentLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/20 hover:border-cyan-400/50 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md hover:shadow-cyan-500/20"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Document</span>
                        </a>
                      )}
                      {doc.canvasLink && (
                        <a
                          href={doc.canvasLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 text-green-300 hover:text-green-200 hover:bg-green-500/20 hover:border-green-400/50 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md hover:shadow-green-500/20"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Canvas</span>
                        </a>
                      )}
                    </div>

                    <div className="pt-4 border-t border-gray-700/50 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span
                          className={`px-3 py-1.5 rounded-lg border font-medium text-sm w-fit ${doc.visible ? "bg-green-500/15 border-green-500/30 text-green-400" : "bg-red-500/15 border-red-500/30 text-red-400"}`}
                        >
                          {doc.visible ? "Visible" : "Hidden"}
                        </span>
                        {doc.dueDate && (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-md w-fit">
                            <Calendar className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                            <span className="text-cyan-300 font-medium text-xs whitespace-nowrap">
                              Due {formatDueDate(doc.dueDate)}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 font-medium">
                        Created {new Date(doc.createdAt).toLocaleDateString()}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-700/30">
                        <span className="text-xs text-gray-500 font-medium">Actions</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleVisibility(doc.id, doc.visible)}
                            className={`p-2 rounded-lg border transition-all duration-200 hover:scale-105 ${doc.visible ? "bg-green-500/15 border-green-500/30 text-green-400 hover:bg-green-500/25 hover:shadow-md hover:shadow-green-500/20" : "bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25 hover:shadow-md hover:shadow-red-500/20"}`}
                            title={doc.visible ? "Hide from team" : "Show to team"}
                          >
                            {doc.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => togglePin(doc.id, doc.pinned)}
                            className={`p-2 rounded-lg border transition-all duration-200 hover:scale-105 ${doc.pinned ? "bg-yellow-500/15 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/25 hover:shadow-md hover:shadow-yellow-500/20" : "bg-gray-600/15 border-gray-500/30 text-gray-400 hover:bg-gray-500/25 hover:shadow-md hover:shadow-gray-500/20"}`}
                            title={doc.pinned ? "Unpin document" : "Pin document"}
                          >
                            {doc.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => startEditing(doc)}
                            className="p-2 bg-blue-500/15 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/25 hover:scale-105 hover:shadow-md hover:shadow-blue-500/20 transition-all duration-200"
                            title="Edit document"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteDocument(doc.id)}
                            className="p-2 bg-red-500/15 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/25 hover:scale-105 hover:shadow-md hover:shadow-red-500/20 transition-all duration-200"
                            title="Delete document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-16 text-gray-400">
                  <div className="mx-auto w-16 h-16 bg-gray-800/60 rounded-2xl flex items-center justify-center mb-4 border border-gray-700/30">
                    <FileText className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-lg font-medium">No documents in this category yet.</p>
                </div>
              )}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}

export default AdminPanel
