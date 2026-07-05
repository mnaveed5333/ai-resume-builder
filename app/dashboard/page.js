"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const res = await fetch("/api/resume");
      const data = await res.json();
      setResumes(data.resumes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled Resume" }),
      });
      const data = await res.json();
      router.push(`/builder/${data.resume._id}`);
    } catch (err) {
      console.error(err);
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this resume?")) return;
    try {
      await fetch(`/api/resume/${id}`, { method: "DELETE" });
      setResumes(resumes.filter((r) => r._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] bg-[#0A0F0D]">
        <p className="text-[#6B7A70] text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F0D] px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#F1F5F2]">My Resumes</h1>
            <p className="text-sm text-[#6B7A70] mt-1">
              {resumes.length} {resumes.length === 1 ? "resume" : "resumes"}
            </p>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="px-5 py-2.5 bg-[#22C55E] text-[#0A0F0D] font-medium rounded-lg hover:bg-[#4ADE80] disabled:opacity-50 transition-colors"
          >
            {creating ? "Creating…" : "+ New Resume"}
          </button>
        </div>

        {resumes.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-[#28332B] rounded-2xl bg-[#111813]/50">
            <div className="text-3xl mb-3">📄</div>
            <p className="text-[#C7D1CA] mb-5">You haven't created any resumes yet.</p>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-5 py-2.5 bg-[#22C55E] text-[#0A0F0D] font-medium rounded-lg hover:bg-[#4ADE80] disabled:opacity-50 transition-colors"
            >
              {creating ? "Creating…" : "Create Your First Resume"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {resumes.map((resume) => (
              <div
                key={resume._id}
                className="border border-[#28332B] rounded-xl p-5 bg-[#111813] hover:border-[#3A473C] hover:bg-[#1A231C] transition-colors group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-[#F1F5F2] truncate pr-2">{resume.title}</h3>
                  <span className="shrink-0 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#A855F7]/10 text-[#C084FC] border border-[#A855F7]/20">
                    {resume.template || "onyx"}
                  </span>
                </div>
                <p className="text-sm text-[#6B7A70] mb-1 truncate">
                  {resume.personalInfo?.fullName || "No name set"}
                </p>
                <p className="text-xs text-[#6B7A70]/70 mb-5">
                  Updated {new Date(resume.updatedAt).toLocaleDateString()}
                </p>

                <div className="flex gap-2">
                  <Link
                    href={`/builder/${resume._id}`}
                    className="flex-1 text-center px-3 py-2 bg-[#22C55E]/10 text-[#4ADE80] border border-[#22C55E]/20 rounded-lg hover:bg-[#22C55E]/20 text-sm transition-colors"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/preview/${resume._id}`}
                    className="flex-1 text-center px-3 py-2 bg-[#1A231C] text-[#C7D1CA] border border-[#28332B] rounded-lg hover:bg-[#232F26] text-sm transition-colors"
                  >
                    Preview
                  </Link>
                  <button
                    onClick={() => handleDelete(resume._id)}
                    className="px-3 py-2 bg-[#F87171]/10 text-[#F87171] border border-[#F87171]/20 rounded-lg hover:bg-[#F87171]/20 text-sm transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}