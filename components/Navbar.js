"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setUser(data.user))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
  };

  return (
    <nav className="flex items-center justify-between px-8 py-4 border-b border-[#28332B] bg-[#111813]">
      <Link
        href="/"
        className="text-xl font-bold text-[#F1F5F2] flex items-center gap-2"
      >
        <span className="text-[#22C55E]">Resume</span>
        <span className="text-[#A855F7]">AI</span>
      </Link>
      <div className="flex items-center gap-6">
        {user ? (
          <>
            <Link
              href="/dashboard"
              className="text-[#C7D1CA] hover:text-[#4ADE80] transition-colors"
            >
              Dashboard
            </Link>
            <span className="text-[#6B7A70] text-sm">{user.name}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-[#F87171]/10 text-[#F87171] border border-[#F87171]/30 rounded-lg hover:bg-[#F87171]/20 transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-[#C7D1CA] hover:text-[#4ADE80] transition-colors"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-[#22C55E] text-[#0A0F0D] font-medium rounded-lg hover:bg-[#4ADE80] transition-colors"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}