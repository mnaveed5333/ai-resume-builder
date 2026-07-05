import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-[85vh] bg-[#0A0F0D] flex items-center justify-center px-6 py-20 relative overflow-hidden">
      {/* ambient glow accents */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[#22C55E]/10 blur-[120px] -top-40 -left-40 pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-[#A855F7]/10 blur-[120px] bottom-0 right-0 pointer-events-none" />

      <div className="max-w-3xl text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#28332B] bg-[#111813] text-[#C7D1CA] text-xs mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
          Powered by AI
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-[#F1F5F2] mb-5 leading-tight tracking-tight">
          Build Your Resume with{" "}
          <span className="bg-gradient-to-r from-[#A855F7] to-[#C084FC] bg-clip-text text-transparent">
            AI
          </span>
        </h1>

        <p className="text-[#C7D1CA] max-w-xl mx-auto mb-10 text-lg leading-relaxed">
          Create a professional, ATS-friendly resume in minutes. Let AI write
          your summary, bullet points, and suggest skills tailored to your
          target role.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="px-7 py-3.5 bg-[#22C55E] text-[#0A0F0D] font-semibold rounded-lg hover:bg-[#4ADE80] transition-colors shadow-lg shadow-[#22C55E]/20"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="px-7 py-3.5 border border-[#28332B] text-[#F1F5F2] rounded-lg hover:bg-[#1A231C] hover:border-[#3A473C] transition-colors"
          >
            Login
          </Link>
        </div>

        {/* quick feature row */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          {[
            { icon: "✨", title: "AI-Generated Content", desc: "Summaries and bullet points written for you" },
            { icon: "🎨", title: "10 Templates", desc: "Pick a design that fits your industry" },
            { icon: "⚡", title: "ATS-Friendly", desc: "Formatted to pass resume screening tools" },
          ].map((f) => (
            <div key={f.title} className="bg-[#111813] border border-[#28332B] rounded-xl p-5">
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="text-[#F1F5F2] font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-[#6B7A70] text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}