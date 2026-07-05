import { generateCompletion } from "@/lib/ai";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { jobTitle, yearsExperience, keySkills } = await req.json();

    if (!jobTitle) {
      return NextResponse.json({ error: "Job title is required" }, { status: 400 });
    }

    const prompt = `Write a professional resume summary (3-4 sentences, no headers, no quotes) for a ${jobTitle} with ${yearsExperience || "several"} years of experience. Key skills: ${keySkills || "relevant industry skills"}. Make it confident, concise, and ATS-friendly. Return only the summary text.`;

    const summary = await generateCompletion(prompt, 200);

    return NextResponse.json({ summary });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}