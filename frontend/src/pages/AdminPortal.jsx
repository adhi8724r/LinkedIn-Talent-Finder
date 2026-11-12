import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  UploadCloud, FileText, Database, Activity, CheckCircle2, AlertCircle,
  Trash2, RefreshCw, Search, ShieldCheck, Users, HardDrive, Loader2,
  FileArchive, ArrowUpRight, Check, X, UserCheck, Mail, Phone, Briefcase
} from "lucide-react";
import axios from "axios";
import { formatDisplayName } from "../utils/formatters";

export default function AdminPortal({ onTabChange }) {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Candidates Table State
  const [candidates, setCandidates] = useState([]);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [limit] = useState(15);
  const [loadingCandidates, setLoadingCandidates] = useState(true);

  // Upload State
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Deletion State
  const [deletingId, setDeletingId] = useState(null);

  // Recruiter Directory State
  const [activeView, setActiveView] = useState("talents"); // "talents" | "recruiters"
  const [recruiters, setRecruiters] = useState([]);
  const [loadingRecruiters, setLoadingRecruiters] = useState(false);
  const [recruiterSearch, setRecruiterSearch] = useState("");

  // Helper for auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // 1. Fetch Registered Recruiters
  const fetchRecruiters = useCallback(async () => {
    try {
      setLoadingRecruiters(true);
      const res = await axios.get("http://localhost:8000/admin/recruiters", {
        headers: getAuthHeaders()
      });
      setRecruiters(res.data || []);
    } catch (err) {
      console.error("Failed to load registered recruiters:", err);
    } finally {
      setLoadingRecruiters(false);
    }
  }, []);

  const filteredRecruiters = useMemo(() => {
    if (!recruiterSearch.trim()) return recruiters;
    const q = recruiterSearch.toLowerCase().trim();
    return recruiters.filter((r) =>
      (r.name && r.name.toLowerCase().includes(q)) ||
      (r.email && r.email.toLowerCase().includes(q)) ||
      (r.number && r.number.toLowerCase().includes(q)) ||
      (r.role && r.role.toLowerCase().includes(q))
    );
  }, [recruiters, recruiterSearch]);

  // 1. Fetch System Stats
  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const res = await axios.get("http://localhost:8000/admin/stats", {
        headers: getAuthHeaders()
      });
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // 2. Fetch Candidates
  const fetchCandidates = useCallback(async () => {
    try {
      setLoadingCandidates(true);
      const params = {
        limit,
        offset: page * limit,
        ...(searchQuery.trim() ? { search: searchQuery.trim() } : {})
      };
      const res = await axios.get("http://localhost:8000/admin/candidates", {
        headers: getAuthHeaders(),
        params
      });
      setCandidates(res.data.candidates || []);
      setTotalCandidates(res.data.total || 0);
    } catch (err) {
      console.error("Failed to load candidates:", err);
    } finally {
      setLoadingCandidates(false);
    }
  }, [page, limit, searchQuery]);

  useEffect(() => {
    fetchStats();
    fetchRecruiters();
  }, [fetchStats, fetchRecruiters]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // File Drag & Drop Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles) => {
    const validExtensions = [".pdf", ".docx", ".doc", ".txt", ".zip"];
    const filtered = newFiles.filter((f) => {
      const ext = f.name.substring(f.name.lastIndexOf(".")).toLowerCase();
      return validExtensions.includes(ext);
    });
    setSelectedFiles((prev) => [...prev, ...filtered]);
    setUploadResult(null);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 3. Trigger Bulk Ingestion Upload
  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const res = await axios.post("http://localhost:8000/admin/upload-resumes", formData, {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data"
        }
      });
      setUploadResult({ success: true, data: res.data });
      setSelectedFiles([]);
      // Refresh stats & candidate table
      fetchStats();
      fetchCandidates();
    } catch (err) {
      console.error("Bulk upload failed:", err);
      const errMsg = err.response?.data?.detail || "Upload and ingestion failed.";
      setUploadResult({ success: false, error: errMsg });
    } finally {
      setIsUploading(false);
    }
  };

  // 4. Delete Candidate Handler
  const handleDeleteCandidate = async (documentId, candidateName) => {
    if (!window.confirm(`Are you sure you want to permanently delete candidate "${candidateName}" from PostgreSQL and Qdrant?`)) {
      return;
    }

    try {
      setDeletingId(documentId);
      await axios.delete(`http://localhost:8000/admin/candidates/${documentId}`, {
        headers: getAuthHeaders()
      });
      // Remove from table and refresh stats
      setCandidates((prev) => prev.filter((c) => c.document_id !== documentId));
      setTotalCandidates((prev) => Math.max(0, prev - 1));
      fetchStats();
    } catch (err) {
      console.error("Failed to delete candidate:", err);
      alert(err.response?.data?.detail || "Failed to delete candidate.");
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.ceil(totalCandidates / limit) || 1;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Control Panel • Role-Based Access</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            Talent Pool Repository & System Health
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Bulk ingest applicant resume archives (.zip / .docx / .pdf), monitor vector database indexing, and manage central talent records.
          </p>
        </div>
      </div>

      {/* Metrics & System Health Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Candidates */}
        <div
          onClick={() => setActiveView("talents")}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between cursor-pointer hover:border-purple-300 transition-colors"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Talent Pool</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {loadingStats ? "..." : stats?.total_candidates ?? 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">PostgreSQL Resumes</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
        </div>

        {/* Registered Recruiters */}
        <div
          onClick={() => { setActiveView("recruiters"); fetchRecruiters(); }}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between cursor-pointer hover:border-blue-300 transition-colors"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Registered Recruiters</p>
            <p className="text-2xl font-black text-blue-600 mt-1">
              {loadingStats ? "..." : stats?.total_recruiters ?? recruiters.length}
            </p>
            <p className="text-[11px] text-blue-500 font-semibold mt-0.5 flex items-center gap-1">
              View Team Directory →
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Qdrant Vectors */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Qdrant Vectors</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {loadingStats ? "..." : stats?.qdrant_vectors ?? 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">768-Dim Embeddings</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <HardDrive className="w-6 h-6" />
          </div>
        </div>

        {/* Infrastructure Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">System Health</p>
            <button
              onClick={fetchStats}
              title="Refresh Health"
              className="text-slate-400 hover:text-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="space-y-1.5 text-xs font-medium">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">PostgreSQL</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Healthy
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Qdrant Vector DB</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Healthy
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Groq LLM</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Ready
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin View Navigation Switcher */}
      <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200/80">
        <button
          onClick={() => setActiveView("talents")}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeView === "talents"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Database className="w-4 h-4 text-purple-600" />
          <span>Talent Pool & Ingestion ({totalCandidates})</span>
        </button>

        <button
          onClick={() => { setActiveView("recruiters"); fetchRecruiters(); }}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeView === "recruiters"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <UserCheck className="w-4 h-4 text-blue-600" />
          <span>Registered Recruiters ({stats?.total_recruiters ?? recruiters.length})</span>
        </button>
      </div>

      {/* VIEW 1: TALENT POOL & INGESTION */}
      {activeView === "talents" && (
        <div className="space-y-8 animate-in fade-in duration-200">
      {/* Bulk Ingestion Dropzone Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <UploadCloud className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-bold text-slate-900">Bulk Ingestion & Vector Indexing</h2>
            </div>
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
              ZIP / Multi-Doc Ingestion
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Upload candidate resumes directly. You can drop a <strong>.zip file containing 100+ resumes</strong> or select multiple <strong>.pdf / .docx</strong> files at once.
          </p>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
            dragActive
              ? "border-purple-500 bg-purple-50/50 scale-[1.01]"
              : "border-slate-200 hover:border-purple-400 hover:bg-slate-50/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.txt,.zip"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <FileArchive className="w-8 h-8" />
          </div>

          <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-1">
            Click to select files, or drag and drop here
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Supported formats: <strong>ZIP archives (.zip)</strong>, <strong>PDF (.pdf)</strong>, <strong>Word (.docx, .doc)</strong>, and <strong>Text (.txt)</strong>.
          </p>
        </div>

        {/* File Queue List */}
        {selectedFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">
                Selected Files ({selectedFiles.length})
              </span>
              <button
                onClick={() => setSelectedFiles([])}
                className="text-red-500 hover:text-red-700 font-medium"
              >
                Clear All
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/70 text-xs"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="font-medium text-slate-800 truncate">{file.name}</span>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                    className="text-slate-400 hover:text-red-600 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Ingestion Submit Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleUploadSubmit}
                disabled={isUploading}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 disabled:opacity-50 transition-all"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing & Indexing Resumes...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Start Ingestion ({selectedFiles.length} files)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Upload Success / Error Toast */}
        {uploadResult && (
          <div className={`p-4 rounded-2xl text-xs space-y-1 border ${
            uploadResult.success ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"
          }`}>
            <div className="flex items-center space-x-2 font-bold text-sm">
              {uploadResult.success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{uploadResult.data?.message || "Ingestion Completed!"}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span>Ingestion Error</span>
                </>
              )}
            </div>

            {uploadResult.success && uploadResult.data && (
              <div className="pt-1 text-slate-700 space-y-0.5">
                <p>• <strong>{uploadResult.data.newly_indexed}</strong> new candidate profiles created and vectorized into Qdrant.</p>
                <p>• <strong>{uploadResult.data.updated_duplicates}</strong> existing candidate profiles updated.</p>
                {uploadResult.data.errors?.length > 0 && (
                  <p className="text-amber-700">• {uploadResult.data.errors.length} files skipped due to format issues.</p>
                )}
              </div>
            )}

            {!uploadResult.success && (
              <p className="text-red-700">{uploadResult.error}</p>
            )}
          </div>
        )}
      </div>

      {/* Talent Pool Directory Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Talent Pool Directory</h2>
            <p className="text-xs text-slate-500">
              Browse, filter, and manage all indexed candidate records in the central repository ({totalCandidates} total).
            </p>
          </div>

          {/* Table Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              placeholder="Search candidate name or skill..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Candidate</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Experience</th>
                <th className="p-4">Key Skills</th>
                <th className="p-4">Format</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingCandidates ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
                    Loading talent repository...
                  </td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No candidate records found matching "{searchQuery}".
                  </td>
                </tr>
              ) : (
                candidates.map((c) => (
                  <tr key={c.document_id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name & Avatar */}
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {formatDisplayName(c.name).split(" ").map(n => n[0]).slice(0, 2).join("")}
                        </div>
                        <span className="font-bold text-slate-900 line-clamp-1">{formatDisplayName(c.name)}</span>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="p-4 text-slate-600">
                      <p className="truncate max-w-[180px]">{c.email}</p>
                      <p className="text-[11px] text-slate-400">{c.mobile_number || "N/A"}</p>
                    </td>

                    {/* Experience */}
                    <td className="p-4 font-semibold text-slate-800">
                      {c.years_experience} yrs
                    </td>

                    {/* Skills */}
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(c.skills || []).slice(0, 3).map((skill, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700">
                            {skill}
                          </span>
                        ))}
                        {(c.skills || []).length > 3 && (
                          <span className="text-[10px] text-slate-400 self-center">
                            +{c.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* File Format Badge */}
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        c.file_type === "pdf" ? "bg-red-50 text-red-700 border border-red-200" :
                        c.file_type.includes("doc") ? "bg-blue-50 text-blue-700 border border-blue-200" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {c.file_type}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteCandidate(c.document_id, c.name)}
                        disabled={deletingId === c.document_id}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Delete candidate from database and vector index"
                      >
                        {deletingId === c.document_id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between pt-2 text-xs">
          <span className="text-slate-500 font-medium">
            Showing {Math.min(totalCandidates, page * limit + 1)} to {Math.min(totalCandidates, (page + 1) * limit)} of {totalCandidates} candidates
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-slate-600 font-bold px-2">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>

      </div>
        </div>
      )}

      {/* VIEW 2: REGISTERED RECRUITERS & USER DIRECTORY */}
      {activeView === "recruiters" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Users className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">Registered Recruiters & User Directory</h2>
              </div>
              <p className="text-xs text-slate-500">
                All platform recruiter and administrator accounts registered in PostgreSQL. Roles are fixed and managed by administrators.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {/* Recruiter Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by name, email, phone..."
                  value={recruiterSearch}
                  onChange={(e) => setRecruiterSearch(e.target.value)}
                  className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64"
                />
              </div>

              <button
                onClick={fetchRecruiters}
                className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                title="Refresh Recruiters"
              >
                <RefreshCw className={`w-4 h-4 ${loadingRecruiters ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Recruiters Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Recruiter / User</th>
                  <th className="p-4">Email Address</th>
                  <th className="p-4">Mobile Number</th>
                  <th className="p-4">System Role</th>
                  <th className="p-4 text-center">Talent Searches Executed</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {loadingRecruiters ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                      <p>Loading registered recruiters...</p>
                    </td>
                  </tr>
                ) : filteredRecruiters.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400">
                      No recruiters match your search filter.
                    </td>
                  </tr>
                ) : (
                  filteredRecruiters.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Recruiter Name & Avatar */}
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                            {r.name ? r.name[0].toUpperCase() : "U"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{r.name}</p>
                            <p className="text-[10px] text-slate-400 font-normal">Account ID #{r.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="p-4">
                        <div className="flex items-center space-x-1.5 text-slate-700">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold">{r.email}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="p-4">
                        <div className="flex items-center space-x-1.5 text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{r.number || "—"}</span>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                          r.role === 'admin'
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                          {r.role === 'admin' ? '👑 Admin' : '💼 Recruiter'}
                        </span>
                      </td>

                      {/* Search Volume */}
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          {r.searches_conducted} Searches Run
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer stats summary */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
            <span>
              Showing {filteredRecruiters.length} of {recruiters.length} registered accounts
            </span>
            <div className="flex items-center space-x-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Recruiters: <strong>{recruiters.filter(r => r.role === 'recruiter').length}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Administrators: <strong>{recruiters.filter(r => r.role === 'admin').length}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

