import { generateCompletion } from "@/lib/ai";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { projectName, techStack, roughDescription } = await req.json();

    if (!projectName || !roughDescription) {
      return NextResponse.json(
        { error: "Project name and description are required" },
        { status: 400 }
      );
    }

    const prompt = `Convert this rough project description into 3 polished, ATS-friendly resume bullet points for a project called "${projectName}" built with ${techStack || "modern technologies"}. Use strong action verbs, mention technical impact, and keep each bullet under 20 words. Rough description: "${roughDescription}". Return ONLY the bullet points, one per line, no numbering, no dashes, no asterisks.`;

    const raw = await generateCompletion(prompt, 250);

    const bullets = raw
      .split("\n")
      .map((line) => line.replace(/^[-•*\d.]+\s*/, "").trim())
      .filter((line) => line.length > 0);

    return NextResponse.json({ bullets });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}