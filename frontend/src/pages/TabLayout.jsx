import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  FileText, Search, BarChart3, Briefcase, User, LogOut, ShieldCheck,
  Clock, X, Mail, Phone, Trash2, ArrowRight, CheckCircle2, Loader2, Building2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import InputPage from "./input";
import SearchResults from "./SearchResults";
import Dashboard from "./dashboard";
import AdminPortal from "./AdminPortal";

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffSecs = Math.floor((now - date) / 1000);
  if (diffSecs < 60) return "Just now";
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const TabButton = ({ tab, isActive, onClick, badge }) => {
  const getTabStyles = useCallback((color) => ({
    blue: 'border-blue-600 text-blue-700 bg-blue-50/70 shadow-sm',
    purple: 'border-purple-600 text-purple-700 bg-purple-50/70 shadow-sm',
    emerald: 'border-emerald-600 text-emerald-700 bg-emerald-50/70 shadow-sm',
    rose: 'border-rose-600 text-rose-700 bg-rose-50/70 shadow-sm',
  }[color]), []);

  const getIconStyles = useCallback((color) => ({
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    emerald: 'text-emerald-600',
    rose: 'text-rose-600',
  }[color]), []);

  return (
    <button
      onClick={() => onClick(tab.name)}
      className={`relative py-3.5 px-5 rounded-xl font-semibold text-sm flex items-center space-x-2.5 transition-all duration-200 border-2 ${
        isActive
          ? getTabStyles(tab.color)
          : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-white/60'
      }`}
    >
      <tab.icon className={`w-4 h-4 ${isActive ? getIconStyles(tab.color) : 'text-gray-400'}`} />
      <span>{tab.name}</span>
      {badge !== undefined && badge > 0 && (
        <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
          isActive ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
};

const TabLayout = () => {
  const [searchResults, setSearchResults] = useState(() => {
    try {
      const saved = sessionStorage.getItem("tf_search_results");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [jobDescription, setJobDescription] = useState(() => {
    return sessionStorage.getItem("tf_job_description") || "";
  });

  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = sessionStorage.getItem("tf_active_tab");
    if (savedTab) return savedTab;
    try {
      const saved = sessionStorage.getItem("tf_search_results");
      if (saved && JSON.parse(saved).length > 0) return "Search Results";
    } catch {
      // fallback
    }
    return "Job Description";
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch search history for user
  const fetchUserHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/searches/history", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data || []);
      }
    } catch (err) {
      console.warn("Could not load history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (isHistoryModalOpen || activeTab === 'History') {
      fetchUserHistory();
    }
  }, [isHistoryModalOpen, activeTab, fetchUserHistory]);



  const handleLoadHistorySearch = async (historyId) => {
    try {
      const res = await fetch(`http://localhost:8000/searches/history/${historyId}`);
      if (res.ok) {
        const data = await res.json();
        setJobDescription(data.job_description || "");
        setSearchResults(data.results || []);
        setActiveTab("Search Results");
        setIsHistoryModalOpen(false);
      }
    } catch (err) {
      console.error("Failed to load search:", err);
    }
  };

  const handleDeleteHistory = async (e, historyId) => {
    e.stopPropagation();
    try {
      const res = await fetch(`http://localhost:8000/searches/history/${historyId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setHistoryList((prev) => prev.filter((h) => h.id !== historyId));
      }
    } catch (err) {
      console.error("Failed to delete history item:", err);
    }
  };

  // Persist search state across page reloads and route navigation
  useEffect(() => {
    try {
      sessionStorage.setItem("tf_search_results", JSON.stringify(searchResults));
    } catch (e) {
      console.warn("Could not save search results to session storage", e);
    }
  }, [searchResults]);

  useEffect(() => {
    sessionStorage.setItem("tf_job_description", jobDescription);
  }, [jobDescription]);

  useEffect(() => {
    sessionStorage.setItem("tf_active_tab", activeTab);
  }, [activeTab]);

  const isAdmin = user?.role === 'admin' || localStorage.getItem('role') === 'admin';

  const tabs = useMemo(() => {
    const list = [
      { name: 'Job Description', icon: FileText, color: 'blue' },
      { name: 'Search Results', icon: Search, color: 'purple' },
      { name: 'Dashboard', icon: BarChart3, color: 'emerald' },
      { name: 'History', icon: Clock, color: 'purple' }
    ];
    if (isAdmin) {
      list.push({ name: 'Admin Portal', icon: ShieldCheck, color: 'rose' });
    }
    return list;
  }, [isAdmin]);

  // Fetch logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("http://localhost:8000/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data);
          if (data.role) {
            localStorage.setItem("role", data.role);
          }
        }
      } catch (err) {
        console.error("Auth fetch failed:", err);
      }
    };

    fetchUser();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    sessionStorage.removeItem("tf_search_results");
    sessionStorage.removeItem("tf_job_description");
    sessionStorage.removeItem("tf_active_tab");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo & Name */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate("/")}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-slate-900 text-lg tracking-tight">TalentFinder</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 tracking-wide uppercase">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">LinkedIn Sourcing & Matching</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center space-x-1 bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/60">
              {tabs.map((tab) => (
                <TabButton
                  key={tab.name}
                  tab={tab}
                  isActive={activeTab === tab.name}
                  onClick={setActiveTab}
                  badge={tab.name === 'Search Results' ? searchResults.length : undefined}
                />
              ))}
            </nav>

            {/* User Profile / Auth State */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2.5 p-1.5 pr-3 rounded-full hover:bg-slate-100 transition-colors border border-slate-200"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  {user?.name ? user.name[0].toUpperCase() : <User className="w-4 h-4" />}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">
                    {user?.name || "Recruiter"}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    {user?.email || "Signed In"}
                  </p>
                </div>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl py-2 z-50 border border-slate-100 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 truncate">{user?.name || "Account"}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        user?.role === 'admin' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user?.role === 'admin' ? 'Admin' : 'Recruiter'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{user?.email}</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => { setDropdownOpen(false); setIsProfileModalOpen(true); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5 transition-colors"
                    >
                      <User className="w-4 h-4 text-blue-600" />
                      <span>Profile</span>
                    </button>

                    <button
                      onClick={() => { setDropdownOpen(false); setActiveTab("History"); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2.5 transition-colors"
                    >
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span>History</span>
                    </button>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center space-x-2.5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Main Tab View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'Job Description' && (
          <InputPage
            activeTab={activeTab}
            onTabChange={setActiveTab}
            jobDescription={jobDescription}
            setJobDescription={setJobDescription}
            setSearchResults={setSearchResults}
          />
        )}
        {activeTab === 'Search Results' && (
          <SearchResults results={searchResults} onTabChange={setActiveTab} />
        )}
        {activeTab === 'Dashboard' && (
          <Dashboard results={searchResults} />
        )}
        {activeTab === 'History' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header banner */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Search History & Saved Shortlists</h1>
                  <p className="text-xs text-slate-500 mt-1">Review past talent searches, matching results, and reload previous candidate shortlists in one click.</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
                  {historyList.length} Searches Recorded
                </span>
              </div>
            </div>

            {/* List */}
            {loadingHistory ? (
              <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm space-y-3">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
                <p className="text-xs text-slate-500 font-medium">Fetching historical talent searches...</p>
              </div>
            ) : historyList.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Clock className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No searches recorded yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  When you input a job description and search for candidates, the query and ranked candidate list are permanently preserved here.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('Job Description')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Start New Talent Search
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {historyList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleLoadHistorySearch(item.id)}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 line-clamp-1">
                            {item.job_title || "Talent Search"}
                          </h3>
                        </div>
                        <button
                          onClick={(e) => handleDeleteHistory(e, item.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-opacity p-1 rounded-lg hover:bg-red-50"
                          title="Remove from history"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                        {item.job_description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-purple-700 font-bold bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                        {item.match_count} Matches Qualified
                      </span>
                      <div className="flex items-center space-x-3 text-slate-400 font-medium text-[11px]">
                        <span>{formatTimeAgo(item.created_at)}</span>
                        <span className="text-purple-600 font-bold group-hover:underline flex items-center gap-1">
                          Reload Candidates <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'Admin Portal' && (
          <AdminPortal onTabChange={setActiveTab} />
        )}
      </main>

      {/* USER PROFILE MODAL */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white relative">
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="absolute top-5 right-5 p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center space-x-3.5">
                <div className="w-14 h-14 rounded-2xl bg-white text-indigo-700 font-extrabold text-xl flex items-center justify-center shadow-md">
                  {user?.name ? user.name[0].toUpperCase() : "U"}
                </div>
                <div>
                  <h3 className="text-lg font-bold leading-tight">{user?.name || "User Profile"}</h3>
                  <p className="text-xs text-blue-100 mt-0.5">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Profile Info Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Full Name:
                  </span>
                  <span className="font-bold text-slate-900">{user?.name || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" /> Organization:
                  </span>
                  <span className="font-bold text-slate-900">{user?.organization || "Independent"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Email:
                  </span>
                  <span className="font-bold text-slate-900">{user?.email || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Mobile:
                  </span>
                  <span className="font-bold text-slate-900">{user?.number || "N/A"}</span>
                </div>
              </div>

              {/* Fixed Role Card */}
              <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Account Access Level:</span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                    user?.role === 'admin' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}>
                    {user?.role === 'admin' ? '👑 Administrator' : '💼 Recruiter'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {user?.role === 'admin' 
                    ? 'Administrator account with talent pool ingestion, recruiter oversight, and system management privileges.' 
                    : 'Recruiter account with talent search, AI semantic ranking, and shortlisting privileges.'}
                </p>
                <div className="pt-1 flex items-center space-x-1.5 text-[10px] text-slate-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Role is fixed and assigned by system administration.</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEARCH HISTORY MODAL */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Historical Searches & Shortlists</h3>
                  <p className="text-xs text-slate-400">All search runs logged for {user?.email || "this profile"}</p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-3 flex-1">
              {loadingHistory ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600" />
                  <p className="text-xs">Loading search history...</p>
                </div>
              ) : historyList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-1">
                  <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-700">No searches recorded yet</p>
                  <p className="text-[11px] text-slate-400">Run searches on the Job Description tab to save candidate shortlists here automatically.</p>
                </div>
              ) : (
                historyList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleLoadHistorySearch(item.id)}
                    className="p-4 rounded-2xl bg-slate-50/70 hover:bg-purple-50/60 border border-slate-200/80 hover:border-purple-300 transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-700 line-clamp-1">
                          {item.job_title || "Talent Search"}
                        </h4>
                        <button
                          onClick={(e) => handleDeleteHistory(e, item.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-opacity p-1"
                          title="Remove from history"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {item.job_description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-purple-700 font-bold bg-purple-100/70 px-2 py-0.5 rounded-md">
                        {item.match_count} Matches Qualified
                      </span>
                      <div className="flex items-center space-x-2 text-slate-400 font-medium">
                        <span>{formatTimeAgo(item.created_at)}</span>
                        <span className="text-purple-600 font-semibold group-hover:underline flex items-center gap-0.5">
                          Reload <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">
                {historyList.length} search runs saved
              </span>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabLayout;
