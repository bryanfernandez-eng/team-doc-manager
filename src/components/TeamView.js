"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore"
import { db } from "../firebase"
import { LogOut, ExternalLink, FileText, Calendar, Users, Pin } from "lucide-react"

const TeamView = ({ onLogout }) => {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  const categories = [
    "Daily Standups",
    "Other",
    "Backlog Grooming Meeting",
    "Sprint Planning Meeting",
    "Sprint Review Planning Meeting",
  ]

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Daily Standups":
        return <Calendar className="w-5 h-5 text-cyan-400" />
      case "Backlog Grooming Meeting":
      case "Sprint Planning Meeting":
      case "Sprint Review Planning Meeting":
        return <Users className="w-5 h-5 text-green-400" />
      default:
        return <FileText className="w-5 h-5 text-gray-400" />
    }
  }

  useEffect(() => {
    const q = query(collection(db, "documents"), where("visible", "==", true), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setDocuments(docs)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const groupedDocuments = categories.reduce((acc, category) => {
    acc[category] = documents.filter((doc) => doc.category === category)
    return acc
  }, {})

  const pinnedDocs = documents.filter((doc) => doc.pinned)

  const totalDocuments = documents.length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/3 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4 shadow-lg shadow-cyan-400/50"></div>
          <p className="text-gray-300">Loading documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/3 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <header className="relative bg-gray-950/90 backdrop-blur-sm border-b border-cyan-500/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">FIU Capstone Team</h1>
              <p className="text-cyan-300/70 text-sm">Document Hub - {totalDocuments} documents available</p>
            </div>
            <button
              onClick={onLogout}
              className="bg-red-500/10 border border-red-500/30 text-red-300 px-6 py-2.5 rounded-lg hover:bg-red-500/20 hover:border-red-400/50 hover:shadow-lg hover:shadow-red-500/20 flex items-center gap-2 transition-all duration-300 backdrop-blur-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  className="group bg-gradient-to-br from-gray-900/80 to-gray-800/60 border border-yellow-500/30 p-6 rounded-2xl backdrop-blur-sm hover:from-gray-800/90 hover:to-gray-700/70 hover:border-yellow-400/50 hover:shadow-xl hover:shadow-yellow-500/10 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <h3 className="font-semibold text-white text-lg leading-tight text-balance group-hover:text-cyan-50 transition-colors duration-200 min-w-0 flex-1 break-words">
                      {doc.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                      <Pin className="w-4 h-4 text-yellow-400" />
                    </div>
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
                        <span>Assignment</span>
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

                  <div className="pt-4 border-t border-gray-700/50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                      <span className="text-gray-400 font-medium">
                        Added {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                      {doc.dueDate && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-md w-fit">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                          <span className="text-cyan-300 font-medium text-xs whitespace-nowrap">
                            Due {new Date(doc.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-10">
          {categories.map((category) => (
            <div
              key={category}
              className="group relative bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/[0.04] hover:border-white/20 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-4 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 rounded-2xl group-hover:from-cyan-500/15 group-hover:to-cyan-600/10 group-hover:border-cyan-400/30 group-hover:shadow-lg group-hover:shadow-cyan-500/20 transition-all duration-300">
                    {getCategoryIcon(category)}
                  </div>

                  <div className="w-2 h-2 bg-cyan-400/60 rounded-full group-hover:bg-cyan-400 group-hover:shadow-lg group-hover:shadow-cyan-400/50 transition-all duration-300" />
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white/90 leading-tight text-balance group-hover:text-white transition-colors duration-300">
                    {category}
                  </h3>

                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent group-hover:from-cyan-300 group-hover:to-cyan-200 transition-all duration-300">
                      {groupedDocuments[category]?.length || 0}
                    </span>
                    <span className="text-xs font-medium text-white/50 group-hover:text-white/70 transition-colors duration-300">
                      {groupedDocuments[category]?.length === 1 ? "document" : "documents"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 group-hover:border-white/10 transition-colors duration-300">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40 group-hover:text-white/60 transition-colors duration-300 font-medium">
                      {category === "Daily Standups" ? "Daily" : category === "Other" ? "Misc" : "Sprint"}
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-cyan-400/40 rounded-full group-hover:bg-cyan-400/80 transition-colors duration-300" />
                      <div className="w-1.5 h-1.5 bg-cyan-400/20 rounded-full group-hover:bg-cyan-400/60 transition-colors duration-300" />
                      <div className="w-1.5 h-1.5 bg-cyan-400/10 rounded-full group-hover:bg-cyan-400/40 transition-colors duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {categories.map((category) => {
          const categoryDocs = groupedDocuments[category]

          return (
            <section key={category} className="mb-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-semibold text-white">{category}</h2>
                <span className="bg-gray-800/60 border border-cyan-500/20 text-cyan-300 px-4 py-2 rounded-full text-sm font-medium">
                  {categoryDocs?.length || 0} documents
                </span>
              </div>

              {categoryDocs?.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {categoryDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="group bg-gradient-to-br from-gray-900/70 to-gray-800/50 border border-cyan-500/20 p-6 rounded-2xl hover:from-gray-800/80 hover:to-gray-700/60 hover:border-cyan-400/40 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1"
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <h3 className="font-semibold text-white text-lg leading-tight text-balance group-hover:text-cyan-50 transition-colors duration-200 min-w-0 flex-1 break-words">
                          {doc.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                          {getCategoryIcon(category)}
                          {doc.pinned && <Pin className="w-4 h-4 text-yellow-400" />}
                        </div>
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
                            <span>Assignment Doc</span>
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

                      <div className="pt-4 border-t border-gray-700/50 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                          <span className="text-gray-400 font-medium">
                            Added {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                          {doc.dueDate && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-md w-fit">
                              <Calendar className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                              <span className="text-cyan-300 font-medium text-xs whitespace-nowrap">
                                Due {new Date(doc.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                        {doc.updatedAt !== doc.createdAt && (
                          <p className="text-xs text-gray-500 font-medium">
                            Updated {new Date(doc.updatedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="col-span-full text-center py-16 text-gray-400">
                  <div className="mx-auto w-16 h-16 bg-gray-800/60 rounded-2xl flex items-center justify-center mb-4 border border-gray-700/30">
                    <FileText className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-lg font-medium">No documents in this category yet.</p>
                </div>
              )}
            </section>
          )
        })}

        {totalDocuments === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-gray-900/60 rounded-full flex items-center justify-center mb-6 border border-gray-600/30">
              <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">No documents available</h2>
            <p className="text-gray-400 max-w-md mx-auto text-sm sm:text-base">
              Your team documents will appear here once they're added by the admin. Check back soon for updates!
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

export default TeamView
