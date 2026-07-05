"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  setCurrentResume,
  updateField,
  updatePersonalInfo,
  addExperience,
  updateExperience,
  removeExperience,
  addEducation,
  updateEducation,
  removeEducation,
  setSkills,
  addProject,
  updateProject,
  removeProject,
  addCertification,
  updateCertification,
  removeCertification,
  addLanguage,
  updateLanguage,
  removeLanguage,
  addAward,
  updateAward,
  removeAward,
  addCustomSection,
  updateCustomSectionTitle,
  removeCustomSection,
  addCustomSectionItem,
  updateCustomSectionItem,
  removeCustomSectionItem,
} from "@/store/resumeSlice";

const inputCls =
  "border border-[#28332B] bg-[#1A231C] text-[#F1F5F2] placeholder:text-[#6B7A70] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-[#22C55E] transition-colors text-sm";
const cardCls = "bg-[#111813] border border-[#28332B] rounded-2xl p-6 sm:p-8";
const itemCls = "border border-[#28332B] bg-[#151C17] rounded-xl p-4 mb-4 relative";
const aiBtnCls =
  "text-sm px-3 py-1.5 bg-[#A855F7]/10 text-[#C084FC] border border-[#A855F7]/30 rounded-lg hover:bg-[#A855F7]/20 disabled:opacity-50 transition-colors whitespace-nowrap";
const ghostBtnCls =
  "text-sm px-3 py-1.5 bg-[#1A231C] text-[#C7D1CA] border border-[#28332B] rounded-lg hover:bg-[#232F26] hover:border-[#3A473C] transition-colors whitespace-nowrap";
const removeCls = "absolute top-3 right-3 text-[#F87171] text-xs hover:text-[#F87171]/80 hover:underline";

// Sequential builder flow — numbering here reflects real order, not decoration
const SECTIONS = [
  { id: "personal", label: "Personal Info", n: "01" },
  { id: "summary", label: "Summary", n: "02" },
  { id: "experience", label: "Experience", n: "03" },
  { id: "education", label: "Education", n: "04" },
  { id: "skills", label: "Skills", n: "05" },
  { id: "projects", label: "Projects", n: "06" },
  { id: "certifications", label: "Certifications", n: "07" },
  { id: "languages", label: "Languages", n: "08" },
  { id: "awards", label: "Awards", n: "09" },
  { id: "custom", label: "Custom Sections", n: "10" },
];

export default function BuilderPage() {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const resume = useSelector((state) => state.resume.currentResume);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [activeSection, setActiveSection] = useState("personal");

  const [quickName, setQuickName] = useState("");
  const [quickTitle, setQuickTitle] = useState("");
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [showQuickGenerate, setShowQuickGenerate] = useState(true);

  const sectionRefs = useRef({});

  useEffect(() => {
    fetchResume();
  }, [id]);

  // Track which section is in view so the sidebar highlights correctly
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.dataset.section);
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [resume]);

  const scrollToSection = (id) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const fetchResume = async () => {
    try {
      const res = await fetch(`/api/resume/${id}`);
      const data = await res.json();
      if (res.ok) dispatch(setCurrentResume(data.resume));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveResume = async () => {
    const res = await fetch(`/api/resume/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resume),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save resume");
    return data;
  };

  // Save now saves AND takes the user straight to the preview page,
  // matching what "Preview" already did — one action, one destination.
  const handleSave = async () => {
    setSaving(true);
    try {
      await saveResume();
      router.push(`/preview/${id}`);
    } catch (err) {
      alert(err.message || "Something went wrong saving your resume");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    setSaving(true);
    try {
      await saveResume();
      router.push(`/preview/${id}`);
    } catch (err) {
      alert(err.message || "Something went wrong saving your resume");
    } finally {
      setSaving(false);
    }
  };

  const handleAutoGenerate = async () => {
    if (!quickName.trim() || !quickTitle.trim()) {
      alert("Enter your full name and target job title first");
      return;
    }
    setAutoGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-full-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: quickName, jobTitle: quickTitle }),
      });
      const data = await res.json();
      if (res.ok) {
        dispatch(setCurrentResume({ ...resume, ...data.resume, title: resume.title || `${quickTitle} Resume` }));
        setShowQuickGenerate(false);
      } else {
        alert(data.error || "Failed to generate resume");
      }
    } catch (err) {
      alert("Something went wrong generating your resume");
    } finally {
      setAutoGenerating(false);
    }
  };

  const handleGenerateSummary = async () => {
    setAiLoading("summary");
    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: resume.experience[0]?.jobTitle || "Professional",
          yearsExperience: resume.experience.length,
          keySkills: resume.skills.join(", "),
        }),
      });
      const data = await res.json();
      if (res.ok) dispatch(updateField({ field: "summary", value: data.summary }));
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading("");
    }
  };

  const handleGenerateBullets = async (index) => {
    const exp = resume.experience[index];
    if (!exp.jobTitle) return alert("Enter job title first");
    const roughDescription = prompt("Briefly describe what you did in this role:");
    if (!roughDescription) return;
    setAiLoading(`bullets-${index}`);
    try {
      const res = await fetch("/api/ai/bullets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle: exp.jobTitle, company: exp.company, roughDescription }),
      });
      const data = await res.json();
      if (res.ok) dispatch(updateExperience({ index, field: "bullets", value: data.bullets }));
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading("");
    }
  };

  const handleGenerateSkills = async () => {
    const jobTitle = resume.experience[0]?.jobTitle;
    if (!jobTitle) return alert("Add a job title in experience first");
    setAiLoading("skills");
    try {
      const res = await fetch("/api/ai/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle }),
      });
      const data = await res.json();
      if (res.ok) dispatch(setSkills([...new Set([...resume.skills, ...data.skills])]));
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading("");
    }
  };

  const handleGenerateProjectBullets = async (index) => {
    const proj = resume.projects[index];
    if (!proj.name) return alert("Enter project name first");
    const roughDescription = prompt("Briefly describe what this project does and your role in it:");
    if (!roughDescription) return;
    setAiLoading(`project-bullets-${index}`);
    try {
      const res = await fetch("/api/ai/project-bullets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName: proj.name, techStack: proj.techStack, roughDescription }),
      });
      const data = await res.json();
      if (res.ok) dispatch(updateProject({ index, field: "bullets", value: data.bullets }));
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading("");
    }
  };

  const handleAddSkill = () => {
    if (skillInput.trim()) {
      dispatch(setSkills([...resume.skills, skillInput.trim()]));
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (index) => {
    dispatch(setSkills(resume.skills.filter((_, i) => i !== index)));
  };

  if (loading || !resume) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0F0D]">
        <p className="text-[#6B7A70] text-sm tracking-wide">Loading your resume…</p>
      </div>
    );
  }

  // completion check per section, drives the sidebar progress dots
  const isDone = {
    personal: !!resume.personalInfo.fullName && !!resume.personalInfo.email,
    summary: !!resume.summary,
    experience: resume.experience.length > 0,
    education: resume.education.length > 0,
    skills: resume.skills.length > 0,
    projects: resume.projects.length > 0,
    certifications: resume.certifications.length > 0,
    languages: resume.languages.length > 0,
    awards: resume.awards.length > 0,
    custom: (resume.customSections || []).length > 0,
  };

  return (
    <div className="bg-[#0A0F0D] min-h-screen">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-30 bg-[#0A0F0D]/95 backdrop-blur border-b border-[#28332B]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <input
            type="text"
            value={resume.title}
            onChange={(e) => dispatch(updateField({ field: "title", value: e.target.value }))}
            className="text-xl font-bold bg-transparent text-[#F1F5F2] border-b border-transparent hover:border-[#3A473C] focus:border-[#22C55E] focus:outline-none px-1 min-w-0 flex-1"
          />
          <div className="flex gap-3 shrink-0">
            <button
              onClick={handlePreview}
              disabled={saving}
              className="px-4 py-2 border border-[#28332B] text-[#C7D1CA] rounded-lg hover:bg-[#1A231C] hover:border-[#3A473C] disabled:opacity-50 transition-colors text-sm"
            >
              {saving ? "Saving…" : "Preview"}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-[#22C55E] text-[#0A0F0D] font-medium rounded-lg hover:bg-[#4ADE80] disabled:opacity-50 transition-colors text-sm"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 flex gap-10">
        {/* Sidebar nav — signature element: progress rail with numbered sections */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24">
            <p className="text-xs uppercase tracking-widest text-[#6B7A70] mb-4 px-1">Sections</p>
            <nav className="relative">
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-[#28332B]" />
              <ul className="space-y-1">
                {SECTIONS.map((s) => {
                  const active = activeSection === s.id;
                  const done = isDone[s.id];
                  return (
                    <li key={s.id}>
                      <button
                        onClick={() => scrollToSection(s.id)}
                        className={`w-full flex items-center gap-3 px-1 py-2 rounded-lg text-left transition-colors ${
                          active ? "text-[#F1F5F2]" : "text-[#6B7A70] hover:text-[#C7D1CA]"
                        }`}
                      >
                        <span
                          className={`relative z-10 shrink-0 w-[9px] h-[9px] rounded-full border-2 ${
                            active
                              ? "bg-[#22C55E] border-[#22C55E]"
                              : done
                              ? "bg-[#4ADE80]/40 border-[#4ADE80]/60"
                              : "bg-[#0A0F0D] border-[#3A473C]"
                          }`}
                        />
                        <span className="text-xs font-mono text-[#6B7A70] w-5">{s.n}</span>
                        <span className={`text-sm ${active ? "font-medium" : ""}`}>{s.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="mt-8 px-1">
              <div className="flex items-center justify-between text-xs text-[#6B7A70] mb-1.5">
                <span>Progress</span>
                <span>{Object.values(isDone).filter(Boolean).length}/{SECTIONS.length}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#1A231C] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#16A34A] to-[#4ADE80] transition-all"
                  style={{ width: `${(Object.values(isDone).filter(Boolean).length / SECTIONS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 space-y-10">
          {showQuickGenerate && (
            <div className="bg-gradient-to-br from-[#A855F7]/10 to-[#111813] p-6 rounded-2xl border-2 border-[#A855F7]/30">
              <h2 className="text-lg font-semibold mb-1 text-[#F1F5F2] flex items-center gap-2">
                <span className="text-[#C084FC]">✨</span> Auto-Generate Your Complete Resume
              </h2>
              <p className="text-sm text-[#C7D1CA] mb-4">
                Enter your name and target job title — AI fills in a complete, professional
                resume: summary, experience, education, skills, projects, certifications,
                languages, and awards. Edit anything afterward.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <input type="text" placeholder="Full Name" value={quickName} onChange={(e) => setQuickName(e.target.value)} className={inputCls} />
                <input type="text" placeholder="Target Job Title" value={quickTitle} onChange={(e) => setQuickTitle(e.target.value)} className={inputCls} />
              </div>
              <div className="flex gap-3">
                <button onClick={handleAutoGenerate} disabled={autoGenerating} className="px-4 py-2 bg-[#A855F7] text-white rounded-lg hover:bg-[#7E22CE] disabled:opacity-50 transition-colors text-sm">
                  {autoGenerating ? "Generating…" : "✨ Generate Complete Resume"}
                </button>
                <button onClick={() => setShowQuickGenerate(false)} className={ghostBtnCls + " px-4"}>
                  I'll fill it manually
                </button>
              </div>
            </div>
          )}

          {!showQuickGenerate && (
            <div className="flex justify-end -mb-4">
              <button onClick={() => setShowQuickGenerate(true)} className={aiBtnCls}>
                ✨ Regenerate with AI
              </button>
            </div>
          )}

          {/* Personal Info */}
          <section
            id="personal"
            data-section="personal"
            ref={(el) => (sectionRefs.current.personal = el)}
            className={cardCls}
          >
            <SectionHeader n="01" title="Personal Info" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="text" placeholder="Full Name" value={resume.personalInfo.fullName} onChange={(e) => dispatch(updatePersonalInfo({ field: "fullName", value: e.target.value }))} className={inputCls} />
              <input type="email" placeholder="Email" value={resume.personalInfo.email} onChange={(e) => dispatch(updatePersonalInfo({ field: "email", value: e.target.value }))} className={inputCls} />
              <input type="text" placeholder="Phone" value={resume.personalInfo.phone} onChange={(e) => dispatch(updatePersonalInfo({ field: "phone", value: e.target.value }))} className={inputCls} />
              <input type="text" placeholder="Location" value={resume.personalInfo.location} onChange={(e) => dispatch(updatePersonalInfo({ field: "location", value: e.target.value }))} className={inputCls} />
              <input type="text" placeholder="LinkedIn URL" value={resume.personalInfo.linkedin} onChange={(e) => dispatch(updatePersonalInfo({ field: "linkedin", value: e.target.value }))} className={inputCls} />
              <input type="text" placeholder="Website/Portfolio" value={resume.personalInfo.website} onChange={(e) => dispatch(updatePersonalInfo({ field: "website", value: e.target.value }))} className={inputCls} />
            </div>
          </section>

          {/* Summary */}
          <section id="summary" data-section="summary" ref={(el) => (sectionRefs.current.summary = el)} className={cardCls}>
            <SectionHeader n="02" title="Professional Summary" action={
              <button onClick={handleGenerateSummary} disabled={aiLoading === "summary"} className={aiBtnCls}>
                {aiLoading === "summary" ? "Generating…" : "✨ Generate with AI"}
              </button>
            } />
            <textarea rows={4} value={resume.summary} onChange={(e) => dispatch(updateField({ field: "summary", value: e.target.value }))} className={inputCls + " w-full"} placeholder="A brief professional summary..." />
          </section>

          {/* Experience */}
          <section id="experience" data-section="experience" ref={(el) => (sectionRefs.current.experience = el)} className={cardCls}>
            <SectionHeader n="03" title="Work Experience" action={
              <button onClick={() => dispatch(addExperience())} className={ghostBtnCls}>+ Add Experience</button>
            } />
            {resume.experience.length === 0 && <EmptyHint text="No roles yet. Add your most recent job first." />}
            {resume.experience.map((exp, index) => (
              <div key={index} className={itemCls}>
                <button onClick={() => dispatch(removeExperience(index))} className={removeCls}>Remove</button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <input type="text" placeholder="Job Title" value={exp.jobTitle} onChange={(e) => dispatch(updateExperience({ index, field: "jobTitle", value: e.target.value }))} className={inputCls} />
                  <input type="text" placeholder="Company" value={exp.company} onChange={(e) => dispatch(updateExperience({ index, field: "company", value: e.target.value }))} className={inputCls} />
                  <input type="text" placeholder="Location" value={exp.location} onChange={(e) => dispatch(updateExperience({ index, field: "location", value: e.target.value }))} className={inputCls} />
                  <div className="flex gap-2">
                    <input type="text" placeholder="Start Date" value={exp.startDate} onChange={(e) => dispatch(updateExperience({ index, field: "startDate", value: e.target.value }))} className={inputCls + " w-1/2"} />
                    <input type="text" placeholder="End Date" value={exp.endDate} onChange={(e) => dispatch(updateExperience({ index, field: "endDate", value: e.target.value }))} className={inputCls + " w-1/2"} />
                  </div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wide text-[#6B7A70]">Bullet Points</span>
                  <button onClick={() => handleGenerateBullets(index)} disabled={aiLoading === `bullets-${index}`} className={aiBtnCls}>
                    {aiLoading === `bullets-${index}` ? "Generating…" : "✨ Generate with AI"}
                  </button>
                </div>
                <textarea rows={4} value={exp.bullets.join("\n")} onChange={(e) => dispatch(updateExperience({ index, field: "bullets", value: e.target.value.split("\n") }))} placeholder="One bullet point per line" className={inputCls + " w-full"} />
              </div>
            ))}
          </section>

          {/* Education */}
          <section id="education" data-section="education" ref={(el) => (sectionRefs.current.education = el)} className={cardCls}>
            <SectionHeader n="04" title="Education" action={
              <button onClick={() => dispatch(addEducation())} className={ghostBtnCls}>+ Add Education</button>
            } />
            {resume.education.length === 0 && <EmptyHint text="No schools yet. Add your most recent degree." />}
            {resume.education.map((edu, index) => (
              <div key={index} className={itemCls}>
                <button onClick={() => dispatch(removeEducation(index))} className={removeCls}>Remove</button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" placeholder="Degree" value={edu.degree} onChange={(e) => dispatch(updateEducation({ index, field: "degree", value: e.target.value }))} className={inputCls} />
                  <input type="text" placeholder="School" value={edu.school} onChange={(e) => dispatch(updateEducation({ index, field: "school", value: e.target.value }))} className={inputCls} />
                  <input type="text" placeholder="Location" value={edu.location} onChange={(e) => dispatch(updateEducation({ index, field: "location", value: e.target.value }))} className={inputCls} />
                  <div className="flex gap-2">
                    <input type="text" placeholder="Start Date" value={edu.startDate} onChange={(e) => dispatch(updateEducation({ index, field: "startDate", value: e.target.value }))} className={inputCls + " w-1/2"} />
                    <input type="text" placeholder="End Date" value={edu.endDate} onChange={(e) => dispatch(updateEducation({ index, field: "endDate", value: e.target.value }))} className={inputCls + " w-1/2"} />
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Skills */}
          <section id="skills" data-section="skills" ref={(el) => (sectionRefs.current.skills = el)} className={cardCls}>
            <SectionHeader n="05" title="Skills" action={
              <button onClick={handleGenerateSkills} disabled={aiLoading === "skills"} className={aiBtnCls}>
                {aiLoading === "skills" ? "Generating…" : "✨ Suggest Skills"}
              </button>
            } />
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Add a skill and press Enter"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSkill(); } }}
                className={inputCls + " flex-1"}
              />
              <button onClick={handleAddSkill} className={ghostBtnCls + " px-4"}>Add</button>
            </div>
            {resume.skills.length === 0 ? (
              <EmptyHint text="No skills yet. Add a few, or let AI suggest some from your first job title." />
            ) : (
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((skill, index) => (
                  <span key={index} className="flex items-center gap-2 px-3 py-1.5 bg-[#22C55E]/10 text-[#4ADE80] border border-[#22C55E]/20 rounded-full text-sm">
                    {skill}
                    <button onClick={() => handleRemoveSkill(index)} className="text-[#4ADE80]/70 hover:text-[#F87171]">×</button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Projects */}
          <section id="projects" data-section="projects" ref={(el) => (sectionRefs.current.projects = el)} className={cardCls}>
            <SectionHeader n="06" title="Projects" action={
              <button onClick={() => dispatch(addProject())} className={ghostBtnCls}>+ Add Project</button>
            } />
            {resume.projects.length === 0 && <EmptyHint text="No projects yet. Personal or client work both count." />}
            {resume.projects.map((proj, index) => (
              <div key={index} className={itemCls}>
                <button onClick={() => dispatch(removeProject(index))} className={removeCls}>Remove</button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <input type="text" placeholder="Project Name" value={proj.name} onChange={(e) => dispatch(updateProject({ index, field: "name", value: e.target.value }))} className={inputCls} />
                  <input type="text" placeholder="Tech Stack (e.g. Next.js, MongoDB)" value={proj.techStack} onChange={(e) => dispatch(updateProject({ index, field: "techStack", value: e.target.value }))} className={inputCls} />
                  <input type="text" placeholder="Live Link / GitHub URL" value={proj.link} onChange={(e) => dispatch(updateProject({ index, field: "link", value: e.target.value }))} className={inputCls + " sm:col-span-2"} />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wide text-[#6B7A70]">Bullet Points</span>
                  <button onClick={() => handleGenerateProjectBullets(index)} disabled={aiLoading === `project-bullets-${index}`} className={aiBtnCls}>
                    {aiLoading === `project-bullets-${index}` ? "Generating…" : "✨ Generate with AI"}
                  </button>
                </div>
                <textarea rows={3} value={proj.bullets.join("\n")} onChange={(e) => dispatch(updateProject({ index, field: "bullets", value: e.target.value.split("\n") }))} placeholder="One bullet point per line describing what you built" className={inputCls + " w-full"} />
              </div>
            ))}
          </section>

          {/* Certifications */}
          <section id="certifications" data-section="certifications" ref={(el) => (sectionRefs.current.certifications = el)} className={cardCls}>
            <SectionHeader n="07" title="Certifications" action={
              <button onClick={() => dispatch(addCertification())} className={ghostBtnCls}>+ Add Certification</button>
            } />
            {resume.certifications.length === 0 && <EmptyHint text="No certifications yet." />}
            {resume.certifications.map((cert, index) => (
              <div key={index} className={itemCls}>
                <button onClick={() => dispatch(removeCertification(index))} className={removeCls}>Remove</button>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input type="text" placeholder="Certification Name" value={cert.name} onChange={(e) => dispatch(updateCertification({ index, field: "name", value: e.target.value }))} className={inputCls} />
                  <input type="text" placeholder="Issuer (e.g. Coursera)" value={cert.issuer} onChange={(e) => dispatch(updateCertification({ index, field: "issuer", value: e.target.value }))} className={inputCls} />
                  <input type="text" placeholder="Date" value={cert.date} onChange={(e) => dispatch(updateCertification({ index, field: "date", value: e.target.value }))} className={inputCls} />
                </div>
              </div>
            ))}
          </section>

          {/* Languages */}
          <section id="languages" data-section="languages" ref={(el) => (sectionRefs.current.languages = el)} className={cardCls}>
            <SectionHeader n="08" title="Languages" action={
              <button onClick={() => dispatch(addLanguage())} className={ghostBtnCls}>+ Add Language</button>
            } />
            {resume.languages.length === 0 && <EmptyHint text="No languages yet." />}
            {resume.languages.map((lang, index) => (
              <div key={index} className={itemCls}>
                <button onClick={() => dispatch(removeLanguage(index))} className={removeCls}>Remove</button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" placeholder="Language (e.g. English)" value={lang.name} onChange={(e) => dispatch(updateLanguage({ index, field: "name", value: e.target.value }))} className={inputCls} />
                  <select value={lang.proficiency} onChange={(e) => dispatch(updateLanguage({ index, field: "proficiency", value: e.target.value }))} className={inputCls}>
                    <option value="">Select Proficiency</option>
                    <option value="Native">Native</option>
                    <option value="Fluent">Fluent</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Basic">Basic</option>
                  </select>
                </div>
              </div>
            ))}
          </section>

          {/* Awards */}
          <section id="awards" data-section="awards" ref={(el) => (sectionRefs.current.awards = el)} className={cardCls}>
            <SectionHeader n="09" title="Awards & Achievements" action={
              <button onClick={() => dispatch(addAward())} className={ghostBtnCls}>+ Add Award</button>
            } />
            {resume.awards.length === 0 && <EmptyHint text="No awards yet." />}
            {resume.awards.map((award, index) => (
              <div key={index} className={itemCls}>
                <button onClick={() => dispatch(removeAward(index))} className={removeCls}>Remove</button>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input type="text" placeholder="Award Title" value={award.title} onChange={(e) => dispatch(updateAward({ index, field: "title", value: e.target.value }))} className={inputCls} />
                  <input type="text" placeholder="Issuer" value={award.issuer} onChange={(e) => dispatch(updateAward({ index, field: "issuer", value: e.target.value }))} className={inputCls} />
                  <input type="text" placeholder="Date" value={award.date} onChange={(e) => dispatch(updateAward({ index, field: "date", value: e.target.value }))} className={inputCls} />
                </div>
              </div>
            ))}
          </section>

          {/* Custom Sections */}
          <section id="custom" data-section="custom" ref={(el) => (sectionRefs.current.custom = el)} className={cardCls}>
            <SectionHeader n="10" title="Custom Sections" action={
              <button onClick={() => dispatch(addCustomSection())} className={ghostBtnCls}>+ Add Custom Section</button>
            } />
            {(resume.customSections || []).length === 0 && (
              <EmptyHint text="Add volunteer work, publications, or anything else the sections above don't cover." />
            )}
            {(resume.customSections || []).map((section, sIndex) => (
              <div key={sIndex} className="border border-[#28332B] bg-[#1A231C] rounded-xl p-4 mb-6 relative">
                <button onClick={() => dispatch(removeCustomSection(sIndex))} className={removeCls}>Remove Section</button>
                <input
                  type="text"
                  placeholder="Section Title (e.g. Volunteer Work, Publications)"
                  value={section.title}
                  onChange={(e) => dispatch(updateCustomSectionTitle({ sectionIndex: sIndex, value: e.target.value }))}
                  className={inputCls + " w-full mb-4 font-medium"}
                />
                {section.items.map((item, iIndex) => (
                  <div key={iIndex} className="border border-[#28332B] bg-[#111813] rounded-lg p-4 mb-3 relative">
                    <button onClick={() => dispatch(removeCustomSectionItem({ sectionIndex: sIndex, itemIndex: iIndex }))} className={removeCls}>Remove</button>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                      <input type="text" placeholder="Heading (e.g. Role/Title)" value={item.heading} onChange={(e) => dispatch(updateCustomSectionItem({ sectionIndex: sIndex, itemIndex: iIndex, field: "heading", value: e.target.value }))} className={inputCls} />
                      <input type="text" placeholder="Subheading (e.g. Organization)" value={item.subheading} onChange={(e) => dispatch(updateCustomSectionItem({ sectionIndex: sIndex, itemIndex: iIndex, field: "subheading", value: e.target.value }))} className={inputCls} />
                      <input type="text" placeholder="Date" value={item.date} onChange={(e) => dispatch(updateCustomSectionItem({ sectionIndex: sIndex, itemIndex: iIndex, field: "date", value: e.target.value }))} className={inputCls} />
                    </div>
                    <textarea
                      rows={3}
                      value={item.bullets.join("\n")}
                      onChange={(e) => dispatch(updateCustomSectionItem({ sectionIndex: sIndex, itemIndex: iIndex, field: "bullets", value: e.target.value.split("\n") }))}
                      placeholder="One detail/bullet per line"
                      className={inputCls + " w-full"}
                    />
                  </div>
                ))}
                <button onClick={() => dispatch(addCustomSectionItem(sIndex))} className={aiBtnCls}>+ Add Entry</button>
              </div>
            ))}
          </section>

          <div className="flex justify-end pb-10">
            <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-[#22C55E] text-[#0A0F0D] font-medium rounded-lg hover:bg-[#4ADE80] disabled:opacity-50 transition-colors">
              {saving ? "Saving…" : "Save Resume"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

function SectionHeader({ n, title, action }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-baseline gap-3">
        <span className="text-xs font-mono text-[#4ADE80]/70">{n}</span>
        <h2 className="text-lg font-semibold text-[#F1F5F2]">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function EmptyHint({ text }) {
  return (
    <p className="text-sm text-[#6B7A70] italic border border-dashed border-[#28332B] rounded-lg px-4 py-3 mb-4">
      {text}
    </p>
  );
}