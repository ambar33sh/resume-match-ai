"use client";

import { useState } from "react";
import { FileText, Sparkles, Upload, CheckCircle2, AlertTriangle, XCircle, ArrowRight } from "lucide-react";

type Analysis = {
  score: number; summary: string; matchedSkills: string[]; missingSkills: string[];
  strengths: string[]; gaps: string[]; recommendation: string;
  breakdown: { semantic: number; skills: number; experience: number; education: number };
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [job, setJob] = useState("");
  const [result, setResult] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function analyze() {
    if (!file || !job.trim()) { setError("Upload a resume and provide a job description first."); return; }
    setLoading(true); setError(""); setResult(null);
    const form = new FormData(); form.append("resume", file); form.append("jobDescription", job);
    try {
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data);
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setLoading(false); }
  }

  return <main className="shell">
    <nav className="topbar"><div className="brand">Resume<span>Match</span> AI</div><div className="badge">Explainable AI matching</div></nav>
    <section className="hero"><div className="eyebrow">Resume intelligence</div><h1>Know exactly how well a resume fits a role.</h1><p>Upload a resume, paste a job description, and get a transparent match score, skill gaps, strengths, and actionable recommendations.</p></section>
    <section className="grid">
      <div className="card"><h2>1. Candidate resume</h2><div className="muted">PDF only · text is processed server-side for analysis.</div>
        <label className="drop"><Upload size={25} /><strong>{file ? "Replace resume" : "Upload PDF resume"}</strong><span className="muted">Click to browse your files</span><input type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} />{file && <div className="file"><FileText size={14} style={{verticalAlign:"middle",marginRight:6}} />{file.name}</div>}</label>
      </div>
      <div className="card"><h2>2. Target job</h2><div className="muted">Paste the complete job description for the most useful comparison.</div><textarea className="textarea" placeholder="Paste job title, responsibilities, required skills, qualifications..." value={job} onChange={e => setJob(e.target.value)} /></div>
    </section>
    <div className="actions"><button className="primary" onClick={analyze} disabled={loading}>{loading ? "Analyzing…" : "Analyze match"} <ArrowRight size={16} style={{verticalAlign:"middle",marginLeft:7}} /></button></div>
    {error && <div className="error">{error}</div>}
    {result && <Result result={result} />}
    <div className="footer">ResumeMatch AI · semantic similarity + skill analysis + explainable scoring</div>
  </main>;
}

function Result({ result }: { result: Analysis }) {
  const score = Math.round(result.score);
  return <section className="card result">
    <div className="scoreRow"><div className="score" style={{"--score":score} as React.CSSProperties}><b>{score}%</b></div><div><div className="eyebrow">Overall fit</div><h2>{score >= 80 ? "Strong match" : score >= 65 ? "Promising match" : score >= 50 ? "Partial match" : "Weak match"}</h2><div className="muted">{result.summary}</div></div></div>
    <div className="section"><h3>Score breakdown</h3>{Object.entries({"Semantic similarity":result.breakdown.semantic,"Skill coverage":result.breakdown.skills,"Experience fit":result.breakdown.experience,"Education fit":result.breakdown.education}).map(([name,value])=><div className="metric" key={name}><div className="metricHead"><span>{name}</span><b>{value}%</b></div><div className="bar"><i style={{width:`${value}%`}} /></div></div>)}</div>
    <div className="grid section">
      <div><h3><CheckCircle2 size={14} style={{verticalAlign:"middle"}} /> Matched skills</h3><div className="pills">{result.matchedSkills.length ? result.matchedSkills.map(x=><span className="pill good" key={x}>{x}</span>) : <span className="muted">No strong matches detected.</span>}</div></div>
      <div><h3><XCircle size={14} style={{verticalAlign:"middle"}} /> Missing skills</h3><div className="pills">{result.missingSkills.length ? result.missingSkills.map(x=><span className="pill bad" key={x}>{x}</span>) : <span className="muted">No major skill gaps detected.</span>}</div></div>
    </div>
    <div className="grid section"><div><h3>Strengths</h3>{result.strengths.map(x=><p className="muted" key={x}>✓ {x}</p>)}</div><div><h3><AlertTriangle size={14} style={{verticalAlign:"middle"}} /> Gaps</h3>{result.gaps.map(x=><p className="muted" key={x}>• {x}</p>)}</div></div>
    <div className="section"><h3>Recommendation</h3><p className="muted">{result.recommendation}</p></div>
  </section>;
}
