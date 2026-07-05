import { generateCompletion } from "@/lib/ai";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { jobTitle } = await req.json();

    if (!jobTitle) {
      return NextResponse.json({ error: "Job title is required" }, { status: 400 });
    }

    const prompt = `List 10 relevant resume skills (mix of technical and soft skills) for a ${jobTitle}. Return ONLY a comma-separated list, no numbering, no explanations.`;

    const raw = await generateCompletion(prompt, 150);

    const skills = raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    return NextResponse.json({ skills });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}