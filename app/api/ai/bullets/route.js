import { generateCompletion } from "@/lib/ai";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { jobTitle, company, roughDescription } = await req.json();

    if (!jobTitle || !roughDescription) {
      return NextResponse.json(
        { error: "Job title and description are required" },
        { status: 400 }
      );
    }

    const prompt = `Convert this rough work description into 4 polished, ATS-friendly resume bullet points for a ${jobTitle} at ${company || "a company"}. Use strong action verbs, quantify results where reasonable, and keep each bullet under 20 words. Rough description: "${roughDescription}". Return ONLY the bullet points, one per line, no numbering, no dashes, no asterisks.`;

    const raw = await generateCompletion(prompt, 300);

    const bullets = raw
      .split("\n")
      .map((line) => line.replace(/^[-•*\d.]+\s*/, "").trim())
      .filter((line) => line.length > 0);

    return NextResponse.json({ bullets });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}