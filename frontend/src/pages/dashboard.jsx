import React, { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Award, Briefcase, Users, Sparkles, BarChart2 } from "lucide-react";

export default function Dashboard({ results = [] }) {
  // Sorted candidates for charts
  const sortedProfiles = useMemo(() => {
    return [...results].sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [results]);

  // Score Bar Data (top 10)
  const barData = useMemo(() => {
    return sortedProfiles.slice(0, 10).map((p) => ({
      name: p.name ? p.name.split(" ")[0] : p.document_id,
      fullName: p.name,
      score: Math.round(p.score || 0),
      experience: p.years_experience || 0
    }));
  }, [sortedProfiles]);

  // Top Skills Frequency distribution
  const topSkillsData = useMemo(() => {
    const counts = {};
    results.forEach((p) => {
      (p.skills || []).forEach((s) => {
        const skill = s.trim();
        if (skill) counts[skill] = (counts[skill] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [results]);

  // Experience bracket distribution
  const expDistribution = useMemo(() => {
    let entry = 0, mid = 0, senior = 0;
    results.forEach((p) => {
      const exp = Number(p.years_experience) || 0;
      if (exp < 2) entry++;
      else if (exp <= 5) mid++;
      else senior++;
    });

    return [
      { name: "Entry (< 2 yrs)", value: entry, color: "#3B82F6" },
      { name: "Mid-Level (2-5 yrs)", value: mid, color: "#6366F1" },
      { name: "Senior (5+ yrs)", value: senior, color: "#10B981" }
    ].filter(d => d.value > 0);
  }, [results]);

  // If results is empty, display a clean placeholder
  if (!results.length) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-xl mx-auto my-12 space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <BarChart2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">No Analytics to Display</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Search for talent in the Job Description tab to view comparative candidate score rankings, skill distributions, and experience analytics.
        </p>
      </div>
    );
  }

  // KPI Metrics
  const highestMatch = Math.round(sortedProfiles[0]?.score || 0);
  const avgExperience = (
    results.reduce((acc, curr) => acc + (Number(curr.years_experience) || 0), 0) / results.length
  ).toFixed(1);
  const highFitCount = results.filter((r) => (r.score || 0) >= 80).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Talent Pool Analytics & Insights
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Comparative evaluation of the top {results.length} shortlisted candidates
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top Match</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{highestMatch}%</p>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[140px]">{sortedProfiles[0]?.name}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Experience</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{avgExperience} <span className="text-xs text-slate-400 font-normal">years</span></p>
            <p className="text-[11px] text-slate-500 mt-0.5">Across all matches</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">High Match Pool</p>
            <p className="text-2xl font-black text-purple-600 mt-1">{highFitCount} <span className="text-xs text-slate-400 font-normal">candidates</span></p>
            <p className="text-[11px] text-slate-500 mt-0.5">Score ≥ 80%</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Evaluated</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{results.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Shortlisted for review</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Match Score Ranking Bar Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1">
              Top 10 Candidate Match Scores (%)
            </h3>
            <p className="text-xs text-slate-400 mb-6">Objective score based on skill and role alignment</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} interval={0} angle={-25} textAnchor="end" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-lg space-y-0.5">
                          <p className="font-bold">{data.fullName}</p>
                          <p className="text-emerald-400">Score: {data.score}%</p>
                          <p className="text-slate-300">Experience: {data.experience} yrs</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="score" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill Prevalence Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1">
              Most Prevalent Candidate Skills
            </h3>
            <p className="text-xs text-slate-400 mb-6">Top skills present among shortlisted profiles</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSkillsData} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis dataKey="skill" type="category" tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2 rounded-xl text-xs shadow-lg">
                          <p className="font-bold">{d.skill}</p>
                          <p className="text-blue-400">Profiles: {d.count}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="#6366F1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Experience Distribution */}
      {expDistribution.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Experience Level Breakdown
            </h3>
            <p className="text-xs text-slate-400">Seniority distribution across shortlisted candidates</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {expDistribution.map((item) => (
              <div key={item.name} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">{item.name}</p>
                  <p className="text-xl font-bold text-slate-800 mt-1">{item.value} candidate{item.value > 1 ? 's' : ''}</p>
                </div>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
