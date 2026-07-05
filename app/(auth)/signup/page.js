"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] bg-[#0A0F0D]">
      <form
        onSubmit={handleSubmit}
        className="bg-[#111813] border border-[#28332B] p-8 rounded-xl shadow-xl shadow-black/40 w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-6 text-center text-[#F1F5F2]">
          Create Account
        </h1>

        {error && (
          <p className="bg-[#F87171]/10 border border-[#F87171]/30 text-[#F87171] text-sm p-2 rounded mb-4">
            {error}
          </p>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-[#C7D1CA]">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full bg-[#1A231C] border border-[#28332B] text-[#F1F5F2] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-[#22C55E] transition-colors placeholder:text-[#6B7A70]"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-[#C7D1CA]">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full bg-[#1A231C] border border-[#28332B] text-[#F1F5F2] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-[#22C55E] transition-colors placeholder:text-[#6B7A70]"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1 text-[#C7D1CA]">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
            className="w-full bg-[#1A231C] border border-[#28332B] text-[#F1F5F2] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-[#22C55E] transition-colors placeholder:text-[#6B7A70]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#22C55E] text-[#0A0F0D] font-medium py-2 rounded-lg hover:bg-[#4ADE80] disabled:opacity-50 transition-colors"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p className="text-sm text-center mt-4 text-[#6B7A70]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#4ADE80] font-medium hover:text-[#22C55E]">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}