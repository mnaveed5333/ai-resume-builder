"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

const TEMPLATES = [
  { id: "onyx", label: "Onyx", blurb: "Dark & luxe — executive" },
  { id: "slate", label: "Slate", blurb: "Clean & ATS-friendly" },
  { id: "studio", label: "Studio", blurb: "Bold & creative" },
  { id: "nova", label: "Nova", blurb: "Modern & vibrant" },
  { id: "ivory", label: "Ivory", blurb: "Elegant & minimal" },
  { id: "aurora", label: "Aurora", blurb: "Soft pastel gradient" },
  { id: "ledger", label: "Ledger", blurb: "Newspaper columns" },
  { id: "pulse", label: "Pulse", blurb: "Bold red & black" },
  { id: "botanica", label: "Botanica", blurb: "Nature-inspired calm" },
  { id: "metro", label: "Metro", blurb: "Blue corporate grid" },
];

export default function PreviewPage() {
  const { id } = useParams();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState("onyx");
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
          {template === "onyx" && <OnyxTemplate resume={resume} />}
          {template === "slate" && <SlateTemplate resume={resume} />}
          {template === "studio" && <StudioTemplate resume={resume} />}
          {template === "nova" && <NovaTemplate resume={resume} />}
          {template === "ivory" && <IvoryTemplate resume={resume} />}
          {template === "aurora" && <AuroraTemplate resume={resume} />}
          {template === "ledger" && <LedgerTemplate resume={resume} />}
          {template === "pulse" && <PulseTemplate resume={resume} />}
          {template === "botanica" && <BotanicaTemplate resume={resume} />}
          {template === "metro" && <MetroTemplate resume={resume} />}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CUSTOM SECTIONS RENDERER (shared across all templates)
   — unchanged from your original file
============================================================ */
function CustomSections({ resume, variant }) {
  const sections = (resume.customSections || []).filter(
    (s) => s.title?.trim() || s.items?.some((i) => i.heading?.trim())
  );
  if (sections.length === 0) return null;

  if (variant === "onyx") {
    return (
      <>
        {sections.map((section, si) => (
          <div key={si} className="mb-7">
            <h2 className="flex items-center gap-2 text-[13pt] font-bold tracking-[0.18em] uppercase text-amber-200 mb-3">
              <span className="w-1.5 h-1.5 bg-amber-500 rotate-45 inline-block" />
              {section.title || "Custom Section"}
            </h2>
            <ul className="text-[12pt] text-neutral-300 leading-relaxed list-none space-y-2.5">
              {section.items?.map((item, ii) => (
                <li key={ii}>
                  <p className="font-medium">{item.heading}</p>
                  {(item.subheading || item.date) && (
                    <p className="text-neutral-500 text-[11pt]">
                      {item.subheading} {item.date && `· ${item.date}`}
                    </p>
                  )}
                  {item.bullets?.filter((b) => b.trim()).length > 0 && (
                    <ul className="list-none mt-1 space-y-0.5">
                      {item.bullets.filter((b) => b.trim()).map((b, bi) => (
                        <li key={bi} className="text-[11pt]">{b}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </>
    );
  }

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

  if (variant === "studio") {
    return (
      <>
        {sections.map((section, si) => (
          <section key={si} className="mb-8">
            <h2 className="flex items-center gap-2 font-bold text-[13pt] text-violet-950 mb-3">
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-600 to-pink-600" />
              {section.title || "Custom Section"}
            </h2>
            <div className="flex flex-col gap-3">
              {section.items?.map((item, ii) => (
                <div
                  key={ii}
                  className="bg-white/70 backdrop-blur border border-violet-100 rounded-2xl p-4 shadow-[0_4px_20px_-8px_rgba(124,58,237,0.15)]"
                >
                  <div className="flex justify-between items-baseline flex-wrap gap-x-2">
                    <h3 className="font-bold text-[12pt] text-violet-950">{item.heading}</h3>
                    {item.date && (
                      <span className="text-[11pt] text-violet-400 whitespace-nowrap font-medium">{item.date}</span>
                    )}
                  </div>
                  {item.subheading && (
                    <p className="text-[11pt] text-violet-500 mb-1 font-medium">{item.subheading}</p>
                  )}
                  <ul className="text-[12pt] text-violet-900/90 leading-relaxed mt-1.5 list-none">
                    {item.bullets?.filter((b) => b.trim()).map((b, bi) => (
                      <li key={bi} className="relative pl-4 mb-1">
                        <span className="absolute left-0 text-purple-500 font-bold">▸</span>{b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}
      </>
    );
  }

  if (variant === "nova") {
    return (
      <>
        {sections.map((section, si) => (
          <div key={si} className="bg-white rounded-xl border border-emerald-100 p-4 shadow-sm mb-4">
            <h2 className="text-[13pt] font-bold uppercase tracking-widest text-emerald-700 mb-2">
              {section.title || "Custom Section"}
            </h2>
            {section.items?.map((item, ii) => (
              <div key={ii} className="mb-2 last:mb-0">
                <div className="flex justify-between items-baseline flex-wrap gap-x-2">
                  <h3 className="font-bold text-[12pt] text-neutral-900">{item.heading}</h3>
                  {item.date && (
                    <span className="text-[11pt] text-emerald-600 whitespace-nowrap font-semibold">{item.date}</span>
                  )}
                </div>
                {item.subheading && <p className="text-[11pt] text-neutral-500">{item.subheading}</p>}
                <ul className="text-[12pt] text-neutral-700 leading-relaxed list-none space-y-1 mt-1">
                  {item.bullets?.filter((b) => b.trim()).map((b, bi) => (
                    <li key={bi} className="relative pl-4">
                      <span className="absolute left-0 text-emerald-500 font-bold">✓</span>{b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
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

  if (variant === "aurora") {
    return (
      <>
        {sections.map((section, si) => (
          <div key={si} className="bg-white/70 backdrop-blur rounded-2xl p-4 border border-violet-100 mb-3">
            <h2 className="text-[13pt] font-bold uppercase tracking-widest text-violet-500 mb-2">
              {section.title || "Custom Section"}
            </h2>
            {section.items?.map((item, ii) => (
              <div key={ii} className="mb-2 last:mb-0">
                <h3 className="font-bold text-[12pt] text-violet-950">{item.heading}</h3>
                {item.subheading && <p className="text-[11pt] text-violet-400">{item.subheading}</p>}
                {item.date && <p className="text-[11pt] text-pink-500 font-medium">{item.date}</p>}
                <ul className="text-[12pt] text-violet-900 leading-relaxed list-none space-y-1 mt-1">
                  {item.bullets?.filter((b) => b.trim()).map((b, bi) => (
                    <li key={bi} className="relative pl-4">
                      <span className="absolute left-0 text-violet-400">✦</span>{b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
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

  if (variant === "pulse") {
    return (
      <>
        {sections.map((section, si) => (
          <div key={si} className="mb-4">
            <h2 className="text-[13pt] font-black uppercase tracking-[0.2em] text-red-500 mb-2">
              {section.title || "Custom Section"}
            </h2>
            {section.items?.map((item, ii) => (
              <div key={ii} className="mb-2 last:mb-0 pl-4 border-l-2 border-red-600">
                <div className="flex justify-between items-baseline flex-wrap gap-x-2">
                  <h3 className="font-bold text-[12pt] text-white">{item.heading}</h3>
                  {item.date && (
                    <span className="text-[11pt] text-red-400 whitespace-nowrap font-bold">{item.date}</span>
                  )}
                </div>
                {item.subheading && <p className="text-[11pt] text-neutral-400">{item.subheading}</p>}
                <ul className="text-[12pt] text-neutral-300 leading-relaxed list-none space-y-1 mt-1">
                  {item.bullets?.filter((b) => b.trim()).map((b, bi) => (
                    <li key={bi} className="relative pl-4">
                      <span className="absolute left-0 text-red-500 font-black">▪</span>{b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </>
    );
  }

  if (variant === "botanica") {
    return (
      <>
        {sections.map((section, si) => (
          <div key={si} className="bg-white rounded-2xl p-4 border border-emerald-100 mb-3">
            <h2 className="text-[13pt] font-bold uppercase tracking-widest text-emerald-700 mb-2">
              {section.title || "Custom Section"}
            </h2>
            {section.items?.map((item, ii) => (
              <div key={ii} className="mb-2 last:mb-0">
                <h3 className="font-bold text-[12pt] text-emerald-950">{item.heading}</h3>
                {item.subheading && <p className="text-[11pt] text-emerald-600">{item.subheading}</p>}
                {item.date && <p className="text-[11pt] text-emerald-500 font-medium">{item.date}</p>}
                <ul className="text-[12pt] text-emerald-950/80 leading-relaxed list-none space-y-1 mt-1">
                  {item.bullets?.filter((b) => b.trim()).map((b, bi) => (
                    <li key={bi} className="relative pl-4">
                      <span className="absolute left-0 text-emerald-500">🌱</span>{b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </>
    );
  }

  if (variant === "metro") {
    return (
      <>
        {sections.map((section, si) => (
          <div key={si} className="border border-blue-200 rounded-lg p-4 mb-4">
            <h2 className="text-[13pt] font-bold uppercase tracking-widest text-blue-900 mb-2 pb-1 border-b border-blue-200">
              {section.title || "Custom Section"}
            </h2>
            {section.items?.map((item, ii) => (
              <div key={ii} className="mb-2 last:mb-0">
                <div className="flex justify-between items-baseline flex-wrap gap-x-2">
                  <h3 className="font-bold text-[12pt] text-neutral-900">{item.heading}</h3>
                  {item.date && (
                    <span className="text-[11pt] text-blue-700 whitespace-nowrap font-medium">{item.date}</span>
                  )}
                </div>
                {item.subheading && <p className="text-[11pt] text-neutral-500">{item.subheading}</p>}
                <ul className="text-[12pt] text-neutral-700 leading-relaxed list-disc pl-5">
                  {item.bullets?.filter((b) => b.trim()).map((b, bi) => (
                    <li key={bi} className="mb-0.5">{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </>
    );
  }

  return null;
}

/* ============================================================
   TEMPLATE 1 — ONYX (unchanged)
============================================================ */
function OnyxTemplate({ resume }) {
  const initial = resume.personalInfo?.fullName?.trim()?.[0]?.toUpperCase() || "R";
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 rounded-xl overflow-hidden shadow-[0_30px_80px_-24px_rgba(20,22,26,0.45)] border border-amber-700/20">
      <aside className="sidebar sm:col-span-1 bg-gradient-to-b from-neutral-900 via-neutral-800 to-neutral-900 text-neutral-200 p-8 relative">
        <div className="w-12 h-12 rounded-full border-[1.5px] border-amber-400 flex items-center justify-center text-amber-200 font-serif font-bold text-lg mb-6 shadow-[0_0_0_4px_rgba(184,147,90,0.08)]">
          {initial}
        </div>
        <h1 className="font-serif font-extrabold text-[22pt] leading-tight text-white mb-1 tracking-tight">
          {resume.personalInfo?.fullName || "Your Name"}
        </h1>
        {resume.experience?.[0]?.jobTitle && (
          <p className="text-[13pt] tracking-wide text-amber-200 font-medium">{resume.experience[0].jobTitle}</p>
        )}
        <div className="w-11 h-0.5 bg-gradient-to-r from-amber-500 to-transparent my-6" />
        <div className="mb-7">
          <h2 className="flex items-center gap-2 text-[13pt] font-bold tracking-[0.18em] uppercase text-amber-200 mb-3">
            <span className="w-1.5 h-1.5 bg-amber-500 rotate-45 inline-block" />Contact
          </h2>
          <ul className="text-[12pt] text-neutral-300 leading-relaxed list-none space-y-1 break-words">
            {resume.personalInfo?.email && <li>{resume.personalInfo.email}</li>}
            {resume.personalInfo?.phone && <li>{resume.personalInfo.phone}</li>}
            {resume.personalInfo?.location && <li>{resume.personalInfo.location}</li>}
            {resume.personalInfo?.linkedin && <li>{resume.personalInfo.linkedin}</li>}
            {resume.personalInfo?.website && <li>{resume.personalInfo.website}</li>}
          </ul>
        </div>
        {resume.skills?.length > 0 && (
          <div className="mb-7">
            <h2 className="flex items-center gap-2 text-[13pt] font-bold tracking-[0.18em] uppercase text-amber-200 mb-3">
              <span className="w-1.5 h-1.5 bg-amber-500 rotate-45 inline-block" />Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {resume.skills.map((skill, i) => (
                <span key={i} className="text-[11pt] font-medium px-2.5 py-1 border border-amber-500/50 text-amber-100 rounded-full bg-amber-500/10">{skill}</span>
              ))}
            </div>
          </div>
        )}

        <CustomSections resume={resume} variant="onyx" />

        {resume.languages?.filter((l) => l.name).length > 0 && (
          <div className="mb-7">
            <h2 className="flex items-center gap-2 text-[13pt] font-bold tracking-[0.18em] uppercase text-amber-200 mb-3">
              <span className="w-1.5 h-1.5 bg-amber-500 rotate-45 inline-block" />Languages
            </h2>
            <ul className="text-[12pt] text-neutral-300 leading-relaxed list-none space-y-1">
              {resume.languages.filter((l) => l.name).map((l, i) => (
                <li key={i}>{l.name}{l.proficiency && <span className="text-neutral-500"> — {l.proficiency}</span>}</li>
              ))}
            </ul>
          </div>
        )}
        {resume.certifications?.length > 0 && (
          <div>
            <h2 className="flex items-center gap-2 text-[13pt] font-bold tracking-[0.18em] uppercase text-amber-200 mb-3">
              <span className="w-1.5 h-1.5 bg-amber-500 rotate-45 inline-block" />Certifications
            </h2>
            <ul className="text-[12pt] text-neutral-300 leading-relaxed list-none space-y-2.5">
              {resume.certifications.map((cert, i) => (
                <li key={i}><p className="font-medium">{cert.name}</p><p className="text-neutral-500 text-[11pt]">{cert.issuer} {cert.date && `· ${cert.date}`}</p></li>
              ))}
            </ul>
          </div>
        )}
      </aside>
      <main className="sm:col-span-2 bg-[#faf8f4] p-9">
        {resume.summary && (
          <section className="mb-7">
            <h2 className="flex items-center gap-3 font-serif font-bold text-[13pt] text-neutral-900 mb-4">Professional Summary<span className="flex-1 h-px bg-gradient-to-r from-amber-300 to-transparent" /></h2>
            <p className="text-[12pt] leading-relaxed text-neutral-700">{resume.summary}</p>
          </section>
        )}
        {resume.experience?.length > 0 && (
          <section className="mb-7">
            <h2 className="flex items-center gap-3 font-serif font-bold text-[13pt] text-neutral-900 mb-4">Work Experience<span className="flex-1 h-px bg-gradient-to-r from-amber-300 to-transparent" /></h2>
            <div className="relative pl-5 border-l-[1.5px] border-amber-200">
              {resume.experience.map((exp, index) => (
                <div key={index} className="relative mb-6 last:mb-0">
                  <span className="absolute -left-[1.42rem] top-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-[#faf8f4] shadow-[0_0_0_1px_rgba(184,147,90,0.4)]" />
                  <div className="flex justify-between items-baseline flex-wrap gap-x-2">
                    <h3 className="font-bold text-[12pt] text-neutral-900">{exp.jobTitle}{exp.company && <span className="text-neutral-500 font-normal"> — {exp.company}</span>}</h3>
                    <span className="text-[11pt] text-neutral-500 whitespace-nowrap font-medium tracking-wide">{exp.startDate} - {exp.current ? "Present" : exp.endDate}</span>
                  </div>
                  {exp.location && <p className="text-neutral-500 text-[11pt] mb-1">{exp.location}</p>}
                  <ul className="text-[12pt] text-neutral-700 leading-relaxed mt-2 list-none">
                    {exp.bullets?.filter((b) => b.trim()).map((bullet, i) => (
                      <li key={i} className="relative pl-4 mb-1.5"><span className="absolute left-0 text-amber-600 font-bold">—</span>{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
        {resume.projects?.length > 0 && (
          <section className="mb-7">
            <h2 className="flex items-center gap-3 font-serif font-bold text-[13pt] text-neutral-900 mb-4">Projects<span className="flex-1 h-px bg-gradient-to-r from-amber-300 to-transparent" /></h2>
            {resume.projects.map((proj, index) => (
              <div key={index} className="mb-5 last:mb-0">
                <div className="flex justify-between items-baseline flex-wrap gap-x-2">
                  <h3 className="font-bold text-[12pt] text-neutral-900">{proj.name}{proj.techStack && <span className="text-neutral-500 font-normal"> — {proj.techStack}</span>}</h3>
                  {proj.link && <span className="text-[11pt] text-amber-600 whitespace-nowrap font-medium">{proj.link}</span>}
                </div>
                <ul className="text-[12pt] text-neutral-700 leading-relaxed mt-2 list-none">
                  {proj.bullets?.filter((b) => b.trim()).map((bullet, i) => (
                    <li key={i} className="relative pl-4 mb-1.5"><span className="absolute left-0 text-amber-600 font-bold">—</span>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}
        {resume.education?.length > 0 && (
          <section className="mb-7">
            <h2 className="flex items-center gap-3 font-serif font-bold text-[13pt] text-neutral-900 mb-4">Education<span className="flex-1 h-px bg-gradient-to-r from-amber-300 to-transparent" /></h2>
            {resume.education.map((edu, index) => (
              <div key={index} className="mb-3 flex justify-between items-baseline flex-wrap gap-x-2">
                <div><h3 className="font-bold text-[12pt] text-neutral-900">{edu.degree}</h3><p className="text-neutral-500 text-[11pt]">{edu.school} {edu.location && `— ${edu.location}`}</p></div>
                <span className="text-[11pt] text-neutral-500 whitespace-nowrap font-medium">{edu.startDate} - {edu.endDate}</span>
              </div>
            ))}
          </section>
        )}
        {resume.awards?.length > 0 && (
          <section>
            <h2 className="flex items-center gap-3 font-serif font-bold text-[13pt] text-neutral-900 mb-4">Awards &amp; Achievements<span className="flex-1 h-px bg-gradient-to-r from-amber-300 to-transparent" /></h2>
            {resume.awards.map((award, index) => (
              <div key={index} className="mb-3 flex justify-between items-baseline flex-wrap gap-x-2">
                <div><h3 className="font-bold text-[12pt] text-neutral-900">{award.title}</h3><p className="text-neutral-500 text-[11pt]">{award.issuer}</p></div>
                <span className="text-[11pt] text-neutral-500 whitespace-nowrap font-medium">{award.date}</span>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

/* ============================================================
   TEMPLATE 2 — SLATE (unchanged)
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
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((skill, i) => <span key={i} className="text-[11pt] font-medium px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-md text-slate-700">{skill}</span>)}
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
   TEMPLATE 3 — STUDIO (unchanged)
============================================================ */
function StudioTemplate({ resume }) {
  const initial = resume.personalInfo?.fullName?.trim()?.[0]?.toUpperCase() || "R";
  const chipGradients = ["bg-gradient-to-r from-indigo-500 to-indigo-600", "bg-gradient-to-r from-violet-500 to-violet-600", "bg-gradient-to-r from-pink-500 to-pink-600", "bg-gradient-to-r from-amber-500 to-amber-600"];
  return (
    <div className="rounded-2xl overflow-hidden shadow-[0_30px_70px_-24px_rgba(76,29,149,0.4)]">
      <header className="relative overflow-hidden p-9 sm:p-11 bg-gradient-to-br from-indigo-600 via-violet-600 to-pink-600 text-white">
        <div className="absolute rounded-full blur-3xl opacity-35 w-56 h-56 bg-amber-400 -top-20 -right-16" />
        <div className="absolute rounded-full blur-3xl opacity-35 w-44 h-44 bg-cyan-400 -bottom-24 left-1/3" />
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur border border-white/40 flex items-center justify-center font-bold text-2xl shadow-lg">{initial}</div>
          <div><h1 className="font-bold text-[22pt] leading-tight">{resume.personalInfo?.fullName || "Your Name"}</h1>{resume.experience?.[0]?.jobTitle && <p className="text-[13pt] opacity-95 mt-1 font-medium">{resume.experience[0].jobTitle}</p>}</div>
        </div>
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[11pt] opacity-95 font-medium relative z-10">
          {resume.personalInfo?.email && <span>✉ {resume.personalInfo.email}</span>}
          {resume.personalInfo?.phone && <span>☎ {resume.personalInfo.phone}</span>}
          {resume.personalInfo?.location && <span>📍 {resume.personalInfo.location}</span>}
          {resume.personalInfo?.linkedin && <span>in {resume.personalInfo.linkedin}</span>}
          {resume.personalInfo?.website && <span>🔗 {resume.personalInfo.website}</span>}
        </div>
      </header>
      <div className="p-9 sm:p-11 bg-[#fbfaff]">
        {resume.summary && <section className="mb-8"><h2 className="flex items-center gap-2 font-bold text-[13pt] text-violet-950 mb-3"><span className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-600 to-pink-600" />About</h2><p className="text-[13pt] leading-relaxed text-violet-900/90">{resume.summary}</p></section>}
        {resume.skills?.length > 0 && (
          <section className="mb-8"><h2 className="flex items-center gap-2 font-bold text-[13pt] text-violet-950 mb-3"><span className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-600 to-pink-600" />Skills</h2>
            <div className="flex flex-wrap gap-2">{resume.skills.map((skill, i) => <span key={i} className={`text-[11pt] font-semibold px-3 py-1.5 rounded-full text-white shadow-md ${chipGradients[i % 4]}`}>{skill}</span>)}</div>
          </section>
        )}
        {resume.experience?.length > 0 && (
          <section className="mb-8"><h2 className="flex items-center gap-2 font-bold text-[13pt] text-violet-950 mb-3"><span className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-600 to-pink-600" />Experience</h2>
            {resume.experience.map((exp, index) => (
              <div key={index} className="mb-5 last:mb-0">
                <div className="flex justify-between items-baseline flex-wrap gap-x-2"><h3 className="font-bold text-[12pt] text-violet-950">{exp.jobTitle}</h3><span className="text-[11pt] text-violet-400 whitespace-nowrap font-medium">{exp.startDate} → {exp.current ? "Present" : exp.endDate}</span></div>
                <p className="text-[11pt] text-violet-500 mb-1 font-medium">{exp.company}{exp.location && ` · ${exp.location}`}</p>
                <ul className="text-[12pt] text-violet-900/90 leading-relaxed mt-1.5 list-none">{exp.bullets?.filter((b) => b.trim()).map((bullet, i) => <li key={i} className="relative pl-4 mb-1"><span className="absolute left-0 text-purple-500 font-bold">▸</span>{bullet}</li>)}</ul>
              </div>
            ))}
          </section>
        )}
        {resume.projects?.length > 0 && (
          <section className="mb-8"><h2 className="flex items-center gap-2 font-bold text-[13pt] text-violet-950 mb-3"><span className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-600 to-pink-600" />Projects</h2>
            <div className="flex flex-col gap-4">
              {resume.projects.map((proj, index) => (
                <div key={index} className="bg-white/70 backdrop-blur border border-violet-100 rounded-2xl p-4 shadow-[0_4px_20px_-8px_rgba(124,58,237,0.15)]">
                  <h3 className="font-bold text-[12pt] text-violet-950">{proj.name}</h3>{proj.techStack && <p className="text-[11pt] text-violet-500 mb-1 font-medium">{proj.techStack}</p>}
                  <ul className="text-[12pt] text-violet-900/90 leading-relaxed mt-1.5 list-none">{proj.bullets?.filter((b) => b.trim()).map((bullet, i) => <li key={i} className="relative pl-4 mb-1"><span className="absolute left-0 text-purple-500 font-bold">▸</span>{bullet}</li>)}</ul>
                  {proj.link && <p className="text-[11pt] text-violet-600 mt-2 font-medium">🔗 {proj.link}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
        <div className="flex flex-col gap-8">
          {resume.education?.length > 0 && (
            <section><h2 className="flex items-center gap-2 font-bold text-[13pt] text-violet-950 mb-3"><span className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-600 to-pink-600" />Education</h2>
              {resume.education.map((edu, index) => <div key={index} className="mb-3"><h3 className="font-bold text-[12pt] text-violet-950">{edu.degree}</h3><p className="text-[11pt] text-violet-500 mb-0.5 font-medium">{edu.school} {edu.location && `· ${edu.location}`}</p><p className="text-[11pt] text-violet-400 font-medium">{edu.startDate} – {edu.endDate}</p></div>)}
            </section>
          )}

          <CustomSections resume={resume} variant="studio" />

          {(resume.certifications?.length > 0 || resume.languages?.filter((l) => l.name).length > 0 || resume.awards?.length > 0) && (
            <section><h2 className="flex items-center gap-2 font-bold text-[13pt] text-violet-950 mb-3"><span className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-600 to-pink-600" />More</h2>
              <ul className="text-[12pt] text-violet-900/90 leading-loose list-none">
                {resume.certifications?.map((c, i) => <li key={`c-${i}`}>🎓 {c.name} {c.date && `(${c.date})`}</li>)}
                {resume.languages?.filter((l) => l.name).map((l, i) => <li key={`l-${i}`}>🌐 {l.name} {l.proficiency && `— ${l.proficiency}`}</li>)}
                {resume.awards?.map((a, i) => <li key={`a-${i}`}>🏆 {a.title} {a.date && `(${a.date})`}</li>)}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TEMPLATE 4 — NOVA (unchanged)
============================================================ */
function NovaTemplate({ resume }) {
  const initial = resume.personalInfo?.fullName?.trim()?.[0]?.toUpperCase() || "R";
  return (
    <div className="rounded-2xl overflow-hidden shadow-[0_24px_60px_-20px_rgba(6,95,70,0.35)] bg-white">
      <header className="relative bg-gradient-to-r from-emerald-600 to-teal-500 p-8 sm:p-10 text-white">
        <div className="flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/15 border border-white/30 flex items-center justify-center font-bold text-xl">{initial}</div>
            <div><h1 className="font-bold text-[22pt] leading-tight">{resume.personalInfo?.fullName || "Your Name"}</h1>{resume.experience?.[0]?.jobTitle && <p className="text-[13pt] text-emerald-50 font-medium mt-0.5">{resume.experience[0].jobTitle}</p>}</div>
          </div>
          <div className="flex flex-col items-end text-[11pt] text-emerald-50 gap-1 font-medium">
            {resume.personalInfo?.email && <span>{resume.personalInfo.email}</span>}
            {resume.personalInfo?.phone && <span>{resume.personalInfo.phone}</span>}
            {resume.personalInfo?.location && <span>{resume.personalInfo.location}</span>}
          </div>
        </div>
      </header>
      <div className="p-8 sm:p-10 bg-emerald-50/30">
        {resume.summary && <section className="mb-6 bg-white rounded-xl border border-emerald-100 p-5 shadow-sm"><h2 className="text-[13pt] font-bold uppercase tracking-widest text-emerald-700 mb-2">Summary</h2><p className="text-[13pt] leading-relaxed text-neutral-700">{resume.summary}</p></section>}
        {resume.skills?.length > 0 && (
          <section className="mb-6"><h2 className="text-[13pt] font-bold uppercase tracking-widest text-emerald-700 mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">{resume.skills.map((skill, i) => <span key={i} className="text-[11pt] font-semibold px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-lg">{skill}</span>)}</div>
          </section>
        )}
        {resume.experience?.length > 0 && (
          <section className="mb-6"><h2 className="text-[13pt] font-bold uppercase tracking-widest text-emerald-700 mb-3">Experience</h2>
            <div className="space-y-3">
              {resume.experience.map((exp, index) => (
                <div key={index} className="bg-white rounded-xl border border-emerald-100 p-5 shadow-sm">
                  <div className="flex justify-between items-baseline flex-wrap gap-x-2"><h3 className="font-bold text-[12pt] text-neutral-900">{exp.jobTitle}</h3><span className="text-[11pt] text-emerald-600 whitespace-nowrap font-semibold">{exp.startDate} – {exp.current ? "Present" : exp.endDate}</span></div>
                  <p className="text-[11pt] text-neutral-500 mb-2">{exp.company}{exp.location && ` · ${exp.location}`}</p>
                  <ul className="text-[12pt] text-neutral-700 leading-relaxed list-none space-y-1">{exp.bullets?.filter((b) => b.trim()).map((bullet, i) => <li key={i} className="relative pl-4"><span className="absolute left-0 text-emerald-500 font-bold">✓</span>{bullet}</li>)}</ul>
                </div>
              ))}
            </div>
          </section>
        )}
        {resume.projects?.length > 0 && (
          <section className="mb-6"><h2 className="text-[13pt] font-bold uppercase tracking-widest text-emerald-700 mb-3">Projects</h2>
            <div className="flex flex-col gap-3">
              {resume.projects.map((proj, index) => (
                <div key={index} className="bg-white rounded-xl border border-emerald-100 p-4 shadow-sm">
                  <h3 className="font-bold text-[12pt] text-neutral-900">{proj.name}</h3>{proj.techStack && <p className="text-[11pt] text-emerald-600 font-medium mb-1">{proj.techStack}</p>}
                  <ul className="text-[12pt] text-neutral-700 leading-relaxed list-none space-y-1 mt-1">{proj.bullets?.filter((b) => b.trim()).map((bullet, i) => <li key={i} className="relative pl-4"><span className="absolute left-0 text-emerald-500 font-bold">✓</span>{bullet}</li>)}</ul>
                  {proj.link && <p className="text-[11pt] text-emerald-600 mt-2 font-medium">{proj.link}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
        <div className="flex flex-col gap-4">
          {resume.education?.length > 0 && (
            <div className="bg-white rounded-xl border border-emerald-100 p-4 shadow-sm"><h2 className="text-[13pt] font-bold uppercase tracking-widest text-emerald-700 mb-2">Education</h2>
              {resume.education.map((edu, index) => <div key={index} className="mb-2 last:mb-0"><h3 className="font-bold text-[12pt] text-neutral-900">{edu.degree}</h3><p className="text-[11pt] text-neutral-500">{edu.school}</p><p className="text-[11pt] text-emerald-600 font-medium">{edu.startDate} – {edu.endDate}</p></div>)}
            </div>
          )}
          {resume.certifications?.length > 0 && (
            <div className="bg-white rounded-xl border border-emerald-100 p-4 shadow-sm"><h2 className="text-[13pt] font-bold uppercase tracking-widest text-emerald-700 mb-2">Certifications</h2>
              <ul className="text-[12pt] text-neutral-700 leading-relaxed list-none space-y-1">{resume.certifications.map((c, i) => <li key={i}>{c.name}{c.date && <span className="text-neutral-400"> — {c.date}</span>}</li>)}</ul>
            </div>
          )}

          <CustomSections resume={resume} variant="nova" />

          {(resume.languages?.filter((l) => l.name).length > 0 || resume.awards?.length > 0) && (
            <div className="bg-white rounded-xl border border-emerald-100 p-4 shadow-sm"><h2 className="text-[13pt] font-bold uppercase tracking-widest text-emerald-700 mb-2">More</h2>
              <ul className="text-[12pt] text-neutral-700 leading-relaxed list-none space-y-1">
                {resume.languages?.filter((l) => l.name).map((l, i) => <li key={`l-${i}`}>{l.name} {l.proficiency && `— ${l.proficiency}`}</li>)}
                {resume.awards?.map((a, i) => <li key={`a-${i}`}>🏆 {a.title} {a.date && `(${a.date})`}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TEMPLATE 5 — IVORY (unchanged)
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
   TEMPLATE 6 — AURORA (unchanged)
============================================================ */
function AuroraTemplate({ resume }) {
  const initial = resume.personalInfo?.fullName?.trim()?.[0]?.toUpperCase() || "R";
  return (
    <div className="rounded-3xl overflow-hidden shadow-[0_24px_70px_-24px_rgba(168,85,247,0.3)] bg-gradient-to-br from-violet-50 via-pink-50 to-sky-50 p-9 sm:p-12">
      <header className="flex items-center gap-5 mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-white font-bold text-2xl shadow-md">
          {initial}
        </div>
        <div>
          <h1 className="font-bold text-[22pt] text-violet-950">{resume.personalInfo?.fullName || "Your Name"}</h1>
          {resume.experience?.[0]?.jobTitle && <p className="text-[13pt] text-violet-500 font-medium">{resume.experience[0].jobTitle}</p>}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11pt] text-violet-400 mt-1 font-medium">
            {resume.personalInfo?.email && <span>{resume.personalInfo.email}</span>}
            {resume.personalInfo?.phone && <span>{resume.personalInfo.phone}</span>}
            {resume.personalInfo?.location && <span>{resume.personalInfo.location}</span>}
          </div>
        </div>
      </header>

      {resume.summary && (
        <section className="mb-6 bg-white/70 backdrop-blur rounded-2xl p-5 border border-violet-100">
          <h2 className="text-[13pt] font-bold uppercase tracking-widest text-violet-500 mb-2">About Me</h2>
          <p className="text-[12pt] leading-relaxed text-violet-900">{resume.summary}</p>
        </section>
      )}

      {resume.skills?.length > 0 && (
        <section className="mb-6">
          <h2 className="text-[13pt] font-bold uppercase tracking-widest text-violet-500 mb-3">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((skill, i) => (
              <span key={i} className="text-[11pt] font-semibold px-3.5 py-1.5 bg-white/80 border border-pink-200 text-pink-600 rounded-full shadow-sm">{skill}</span>
            ))}
          </div>
        </section>
      )}

      {resume.experience?.length > 0 && (
        <section className="mb-6">
          <h2 className="text-[13pt] font-bold uppercase tracking-widest text-violet-500 mb-3">Experience</h2>
          <div className="space-y-3">
            {resume.experience.map((exp, index) => (
              <div key={index} className="bg-white/70 backdrop-blur rounded-2xl p-5 border border-violet-100">
                <div className="flex justify-between items-baseline flex-wrap gap-x-2">
                  <h3 className="font-bold text-[12pt] text-violet-950">{exp.jobTitle}</h3>
                  <span className="text-[11pt] text-pink-500 whitespace-nowrap font-semibold">{exp.startDate} – {exp.current ? "Present" : exp.endDate}</span>
                </div>
                <p className="text-[11pt] text-violet-400 mb-2 font-medium">{exp.company}{exp.location && ` · ${exp.location}`}</p>
                <ul className="text-[12pt] text-violet-900 leading-relaxed list-none space-y-1">
                  {exp.bullets?.filter((b) => b.trim()).map((bullet, i) => (
                    <li key={i} className="relative pl-4"><span className="absolute left-0 text-violet-400">✦</span>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {resume.projects?.length > 0 && (
        <section className="mb-6">
          <h2 className="text-[13pt] font-bold uppercase tracking-widest text-violet-500 mb-3">Projects</h2>
          <div className="flex flex-col gap-3">
            {resume.projects.map((proj, index) => (
              <div key={index} className="bg-white/70 backdrop-blur rounded-2xl p-4 border border-violet-100">
                <h3 className="font-bold text-[12pt] text-violet-950">{proj.name}</h3>
                {proj.techStack && <p className="text-[11pt] text-pink-500 font-medium mb-1">{proj.techStack}</p>}
                <ul className="text-[12pt] text-violet-900 leading-relaxed list-none space-y-1">
                  {proj.bullets?.filter((b) => b.trim()).map((bullet, i) => (
                    <li key={i} className="relative pl-4"><span className="absolute left-0 text-violet-400">✦</span>{bullet}</li>
                  ))}
                </ul>
                {proj.link && <p className="text-[11pt] text-violet-500 mt-2 font-medium">{proj.link}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-col gap-3">
        {resume.education?.length > 0 && (
          <div className="bg-white/70 backdrop-blur rounded-2xl p-4 border border-violet-100">
            <h2 className="text-[13pt] font-bold uppercase tracking-widest text-violet-500 mb-2">Education</h2>
            {resume.education.map((edu, index) => (
              <div key={index} className="mb-2 last:mb-0">
                <h3 className="font-bold text-[12pt] text-violet-950">{edu.degree}</h3>
                <p className="text-[11pt] text-violet-400">{edu.school}</p>
                <p className="text-[11pt] text-pink-500 font-medium">{edu.startDate} – {edu.endDate}</p>
              </div>
            ))}
          </div>
        )}
        {resume.certifications?.length > 0 && (
          <div className="bg-white/70 backdrop-blur rounded-2xl p-4 border border-violet-100">
            <h2 className="text-[13pt] font-bold uppercase tracking-widest text-violet-500 mb-2">Certifications</h2>
            <ul className="text-[12pt] text-violet-900 leading-relaxed list-none space-y-1">
              {resume.certifications.map((c, i) => <li key={i}>{c.name}{c.date && <span className="text-violet-400"> — {c.date}</span>}</li>)}
            </ul>
          </div>
        )}

        <CustomSections resume={resume} variant="aurora" />

        {(resume.languages?.filter((l) => l.name).length > 0 || resume.awards?.length > 0) && (
          <div className="bg-white/70 backdrop-blur rounded-2xl p-4 border border-violet-100">
            <h2 className="text-[13pt] font-bold uppercase tracking-widest text-violet-500 mb-2">More</h2>
            <ul className="text-[12pt] text-violet-900 leading-relaxed list-none space-y-1">
              {resume.languages?.filter((l) => l.name).map((l, i) => <li key={`l-${i}`}>{l.name} {l.proficiency && `— ${l.proficiency}`}</li>)}
              {resume.awards?.map((a, i) => <li key={`a-${i}`}>🏆 {a.title} {a.date && `(${a.date})`}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   TEMPLATE 7 — LEDGER (unchanged)
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
   TEMPLATE 8 — PULSE (unchanged)
============================================================ */
function PulseTemplate({ resume }) {
  const initial = resume.personalInfo?.fullName?.trim()?.[0]?.toUpperCase() || "R";
  return (
    <div className="rounded-xl overflow-hidden bg-neutral-950 shadow-[0_28px_70px_-20px_rgba(220,38,38,0.35)]">
      <header className="p-9 sm:p-11 border-b-4 border-red-600">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-2xl">
            {initial}
          </div>
          <div>
            <h1 className="font-black text-[22pt] leading-tight text-white uppercase tracking-tight">
              {resume.personalInfo?.fullName || "Your Name"}
            </h1>
            {resume.experience?.[0]?.jobTitle && (
              <p className="text-[13pt] text-red-500 font-bold uppercase tracking-widest mt-1">{resume.experience[0].jobTitle}</p>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[11pt] text-neutral-400 font-medium">
          {resume.personalInfo?.email && <span>{resume.personalInfo.email}</span>}
          {resume.personalInfo?.phone && <span>{resume.personalInfo.phone}</span>}
          {resume.personalInfo?.location && <span>{resume.personalInfo.location}</span>}
          {resume.personalInfo?.linkedin && <span>{resume.personalInfo.linkedin}</span>}
        </div>
      </header>

      <div className="p-9 sm:p-11 bg-neutral-900">
        {resume.summary && (
          <section className="mb-7">
            <h2 className="text-[13pt] font-black uppercase tracking-[0.2em] text-red-500 mb-2">Profile</h2>
            <p className="text-[12pt] leading-relaxed text-neutral-300">{resume.summary}</p>
          </section>
        )}

        {resume.skills?.length > 0 && (
          <section className="mb-7">
            <h2 className="text-[13pt] font-black uppercase tracking-[0.2em] text-red-500 mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {resume.skills.map((skill, i) => (
                <span key={i} className="text-[11pt] font-bold px-3 py-1.5 bg-neutral-800 border border-red-600/40 text-neutral-100 rounded">{skill}</span>
              ))}
            </div>
          </section>
        )}

        {resume.experience?.length > 0 && (
          <section className="mb-7">
            <h2 className="text-[13pt] font-black uppercase tracking-[0.2em] text-red-500 mb-3">Experience</h2>
            {resume.experience.map((exp, index) => (
              <div key={index} className="mb-5 last:mb-0 pl-4 border-l-2 border-red-600">
                <div className="flex justify-between items-baseline flex-wrap gap-x-2">
                  <h3 className="font-bold text-[12pt] text-white">{exp.jobTitle}</h3>
                  <span className="text-[11pt] text-red-400 whitespace-nowrap font-bold">{exp.startDate} — {exp.current ? "Present" : exp.endDate}</span>
                </div>
                <p className="text-[11pt] text-neutral-400 mb-1.5">{exp.company}{exp.location && ` · ${exp.location}`}</p>
                <ul className="text-[12pt] text-neutral-300 leading-relaxed list-none space-y-1">
                  {exp.bullets?.filter((b) => b.trim()).map((bullet, i) => (
                    <li key={i} className="relative pl-4"><span className="absolute left-0 text-red-500 font-black">▪</span>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {resume.projects?.length > 0 && (
          <section className="mb-7">
            <h2 className="text-[13pt] font-black uppercase tracking-[0.2em] text-red-500 mb-3">Projects</h2>
            <div className="flex flex-col gap-3">
              {resume.projects.map((proj, index) => (
                <div key={index} className="bg-neutral-800 rounded-lg p-4 border border-red-600/20">
                  <h3 className="font-bold text-[12pt] text-white">{proj.name}</h3>
                  {proj.techStack && <p className="text-[11pt] text-red-400 font-medium mb-1">{proj.techStack}</p>}
                  <ul className="text-[12pt] text-neutral-300 leading-relaxed list-none space-y-1">
                    {proj.bullets?.filter((b) => b.trim()).map((bullet, i) => (
                      <li key={i} className="relative pl-4"><span className="absolute left-0 text-red-500 font-black">▪</span>{bullet}</li>
                    ))}
                  </ul>
                  {proj.link && <p className="text-[11pt] text-red-400 mt-2 font-medium">{proj.link}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col gap-4">
          {resume.education?.length > 0 && (
            <div><h2 className="text-[13pt] font-black uppercase tracking-[0.2em] text-red-500 mb-2">Education</h2>
              {resume.education.map((edu, index) => (
                <div key={index} className="mb-2 last:mb-0">
                  <h3 className="font-bold text-[12pt] text-white">{edu.degree}</h3>
                  <p className="text-[11pt] text-neutral-400">{edu.school}</p>
                  <p className="text-[11pt] text-red-400 font-medium">{edu.startDate} – {edu.endDate}</p>
                </div>
              ))}
            </div>
          )}
          {resume.certifications?.length > 0 && (
            <div><h2 className="text-[13pt] font-black uppercase tracking-[0.2em] text-red-500 mb-2">Certifications</h2>
              <ul className="text-[12pt] text-neutral-300 leading-relaxed list-none space-y-1">{resume.certifications.map((c, i) => <li key={i}>{c.name}{c.date && <span className="text-neutral-500"> — {c.date}</span>}</li>)}</ul>
            </div>
          )}

          <CustomSections resume={resume} variant="pulse" />

          {(resume.languages?.filter((l) => l.name).length > 0 || resume.awards?.length > 0) && (
            <div><h2 className="text-[13pt] font-black uppercase tracking-[0.2em] text-red-500 mb-2">More</h2>
              <ul className="text-[12pt] text-neutral-300 leading-relaxed list-none space-y-1">
                {resume.languages?.filter((l) => l.name).map((l, i) => <li key={`l-${i}`}>{l.name} {l.proficiency && `— ${l.proficiency}`}</li>)}
                {resume.awards?.map((a, i) => <li key={`a-${i}`}>🏆 {a.title} {a.date && `(${a.date})`}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TEMPLATE 9 — BOTANICA (unchanged)
============================================================ */
function BotanicaTemplate({ resume }) {
  const initial = resume.personalInfo?.fullName?.trim()?.[0]?.toUpperCase() || "R";
  return (
    <div className="bg-[#f6f5ef] rounded-2xl border border-emerald-900/10 shadow-[0_20px_60px_-24px_rgba(6,78,59,0.25)] p-9 sm:p-12">
      <header className="flex items-center gap-5 mb-8 pb-6 border-b border-emerald-900/15">
        <div className="w-16 h-16 rounded-full bg-emerald-800 flex items-center justify-center text-emerald-50 font-bold text-2xl">
          {initial}
        </div>
        <div>
          <h1 className="font-bold text-[22pt] text-emerald-950">{resume.personalInfo?.fullName || "Your Name"}</h1>
          {resume.experience?.[0]?.jobTitle && <p className="text-[13pt] text-emerald-700 font-medium">{resume.experience[0].jobTitle}</p>}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11pt] text-emerald-600 mt-1">
            {resume.personalInfo?.email && <span>{resume.personalInfo.email}</span>}
            {resume.personalInfo?.phone && <span>{resume.personalInfo.phone}</span>}
            {resume.personalInfo?.location && <span>{resume.personalInfo.location}</span>}
          </div>
        </div>
      </header>

      {resume.summary && (
        <section className="mb-6">
          <h2 className="flex items-center gap-2 text-[13pt] font-bold uppercase tracking-widest text-emerald-700 mb-2">
            <span>🌿</span>About
          </h2>
          <p className="text-[12pt] leading-relaxed text-emerald-950/80">{resume.summary}</p>
        </section>
      )}

      {resume.skills?.length > 0 && (
        <section className="mb-6">
          <h2 className="flex items-center gap-2 text-[13pt] font-bold uppercase tracking-widest text-emerald-700 mb-3">
            <span>🌿</span>Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((skill, i) => (
              <span key={i} className="text-[11pt] font-medium px-3 py-1.5 bg-white border border-emerald-200 text-emerald-800 rounded-full">{skill}</span>
            ))}
          </div>
        </section>
      )}

      {resume.experience?.length > 0 && (
        <section className="mb-6">
          <h2 className="flex items-center gap-2 text-[13pt] font-bold uppercase tracking-widest text-emerald-700 mb-3">
            <span>🌿</span>Experience
          </h2>
          <div className="space-y-3">
            {resume.experience.map((exp, index) => (
              <div key={index} className="bg-white rounded-2xl p-5 border border-emerald-100">
                <div className="flex justify-between items-baseline flex-wrap gap-x-2">
                  <h3 className="font-bold text-[12pt] text-emerald-950">{exp.jobTitle}</h3>
                  <span className="text-[11pt] text-emerald-600 whitespace-nowrap font-semibold">{exp.startDate} – {exp.current ? "Present" : exp.endDate}</span>
                </div>
                <p className="text-[11pt] text-emerald-600 mb-2">{exp.company}{exp.location && ` · ${exp.location}`}</p>
                <ul className="text-[12pt] text-emerald-950/80 leading-relaxed list-none space-y-1">
                  {exp.bullets?.filter((b) => b.trim()).map((bullet, i) => (
                    <li key={i} className="relative pl-4"><span className="absolute left-0 text-emerald-500">🌱</span>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {resume.projects?.length > 0 && (
        <section className="mb-6">
          <h2 className="flex items-center gap-2 text-[13pt] font-bold uppercase tracking-widest text-emerald-700 mb-3">
            <span>🌿</span>Projects
          </h2>
          <div className="flex flex-col gap-3">
            {resume.projects.map((proj, index) => (
              <div key={index} className="bg-white rounded-2xl p-4 border border-emerald-100">
                <h3 className="font-bold text-[12pt] text-emerald-950">{proj.name}</h3>
                {proj.techStack && <p className="text-[11pt] text-emerald-600 font-medium mb-1">{proj.techStack}</p>}
                <ul className="text-[12pt] text-emerald-950/80 leading-relaxed list-none space-y-1">
                  {proj.bullets?.filter((b) => b.trim()).map((bullet, i) => (
                    <li key={i} className="relative pl-4"><span className="absolute left-0 text-emerald-500">🌱</span>{bullet}</li>
                  ))}
                </ul>
                {proj.link && <p className="text-[11pt] text-emerald-600 mt-2 font-medium">{proj.link}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-col gap-3">
        {resume.education?.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-emerald-100">
            <h2 className="text-[13pt] font-bold uppercase tracking-widest text-emerald-700 mb-2">Education</h2>
            {resume.education.map((edu, index) => (
              <div key={index} className="mb-2 last:mb-0">
                <h3 className="font-bold text-[12pt] text-emerald-950">{edu.degree}</h3>
                <p className="text-[11pt] text-emerald-600">{edu.school}</p>
                <p className="text-[11pt] text-emerald-500 font-medium">{edu.startDate} – {edu.endDate}</p>
              </div>
            ))}
          </div>
        )}
        {resume.certifications?.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-emerald-100">
            <h2 className="text-[13pt] font-bold uppercase tracking-widest text-emerald-700 mb-2">Certifications</h2>
            <ul className="text-[12pt] text-emerald-950/80 leading-relaxed list-none space-y-1">
              {resume.certifications.map((c, i) => <li key={i}>{c.name}{c.date && <span className="text-emerald-400"> — {c.date}</span>}</li>)}
            </ul>
          </div>
        )}

        <CustomSections resume={resume} variant="botanica" />

        {(resume.languages?.filter((l) => l.name).length > 0 || resume.awards?.length > 0) && (
          <div className="bg-white rounded-2xl p-4 border border-emerald-100">
            <h2 className="text-[13pt] font-bold uppercase tracking-widest text-emerald-700 mb-2">More</h2>
            <ul className="text-[12pt] text-emerald-950/80 leading-relaxed list-none space-y-1">
              {resume.languages?.filter((l) => l.name).map((l, i) => <li key={`l-${i}`}>{l.name} {l.proficiency && `— ${l.proficiency}`}</li>)}
              {resume.awards?.map((a, i) => <li key={`a-${i}`}>🏆 {a.title} {a.date && `(${a.date})`}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   TEMPLATE 10 — METRO (unchanged)
============================================================ */
function MetroTemplate({ resume }) {
  return (
    <div className="bg-white rounded-lg border-2 border-blue-900 shadow-[0_18px_50px_-20px_rgba(30,58,138,0.3)] overflow-hidden">
      <header className="bg-blue-900 text-white p-7 sm:p-9">
        <h1 className="font-bold text-[22pt] tracking-tight">{resume.personalInfo?.fullName || "Your Name"}</h1>
        {resume.experience?.[0]?.jobTitle && <p className="text-[13pt] text-blue-200 font-medium mt-1">{resume.experience[0].jobTitle}</p>}
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11pt] text-blue-100 font-medium">
          {resume.personalInfo?.email && <span>{resume.personalInfo.email}</span>}
          {resume.personalInfo?.phone && <span>{resume.personalInfo.phone}</span>}
          {resume.personalInfo?.location && <span>{resume.personalInfo.location}</span>}
          {resume.personalInfo?.linkedin && <span>{resume.personalInfo.linkedin}</span>}
        </div>
      </header>

      <div className="p-7 sm:p-9">
        {resume.summary && (
          <section className="mb-5 border border-blue-200 rounded-lg p-4">
            <h2 className="text-[13pt] font-bold uppercase tracking-widest text-blue-900 mb-2 pb-1 border-b border-blue-200">Summary</h2>
            <p className="text-[12pt] leading-relaxed text-neutral-700">{resume.summary}</p>
          </section>
        )}

        {resume.experience?.length > 0 && (
          <section className="mb-5 border border-blue-200 rounded-lg overflow-hidden">
            <h2 className="text-[13pt] font-bold uppercase tracking-widest text-blue-900 p-4 pb-2 border-b border-blue-200">Experience</h2>
            {resume.experience.map((exp, index) => (
              <div key={index} className="p-4 border-b border-blue-100 last:border-none">
                <div className="flex justify-between items-baseline flex-wrap gap-x-2">
                  <h3 className="font-bold text-[12pt] text-neutral-900">{exp.jobTitle}</h3>
                  <span className="text-[11pt] text-blue-700 whitespace-nowrap font-semibold">{exp.startDate} – {exp.current ? "Present" : exp.endDate}</span>
                </div>
                <p className="text-[11pt] text-neutral-500 mb-1.5">{exp.company}{exp.location && ` · ${exp.location}`}</p>
                <ul className="text-[12pt] text-neutral-700 leading-relaxed list-disc pl-5">
                  {exp.bullets?.filter((b) => b.trim()).map((bullet, i) => <li key={i} className="mb-1">{bullet}</li>)}
                </ul>
              </div>
            ))}
          </section>
        )}

        <div className="flex flex-col gap-4 mb-5">
          {resume.education?.length > 0 && (
            <div className="border border-blue-200 rounded-lg p-4">
              <h2 className="text-[13pt] font-bold uppercase tracking-widest text-blue-900 mb-2 pb-1 border-b border-blue-200">Education</h2>
              {resume.education.map((edu, index) => (
                <div key={index} className="mb-2 last:mb-0">
                  <h3 className="font-bold text-[12pt] text-neutral-900">{edu.degree}</h3>
                  <p className="text-[11pt] text-neutral-500">{edu.school}</p>
                  <p className="text-[11pt] text-blue-700 font-medium">{edu.startDate} – {edu.endDate}</p>
                </div>
              ))}
            </div>
          )}
          {resume.skills?.length > 0 && (
            <div className="border border-blue-200 rounded-lg p-4">
              <h2 className="text-[13pt] font-bold uppercase tracking-widest text-blue-900 mb-2 pb-1 border-b border-blue-200">Skills</h2>
              <div className="flex flex-wrap gap-1.5">
                {resume.skills.map((skill, i) => <span key={i} className="text-[11pt] font-medium px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded">{skill}</span>)}
              </div>
            </div>
          )}
        </div>

        {resume.projects?.length > 0 && (
          <section className="mb-5 border border-blue-200 rounded-lg p-4">
            <h2 className="text-[13pt] font-bold uppercase tracking-widest text-blue-900 mb-2 pb-1 border-b border-blue-200">Projects</h2>
            <div className="flex flex-col gap-4">
              {resume.projects.map((proj, index) => (
                <div key={index}>
                  <h3 className="font-bold text-[12pt] text-neutral-900">{proj.name}</h3>
                  {proj.techStack && <p className="text-[11pt] text-blue-700 font-medium mb-1">{proj.techStack}</p>}
                  <ul className="text-[12pt] text-neutral-700 leading-relaxed list-disc pl-5">
                    {proj.bullets?.filter((b) => b.trim()).map((bullet, i) => <li key={i} className="mb-0.5">{bullet}</li>)}
                  </ul>
                  {proj.link && <p className="text-[11pt] text-blue-600 mt-1 font-medium">{proj.link}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        <CustomSections resume={resume} variant="metro" />

        {(resume.certifications?.length > 0 || resume.languages?.filter((l) => l.name).length > 0 || resume.awards?.length > 0) && (
          <div className="flex flex-col gap-4">
            {resume.certifications?.length > 0 && (
              <div className="border border-blue-200 rounded-lg p-4">
                <h2 className="text-[13pt] font-bold uppercase tracking-widest text-blue-900 mb-2 pb-1 border-b border-blue-200">Certifications</h2>
                <ul className="text-[12pt] text-neutral-700 leading-relaxed list-none space-y-1">
                  {resume.certifications.map((c, i) => <li key={i}>{c.name}{c.date && <span className="text-neutral-400"> — {c.date}</span>}</li>)}
                </ul>
              </div>
            )}
            {resume.languages?.filter((l) => l.name).length > 0 && (
              <div className="border border-blue-200 rounded-lg p-4">
                <h2 className="text-[13pt] font-bold uppercase tracking-widest text-blue-900 mb-2 pb-1 border-b border-blue-200">Languages</h2>
                <ul className="text-[12pt] text-neutral-700 leading-relaxed list-none space-y-1">
                  {resume.languages.filter((l) => l.name).map((l, i) => <li key={i}>{l.name} {l.proficiency && `— ${l.proficiency}`}</li>)}
                </ul>
              </div>
            )}
            {resume.awards?.length > 0 && (
              <div className="border border-blue-200 rounded-lg p-4">
                <h2 className="text-[13pt] font-bold uppercase tracking-widest text-blue-900 mb-2 pb-1 border-b border-blue-200">Awards</h2>
                <ul className="text-[12pt] text-neutral-700 leading-relaxed list-none space-y-1">
                  {resume.awards.map((a, i) => <li key={i}>{a.title} {a.date && `(${a.date})`}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}