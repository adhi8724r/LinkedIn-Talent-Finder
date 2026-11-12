import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  FileText, Search, BarChart3, Briefcase, User, LogOut, ShieldCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import InputPage from "./input";
import SearchResults from "./SearchResults";
import Dashboard from "./dashboard";
import AdminPortal from "./AdminPortal";

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
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

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
      { name: 'Dashboard', icon: BarChart3, color: 'emerald' }
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
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl py-2 z-50 border border-slate-100 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2">
                    <p className="text-xs font-semibold text-slate-900">{user?.name || "Recruiter Account"}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition-colors"
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
        {activeTab === 'Admin Portal' && (
          <AdminPortal onTabChange={setActiveTab} />
        )}
      </main>
    </div>
  );
};

export default TabLayout;
