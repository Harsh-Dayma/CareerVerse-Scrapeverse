"use client";

import { useEffect, useState, useMemo } from "react";
import { Sidebar } from "@/components/sidebar";
import {
  FileText,
  CheckCircle2,
  Plus,
  X,
  Building,
  Search,
  CheckSquare,
  Square,
  Shield,
  Upload,
  User,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CompanyItem = {
  id: number;
  name: string;
  slug: string;
  domain: string;
  hqLocation?: string;
  careersUrl: string;
  isMonitored: boolean;
  scraperStatus: string;
  extractionScore: number;
  lastRunAt: string | null;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [pastedText, setPastedText] = useState("");

  // Monitored Companies State (Section 73.20)
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [companySearch, setCompanySearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState<"ALL" | "MONITORED" | "UNMONITORED">("ALL");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  function loadProfile() {
    setLoading(true);
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setName(data.name || "");
        setRole(data.role || "");
        setExperience(data.experience || "");
        setEducation(data.education || "");
        setSkills(data.skills || []);
        if (data.companies) {
          setCompanies(data.companies);
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
        loadProfile();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handlePasteParse() {
    if (!pastedText.trim()) return;
    setSaving(true);
    const formData = new FormData();
    formData.append("text", pastedText);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
        loadProfile();
      }
    } finally {
      setSaving(false);
    }
  }

  function toggleCompany(id: number) {
    setCompanies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isMonitored: !c.isMonitored } : c))
    );
  }

  async function handleSaveManual() {
    setSaving(true);
    const monitoredIds = companies.filter((c) => c.isMonitored).map((c) => c.id);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          role,
          experience,
          education,
          skills,
          monitoredCompanyIds: monitoredIds,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  function addSkill() {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  }

  function removeSkill(sk: string) {
    setSkills(skills.filter((s) => s !== sk));
  }

  // Filtered companies list
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(companySearch.toLowerCase()) ||
        c.domain.toLowerCase().includes(companySearch.toLowerCase());

      if (!matchSearch) return false;

      if (companyFilter === "MONITORED") return c.isMonitored;
      if (companyFilter === "UNMONITORED") return !c.isMonitored;
      return true;
    });
  }, [companies, companySearch, companyFilter]);

  const monitoredCount = companies.filter((c) => c.isMonitored).length;

  return (
    <div className="min-h-screen flex bg-background text-foreground font-sans transition-colors duration-150">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto overflow-y-auto space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b dark:border-zinc-800/80 border-zinc-200/90 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold dark:text-white text-zinc-900 tracking-tight">Candidate Profile & Radar Configuration</h1>
              <span className="text-[11px] font-mono dark:bg-cyan-950/60 bg-cyan-100 dark:text-cyan-400 text-cyan-800 border dark:border-cyan-500/30 border-cyan-200 px-2.5 py-0.5 rounded-full font-semibold">
                Profile Anchor
              </span>
            </div>
            <p className="text-xs dark:text-zinc-400 text-zinc-600 mt-1 font-mono">
              Deterministic matching preferences, skills, and monitored target companies
            </p>
          </div>

          <div className="flex items-center gap-3">
            {savedSuccess && (
              <div className="flex items-center gap-1.5 text-xs font-mono dark:text-emerald-400 text-emerald-700 dark:bg-emerald-950/50 bg-emerald-100 border dark:border-emerald-500/30 border-emerald-300 px-3 py-1.5 rounded-lg shadow-xs">
                <CheckCircle2 size={13} />
                Changes Saved to Database
              </div>
            )}
            <button
              onClick={handleSaveManual}
              disabled={saving}
              className="rounded-lg dark:bg-white bg-zinc-900 hover:dark:bg-zinc-200 hover:bg-zinc-800 dark:text-black text-white px-4 py-2 text-xs font-semibold disabled:opacity-50 transition-colors shadow-sm"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>

        {/* Two-Column Responsive Layout (Section 73.20 & 73.22) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Candidate Attributes & Ingestion (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Profile Attributes */}
            <div className="rounded-xl border dark:border-zinc-800/80 border-zinc-200/90 dark:bg-zinc-900/30 bg-white p-5 space-y-4 text-xs shadow-xs">
              <h2 className="text-xs font-bold dark:text-white text-zinc-900 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <User size={13} className="text-cyan-500" />
                Candidate Information
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="dark:text-zinc-400 text-zinc-600 font-medium">Candidate Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-lg border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-950 bg-slate-50 px-3 py-1.5 text-xs dark:text-white text-zinc-900 focus:outline-none dark:focus:border-zinc-700 focus:border-zinc-400"
                  />
                </div>

                <div>
                  <label className="dark:text-zinc-400 text-zinc-600 font-medium">Target Role Title</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="mt-1 w-full rounded-lg border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-950 bg-slate-50 px-3 py-1.5 text-xs dark:text-white text-zinc-900 focus:outline-none dark:focus:border-zinc-700 focus:border-zinc-400"
                  />
                </div>

                <div>
                  <label className="dark:text-zinc-400 text-zinc-600 font-medium">Experience Level</label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="mt-1 w-full rounded-lg border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-950 bg-slate-50 px-3 py-1.5 text-xs dark:text-white text-zinc-900 focus:outline-none dark:focus:border-zinc-700 focus:border-zinc-400"
                  />
                </div>

                <div>
                  <label className="dark:text-zinc-400 text-zinc-600 font-medium">Education</label>
                  <input
                    type="text"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    className="mt-1 w-full rounded-lg border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-950 bg-slate-50 px-3 py-1.5 text-xs dark:text-white text-zinc-900 focus:outline-none dark:focus:border-zinc-700 focus:border-zinc-400"
                  />
                </div>
              </div>

              {/* Skills */}
              <div className="pt-2 border-t dark:border-zinc-800/80 border-zinc-200">
                <label className="dark:text-zinc-400 text-zinc-600 font-medium">Candidate Skills & Tech</label>
                <div className="mt-2 flex items-center gap-1.5 flex-wrap max-h-36 overflow-y-auto">
                  {skills.map((sk) => (
                    <span
                      key={sk}
                      className="rounded-md dark:bg-zinc-950 bg-zinc-100 border dark:border-zinc-800 border-zinc-200 px-2 py-0.5 text-xs dark:text-zinc-300 text-zinc-800 font-mono flex items-center gap-1.5"
                    >
                      {sk}
                      <button onClick={() => removeSkill(sk)} className="dark:text-zinc-500 text-zinc-400 hover:dark:text-zinc-200 hover:text-zinc-800">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add skill (e.g. Docker, TypeScript)..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSkill()}
                    className="w-full rounded-lg border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-950 bg-slate-50 px-2.5 py-1.5 text-xs dark:text-white text-zinc-900 placeholder-zinc-400 focus:outline-none dark:focus:border-zinc-700 focus:border-zinc-400"
                  />
                  <button
                    onClick={addSkill}
                    className="rounded-lg border dark:border-zinc-700 border-zinc-300 dark:bg-zinc-800 bg-zinc-100 hover:dark:bg-zinc-700 hover:bg-zinc-200 p-2 dark:text-zinc-300 text-zinc-700 transition-colors shrink-0 shadow-xs"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Resume Ingestion Dropzone */}
            <div className="rounded-xl border dark:border-zinc-800/80 border-zinc-200/90 dark:bg-zinc-900/30 bg-white p-5 space-y-3 shadow-xs">
              <h2 className="text-xs font-bold dark:text-white text-zinc-900 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={13} className="text-emerald-500" />
                Resume Parser (Local)
              </h2>

              <div className="space-y-3">
                <label className="rounded-xl border border-dashed dark:border-zinc-700 border-zinc-300 dark:bg-zinc-950 bg-slate-50 p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:dark:border-cyan-500/50 hover:border-cyan-500 transition-colors group">
                  <Upload size={22} className="dark:text-zinc-400 text-zinc-500 mb-1.5 group-hover:text-cyan-500 transition-colors" />
                  <span className="text-xs font-semibold dark:text-white text-zinc-900">Upload Resume (PDF, DOCX, TXT)</span>
                  <span className="text-[10px] dark:text-zinc-500 text-zinc-500 mt-0.5">Instant local deterministic extraction</span>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <div className="flex flex-col gap-1.5">
                  <textarea
                    rows={3}
                    placeholder="Or paste resume experience text..."
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    className="w-full rounded-lg border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-950 bg-slate-50 p-2.5 text-xs dark:text-white text-zinc-900 placeholder-zinc-400 focus:outline-none dark:focus:border-zinc-700 focus:border-zinc-400"
                  />
                  <button
                    onClick={handlePasteParse}
                    disabled={saving || !pastedText.trim()}
                    className="self-end rounded-lg dark:bg-zinc-800 bg-zinc-100 hover:dark:bg-zinc-700 hover:bg-zinc-200 border dark:border-zinc-700 border-zinc-300 px-3 py-1.5 text-xs dark:text-zinc-200 text-zinc-800 font-medium transition-colors disabled:opacity-50 shadow-xs"
                  >
                    Extract Profile
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: MONITORED COMPANIES (Section 73.20) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-xl border dark:border-zinc-800/80 border-zinc-200/90 dark:bg-zinc-900/30 bg-white p-5 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b dark:border-zinc-800 border-zinc-200">
                <div>
                  <h2 className="text-sm font-bold dark:text-white text-zinc-900 tracking-tight flex items-center gap-2">
                    <Building size={16} className="text-blue-500" />
                    Monitored Target Companies
                  </h2>
                  <p className="text-[11px] dark:text-zinc-400 text-zinc-600 mt-0.5">
                    CareerVerse monitors career portals and matches positions for checked companies.
                  </p>
                </div>

                <div className="text-xs font-mono dark:text-zinc-400 text-zinc-600 dark:bg-zinc-950 bg-zinc-100 px-3 py-1 rounded-lg border dark:border-zinc-800 border-zinc-200 shrink-0">
                  Monitored: <span className="text-blue-500 font-bold">{monitoredCount}</span> / {companies.length}
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-2.5 top-2.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search companies (e.g. Nova, Vertex)..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    className="w-full rounded-lg border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-950 bg-slate-50 pl-8 pr-3 py-1.5 text-xs dark:text-white text-zinc-900 placeholder-zinc-400 focus:outline-none dark:focus:border-zinc-700 focus:border-zinc-400"
                  />
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center rounded-lg border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-950 bg-zinc-100 p-0.5 text-xs font-medium">
                  <button
                    onClick={() => setCompanyFilter("ALL")}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] transition-colors",
                      companyFilter === "ALL"
                        ? "dark:bg-zinc-800 bg-white dark:text-white text-zinc-900 font-semibold shadow-xs"
                        : "dark:text-zinc-400 text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-200"
                    )}
                  >
                    All ({companies.length})
                  </button>
                  <button
                    onClick={() => setCompanyFilter("MONITORED")}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] transition-colors",
                      companyFilter === "MONITORED"
                        ? "dark:bg-blue-500/20 bg-blue-100 text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
                        : "dark:text-zinc-400 text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-200"
                    )}
                  >
                    Monitored ({monitoredCount})
                  </button>
                  <button
                    onClick={() => setCompanyFilter("UNMONITORED")}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] transition-colors",
                      companyFilter === "UNMONITORED"
                        ? "dark:bg-zinc-800 bg-white dark:text-zinc-300 text-zinc-800 font-semibold shadow-xs"
                        : "dark:text-zinc-400 text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-200"
                    )}
                  >
                    Unmonitored ({companies.length - monitoredCount})
                  </button>
                </div>
              </div>

              {/* Companies List (Section 73.20) */}
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {filteredCompanies.map((c) => {
                  const isHealthy = c.scraperStatus === "HEALTHY" || c.scraperStatus === "RECOVERED";
                  const isFailed = c.scraperStatus === "FAILED";

                  return (
                    <div
                      key={c.id}
                      onClick={() => toggleCompany(c.id)}
                      className={cn(
                        "rounded-xl border p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all",
                        c.isMonitored
                          ? "dark:border-blue-500/40 border-blue-300 dark:bg-blue-950/15 bg-blue-50/70 hover:dark:border-blue-500/60 hover:border-blue-400 shadow-xs"
                          : "dark:border-zinc-800/80 border-zinc-200 dark:bg-zinc-950/60 bg-zinc-50 hover:dark:border-zinc-700 hover:border-zinc-300 opacity-75 hover:opacity-100"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-zinc-400 hover:text-blue-500 transition-colors">
                          {c.isMonitored ? (
                            <CheckSquare size={17} className="text-blue-500" />
                          ) : (
                            <Square size={17} className="dark:text-zinc-600 text-zinc-400" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold dark:text-white text-zinc-900">{c.name}</span>
                            {c.isMonitored && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded dark:bg-blue-500/10 bg-blue-100 dark:text-blue-400 text-blue-700 border dark:border-blue-500/20 border-blue-200 font-semibold">
                                Monitored
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] dark:text-zinc-400 text-zinc-600 mt-0.5">
                            {c.domain} {c.hqLocation ? `· ${c.hqLocation}` : ""}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <div className="hidden sm:block">
                          <span
                            className={cn(
                              "text-[10px] font-mono font-semibold px-2 py-0.5 rounded",
                              isHealthy
                                ? "dark:text-emerald-400 text-emerald-700 dark:bg-emerald-950/50 bg-emerald-100 border dark:border-emerald-500/30 border-emerald-300"
                                : isFailed
                                ? "dark:text-red-400 text-red-700 dark:bg-red-950/50 bg-red-100 border dark:border-red-500/30 border-red-300"
                                : "dark:text-amber-400 text-amber-700 dark:bg-amber-950/50 bg-amber-100 border dark:border-amber-500/30 border-amber-300"
                            )}
                          >
                            ● {c.scraperStatus}
                          </span>
                          <div className="text-[9px] font-mono dark:text-zinc-500 text-zinc-500 mt-1">
                            {c.extractionScore}% accuracy
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredCompanies.length === 0 && (
                  <div className="text-center py-10 text-xs dark:text-zinc-500 text-zinc-500 font-mono">
                    No companies match &quot;{companySearch}&quot;
                  </div>
                )}
              </div>

              {/* Bottom Quick Save Banner */}
              <div className="pt-3 border-t dark:border-zinc-800 border-zinc-200 flex items-center justify-between text-xs dark:text-zinc-400 text-zinc-600">
                <span className="text-[11px] font-mono">
                  {monitoredCount} companies selected for continuous radar scanning.
                </span>
                <button
                  onClick={handleSaveManual}
                  disabled={saving}
                  className="rounded-lg dark:bg-white bg-zinc-900 hover:dark:bg-zinc-200 hover:bg-zinc-800 dark:text-black text-white px-4 py-2 text-xs font-semibold disabled:opacity-50 transition-colors shadow-sm"
                >
                  {saving ? "Saving..." : "Save Selection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
