"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

const TEMPLATES = [
  { id: "slate", label: "Slate", blurb: "Clean & ATS-friendly" },
  { id: "ivory", label: "Ivory", blurb: "Elegant & minimal" },
  { id: "ledger", label: "Ledger", blurb: "Newspaper columns" },
  { id: "minimal", label: "Minimal", blurb: "Plain & simple" },
];

export default function PreviewPage() {
  const { id } = useParams();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState("slate");
  const [downloading, setDownloading] = useState(false);
  const resumeRef = useRef(null);

  useEffect(() => {
    fetch(`/api/resume/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setResume(data.resume);
        if (data.resume?.template && TEMPLATES.some((t) => t.id === data.resume.template)) {
          setTemplate(data.resume.template);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleTemplateChange = async (newTemplate) => {
    setTemplate(newTemplate);
    try {
      await fetch(`/api/resume/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: newTemplate }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadPDF = async () => {
    if (!resumeRef.current || downloading) return;
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      // Ensure all fonts are fully loaded before capture, otherwise
      // html2canvas can snapshot mid-layout and shift/overlap text.
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const element = resumeRef.current;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const safeName = (resume?.personalInfo?.fullName || "resume").trim().replace(/\s+/g, "_");
      pdf.save(`${safeName}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Something went wrong generating the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading || !resume) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] bg-[#0A0F0D]">
        <p className="text-[#6B7A70] text-sm">Loading…</p>
      </div>
    );
  }

  return (
    // Page chrome uses the dark theme. Resume templates below intentionally
    // keep their own light/print-facing color schemes since they get
    // exported to PDF and viewed by employers.
    <div className="min-h-screen bg-[#0A0F0D] font-sans">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-[#111813] border border-[#28332B] rounded-xl p-4">
          <div className="flex gap-2 flex-wrap">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => handleTemplateChange(t.id)}
                className={`px-4 py-2 rounded-lg text-sm border transition-all duration-150 ${
                  template === t.id
                    ? "bg-[#22C55E] text-[#0A0F0D] border-[#22C55E] shadow-md scale-[1.02]"
                    : "bg-[#1A231C] text-[#C7D1CA] border-[#28332B] hover:bg-[#232F26] hover:border-[#3A473C]"
                }`}
              >
                <span className="font-medium">{t.label}</span>
                <span className={`ml-1.5 text-xs ${template === t.id ? "text-[#0A0F0D]/70" : "text-[#6B7A70]"}`}>
                  {t.blurb}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="px-5 py-2.5 bg-[#A855F7] text-white rounded-lg hover:bg-[#7E22CE] whitespace-nowrap shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {downloading ? "Preparing PDF…" : "Download PDF"}
          </button>
        </div>

        <div ref={resumeRef}>
          {template === "slate" && <SlateTemplate resume={resume} />}
          {template === "ivory" && <IvoryTemplate resume={resume} />}
          {template === "ledger" && <LedgerTemplate resume={resume} />}
          {template === "minimal" && <MinimalTemplate resume={resume} />}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CUSTOM SECTIONS RENDERER (shared across templates)
============================================================ */
function CustomSections({ resume, variant }) {
  const sections = (resume.customSections || []).filter(
    (s) => s.title?.trim() || s.items?.some((i) => i.heading?.trim())
  );
  if (sections.length === 0) return null;

  if (variant === "slate") {
    return (
      <>
        {sections.map((section, si) => (
          <section key={si} className="mb-8">
            <h2 className="text-[13pt] font-bold tracking-[0.16em] uppercase text-slate-700 mb-3 pb-2 border-b-[1.5px] border-gray-200">
              {section.title || "Custom Section"}
            </h2>
            {section.items?.map((item, ii) => (
              <div key={ii} className="mb-4 last:mb-0">
                <div className="flex justify-between items-baseline flex-wrap gap-x-2">
                  <h3 className="font-bold text-[12pt] text-neutral-900">{item.heading}</h3>
                  {item.date && (
                    <span className="text-[11pt] text-gray-500 whitespace-nowrap font-medium">{item.date}</span>
                  )}
                </div>
                {item.subheading && <p className="text-[11pt] text-gray-500 mb-1">{item.subheading}</p>}
                <ul className="text-[12pt] text-neutral-700 leading-relaxed mt-1 list-disc pl-5">
                  {item.bullets?.filter((b) => b.trim()).map((b, bi) => (
                    <li key={bi} className="mb-1">{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </>
    );
  }

  if (variant === "ivory") {
    return (
      <>
        {sections.map((section, si) => (
          <section key={si} className="mb-8">
            <h2 className="font-serif text-[13pt] font-bold text-neutral-900 mb-2">
              {section.title || "Custom Section"}
            </h2>
            {section.items?.map((item, ii) => (
              <div key={ii} className="mb-3 last:mb-0">
                <div className="flex justify-between items-baseline flex-wrap gap-x-2">
                  <h3 className="font-semibold text-[12pt] text-neutral-900">{item.heading}</h3>
                  {item.date && (
                    <span className="text-[11pt] text-neutral-500 whitespace-nowrap">{item.date}</span>
                  )}
                </div>
                {item.subheading && <p className="text-[11pt] text-neutral-500 italic">{item.subheading}</p>}
                <ul className="text-[12pt] text-neutral-700 leading-relaxed list-disc pl-5 mt-1">
                  {item.bullets?.filter((b) => b.trim()).map((b, bi) => (
                    <li key={bi} className="mb-1">{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </>
    );
  }

  if (variant === "ledger") {
    return (
      <>
        {sections.map((section, si) => (
          <section key={si} className="mb-5">
            <h2 className="font-serif text-[13pt] font-bold uppercase tracking-widest text-neutral-800 mb-2 pb-1 border-b border-neutral-300">
              {section.title || "Custom Section"}
            </h2>
            {section.items?.map((item, ii) => (
              <div key={ii} className="mb-3 last:mb-0">
                <h3 className="font-bold text-[12pt] text-neutral-900">{item.heading}</h3>
                {item.subheading && <p className="text-[11pt] text-neutral-500 italic">{item.subheading}</p>}
                {item.date && <p className="text-[11pt] text-neutral-400 mb-1">{item.date}</p>}
                <ul className="text-[11pt] text-neutral-700 leading-relaxed list-disc pl-4">
                  {item.bullets?.filter((b) => b.trim()).map((b, bi) => (
                    <li key={bi} className="mb-0.5">{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </>
    );
  }

  if (variant === "minimal") {
    return (
      <>
        {sections.map((section, si) => (
          <section key={si} className="mb-6">
            <h2 className="text-[12pt] font-bold uppercase tracking-wider text-neutral-900 mb-2 pb-1 border-b border-neutral-300">
              {section.title || "Custom Section"}
            </h2>
            {section.items?.map((item, ii) => (
              <div key={ii} className="mb-3 last:mb-0">
                <div className="flex justify-between items-baseline flex-wrap gap-x-2">
                  <h3 className="font-semibold text-[11pt] text-neutral-900">{item.heading}</h3>
                  {item.date && <span className="text-[10pt] text-neutral-500 whitespace-nowrap">{item.date}</span>}
                </div>
                {item.subheading && <p className="text-[10pt] text-neutral-500">{item.subheading}</p>}
                <ul className="text-[11pt] text-neutral-700 leading-relaxed list-disc pl-4 mt-1">
                  {item.bullets?.filter((b) => b.trim()).map((b, bi) => (
                    <li key={bi} className="mb-0.5">{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </>
    );
  }

  

  return null;
}

/* ============================================================
   TEMPLATE 1 — SLATE
============================================================ */
function SlateTemplate({ resume }) {
  const contactLine = [resume.personalInfo?.email, resume.personalInfo?.phone, resume.personalInfo?.location, resume.personalInfo?.linkedin, resume.personalInfo?.website].filter(Boolean).join("   ·   ");
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-[0_20px_60px_-24px_rgba(31,36,48,0.3)] p-10 sm:p-14 text-neutral-800">
      <header className="mb-9 text-center relative">
        <p className="text-[11pt] font-bold tracking-[0.3em] uppercase text-gray-400 mb-2">Résumé</p>
        <h1 className="font-extrabold text-[22pt] tracking-tight text-neutral-900">{resume.personalInfo?.fullName || "Your Name"}</h1>
        {resume.experience?.[0]?.jobTitle && <p className="text-[13pt] text-slate-700 mt-1 font-semibold">{resume.experience[0].jobTitle}</p>}
        {contactLine && <p className="text-[11pt] text-gray-500 mt-3 tracking-wide">{contactLine}</p>}
        <div className="relative w-20 h-px bg-gray-300 mx-auto mt-7"><span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 w-1.5 h-1.5 bg-slate-700" /></div>
      </header>
      {resume.summary && (
        <section className="mb-8">
          <h2 className="text-[13pt] font-bold tracking-[0.16em] uppercase text-slate-700 mb-3 pb-2 border-b-[1.5px] border-gray-200">Summary</h2>
          <p className="text-[12pt] leading-relaxed text-neutral-700">{resume.summary}</p>
        </section>
      )}
      {resume.experience?.length > 0 && (
        <section className="mb-8">
          <h2 className="text-[13pt] font-bold tracking-[0.16em] uppercase text-slate-700 mb-3 pb-2 border-b-[1.5px] border-gray-200">Experience</h2>
          {resume.experience.map((exp, index) => (
            <div key={index} className="mb-5 last:mb-0">
              <div className="flex justify-between items-baseline flex-wrap gap-x-2">
                <h3 className="font-bold text-[12pt] text-neutral-900">{exp.jobTitle}</h3>
                <span className="text-[11pt] text-gray-500 whitespace-nowrap font-medium">{exp.startDate} – {exp.current ? "Present" : exp.endDate}</span>
              </div>
              <p className="text-[11pt] text-gray-500 mb-1">{exp.company}{exp.location && ` · ${exp.location}`}</p>
              <ul className="text-[12pt] text-neutral-700 leading-relaxed mt-1 list-disc pl-5">
                {exp.bullets?.filter((b) => b.trim()).map((bullet, i) => <li key={i} className="mb-1">{bullet}</li>)}
              </ul>
            </div>
          ))}
        </section>
      )}
      {resume.education?.length > 0 && (
        <section className="mb-8">
          <h2 className="text-[13pt] font-bold tracking-[0.16em] uppercase text-slate-700 mb-3 pb-2 border-b-[1.5px] border-gray-200">Education</h2>
          {resume.education.map((edu, index) => (
            <div key={index} className="mb-3 flex justify-between items-baseline flex-wrap gap-x-2">
              <div><h3 className="font-bold text-[12pt] text-neutral-900">{edu.degree}</h3><p className="text-[11pt] text-gray-500">{edu.school} {edu.location && `· ${edu.location}`}</p></div>
              <span className="text-[11pt] text-gray-500 whitespace-nowrap font-medium">{edu.startDate} – {edu.endDate}</span>
            </div>
          ))}
        </section>
      )}
      {resume.skills?.length > 0 && (
        <section className="mb-8">
          <h2 className="text-[13pt] font-bold tracking-[0.16em] uppercase text-slate-700 mb-3 pb-2 border-b-[1.5px] border-gray-200">Skills</h2>
          <div className="flex flex-wrap -mr-2 -mb-2">
            {resume.skills.map((skill, i) => <span key={i} className="text-[11pt] font-medium px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-md text-slate-700 mr-2 mb-2">{skill}</span>)}
          </div>
        </section>
      )}
      {resume.projects?.length > 0 && (
        <section className="mb-8">
          <h2 className="text-[13pt] font-bold tracking-[0.16em] uppercase text-slate-700 mb-3 pb-2 border-b-[1.5px] border-gray-200">Projects</h2>
          {resume.projects.map((proj, index) => (
            <div key={index} className="mb-5 last:mb-0">
              <div className="flex justify-between items-baseline flex-wrap gap-x-2"><h3 className="font-bold text-[12pt] text-neutral-900">{proj.name}</h3>{proj.link && <span className="text-[11pt] text-gray-500 font-medium">{proj.link}</span>}</div>
              {proj.techStack && <p className="text-[11pt] text-gray-500 mb-1">{proj.techStack}</p>}
              <ul className="text-[12pt] text-neutral-700 leading-relaxed mt-1 list-disc pl-5">
                {proj.bullets?.filter((b) => b.trim()).map((bullet, i) => <li key={i} className="mb-1">{bullet}</li>)}
              </ul>
            </div>
          ))}
        </section>
      )}
      {resume.certifications?.length > 0 && (
        <section className="mb-8">
          <h2 className="text-[13pt] font-bold tracking-[0.16em] uppercase text-slate-700 mb-3 pb-2 border-b-[1.5px] border-gray-200">Certifications</h2>
          <ul className="text-[12pt] text-neutral-700 leading-relaxed list-none space-y-1">{resume.certifications.map((c, i) => <li key={i}>{c.name}{c.date && <span className="text-gray-500"> — {c.date}</span>}</li>)}</ul>
        </section>
      )}

      <CustomSections resume={resume} variant="slate" />

      {resume.languages?.filter((l) => l.name).length > 0 && (
        <section className="mb-8">
          <h2 className="text-[13pt] font-bold tracking-[0.16em] uppercase text-slate-700 mb-3 pb-2 border-b-[1.5px] border-gray-200">Languages</h2>
          <ul className="text-[12pt] text-neutral-700 leading-relaxed list-none space-y-1">{resume.languages.filter((l) => l.name).map((l, i) => <li key={i}>{l.name}{l.proficiency && <span className="text-gray-500"> — {l.proficiency}</span>}</li>)}</ul>
        </section>
      )}
      {resume.awards?.length > 0 && (
        <section>
          <h2 className="text-[13pt] font-bold tracking-[0.16em] uppercase text-slate-700 mb-3 pb-2 border-b-[1.5px] border-gray-200">Awards</h2>
          <ul className="text-[12pt] text-neutral-700 leading-relaxed list-none space-y-1">{resume.awards.map((a, i) => <li key={i}>{a.title}{a.date && <span className="text-gray-500"> — {a.date}</span>}</li>)}</ul>
        </section>
      )}
    </div>
  );
}

/* ============================================================
   TEMPLATE 2 — IVORY
============================================================ */
function IvoryTemplate({ resume }) {
  return (
    <div className="bg-[#fdfbf7] rounded-xl border border-neutral-200 shadow-[0_16px_50px_-20px_rgba(0,0,0,0.15)] p-10 sm:p-14">
      <header className="mb-10 pb-6 border-b-2 border-neutral-800">
        <div className="flex justify-between items-end flex-wrap gap-3">
          <div><h1 className="font-serif text-[22pt] font-bold text-neutral-900 tracking-tight">{resume.personalInfo?.fullName || "Your Name"}</h1>{resume.experience?.[0]?.jobTitle && <p className="text-[13pt] text-neutral-500 mt-1 italic">{resume.experience[0].jobTitle}</p>}</div>
          <div className="text-right text-[11pt] text-neutral-600 leading-relaxed">
            {resume.personalInfo?.email && <p>{resume.personalInfo.email}</p>}
            {resume.personalInfo?.phone && <p>{resume.personalInfo.phone}</p>}
            {resume.personalInfo?.location && <p>{resume.personalInfo.location}</p>}
            {resume.personalInfo?.linkedin && <p>{resume.personalInfo.linkedin}</p>}
          </div>
        </div>
      </header>
      {resume.summary && <section className="mb-8"><h2 className="font-serif text-[13pt] font-bold text-neutral-900 mb-2">Profile</h2><p className="text-[13pt] leading-relaxed text-neutral-700">{resume.summary}</p></section>}
      {resume.experience?.length > 0 && (
        <section className="mb-8"><h2 className="font-serif text-[13pt] font-bold text-neutral-900 mb-3">Experience</h2>
          {resume.experience.map((exp, index) => (
            <div key={index} className="mb-5 last:mb-0 pb-5 last:pb-0 border-b border-neutral-200 last:border-none">
              <div className="flex justify-between items-baseline flex-wrap gap-x-2"><h3 className="font-semibold text-[12pt] text-neutral-900">{exp.jobTitle}{exp.company && <span className="text-neutral-500 font-normal italic"> · {exp.company}</span>}</h3><span className="text-[11pt] text-neutral-500 whitespace-nowrap">{exp.startDate} – {exp.current ? "Present" : exp.endDate}</span></div>
              {exp.location && <p className="text-[11pt] text-neutral-400 mb-1">{exp.location}</p>}
              <ul className="text-[12pt] text-neutral-700 leading-relaxed list-disc pl-5 mt-1">{exp.bullets?.filter((b) => b.trim()).map((bullet, i) => <li key={i} className="mb-1">{bullet}</li>)}</ul>
            </div>
          ))}
        </section>
      )}
      {resume.education?.length > 0 && (
        <section className="mb-8"><h2 className="font-serif text-[13pt] font-bold text-neutral-900 mb-3">Education</h2>
          {resume.education.map((edu, index) => (
            <div key={index} className="mb-2 flex justify-between items-baseline flex-wrap gap-x-2">
              <div><h3 className="font-semibold text-[12pt] text-neutral-900">{edu.degree}</h3><p className="text-[11pt] text-neutral-500 italic">{edu.school} {edu.location && `· ${edu.location}`}</p></div>
              <span className="text-[11pt] text-neutral-500 whitespace-nowrap">{edu.startDate} – {edu.endDate}</span>
            </div>
          ))}
        </section>
      )}
      {resume.projects?.length > 0 && (
        <section className="mb-8"><h2 className="font-serif text-[13pt] font-bold text-neutral-900 mb-3">Projects</h2>
          {resume.projects.map((proj, index) => (
            <div key={index} className="mb-4 last:mb-0">
              <div className="flex justify-between items-baseline flex-wrap gap-x-2"><h3 className="font-semibold text-[12pt] text-neutral-900">{proj.name}</h3>{proj.link && <span className="text-[11pt] text-neutral-500">{proj.link}</span>}</div>
              {proj.techStack && <p className="text-[11pt] text-neutral-400 italic mb-1">{proj.techStack}</p>}
              <ul className="text-[12pt] text-neutral-700 leading-relaxed list-disc pl-5">{proj.bullets?.filter((b) => b.trim()).map((bullet, i) => <li key={i} className="mb-1">{bullet}</li>)}</ul>
            </div>
          ))}
        </section>
      )}
      <div className="flex flex-col gap-8">
        {resume.skills?.length > 0 && <section><h2 className="font-serif text-[13pt] font-bold text-neutral-900 mb-2">Skills</h2><p className="text-[13pt] text-neutral-700 leading-relaxed">{resume.skills.join("  ·  ")}</p></section>}
        {resume.certifications?.length > 0 && (
          <section><h2 className="font-serif text-[13pt] font-bold text-neutral-900 mb-2">Certifications</h2>
            <ul className="text-[12pt] text-neutral-700 leading-relaxed list-none space-y-1">{resume.certifications.map((c, i) => <li key={i}>{c.name} {c.date && `— ${c.date}`}</li>)}</ul>
          </section>
        )}

        <CustomSections resume={resume} variant="ivory" />

        {resume.languages?.filter((l) => l.name).length > 0 && (
          <section><h2 className="font-serif text-[13pt] font-bold text-neutral-900 mb-2">Languages</h2>
            <ul className="text-[12pt] text-neutral-700 leading-relaxed list-none space-y-1">{resume.languages.filter((l) => l.name).map((l, i) => <li key={i}>{l.name} {l.proficiency && `— ${l.proficiency}`}</li>)}</ul>
          </section>
        )}
        {resume.awards?.length > 0 && (
          <section><h2 className="font-serif text-[13pt] font-bold text-neutral-900 mb-2">Awards</h2>
            <ul className="text-[12pt] text-neutral-700 leading-relaxed list-none space-y-1">{resume.awards.map((a, i) => <li key={i}>{a.title} {a.date && `— ${a.date}`}</li>)}</ul>
          </section>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   TEMPLATE 3 — LEDGER
============================================================ */
function LedgerTemplate({ resume }) {
  return (
    <div className="bg-white rounded-lg border border-neutral-300 shadow-[0_14px_44px_-20px_rgba(0,0,0,0.2)] p-10 sm:p-12">
      <header className="text-center mb-6 pb-4 border-b-4 border-double border-neutral-800">
        <h1 className="font-serif text-[22pt] font-black tracking-tight text-neutral-900 uppercase">
          {resume.personalInfo?.fullName || "Your Name"}
        </h1>
        {resume.experience?.[0]?.jobTitle && (
          <p className="text-[13pt] uppercase tracking-[0.25em] text-neutral-500 mt-1">{resume.experience[0].jobTitle}</p>
        )}
        <p className="text-[11pt] text-neutral-600 mt-2">
          {[resume.personalInfo?.email, resume.personalInfo?.phone, resume.personalInfo?.location, resume.personalInfo?.linkedin]
            .filter(Boolean)
            .join(" | ")}
        </p>
      </header>

      {resume.summary && (
        <section className="mb-5 pb-4 border-b border-neutral-300">
          <h2 className="font-serif text-[13pt] font-bold uppercase tracking-widest text-neutral-800 mb-2">Summary</h2>
          <p className="text-[12pt] leading-relaxed text-neutral-700">
            {resume.summary}
          </p>
        </section>
      )}

      <div className="flex flex-col">
        {resume.experience?.length > 0 && (
          <section className="mb-5">
            <h2 className="font-serif text-[13pt] font-bold uppercase tracking-widest text-neutral-800 mb-2 pb-1 border-b border-neutral-300">Experience</h2>
            {resume.experience.map((exp, index) => (
              <div key={index} className="mb-4 last:mb-0">
                <h3 className="font-bold text-[12pt] text-neutral-900">{exp.jobTitle}</h3>
                <p className="text-[11pt] text-neutral-500 italic">{exp.company}, {exp.location}</p>
                <p className="text-[11pt] text-neutral-400 mb-1">{exp.startDate} – {exp.current ? "Present" : exp.endDate}</p>
                <ul className="text-[11pt] text-neutral-700 leading-relaxed list-disc pl-4">
                  {exp.bullets?.filter((b) => b.trim()).map((bullet, i) => <li key={i} className="mb-0.5">{bullet}</li>)}
                </ul>
              </div>
            ))}
          </section>
        )}
        {resume.projects?.length > 0 && (
          <section className="mb-5">
            <h2 className="font-serif text-[13pt] font-bold uppercase tracking-widest text-neutral-800 mb-2 pb-1 border-b border-neutral-300">Projects</h2>
            {resume.projects.map((proj, index) => (
              <div key={index} className="mb-3 last:mb-0">
                <h3 className="font-bold text-[12pt] text-neutral-900">{proj.name}</h3>
                {proj.techStack && <p className="text-[11pt] text-neutral-400 italic mb-0.5">{proj.techStack}</p>}
                <ul className="text-[11pt] text-neutral-700 leading-relaxed list-disc pl-4">
                  {proj.bullets?.filter((b) => b.trim()).map((bullet, i) => <li key={i} className="mb-0.5">{bullet}</li>)}
                </ul>
              </div>
            ))}
          </section>
        )}
        {resume.education?.length > 0 && (
          <section className="mb-5">
            <h2 className="font-serif text-[13pt] font-bold uppercase tracking-widest text-neutral-800 mb-2 pb-1 border-b border-neutral-300">Education</h2>
            {resume.education.map((edu, index) => (
              <div key={index} className="mb-2 last:mb-0">
                <h3 className="font-bold text-[12pt] text-neutral-900">{edu.degree}</h3>
                <p className="text-[11pt] text-neutral-500">{edu.school}</p>
                <p className="text-[11pt] text-neutral-400">{edu.startDate} – {edu.endDate}</p>
              </div>
            ))}
          </section>
        )}
        {resume.skills?.length > 0 && (
          <section className="mb-5">
            <h2 className="font-serif text-[13pt] font-bold uppercase tracking-widest text-neutral-800 mb-2 pb-1 border-b border-neutral-300">Skills</h2>
            <p className="text-[11pt] text-neutral-700 leading-relaxed">{resume.skills.join(", ")}</p>
          </section>
        )}
        {resume.certifications?.length > 0 && (
          <section className="mb-5">
            <h2 className="font-serif text-[13pt] font-bold uppercase tracking-widest text-neutral-800 mb-2 pb-1 border-b border-neutral-300">Certifications</h2>
            <ul className="text-[11pt] text-neutral-700 leading-relaxed list-none space-y-0.5">
              {resume.certifications.map((c, i) => <li key={i}>{c.name} {c.date && `(${c.date})`}</li>)}
            </ul>
          </section>
        )}

        <CustomSections resume={resume} variant="ledger" />

        {(resume.languages?.filter((l) => l.name).length > 0 || resume.awards?.length > 0) && (
          <section>
            <h2 className="font-serif text-[13pt] font-bold uppercase tracking-widest text-neutral-800 mb-2 pb-1 border-b border-neutral-300">Additional</h2>
            <ul className="text-[11pt] text-neutral-700 leading-relaxed list-none space-y-0.5">
              {resume.languages?.filter((l) => l.name).map((l, i) => <li key={`l-${i}`}>{l.name} {l.proficiency && `— ${l.proficiency}`}</li>)}
              {resume.awards?.map((a, i) => <li key={`a-${i}`}>{a.title} {a.date && `(${a.date})`}</li>)}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   TEMPLATE 4 — MINIMAL (new)
   Plain single column, no colors, thin rules, generous
   whitespace. About as simple as a resume gets.
============================================================ */
function MinimalTemplate({ resume }) {
  const contactLine = [
    resume.personalInfo?.email,
    resume.personalInfo?.phone,
    resume.personalInfo?.location,
    resume.personalInfo?.linkedin,
    resume.personalInfo?.website,
  ].filter(Boolean).join("  •  ");

  return (
    <div className="bg-white p-10 sm:p-14 text-neutral-900">
      <header className="mb-8">
        <h1 className="text-[24pt] font-bold tracking-tight">{resume.personalInfo?.fullName || "Your Name"}</h1>
        {resume.experience?.[0]?.jobTitle && (
          <p className="text-[13pt] text-neutral-600 mt-1">{resume.experience[0].jobTitle}</p>
        )}
        {contactLine && <p className="text-[10.5pt] text-neutral-500 mt-2">{contactLine}</p>}
        <div className="mt-5 border-b border-neutral-300" />
      </header>

      {resume.summary && (
        <section className="mb-7">
          <p className="text-[11.5pt] leading-relaxed text-neutral-700">{resume.summary}</p>
        </section>
      )}

      {resume.experience?.length > 0 && (
        <section className="mb-7">
          <h2 className="text-[12pt] font-bold uppercase tracking-wider text-neutral-900 mb-3 pb-1 border-b border-neutral-300">
            Experience
          </h2>
          {resume.experience.map((exp, index) => (
            <div key={index} className="mb-5 last:mb-0">
              <div className="flex justify-between items-baseline flex-wrap gap-x-2">
                <h3 className="font-semibold text-[11.5pt] text-neutral-900">{exp.jobTitle}</h3>
                <span className="text-[10.5pt] text-neutral-500 whitespace-nowrap">
                  {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                </span>
              </div>
              <p className="text-[10.5pt] text-neutral-500 mb-1.5">
                {exp.company}{exp.location && ` · ${exp.location}`}
              </p>
              <ul className="text-[11pt] text-neutral-700 leading-relaxed list-disc pl-5">
                {exp.bullets?.filter((b) => b.trim()).map((bullet, i) => (
                  <li key={i} className="mb-0.5">{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {resume.projects?.length > 0 && (
        <section className="mb-7">
          <h2 className="text-[12pt] font-bold uppercase tracking-wider text-neutral-900 mb-3 pb-1 border-b border-neutral-300">
            Projects
          </h2>
          {resume.projects.map((proj, index) => (
            <div key={index} className="mb-4 last:mb-0">
              <div className="flex justify-between items-baseline flex-wrap gap-x-2">
                <h3 className="font-semibold text-[11.5pt] text-neutral-900">{proj.name}</h3>
                {proj.link && <span className="text-[10.5pt] text-neutral-500">{proj.link}</span>}
              </div>
              {proj.techStack && <p className="text-[10.5pt] text-neutral-500 mb-1">{proj.techStack}</p>}
              <ul className="text-[11pt] text-neutral-700 leading-relaxed list-disc pl-5">
                {proj.bullets?.filter((b) => b.trim()).map((bullet, i) => (
                  <li key={i} className="mb-0.5">{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {resume.education?.length > 0 && (
        <section className="mb-7">
          <h2 className="text-[12pt] font-bold uppercase tracking-wider text-neutral-900 mb-3 pb-1 border-b border-neutral-300">
            Education
          </h2>
          {resume.education.map((edu, index) => (
            <div key={index} className="mb-2 flex justify-between items-baseline flex-wrap gap-x-2">
              <div>
                <h3 className="font-semibold text-[11.5pt] text-neutral-900">{edu.degree}</h3>
                <p className="text-[10.5pt] text-neutral-500">{edu.school} {edu.location && `· ${edu.location}`}</p>
              </div>
              <span className="text-[10.5pt] text-neutral-500 whitespace-nowrap">{edu.startDate} – {edu.endDate}</span>
            </div>
          ))}
        </section>
      )}

      {resume.skills?.length > 0 && (
        <section className="mb-7">
          <h2 className="text-[12pt] font-bold uppercase tracking-wider text-neutral-900 mb-2 pb-1 border-b border-neutral-300">
            Skills
          </h2>
          <p className="text-[11pt] text-neutral-700 leading-relaxed">{resume.skills.join("  ·  ")}</p>
        </section>
      )}

      {resume.certifications?.length > 0 && (
        <section className="mb-7">
          <h2 className="text-[12pt] font-bold uppercase tracking-wider text-neutral-900 mb-2 pb-1 border-b border-neutral-300">
            Certifications
          </h2>
          <ul className="text-[11pt] text-neutral-700 leading-relaxed list-none space-y-0.5">
            {resume.certifications.map((c, i) => (
              <li key={i}>{c.name} {c.date && <span className="text-neutral-500">— {c.date}</span>}</li>
            ))}
          </ul>
        </section>
      )}

      <CustomSections resume={resume} variant="minimal" />

      {(resume.languages?.filter((l) => l.name).length > 0 || resume.awards?.length > 0) && (
        <section>
          <h2 className="text-[12pt] font-bold uppercase tracking-wider text-neutral-900 mb-2 pb-1 border-b border-neutral-300">
            Additional
          </h2>
          <ul className="text-[11pt] text-neutral-700 leading-relaxed list-none space-y-0.5">
            {resume.languages?.filter((l) => l.name).map((l, i) => (
              <li key={`l-${i}`}>{l.name} {l.proficiency && `— ${l.proficiency}`}</li>
            ))}
            {resume.awards?.map((a, i) => (
              <li key={`a-${i}`}>{a.title} {a.date && `(${a.date})`}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/* ============================================================
   TEMPLATE 5 — CLASSIC (new)
   Simple two-column: plain gray sidebar (contact/skills/
   education), main column for summary/experience. No colors,
   no gradients, no pills — just borders and gray tones.
============================================================ */
