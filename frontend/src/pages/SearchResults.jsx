import React, { useState, useMemo, useEffect } from 'react';
import {
  User, Mail, Phone, MapPin, Briefcase, Search, Download, 
  ExternalLink, ChevronLeft, ChevronRight, X, Copy, Check, FileText, Eye, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatDisplayName } from '../utils/formatters';

export default function SearchResults({ results = [], onTabChange }) {
  const navigate = useNavigate();
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [modalTab, setModalTab] = useState("overview"); // "overview" | "resume"
  const [docViewMode, setDocViewMode] = useState("document"); // "document" | "text"
  const [resumeData, setResumeData] = useState(null);
  const [loadingResume, setLoadingResume] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [copiedField, setCopiedField] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Reset pagination to page 1 whenever results or filter criteria change
  useEffect(() => {
    setCurrentPage(1);
  }, [results, minScore, searchQuery, experienceFilter]);

  // Fetch resume preview when modal opens or candidate changes
  useEffect(() => {
    if (!selectedCandidate) {
      setResumeData(null);
      setModalTab("overview");
      return;
    }

    const fetchResume = async () => {
      setLoadingResume(true);
      try {
        const res = await axios.get(`http://localhost:8000/resume/${selectedCandidate.document_id}/preview`);
        setResumeData(res.data);
      } catch (err) {
        console.error("Failed to load resume preview:", err);
      } finally {
        setLoadingResume(false);
      }
    };

    fetchResume();
  }, [selectedCandidate]);

  // Filter candidates in memory
  const filteredCandidates = useMemo(() => {
    return results.filter((c) => {
      const matchScore = c.score >= minScore;
      
      const query = searchQuery.toLowerCase().trim();
      const matchQuery = !query || 
        c.name?.toLowerCase().includes(query) ||
        c.skills?.some(s => s.toLowerCase().includes(query)) ||
        c.prev_roles?.some(r => r.toLowerCase().includes(query)) ||
        c.location?.toLowerCase().includes(query);

      let matchExp = true;
      const exp = Number(c.years_experience) || 0;
      if (experienceFilter === "entry") matchExp = exp < 2;
      else if (experienceFilter === "mid") matchExp = exp >= 2 && exp <= 5;
      else if (experienceFilter === "senior") matchExp = exp > 5;

      return matchScore && matchQuery && matchExp;
    });
  }, [results, minScore, searchQuery, experienceFilter]);

  // Overall KPI Metrics
  const stats = useMemo(() => {
    if (!results.length) return null;
    const scores = results.map(r => r.score || 0);
    const exps = results.map(r => Number(r.years_experience) || 0);
    const topScore = Math.max(...scores);
    const avgExp = (exps.reduce((a, b) => a + b, 0) / exps.length).toFixed(1);
    const highMatches = results.filter(r => r.score >= 80).length;

    return { topScore, avgExp, highMatches };
  }, [results]);

  // Export Shortlist to CSV
  const handleExportCSV = () => {
    if (!filteredCandidates.length) return;
    const headers = ["Candidate ID", "Name", "Match Score (%)", "Experience (Years)", "Email", "Phone", "Location", "Skills"];
    const rows = filteredCandidates.map(c => [
      `"${c.document_id || ''}"`,
      `"${c.name || ''}"`,
      c.score || 0,
      c.years_experience || 0,
      `"${c.email || ''}"`,
      `"${c.mobile_number || ''}"`,
      `"${c.location || ''}"`,
      `"${(c.skills || []).join('; ')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `talent_shortlist_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const paginatedCandidates = filteredCandidates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!results.length) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-xl mx-auto my-12 space-y-4">
        <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <Search className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">No Candidates Sourced Yet</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Provide a job description in the Job Description tab and click "Run AI Talent Search" to generate ranked recommendations.
        </p>
        <button
          onClick={() => onTabChange("Job Description")}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-500/20"
        >
          Go to Job Description
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Quick Summary KPIs */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top Match Score</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{stats.topScore}%</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
              🎯
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Experience</p>
              <p className="text-2xl font-black text-indigo-600 mt-1">{stats.avgExp} <span className="text-sm font-normal text-slate-500">years</span></p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
              💼
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">High Matches (≥80%)</p>
              <p className="text-2xl font-black text-purple-600 mt-1">{stats.highMatches} <span className="text-sm font-normal text-slate-500">candidates</span></p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg">
              ⭐
            </div>
          </div>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search within candidates */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by candidate name, skill, or role..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Experience Filter Pills */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
          {[
            { id: "all", label: "All Exp" },
            { id: "entry", label: "< 2 Yrs" },
            { id: "mid", label: "2 - 5 Yrs" },
            { id: "senior", label: "> 5 Yrs" }
          ].map((exp) => (
            <button
              key={exp.id}
              onClick={() => setExperienceFilter(exp.id)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                experienceFilter === exp.id
                  ? "bg-white text-slate-900 font-bold shadow-sm"
                  : "hover:text-slate-900"
              }`}
            >
              {exp.label}
            </button>
          ))}
        </div>

        {/* Min Score & Export */}
        <div className="flex items-center space-x-3 justify-end">
          <div className="flex items-center space-x-1.5 text-xs text-slate-600">
            <span className="font-medium">Min Score:</span>
            <select
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white font-semibold text-slate-800"
            >
              <option value={0}>Any</option>
              <option value={60}>60%+</option>
              <option value={70}>70%+</option>
              <option value={80}>80%+</option>
              <option value={90}>90%+</option>
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

      </div>

      {/* Candidate Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {paginatedCandidates.map((candidate) => {
          const score = candidate.score || 0;
          const scoreColor =
            score >= 85 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
            score >= 70 ? "bg-blue-50 text-blue-700 border-blue-200" :
            "bg-amber-50 text-amber-700 border-amber-200";

          return (
            <div
              key={candidate.document_id}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header row: Avatar + Name + Score Badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm border border-slate-300/50 shadow-sm">
                      {formatDisplayName(candidate.name).split(" ").map(n => n[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">
                        {formatDisplayName(candidate.name)}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{candidate.location || "Location not specified"}</span>
                      </p>
                    </div>
                  </div>

                  <div className={`px-2.5 py-1 rounded-xl border text-xs font-black tracking-tight ${scoreColor}`}>
                    {score}% Match
                  </div>
                </div>

                {/* Experience & Previous Roles */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span><strong>{candidate.years_experience || 0} years</strong> total experience</span>
                  </div>

                  {candidate.prev_roles?.length > 0 && (
                    <p className="text-xs text-slate-500 line-clamp-1">
                      <span className="font-medium text-slate-700">Recent Role:</span> {candidate.prev_roles[0]}
                    </p>
                  )}
                </div>

                {/* Skills Cloud */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(candidate.skills || []).slice(0, 5).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700"
                    >
                      {skill}
                    </span>
                  ))}
                  {(candidate.skills?.length || 0) > 5 && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-500">
                      +{candidate.skills.length - 5}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-1">
                <button
                  onClick={() => { setSelectedCandidate(candidate); setModalTab("overview"); }}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Quick View
                </button>

                <button
                  onClick={() => { setSelectedCandidate(candidate); setModalTab("resume"); }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 bg-blue-50/70 hover:bg-blue-100/70 px-2.5 py-1 rounded-lg"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Resume Preview</span>
                </button>

                <button
                  onClick={() => navigate(`/profile/${candidate.document_id}`)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
                >
                  <span>Profile</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-xs text-slate-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCandidates.length)} of {filteredCandidates.length} matches
          </p>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold px-3 text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Slide-out / Modal Drawer for Quick Candidate Inspection & Resume Preview */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 relative overflow-hidden">
            
            {/* Modal Top Header */}
            <div className="p-6 sm:p-7 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-extrabold text-base flex items-center justify-center shadow-md shadow-blue-500/20">
                  {formatDisplayName(selectedCandidate.name).split(" ").map(n => n[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    {formatDisplayName(selectedCandidate.name)}
                  </h2>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedCandidate.location || "Location not provided"}</span>
                    <span className="text-slate-300">•</span>
                    <span>{selectedCandidate.years_experience || 0} yrs exp</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 pr-2">
                <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {selectedCandidate.score}% Match
                </span>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="p-2 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Sub-Tabs: Overview vs Resume Document */}
            <div className="flex items-center space-x-2 px-6 pt-3 border-b border-slate-100 bg-white">
              <button
                onClick={() => setModalTab("overview")}
                className={`py-2.5 px-4 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all border-b-2 ${
                  modalTab === "overview"
                    ? "border-blue-600 text-blue-700 bg-blue-50/70"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Profile Overview</span>
              </button>

              <button
                onClick={() => setModalTab("resume")}
                className={`py-2.5 px-4 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all border-b-2 ${
                  modalTab === "resume"
                    ? "border-purple-600 text-purple-700 bg-purple-50/70"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Original Resume Document</span>
                {resumeData?.filename && (
                  <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-200/60 text-purple-800 uppercase">
                    {resumeData.file_type || "DOC"}
                  </span>
                )}
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 sm:p-7 overflow-y-auto flex-1 space-y-6">
              
              {/* TAB 1: OVERVIEW */}
              {modalTab === "overview" && (
                <div className="space-y-6">
                  {/* Contact Details with Copy */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-slate-600 truncate">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{selectedCandidate.email || "No email available"}</span>
                      </div>
                      {selectedCandidate.email && (
                        <button
                          onClick={() => copyToClipboard(selectedCandidate.email, "email")}
                          className="p-1 text-slate-400 hover:text-blue-600"
                        >
                          {copiedField === "email" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-slate-600 truncate">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{selectedCandidate.mobile_number || "No phone listed"}</span>
                      </div>
                      {selectedCandidate.mobile_number && (
                        <button
                          onClick={() => copyToClipboard(selectedCandidate.mobile_number, "phone")}
                          className="p-1 text-slate-400 hover:text-blue-600"
                        >
                          {copiedField === "phone" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Experience and Roles */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Work Experience & Past Positions
                    </h4>
                    <p className="text-sm font-semibold text-slate-800 mb-2">
                      Total Professional Experience: {selectedCandidate.years_experience || 0} years
                    </p>
                    {selectedCandidate.prev_roles?.length > 0 ? (
                      <ul className="space-y-1.5">
                        {selectedCandidate.prev_roles.map((role, idx) => (
                          <li key={idx} className="text-xs text-slate-600 flex items-start space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                            <span>{role}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400">No specific previous roles listed.</p>
                    )}
                  </div>

                  {/* Skills Full Breakdown */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Identified Candidate Skills
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedCandidate.skills || []).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ORIGINAL RESUME PREVIEW */}
              {modalTab === "resume" && (
                <div className="space-y-4">
                  {loadingResume ? (
                    <div className="py-16 text-center space-y-3">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                      <p className="text-xs font-semibold text-slate-500">Loading original candidate resume...</p>
                    </div>
                  ) : (
                    <>
                      {/* Document Toolbar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700 truncate">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            resumeData?.file_type === 'pdf' ? 'bg-red-100 text-red-700 border border-red-200' :
                            resumeData?.file_type?.includes('doc') ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {resumeData?.file_type?.toUpperCase() || 'FILE'}
                          </span>
                          <span className="truncate max-w-xs">{resumeData?.filename || "Resume Document"}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          {/* Toggle between embedded document and text for PDF */}
                          {resumeData?.file_type === 'pdf' && (
                            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-medium">
                              <button
                                onClick={() => setDocViewMode("document")}
                                className={`px-2.5 py-1 rounded-md transition-all ${
                                  docViewMode === "document" ? "bg-white text-slate-900 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
                                }`}
                              >
                                PDF View
                              </button>
                              <button
                                onClick={() => setDocViewMode("text")}
                                className={`px-2.5 py-1 rounded-md transition-all ${
                                  docViewMode === "text" ? "bg-white text-slate-900 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
                                }`}
                              >
                                Text View
                              </button>
                            </div>
                          )}

                          {resumeData?.text && (
                            <button
                              onClick={() => copyToClipboard(resumeData.text, "resumeText")}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 flex items-center space-x-1"
                            >
                              {copiedField === "resumeText" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedField === "resumeText" ? "Copied" : "Copy Text"}</span>
                            </button>
                          )}

                          <a
                            href={`http://localhost:8000/resume/${selectedCandidate.document_id}/download`}
                            download
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download {resumeData?.file_type?.toUpperCase() || 'File'}</span>
                          </a>
                        </div>
                      </div>

                      {/* PDF Embedded View */}
                      {resumeData?.file_type === 'pdf' && docViewMode === "document" ? (
                        <div className="w-full h-[58vh] rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                          <iframe
                            src={`http://localhost:8000/resume/${selectedCandidate.document_id}/raw#toolbar=1`}
                            className="w-full h-full border-none"
                            title="Candidate Resume PDF"
                          />
                        </div>
                      ) : (
                        /* Document Text/Paragraphs View */
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm max-h-[58vh] overflow-y-auto space-y-3 font-sans text-xs text-slate-800 leading-relaxed selection:bg-purple-100">
                          {resumeData?.paragraphs?.length > 0 ? (
                            resumeData.paragraphs.map((para, idx) => (
                              <p key={idx} className="leading-relaxed">
                                {para}
                              </p>
                            ))
                          ) : (
                            <p className="whitespace-pre-wrap">{resumeData?.text || "No text content found for this resume."}</p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

            </div>

            {/* Modal Bottom Footer */}
            <div className="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => navigate(`/profile/${selectedCandidate.document_id}`)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5"
              >
                <span>Open Full Profile View</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
