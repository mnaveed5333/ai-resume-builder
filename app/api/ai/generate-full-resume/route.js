import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { fullName, jobTitle } = await req.json();

    if (!fullName || !jobTitle) {
      return NextResponse.json(
        { error: "Full name and job title are required" },
        { status: 400 }
      );
    }

    const prompt = `You are a professional resume writer. Generate a complete, realistic, impressive resume for a "${jobTitle}".

Candidate name: ${fullName}
Target job title: ${jobTitle}

Return ONLY valid JSON (no markdown, no code fences, no explanation) matching EXACTLY this structure:

{
  "personalInfo": {
    "fullName": "${fullName}",
    "email": "a plausible email built from the name, lowercase",
    "phone": "+92 3XX XXXXXXX",
    "location": "City, Pakistan",
    "linkedin": "linkedin.com/in/username",
    "website": "username.dev"
  },
  "summary": "3-4 sentence professional summary tailored to the job title, highlighting years of experience, core strengths, and impact",
  "experience": [
    {
      "jobTitle": "string",
      "company": "realistic-sounding fictional company name in the same industry as the target job title",
      "location": "City, Country",
      "startDate": "Mon YYYY",
      "endDate": "Mon YYYY",
      "current": false,
      "bullets": ["4-5 strong, quantified achievement bullets using action verbs and metrics, specific to the responsibilities of a ${jobTitle}"]
    }
  ],
  "education": [
    {
      "degree": "string relevant to the ${jobTitle} field",
      "school": "string",
      "location": "City, Country",
      "startDate": "YYYY",
      "endDate": "YYYY"
    }
  ],
  "skills": ["18-22 relevant skills specifically for a ${jobTitle} — the exact mix of technical, tool, and domain skills should match this role, not a generic tech stack"],
  "projects": [
    {
      "name": "string",
      "techStack": "comma separated tools/technologies/methods relevant to a ${jobTitle}",
      "link": "github.com/username/project-name or a relevant portfolio link if the field isn't code-based",
      "bullets": ["3 bullets describing what was built/delivered and its impact, relevant to a ${jobTitle}"]
    }
  ],
  "certifications": [
    { "name": "string relevant to ${jobTitle}", "issuer": "string", "date": "YYYY" }
  ],
  "languages": [
    { "name": "English", "proficiency": "Fluent" },
    { "name": "Urdu", "proficiency": "Native" }
  ],
  "awards": [
    { "title": "string", "issuer": "string", "date": "YYYY" }
  ]
}

Generate exactly: 2 experience entries, 1 education entry, 3 projects, 2 certifications, 2 languages, 1 award. Every single field — job titles, skills, tech stack, certifications, project types, bullet content — must be realistic and specific to a "${jobTitle}" professional. Do NOT default to web development or software engineering content unless "${jobTitle}" is itself a web/software development role. For example, if the job title is a designer, marketer, accountant, nurse, teacher, sales rep, data analyst, etc., every field should reflect that specific profession's real tools, terminology, and typical achievements. Do not use placeholder text like "[Company Name]" — invent plausible, specific, fictional details throughout.`;

    const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are a professional resume writer who tailors every resume precisely to the candidate's stated target job title and industry. Always respond with valid JSON only, no markdown formatting, no code fences, no explanations.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        response_format: { type: "json_object" },
      }),
    });

    const data = await aiRes.json();
    const rawText = data?.choices?.[0]?.message?.content;

    if (!rawText) {
      const apiError = data?.error?.message || JSON.stringify(data);
      return NextResponse.json(
        { error: `AI did not return content: ${apiError}` },
        { status: 500 }
      );
    }

    const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response as JSON", raw: cleaned },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, resume: parsed });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}