import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft, Mail, Phone, MapPin, Briefcase, Award, Check, Copy, User, Calendar, FileText, Download, Loader2
} from "lucide-react";
import { formatDisplayName } from "../utils/formatters";

const ProfilePage = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "resume"
  const [docViewMode, setDocViewMode] = useState("document"); // "document" | "text"
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileAndResume = async () => {
      try {
        setLoading(true);
        const [profileRes, resumeRes] = await Promise.all([
          axios.get(`http://localhost:8000/profile/${id}`),
          axios.get(`http://localhost:8000/resume/${id}/preview`).catch(() => null)
        ]);
        setProfile(profileRes.data);
        if (resumeRes) setResumeData(resumeRes.data);
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndResume();
  }, [id]);

  const copyToClipboard = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-500 font-semibold text-sm">
          Loading candidate profile...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Profile Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">The requested candidate profile could not be retrieved.</p>
        <button
          onClick={() => navigate("/app")}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Back Button */}
        <button
          onClick={() => navigate("/app")}
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Search Candidates</span>
        </button>

        {/* Profile Card Header */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                {formatDisplayName(profile.name).split(" ").map(n => n[0]).slice(0, 2).join("")}
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900">{formatDisplayName(profile.name)}</h1>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{profile.location || "Location not specified"}</span>
                  <span className="text-slate-300">•</span>
                  <span>ID: {profile.document_id}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {profile.score > 0 && (
                <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-center sm:text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Match Score</p>
                  <p className="text-2xl font-black">{profile.score}%</p>
                </div>
              )}

              {resumeData?.has_file && (
                <a
                  href={`http://localhost:8000/resume/${profile.document_id}/download`}
                  download
                  className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Resume</span>
                </a>
              )}
            </div>

          </div>

          {/* Contact Actions Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center space-x-2.5 truncate">
                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700 truncate">{profile.email || "No email listed"}</span>
              </div>
              {profile.email && (
                <button
                  onClick={() => copyToClipboard(profile.email, "email")}
                  className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {copiedField === "email" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center space-x-2.5 truncate">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700 truncate">{profile.mobile_number || "No phone listed"}</span>
              </div>
              {profile.mobile_number && (
                <button
                  onClick={() => copyToClipboard(profile.mobile_number, "phone")}
                  className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {copiedField === "phone" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* View Selection Tabs */}
        <div className="flex items-center space-x-2 bg-slate-200/60 p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "overview"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Structured Profile
          </button>
          <button
            onClick={() => setActiveTab("resume")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === "resume"
                ? "bg-white text-purple-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Original Resume Document</span>
          </button>
        </div>

        {/* RESUME DOCUMENT VIEW */}
        {activeTab === "resume" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                  resumeData?.file_type === 'pdf' ? 'bg-red-100 text-red-700 border border-red-200' :
                  resumeData?.file_type?.includes('doc') ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-slate-200 text-slate-700'
                }`}>
                  {resumeData?.file_type?.toUpperCase() || 'FILE'}
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{resumeData?.filename || "Resume Preview"}</h3>
                  <p className="text-[11px] text-slate-400">Original uploaded applicant document</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* PDF View Mode Toggle */}
                {resumeData?.file_type === 'pdf' && (
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                    <button
                      onClick={() => setDocViewMode("document")}
                      className={`px-3 py-1 rounded-md transition-all ${
                        docViewMode === "document" ? "bg-white text-slate-900 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      PDF View
                    </button>
                    <button
                      onClick={() => setDocViewMode("text")}
                      className={`px-3 py-1 rounded-md transition-all ${
                        docViewMode === "text" ? "bg-white text-slate-900 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Text View
                    </button>
                  </div>
                )}

                {resumeData?.text && (
                  <button
                    onClick={() => copyToClipboard(resumeData.text, "fullResume")}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center space-x-1.5"
                  >
                    {copiedField === "fullResume" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === "fullResume" ? "Copied" : "Copy Text"}</span>
                  </button>
                )}

                <a
                  href={`http://localhost:8000/resume/${id}/download`}
                  download
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download {resumeData?.file_type?.toUpperCase() || 'File'}</span>
                </a>
              </div>
            </div>

            {/* Embedded PDF View */}
            {resumeData?.file_type === 'pdf' && docViewMode === "document" ? (
              <div className="w-full h-[65vh] rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                <iframe
                  src={`http://localhost:8000/resume/${id}/raw#toolbar=1`}
                  className="w-full h-full border-none"
                  title="Candidate Resume PDF"
                />
              </div>
            ) : (
              /* Clean Document Paragraphs View */
              <div className="p-6 sm:p-8 bg-slate-50/60 rounded-2xl border border-slate-200/80 font-sans text-xs text-slate-800 leading-relaxed space-y-3 max-h-[65vh] overflow-y-auto selection:bg-purple-100">
                {resumeData?.paragraphs?.length > 0 ? (
                  resumeData.paragraphs.map((para, idx) => (
                    <p key={idx} className="leading-relaxed">
                      {para}
                    </p>
                  ))
                ) : (
                  <p className="whitespace-pre-wrap">{resumeData?.text || "No preview available for this document."}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* STRUCTURED PROFILE VIEW */}
        {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Work Experience Timeline */}
          <div className="md:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Career & Experience History</h2>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Total Professional Experience</p>
                <p className="text-xl font-black text-slate-800 mt-0.5">{profile.years_experience || 0} Years</p>
              </div>
              <Calendar className="w-6 h-6 text-slate-300" />
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Roles & Responsibilities</h3>
              {profile.prev_roles?.length > 0 ? (
                <div className="space-y-3">
                  {profile.prev_roles.map((role, idx) => (
                    <div key={idx} className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50/60 border border-slate-100">
                      <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                      <p className="text-xs font-medium text-slate-700 leading-relaxed">{role}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No previous roles documented.</p>
              )}
            </div>
          </div>

          {/* Sourced Skills */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-purple-600" />
              <h2 className="text-base font-bold text-slate-900">Skills & Competencies</h2>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {profile.skills?.length > 0 ? (
                profile.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-100"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-400">No skills listed.</p>
              )}
            </div>
          </div>

        </div>
        )}

      </div>
    </div>
  );
};

export default ProfilePage;
