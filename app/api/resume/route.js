import connectDB from "@/lib/db";
import Resume from "@/models/Resume";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET all resumes for logged-in user
export async function GET() {
  try {
    await connectDB();
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const resumes = await Resume.find({ userId }).sort({ updatedAt: -1 });
    return NextResponse.json({ resumes });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST create new resume
export async function POST(req) {
  try {
    await connectDB();
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();

    const resume = await Resume.create({
      userId,
      title: body.title || "Untitled Resume",
      personalInfo: {
        fullName: "",
        email: "",
        phone: "",
        location: "",
        linkedin: "",
        website: "",
      },
      summary: "",
      experience: [],
      education: [],
      skills: [],
      template: "classic",
    });

    return NextResponse.json({ resume });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}