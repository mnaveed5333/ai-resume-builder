import mongoose from "mongoose";

const ResumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      default: "Untitled Resume",
    },
    personalInfo: {
      fullName: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      location: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      website: { type: String, default: "" },
    },
    summary: {
      type: String,
      default: "",
    },
    experience: [
      {
        jobTitle: String,
        company: String,
        location: String,
        startDate: String,
        endDate: String,
        current: Boolean,
        bullets: [String],
      },
    ],
    education: [
      {
        degree: String,
        school: String,
        location: String,
        startDate: String,
        endDate: String,
      },
    ],
    skills: [String],
    projects: [
      {
        name: String,
        techStack: String,
        link: String,
        bullets: [String],
      },
    ],
    certifications: [
      {
        name: String,
        issuer: String,
        date: String,
      },
    ],
    languages: [
      {
        name: String,
        proficiency: String,
      },
    ],
    awards: [
      {
        title: String,
        issuer: String,
        date: String,
      },
    ],
    customSections: [
      {
        title: { type: String, default: "" },
        items: [
          {
            heading: String,
            subheading: String,
            date: String,
            bullets: [String],
          },
        ],
      },
    ],
    template: {
      type: String,
      default: "classic",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Resume || mongoose.model("Resume", ResumeSchema);