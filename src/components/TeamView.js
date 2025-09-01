"use client";

import { useState, useEffect, useMemo } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  LogOut,
  ExternalLink,
  FileText,
  Calendar,
  Users,
  Pin,
  Search,
  Filter,
  CheckCircle2,
  CircleDashed,
  Link as LinkIcon,
  ListChecks,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

const STATUSES = ["In progress", "Done / Ready to submit"];

// Collapsible header
const SectionHeader = ({
  title,
  count,
  icon = null,
  open,
  onToggle,
  subtle = false,
}) => (
  <button
    type="button"
    onClick={onToggle}
    className={`w-full flex items-center justify-between rounded-xl border px-4 sm:px-5 py-3 sm:py-3.5 transition-all
      ${
        subtle
          ? "bg-white/[0.03] border-white/10 hover:bg-white/[0.06]"
          : "bg-gray-900/50 border-cyan-500/20 hover:border-cyan-400/40"
      }
      text-left`}
    aria-expanded={open}
  >
    <div className="flex items-center gap-3 min-w-0">
      <div className="p-2 rounded-lg bg-white/[0.04] border border-white/10">
        {open ? (
          <ChevronDown className="w-4 h-4 text-cyan-300" />
        ) : (
          <ChevronRight className="w-4 h-4 text-cyan-300" />
        )}
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
);

// Collapsible content wrapper
const Collapsible = ({ open, children }) => (
  <div
    className={`overflow-hidden transition-[grid-template-rows,opacity,margin] duration-300 ease-out grid ${
      open
        ? "grid-rows-[1fr] opacity-100 mt-4"
        : "grid-rows-[0fr] opacity-0 mt-0"
    }`}
  >
    <div className="min-h-0">{children}</div>
  </div>
);

const TeamView = ({ onLogout }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queryText, setQueryText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [links, setLinks] = useState([]); // global useful links

  // collapsibles (default collapsed)
  const [openSections, setOpenSections] = useState({
    usefulLinks: false,
    // categories added below
  });
  const toggleSection = (key) =>
    setOpenSections((s) => ({ ...s, [key]: !s[key] }));

  const categories = [
    "Daily Standups",
    "Other",
    "Backlog Grooming Meeting",
    "Sprint Planning Meeting",
    "Sprint Review Planning Meeting",
  ];

  // seed collapse keys for categories
  useEffect(() => {
    setOpenSections((prev) => {
      const next = { ...prev };
      categories.forEach((c) => {
        if (typeof next[`cat:${c}`] === "undefined") next[`cat:${c}`] = false;
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Daily Standups":
        return <Calendar className="w-5 h-5 text-cyan-400" />;
      case "Backlog Grooming Meeting":
      case "Sprint Planning Meeting":
      case "Sprint Review Planning Meeting":
        return <Users className="w-5 h-5 text-green-400" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  // ---- date helpers ----
  const parseLocalYMD = (str) => {
    if (typeof str !== "string") return null;
    const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const [, y, mo, d] = m.map(Number);
    return new Date(y, mo - 1, d);
  };

  const formatDueDate = (dueDateStr) => {
    const dt = parseLocalYMD(dueDateStr);
    if (!dt || isNaN(dt.getTime())) return dueDateStr;
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(dt);
  };
  // ----------------------

  useEffect(() => {
    const q = query(
      collection(db, "documents"),
      where("visible", "==", true),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((snap) => {
        const data = snap.data();
        const normalizedStatus =
          data.status === "Done / Ready to submit"
            ? "Done / Ready to submit"
            : "In progress";
        return { id: snap.id, ...data, status: normalizedStatus };
      });
      setDocuments(docs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "globals"), (snap) => {
      const data = snap.data();
      if (data?.links && Array.isArray(data.links)) {
        setLinks(data.links.filter((l) => l.label && l.url));
      } else {
        setLinks([]);
      }
    });
    return () => unsub();
  }, []);

  const matchesFilter = (d) => {
    const text = queryText.trim().toLowerCase();
    const inStatus =
      statusFilter === "All" || (d.status || "In progress") === statusFilter;
    if (!text) return inStatus;
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
      .toLowerCase();
    return inStatus && hay.includes(text);
  };

  const filteredDocs = useMemo(
    () => documents.filter(matchesFilter),
    [documents, queryText, statusFilter]
  );

  const groupedDocuments = categories.reduce((acc, category) => {
    acc[category] = filteredDocs.filter((doc) => doc.category === category);
    return acc;
  }, {});

  const pinnedDocs = filteredDocs.filter((doc) => doc.pinned);
  const totalDocuments = filteredDocs.length;

  const statusPill = (status) => {
    const s =
      status === "Done / Ready to submit"
        ? "Done / Ready to submit"
        : "In progress";
    if (s === "Done / Ready to submit") {
      return (
        <span className="px-2.5 py-1 rounded-lg border font-medium text-xs w-fit bg-green-500/15 border-green-500/30 text-green-300 inline-flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {s}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-lg border font-medium text-xs w-fit bg-yellow-500/15 border-yellow-500/30 text-yellow-300 inline-flex items-center gap-1.5">
        <CircleDashed className="w-3.5 h-3.5" />
        {s}
      </span>
    );
  };

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
    );
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
          <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl mb-2 font-bold text-white">
                FIU Capstone Team
              </h1>
              <p className="text-cyan-300/70 text-sm">Gamified Habit Tracker</p>
            </div>
            <div className="flex flex-col md:flex-row gap-3 md:items-center w-full md:w-auto">
              <div className="flex items-center gap-2 bg-gray-900/60 border border-cyan-500/20 rounded-lg px-3 py-3 w-full sm:w-auto">
                <Search className="w-4 h-4 text-cyan-300/70" />
                <input
                  className="bg-transparent text-sm text-white placeholder:text-gray-400 focus:outline-none w-full sm:w-64"
                  placeholder="Search title, tags, links…"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                />
                <div className="w-px h-5 bg-white/10 mx-2" />
                <Filter className="w-4 h-4 text-cyan-300/70" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-sm text-white focus:outline-none"
                >
                  <option className="bg-gray-800" value="All">
                    All
                  </option>
                  {STATUSES.map((s) => (
                    <option className="bg-gray-800" key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
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
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Useful Links (collapsible) */}
        <section className="mb-8">
          <SectionHeader
            title="Useful Links"
            count={links.length}
            icon={<ListChecks className="w-5 h-5 text-cyan-400" />}
            open={openSections.usefulLinks}
            onToggle={() => toggleSection("usefulLinks")}
          />
          <Collapsible open={openSections.usefulLinks}>
            <div className="p-4 sm:p-5 rounded-xl bg-white/[0.03] border border-white/10">
              {links.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {links.map((l, idx) => (
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
                <p className="text-gray-400 text-sm">No links yet.</p>
              )}
            </div>
          </Collapsible>
        </section>

        {/* Pinned (NOT collapsible) */}
        {pinnedDocs.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                <Pin className="w-5 h-5 text-yellow-400" />
                <h2 className="text-xl font-semibold text-white">
                  Pinned Documents
                </h2>
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

                  <div className="flex flex-wrap gap-3 mb-3">
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

                  {Array.isArray(doc.tags) && doc.tags.length > 0 && (
                    <div className="mb-6 flex flex-wrap gap-2">
                      {doc.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 text-xs rounded-md bg-white/5 border border-white/10 text-white/70"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-700/50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                      {doc.dueDate && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-md w-fit">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                          <span className="text-cyan-300 font-medium text-xs whitespace-nowrap">
                            Due {formatDueDate(doc.dueDate)}
                          </span>
                        </div>
                      )}
                      {statusPill(doc.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Summary tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-10">
          {categories.map((category) => (
            <div
              key={category}
              className="group relative bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg.White/[0.04] hover:border-white/20 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/10"
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
                      {groupedDocuments[category]?.length === 1
                        ? "document"
                        : "documents"}
                    </span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-white/5 group-hover:border-white/10 transition-colors duration-300">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40 group-hover:text-white/60 transition-colors duration-300 font-medium">
                      {category === "Daily Standups"
                        ? "Daily"
                        : category === "Other"
                        ? "Misc"
                        : "Sprint"}
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

        {/* Category sections (collapsible) */}
        {categories.map((category) => {
          const categoryDocs = groupedDocuments[category];
          const key = `cat:${category}`;
          return (
            <section key={category} className="mb-8">
              <SectionHeader
                title={category}
                count={categoryDocs?.length || 0}
                icon={<FileText className="w-5 h-5 text-cyan-400" />}
                open={openSections[key]}
                onToggle={() => toggleSection(key)}
                subtle
              />
              <Collapsible open={openSections[key]}>
                <div className="p-4 sm:p-5 rounded-xl bg-white/[0.02] border border-white/10">
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
                              {doc.pinned && (
                                <Pin className="w-4 h-4 text-yellow-400" />
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3 mb-3">
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

                          {Array.isArray(doc.tags) && doc.tags.length > 0 && (
                            <div className="mb-6 flex flex-wrap gap-2">
                              {doc.tags.map((t) => (
                                <span
                                  key={t}
                                  className="px-2 py-0.5 text-xs rounded-md bg-white/5 border border-white/10 text-white/70"
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="pt-4 border-t border-gray-700/50 space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                              {doc.dueDate && (
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-md w-fit">
                                  <Calendar className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                                  <span className="text-cyan-300 font-medium text-xs whitespace-nowrap">
                                    Due {formatDueDate(doc.dueDate)}
                                  </span>
                                </div>
                              )}
                              {statusPill(doc.status)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="col-span-full text-center py-12 text-gray-400">
                      <div className="mx-auto w-16 h-16 bg-gray-800/60 rounded-2xl flex items-center justify-center mb-4 border border-gray-700/30">
                        <FileText className="w-8 h-8 text-gray-500" />
                      </div>
                      <p className="text-lg font-medium">
                        No documents in this category yet.
                      </p>
                    </div>
                  )}
                </div>
              </Collapsible>
            </section>
          );
        })}
      </main>
    </div>
  );
};

export default TeamView;
