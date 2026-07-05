import connectDB from "@/lib/db";
import Resume from "@/models/Resume";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET single resume
export async function GET(req, { params }) {
  try {
    await connectDB();
    const userId = await getUserId();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const resume = await Resume.findOne({ _id: id, userId });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    return NextResponse.json({ resume });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT update resume
export async function PUT(req, { params }) {
  try {
    await connectDB();
    const userId = await getUserId();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();

    // Whitelist editable fields only — never let _id/userId/createdAt/__v
    // reach $set. MongoDB rejects writes that touch the immutable _id
    // field, which was throwing and getting swallowed by the client's
    // silent catch, so saves from the builder were never persisting.
    const allowedFields = [
      "title",
      "personalInfo",
      "summary",
      "experience",
      "education",
      "skills",
      "projects",
      "certifications",
      "languages",
      "awards",
      "customSections",
      "template",
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const resume = await Resume.findOneAndUpdate(
      { _id: id, userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    return NextResponse.json({ resume });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE resume
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const userId = await getUserId();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const resume = await Resume.findOneAndDelete({ _id: id, userId });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Resume deleted" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}