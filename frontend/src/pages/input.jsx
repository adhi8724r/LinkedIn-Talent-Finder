import React, { useState, useCallback, useEffect } from 'react';
import {
  FileText, Zap, Sparkles, Sliders, CheckCircle2, Loader2, ArrowRight, Clock, Trash2, RotateCcw
} from 'lucide-react';
import axios from 'axios';

// Time formatting helper
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

// Preset Job Description Templates for quick 1-click testing
const PRESET_ROLES = [
  {
    title: "Full Stack Engineer",
    skills: ["React", "FastAPI", "PostgreSQL", "Node.js", "Docker"],
    desc: "We are seeking a Full Stack Software Engineer proficient in React, modern JavaScript/TypeScript, Python, FastAPI, and PostgreSQL. Experience with Docker, RESTful microservices, and CI/CD pipelines is strongly preferred."
  },
  {
    title: "AI / ML Engineer",
    skills: ["Python", "PyTorch", "NLP", "LangChain", "Vector DBs"],
    desc: "Looking for an AI/ML Engineer to build generative AI and semantic retrieval pipelines. Must have solid hands-on experience with Python, PyTorch, LangChain, vector databases (like Qdrant/Pinecone), and LLM prompt engineering."
  },
  {
    title: "DevOps / Cloud Specialist",
    skills: ["AWS", "Kubernetes", "Docker", "Terraform", "CI/CD"],
    desc: "Seeking a DevOps Specialist with expertise in AWS, Kubernetes container orchestration, Docker, and Terraform infrastructure as code. Proven experience in automating zero-downtime deployment pipelines required."
  },
  {
    title: "Data Scientist",
    skills: ["Python", "Pandas", "Scikit-Learn", "SQL", "Statistics"],
    desc: "Seeking a Data Scientist with strong statistical modeling, SQL, Python, Pandas, and Scikit-Learn background. Responsible for building predictive pipelines and extracting business intelligence from large-scale datasets."
  }
];

const POPULAR_SKILLS = [
  "React", "Python", "FastAPI", "PostgreSQL", "Qdrant", "Machine Learning", 
  "Docker", "TypeScript", "AWS", "NLP", "LangChain"
];

export default function InputPage({ onTabChange, jobDescription, setJobDescription, setSearchResults }) {
  const [topk, setTopK] = useState(10);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStep, setSearchStep] = useState(0);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const steps = [
    "Analyzing Job Description & Key Competencies",
    "Querying Vector Embeddings in Qdrant",
    "Running LLM Semantic Scoring via Groq Llama 3.3"
  ];

  const fetchHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:8000/searches/history", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setRecentSearches(res.data || []);
    } catch (err) {
      console.warn("Could not load search history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleLoadSavedSearch = async (searchItem) => {
    try {
      setIsSearching(true);
      const res = await axios.get(`http://localhost:8000/searches/history/${searchItem.id}`);
      setJobDescription(res.data.job_description || searchItem.job_description);
      setSearchResults(res.data.results || []);
      onTabChange('Search Results');
    } catch (err) {
      console.error("Failed to load saved search:", err);
      alert("Could not load saved search. Please try re-running the search.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeleteSavedSearch = async (e, searchId) => {
    e.stopPropagation();
    try {
      await axios.delete(`http://localhost:8000/searches/history/${searchId}`);
      setRecentSearches((prev) => prev.filter((s) => s.id !== searchId));
    } catch (err) {
      console.error("Failed to delete search history:", err);
    }
  };

  const handleDescriptionChange = useCallback((e) => {
    setJobDescription(e.target.value);
  }, [setJobDescription]);

  const appendSkill = (skill) => {
    if (!jobDescription.toLowerCase().includes(skill.toLowerCase())) {
      setJobDescription((prev) => (prev ? `${prev}, ${skill}` : skill));
    }
  };

  const loadPreset = (preset) => {
    setJobDescription(preset.desc);
  };

  const handleSmartSearch = async (e) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      alert("Please enter a job description or select one of the quick templates.");
      return;
    }

    setIsSearching(true);
    setSearchStep(0);

    // Simulate multi-step feedback for recruiter transparency
    const stepTimer1 = setTimeout(() => setSearchStep(1), 700);
    const stepTimer2 = setTimeout(() => setSearchStep(2), 1600);

    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const response = await axios.post("http://localhost:8000/search", {
        job_description: jobDescription,
        top_k: topk
      }, { headers });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setSearchResults(response.data);
      fetchHistory(); // refresh history list
      onTabChange('Search Results');
    } catch (err) {
      console.error(err);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      const errMsg = err.response?.data?.detail || "Search request failed. Ensure the backend server is running.";
      alert(errMsg);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-500/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Talent Discovery Pipeline</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Source & Rank Top Candidates with Precision
          </h1>
          <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
            Provide a job description to initiate semantic vector retrieval and automated multi-stage LLM evaluation against candidate profiles.
          </p>
        </div>
      </div>

      {/* 1-Click Role Presets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Quick Start Role Presets</span>
          </h3>
          <span className="text-xs text-slate-400">Click any card to auto-fill</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_ROLES.map((role) => (
            <button
              key={role.title}
              type="button"
              onClick={() => loadPreset(role)}
              className="text-left p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-slate-800 group-hover:text-blue-600 transition-colors">
                  {role.title}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {role.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Searches / Saved Search History */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-800">Recent Searches & Saved Runs</h3>
          </div>
          {recentSearches.length > 0 ? (
            <span className="text-xs text-slate-400 font-medium">Click to reload past results instantly</span>
          ) : (
            <span className="text-xs text-slate-400 font-medium">History is tracked automatically</span>
          )}
        </div>

        {recentSearches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentSearches.slice(0, 6).map((search) => (
              <div
                key={search.id}
                onClick={() => handleLoadSavedSearch(search)}
                className="group relative p-4 rounded-2xl bg-slate-50 hover:bg-purple-50/60 border border-slate-200/80 hover:border-purple-300 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-700 line-clamp-1">
                      {search.job_title || "Talent Search"}
                    </h4>
                    <button
                      onClick={(e) => handleDeleteSavedSearch(e, search.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-opacity p-0.5"
                      title="Delete from history"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {search.job_description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span className="text-purple-700 font-bold bg-purple-100/70 px-2 py-0.5 rounded-md">
                    {search.match_count} matches
                  </span>
                  <span>{formatTimeAgo(search.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50/60 border border-dashed border-slate-200 text-center space-y-1">
            <p className="text-xs font-semibold text-slate-600">No saved searches yet</p>
            <p className="text-[11px] text-slate-400">
              Run your first AI search below or pick a Quick Start preset — your shortlist and timestamps will be saved here automatically!
            </p>
          </div>
        )}
      </div>

      {/* Main Sourcing Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center space-x-2 text-base font-bold text-slate-800">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Job Description & Requirements</span>
            </label>
            <span className="text-xs text-slate-400 font-mono">
              {jobDescription.length} characters
            </span>
          </div>

          <textarea
            value={jobDescription}
            onChange={handleDescriptionChange}
            placeholder="Paste your job description, required technical competencies, responsibilities, and years of experience here..."
            rows={7}
            className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-slate-800 text-sm leading-relaxed placeholder-slate-400 transition-all resize-none bg-slate-50/50"
          />

          {/* Skill Insertion Chips */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-1.5">Add skills:</span>
            {POPULAR_SKILLS.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => appendSkill(skill)}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 hover:bg-blue-100 hover:text-blue-700 transition-colors"
              >
                + {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Sliders className="w-4 h-4 text-slate-400" />
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Top Candidates to Shortlist (Top K)
              </label>
              <div className="flex items-center space-x-3 mt-1.5">
                <input
                  type="range"
                  min={3}
                  max={30}
                  step={1}
                  value={topk}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  className="w-36 accent-blue-600"
                />
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  {topk} Profiles
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSmartSearch}
            disabled={isSearching}
            className="px-8 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Running Pipeline...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>Run AI Talent Search</span>
              </>
            )}
          </button>
        </div>

        {/* Live Search Status Progress */}
        {isSearching && (
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-800">
              Pipeline Execution in Progress:
            </p>
            <div className="space-y-1.5">
              {steps.map((st, idx) => (
                <div key={st} className="flex items-center space-x-2 text-xs">
                  {searchStep > idx ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : searchStep === idx ? (
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300" />
                  )}
                  <span className={searchStep >= idx ? "font-semibold text-slate-800" : "text-slate-400"}>
                    {st}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
