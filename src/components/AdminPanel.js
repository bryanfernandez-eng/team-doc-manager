"use client"

import { useState, useEffect, useMemo } from "react"
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore"
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
  Filter,
  Search,
  Tags as TagsIcon,
  CheckCircle2,
  CircleDashed,
  Link as LinkIcon,
  ListChecks,
  ChevronRight,
  ChevronDown,
  Shield,
} from "lucide-react"

const STATUSES = ["In progress", "Done / Ready to submit"]

// Collapsible section header
const SectionHeader = ({ title, count, icon = null, open, onToggle, subtle = false }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`w-full flex items-center justify-between rounded-xl border px-4 sm:px-5 py-3 sm:py-3.5 transition-all
      ${subtle ? "bg-white/[0.03] border-white/10 hover:bg-white/[0.06]" : "bg-gray-900/50 border-cyan-500/20 hover:border-cyan-400/40"}
      text-left`}
    aria-expanded={open}
  >
    <div className="flex items-center gap-3 min-w-0">
      <div className="p-2 rounded-lg bg-white/[0.04] border border-white/10">
        {open ? <ChevronDown className="w-4 h-4 text-cyan-300" /> : <ChevronRight className="w-4 h-4 text-cyan-300" />}
      </div>
      {icon}
      <span className="font-semibold truncate text-white">{title}</span>
      {typeof count === "number" && (
        <span className="ml-2 hidden sm:inline bg-white/5 border border-white/10 text-cyan-300 px-2.5 py-0.5 rounded-full text-xs font-medium">
          {count}
        </span>
      )}
    </div>
    {typeof count === "number" && (
      <span className="sm:hidden bg-white/5 border border-white/10 text-cyan-300 px-2.5 py-0.5 rounded-full text-xs font-medium">
        {count}
      </span>
    )}
  </button>
)

const Collapsible = ({ open, children }) => (
  <div
    className={`overflow-hidden transition-[grid-template-rows,opacity,margin] duration-300 ease-out grid ${
      open ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0 mt-0"
    }`}
  >
    <div className="min-h-0">{children}</div>
  </div>
)

const AdminPanel = ({ onLogout }) => {
  const [documents, setDocuments] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingDoc, setEditingDoc] = useState(null)
  const [queryText, setQueryText] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  // Useful Links (global)
  const [links, setLinks] = useState([{ label: "GitHub Repo", url: "" }])
  const [showLinksModal, setShowLinksModal] = useState(false)

  // Collapsibles (default collapsed)
  const [openSections, setOpenSections] = useState({
    usefulLinks: false,
    dueToday: false,
    overdue: false,
    pinned: false,
  })

  const [formData, setFormData] = useState({
    title: "",
    assignmentLink: "",
    canvasLink: "",
    category: "Daily Standups",
    visible: true,
    pinned: false,
    dueDate: "",
    status: "In progress",
    tags: "",
  })

  const categories = [
    "Daily Standups",
    "Other",
    "Backlog Grooming Meeting",
    "Sprint Planning Meeting",
    "Sprint Review Planning Meeting",
  ]

  useEffect(() => {
    setOpenSections((prev) => {
      const next = { ...prev }
      categories.forEach((c) => {
        if (typeof next[`cat:${c}`] === "undefined") next[`cat:${c}`] = false
      })
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleSection = (key) => setOpenSections((s) => ({ ...s, [key]: !s[key] }))

  // ---------- date helpers ----------
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
  // ----------------------------------

  useEffect(() => {
    const q = query(collection(db, "documents"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((snap) => {
        const data = snap.data()
        const normalizedStatus =
          data.status === "Done / Ready to submit" ? "Done / Ready to submit" : "In progress"
        return { id: snap.id, ...data, status: normalizedStatus }
      })
      setDocuments(docs)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "globals"),
      (snap) => {
        const data = snap.data()
        if (data?.links && Array.isArray(data.links) && data.links.length > 0) {
          setLinks(data.links)
        } else {
          setLinks([{ label: "GitHub Repo", url: "" }])
        }
      },
      () => setLinks([{ label: "GitHub Repo", url: "" }])
    )
    return () => unsub()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const docData = {
        ...formData,
        tags:
          typeof formData.tags === "string"
            ? formData.tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            : Array.isArray(formData.tags)
            ? formData.tags
            : [],
        createdAt: editingDoc ? editingDoc.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status:
          formData.status === "Done / Ready to submit" ? "Done / Ready to submit" : "In progress",
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
        status: "In progress",
        tags: "",
      })
      setShowForm(false)
    } catch (error) {
      console.error("Error saving document:", error)
      alert("Error saving document. Please try again.")
    }
  }

  const saveLinks = async () => {
    const cleaned = links
      .map((l) => ({ label: (l.label || "").trim(), url: (l.url || "").trim() }))
      .filter((l) => l.label && l.url)
    try {
      await setDoc(
        doc(db, "settings", "globals"),
        { links: cleaned, updatedAt: new Date().toISOString() },
        { merge: true }
      )
      setShowLinksModal(false)
    } catch (e) {
      console.error("Error saving links", e)
      alert("Could not save links. Please try again.")
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

  const toggleStatus = async (d) => {
    const next = d.status === "In progress" ? "Done / Ready to submit" : "In progress"
    try {
      await updateDoc(doc(db, "documents", d.id), {
        status: next,
        updatedAt: new Date().toISOString(),
      })
    } catch (e) {
      console.error("Error updating status", e)
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
      title: document.title || "",
      assignmentLink: document.assignmentLink || "",
      canvasLink: document.canvasLink || "",
      category: document.category || "Daily Standups",
      visible: document.visible ?? true,
      pinned: document.pinned || false,
      dueDate: document.dueDate || "",
      status: document.status === "Done / Ready to submit" ? "Done / Ready to submit" : "In progress",
      tags: Array.isArray(document.tags) ? document.tags.join(", ") : document.tags || "",
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
      status: "In progress",
      tags: "",
    })
    setShowForm(false)
  }

  // derived
  const today = localTodayYMD()
  const dueToday = documents.filter((d) => d.dueDate === today)
  const overdue = documents.filter((d) => d.dueDate && d.dueDate < today)
  const pinnedDocs = documents.filter((d) => d.pinned)

  const groupedDocuments = categories.reduce((acc, category) => {
    acc[category] = documents.filter((d) => d.category === category)
    return acc
  }, {})

  // search/filter
  const matchesFilter = (d) => {
    const text = queryText.trim().toLowerCase()
    const inStatus = statusFilter === "All" || (d.status || "In progress") === statusFilter
    if (!text) return inStatus
    const hay = [
      d.title,
      d.category,
      d.status,
      d.assignmentLink,
      d.canvasLink,
      ...(Array.isArray(d.tags) ? d.tags : []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
    return inStatus && hay.includes(text)
  }

  const filteredByCategory = categories.reduce((acc, cat) => {
    acc[cat] = (groupedDocuments[cat] || []).filter(matchesFilter)
    return acc
  }, {})

  const statusPill = (status) => {
    const s = status === "Done / Ready to submit" ? "Done / Ready to submit" : "In progress"
    if (s === "Done / Ready to submit") {
      return (
        <span className="px-3 py-1.5 rounded-lg border font-medium text-sm w-fit bg-green-500/15 border-green-500/30 text-green-400 inline-flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" />
          {s}
        </span>
      )
    }
    return (
      <span className="px-3 py-1.5 rounded-lg border font-medium text-sm w-fit bg-yellow-500/15 border-yellow-500/30 text-yellow-300 inline-flex items-center gap-1.5">
        <CircleDashed className="w-4 h-4" />
        {s}
      </span>
    )
  }

  const CardActions = ({ doc: d }) => (
    <div className="flex items-center justify-between pt-2 border-t border-gray-700/30">
      <span className="text-xs text-gray-500 font-medium">Actions</span>
      <div className="flex gap-2">
        <button
          onClick={() => toggleStatus(d)}
          className="p-2 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 rounded-lg hover:bg-indigo-500/25 hover:scale-105 hover:shadow-md hover:shadow-indigo-500/20 transition-all duration-200"
          title="Toggle status"
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => toggleVisibility(d.id, d.visible)}
          className={`p-2 rounded-lg border transition-all duration-200 hover:scale-105 ${
            d.visible
              ? "bg-green-500/15 border-green-500/30 text-green-400 hover:bg-green-500/25 hover:shadow-md hover:shadow-green-500/20"
              : "bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25 hover:shadow-md hover:shadow-red-500/20"
          }`}
          title={d.visible ? "Hide from team" : "Show to team"}
        >
          {d.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
        <button
          onClick={() => togglePin(d.id, d.pinned)}
          className="p-2 bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 rounded-lg hover:bg-yellow-500/25 hover:scale-105 hover:shadow-md hover:shadow-yellow-500/20 transition-all duration-200"
          title={d.pinned ? "Unpin document" : "Pin document"}
        >
          {d.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
        </button>
        <button
          onClick={() => startEditing(d)}
          className="p-2 bg-blue-500/15 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/25 hover:scale-105 hover:shadow-md hover:shadow-blue-500/20 transition-all duration-200"
          title="Edit document"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => deleteDocument(d.id)}
          className="p-2 bg-red-500/15 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/25 hover:scale-105 hover:shadow-md hover:shadow-red-500/20 transition-all duration-200"
          title="Delete document"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  const LinkButtons = ({ d }) => (
    <div className="flex flex-wrap gap-3 mb-6">
      {d.assignmentLink && (
        <a
          href={d.assignmentLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/20 hover:border-cyan-400/50 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md hover:shadow-cyan-500/20"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Document</span>
        </a>
      )}
      {d.canvasLink && (
        <a
          href={d.canvasLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 text-green-300 hover:text-green-200 hover:bg-green-500/20 hover:border-green-400/50 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md hover:shadow-green-500/20"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Canvas</span>
        </a>
      )}
    </div>
  )

  const TagRow = ({ d }) =>
    Array.isArray(d.tags) && d.tags.length > 0 ? (
      <div className="flex flex-wrap gap-2 mt-1">
        {d.tags.map((t) => (
          <span key={t} className="px-2 py-0.5 text-xs rounded-md bg-white/5 border border-white/10 text-white/70">
            #{t}
          </span>
        ))}
      </div>
    ) : null

  return (
    <div className="min-h-screen bg-gray-950 relative overflow-hidden">
      {/* backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 sm:w-80 h-72 sm:h-80 bg-cyan-500/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-72 sm:w-80 h-72 sm:h-80 bg-purple-500/8 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-blue-500/4 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* REWORKED HEADER */}
      <header className="sticky top-0 z-40 bg-gray-950/85 backdrop-blur-md border-b border-white/10 shadow-[0_10px_24px_-12px_rgba(0,0,0,0.5)]">
        {/* gradient accent line */}
        <div className="h-[2px] bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 opacity-60" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Row 1: Title + Buttons */}
          <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <Shield className="w-5 h-5 text-cyan-300" />
              </div>
              <div className="leading-tight">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Admin Panel</h1>
                <p className="text-cyan-300/70 text-xs sm:text-sm">Manage team documents and assignments</p>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 flex-wrap">
              <button
                onClick={() => setShowLinksModal(true)}
                className="bg-white/5 border border-white/15 text-white/80 px-4 sm:px-5 py-2.5 rounded-lg hover:bg-white/10 hover:border-white/25 hover:shadow-lg hover:shadow-white/10 flex items-center gap-2 transition-all duration-300"
                title="Edit Useful Links"
              >
                <LinkIcon className="w-4 h-4" />
                <span className="text-sm sm:text-[15px]">Useful Links</span>
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 px-4 sm:px-5 py-2.5 rounded-lg hover:bg-cyan-500/20 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/20 flex items-center gap-2 transition-all duration-300"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm sm:text-[15px]">Add Document</span>
              </button>
              <button
                onClick={onLogout}
                className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 sm:px-5 py-2.5 rounded-lg hover:bg-red-500/20 hover:border-red-400/50 hover:shadow-lg hover:shadow-red-500/20 flex items-center gap-2 transition-all duration-300"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm sm:text-[15px]">Logout</span>
              </button>
            </div>
          </div>

          {/* Row 2: Search + Filter */}
          <div className="mt-3">
            <div className="flex items-center gap-2 bg-gray-900/70 border border-white/10 rounded-xl px-3 py-2.5">
              <Search className="w-4 h-4 text-cyan-300/70" />
              <input
                className="bg-transparent text-sm sm:text-[15px] text-white placeholder:text-gray-400 focus:outline-none w-full"
                placeholder="Search title, tags, links…"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
              />
              <div className="w-px h-5 bg-white/10 mx-1 sm:mx-2" />
              <Filter className="w-4 h-4 text-cyan-300/70" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-sm sm:text-[15px] text-white focus:outline-none"
              >
                <option className="bg-gray-800" value="All">All</option>
                {STATUSES.map((s) => (
                  <option className="bg-gray-800" key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">
        {/* Useful Links */}
        <section>
          <SectionHeader
            title="Useful Links"
            count={links.filter((l) => l.label && l.url).length}
            icon={<ListChecks className="w-5 h-5 text-cyan-400" />}
            open={openSections.usefulLinks}
            onToggle={() => toggleSection("usefulLinks")}
          />
          <Collapsible open={openSections.usefulLinks}>
            <div className="p-4 sm:p-5 lg:p-6 rounded-xl bg-white/[0.03] border border-white/10">
              {links.filter((l) => l.label && l.url).length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {links
                    .filter((l) => l.label && l.url)
                    .map((l, idx) => (
                      <a
                        key={`${l.label}-${idx}`}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/15 text-white/90 hover:text-white hover:bg-white/10 hover:border-white/25 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md hover:shadow-white/10"
                      >
                        <LinkIcon className="w-4 h-4" />
                        <span>{l.label}</span>
                      </a>
                    ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No links yet—click “Useful Links” in the header to add your repo and resources.</p>
              )}
            </div>
          </Collapsible>
        </section>

        {/* Due Today */}
        <section>
          <SectionHeader
            title="Due Today"
            count={dueToday.filter(matchesFilter).length}
            icon={<AlertCircle className="w-5 h-5 text-red-400" />}
            open={openSections.dueToday}
            onToggle={() => toggleSection("dueToday")}
          />
          <Collapsible open={openSections.dueToday}>
            <div className="p-4 sm:p-5 lg:p-6 rounded-xl bg-white/[0.03] border border-white/10">
              {dueToday.filter(matchesFilter).length > 0 ? (
                <div className="grid gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {dueToday.filter(matchesFilter).map((d) => (
                    <DocCard key={d.id} d={d} formatDueDate={formatDueDate} statusPill={statusPill} LinkButtons={LinkButtons} TagRow={TagRow} CardActions={CardActions} />
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-sm">Nothing due today.</div>
              )}
            </div>
          </Collapsible>
        </section>

        {/* Overdue */}
        <section>
          <SectionHeader
            title="Overdue"
            count={overdue.filter(matchesFilter).length}
            icon={<AlertCircle className="w-5 h-5 text-orange-400" />}
            open={openSections.overdue}
            onToggle={() => toggleSection("overdue")}
          />
          <Collapsible open={openSections.overdue}>
            <div className="p-4 sm:p-5 lg:p-6 rounded-xl bg-white/[0.03] border border-white/10">
              {overdue.filter(matchesFilter).length > 0 ? (
                <div className="grid gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {overdue.filter(matchesFilter).map((d) => (
                    <DocCard key={d.id} d={d} formatDueDate={formatDueDate} statusPill={statusPill} LinkButtons={LinkButtons} TagRow={TagRow} CardActions={CardActions} />
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-sm">No overdue items. 🎉</div>
              )}
            </div>
          </Collapsible>
        </section>

        {/* Pinned */}
        <section>
          <SectionHeader
            title="Pinned Documents"
            count={pinnedDocs.filter(matchesFilter).length}
            icon={<Pin className="w-5 h-5 text-yellow-400" />}
            open={openSections.pinned}
            onToggle={() => toggleSection("pinned")}
          />
          <Collapsible open={openSections.pinned}>
            <div className="p-4 sm:p-5 lg:p-6 rounded-xl bg-white/[0.03] border border-white/10">
              {pinnedDocs.filter(matchesFilter).length > 0 ? (
                <div className="grid gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {pinnedDocs.filter(matchesFilter).map((d) => (
                    <DocCard key={d.id} d={d} formatDueDate={formatDueDate} statusPill={statusPill} LinkButtons={LinkButtons} TagRow={TagRow} CardActions={CardActions} />
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-sm">No pinned documents.</div>
              )}
            </div>
          </Collapsible>
        </section>

        {/* Categories */}
        {categories.map((category) => (
          <section key={category}>
            <SectionHeader
              title={category}
              count={filteredByCategory[category]?.length || 0}
              icon={<FileText className="w-5 h-5 text-cyan-400" />}
              open={openSections[`cat:${category}`]}
              onToggle={() => toggleSection(`cat:${category}`)}
              subtle
            />
            <Collapsible open={openSections[`cat:${category}`]}>
              <div className="p-4 sm:p-5 lg:p-6 rounded-xl bg-white/[0.02] border border-white/10">
                {filteredByCategory[category]?.length > 0 ? (
                  <div className="grid gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filteredByCategory[category].map((d) => (
                      <DocCard key={d.id} d={d} formatDueDate={formatDueDate} statusPill={statusPill} LinkButtons={LinkButtons} TagRow={TagRow} CardActions={CardActions} />
                    ))}
                  </div>
                ) : (
                  <div className="col-span-full text-center py-10 sm:py-12 text-gray-400">
                    <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-gray-800/60 rounded-2xl flex items-center justify-center mb-4 border border-gray-700/30">
                      <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-gray-500" />
                    </div>
                    <p className="text-base sm:text-lg font-medium">No documents in this category yet.</p>
                  </div>
                )}
              </div>
            </Collapsible>
          </section>
        ))}
      </main>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-gray-800/95 backdrop-blur-md border border-cyan-500/20 rounded-2xl p-5 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl shadow-cyan-500/10">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg sm:text-xl font-bold text-white">{editingDoc ? "Edit Document" : "Add New Document"}</h2>
              <button
                onClick={cancelEdit}
                className="text-gray-400 hover:text-white transition-colors duration-200 p-2 hover:bg-gray-700/50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-2">Assignment Document Link</label>
                  <input
                    type="url"
                    value={formData.assignmentLink}
                    onChange={(e) => setFormData({ ...formData, assignmentLink: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-700/50 border border-cyan-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 backdrop-blur-sm"
                    placeholder="https://docs.google.com/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-2">Canvas Link</label>
                  <input
                    type="url"
                    value={formData.canvasLink}
                    onChange={(e) => setFormData({ ...formData, canvasLink: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-700/50 border border-cyan-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 backdrop-blur-sm"
                    placeholder="https://canvas.fiu.edu/..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-700/50 border border-cyan-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 backdrop-blur-sm"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category} className="bg-gray-700 text-white">
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-700/50 border border-cyan-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 backdrop-blur-sm"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-gray-700 text-white">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">Due Date (Optional)</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-700/50 border border-cyan-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 backdrop-blur-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2 flex items-center gap-2">
                  <TagsIcon className="w-4 h-4" /> Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-700/50 border border-cyan-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 backdrop-blur-sm"
                  placeholder="frontend, api, docs"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <label className="inline-flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.visible}
                    onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                    className="w-4 h-4 text-cyan-400 bg-gray-700 border-cyan-500/30 rounded focus:ring-cyan-400 focus:ring-2"
                  />
                  <span className="text-sm text-cyan-300 font-medium">Visible to team</span>
                </label>

                <label className="inline-flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.pinned}
                    onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                    className="w-4 h-4 text-cyan-400 bg-gray-700 border-cyan-500/30 rounded focus:ring-cyan-400 focus:ring-2"
                  />
                  <span className="text-sm text-cyan-300 font-medium">Pin document</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
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

      {/* Useful Links Modal */}
      {showLinksModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-gray-800/95 backdrop-blur-md border border-cyan-500/20 rounded-2xl p-5 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-cyan-500/10">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-cyan-300" />
                Useful Links (project-wide)
              </h2>
              <button
                onClick={() => setShowLinksModal(false)}
                className="text-gray-400 hover:text-white transition-colors duration-200 p-2 hover:bg-gray-700/50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {links.map((row, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
                  <input
                    type="text"
                    placeholder="Label (e.g., GitHub Repo)"
                    value={row.label}
                    onChange={(e) => {
                      const next = [...links]
                      next[idx] = { ...next[idx], label: e.target.value }
                      setLinks(next)
                    }}
                    className="sm:col-span-2 px-3 py-2 bg-gray-700/50 border border-cyan-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20"
                  />
                  <input
                    type="url"
                    placeholder="https://..."
                    value={row.url}
                    onChange={(e) => {
                      const next = [...links]
                      next[idx] = { ...next[idx], url: e.target.value }
                      setLinks(next)
                    }}
                    className="sm:col-span-3 px-3 py-2 bg-gray-700/50 border border-cyan-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-5 flex-col sm:flex-row">
              <button
                type="button"
                onClick={() => setLinks([...links, { label: "", url: "" }])}
                className="flex-1 bg-white/5 border border-white/15 text-white/90 py-2.5 rounded-lg hover:bg-white/10 hover:border-white/25 transition-all duration-300 font-medium"
              >
                + Add Row
              </button>
              <button
                type="button"
                onClick={saveLinks}
                className="flex-1 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 py-2.5 rounded-lg hover:bg-cyan-500/25 hover:border-cyan-400/50 transition-all duration-300 font-medium"
              >
                Save Links
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-3">
              Tip: Add “GitHub Repo”, “Design Doc”, “Staging”, “API Docs”, “Drive Folder”, etc.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/* Small presentational component for cards to keep header code concise */
const DocCard = ({ d, formatDueDate, statusPill, LinkButtons, TagRow, CardActions }) => (
  <div className="group bg-gradient-to-br from-gray-900/70 to-gray-800/50 border border-cyan-500/20 p-5 sm:p-6 rounded-2xl hover:from-gray-800/80 hover:to-gray-700/60 hover:border-cyan-400/40 relative backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1">
    <div className="mb-4">
      <h3 className="font-semibold text-white text-lg leading-tight group-hover:text-cyan-50 transition-colors duration-200 break-words">
        {d.title}
      </h3>
      <TagRow d={d} />
    </div>

    <LinkButtons d={d} />

    <div className="pt-4 border-t border-gray-700/50 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {statusPill(d.status)}
          <span
            className={`px-3 py-1.5 rounded-lg border font-medium text-sm w-fit ${
              d.visible ? "bg-green-500/15 border-green-500/30 text-green-400" : "bg-red-500/15 border-red-500/30 text-red-400"
            }`}
          >
            {d.visible ? "Visible" : "Hidden"}
          </span>
        </div>
        {d.dueDate && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-md w-fit">
            <Calendar className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span className="text-cyan-300 font-medium text-xs whitespace-nowrap">Due {formatDueDate(d.dueDate)}</span>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-400 font-medium">Created {new Date(d.createdAt).toLocaleDateString()}</p>
      <CardActions doc={d} />
    </div>
  </div>
)

export default AdminPanel
