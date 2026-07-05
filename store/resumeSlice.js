import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentResume: null,
  resumes: [],
  loading: false,
};

const resumeSlice = createSlice({
  name: "resume",
  initialState,
  reducers: {
    setResumes: (state, action) => {
      state.resumes = action.payload;
    },
    setCurrentResume: (state, action) => {
      const resume = action.payload;
      // Ensure new fields exist even on older resumes
      state.currentResume = {
        ...resume,
        projects: resume.projects || [],
        certifications: resume.certifications || [],
        languages: resume.languages || [],
        awards: resume.awards || [],
        customSections: resume.customSections || [],
      };
    },
    updateField: (state, action) => {
      const { field, value } = action.payload;
      state.currentResume[field] = value;
    },
    updatePersonalInfo: (state, action) => {
      const { field, value } = action.payload;
      state.currentResume.personalInfo[field] = value;
    },
    addExperience: (state) => {
      state.currentResume.experience.push({
        jobTitle: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        bullets: [],
      });
    },
    updateExperience: (state, action) => {
      const { index, field, value } = action.payload;
      state.currentResume.experience[index][field] = value;
    },
    removeExperience: (state, action) => {
      state.currentResume.experience.splice(action.payload, 1);
    },
    addEducation: (state) => {
      state.currentResume.education.push({
        degree: "",
        school: "",
        location: "",
        startDate: "",
        endDate: "",
      });
    },
    updateEducation: (state, action) => {
      const { index, field, value } = action.payload;
      state.currentResume.education[index][field] = value;
    },
    removeEducation: (state, action) => {
      state.currentResume.education.splice(action.payload, 1);
    },
    setSkills: (state, action) => {
      state.currentResume.skills = action.payload;
    },
    addProject: (state) => {
      state.currentResume.projects.push({
        name: "",
        techStack: "",
        link: "",
        bullets: [],
      });
    },
    updateProject: (state, action) => {
      const { index, field, value } = action.payload;
      state.currentResume.projects[index][field] = value;
    },
    removeProject: (state, action) => {
      state.currentResume.projects.splice(action.payload, 1);
    },
    addCertification: (state) => {
      state.currentResume.certifications.push({
        name: "",
        issuer: "",
        date: "",
      });
    },
    updateCertification: (state, action) => {
      const { index, field, value } = action.payload;
      state.currentResume.certifications[index][field] = value;
    },
    removeCertification: (state, action) => {
      state.currentResume.certifications.splice(action.payload, 1);
    },
    addLanguage: (state) => {
      state.currentResume.languages.push({
        name: "",
        proficiency: "",
      });
    },
    updateLanguage: (state, action) => {
      const { index, field, value } = action.payload;
      state.currentResume.languages[index][field] = value;
    },
    removeLanguage: (state, action) => {
      state.currentResume.languages.splice(action.payload, 1);
    },
    addAward: (state) => {
      state.currentResume.awards.push({
        title: "",
        issuer: "",
        date: "",
      });
    },
    updateAward: (state, action) => {
      const { index, field, value } = action.payload;
      state.currentResume.awards[index][field] = value;
    },
    removeAward: (state, action) => {
      state.currentResume.awards.splice(action.payload, 1);
    },

    // ---- CUSTOM SECTIONS ----
    addCustomSection: (state) => {
      if (!state.currentResume.customSections) {
        state.currentResume.customSections = [];
      }
      state.currentResume.customSections.push({
        title: "",
        items: [],
      });
    },
    updateCustomSectionTitle: (state, action) => {
      const { sectionIndex, value } = action.payload;
      state.currentResume.customSections[sectionIndex].title = value;
    },
    removeCustomSection: (state, action) => {
      state.currentResume.customSections.splice(action.payload, 1);
    },
    addCustomSectionItem: (state, action) => {
      const sectionIndex = action.payload;
      state.currentResume.customSections[sectionIndex].items.push({
        heading: "",
        subheading: "",
        date: "",
        bullets: [],
      });
    },
    updateCustomSectionItem: (state, action) => {
      const { sectionIndex, itemIndex, field, value } = action.payload;
      state.currentResume.customSections[sectionIndex].items[itemIndex][field] = value;
    },
    removeCustomSectionItem: (state, action) => {
      const { sectionIndex, itemIndex } = action.payload;
      state.currentResume.customSections[sectionIndex].items.splice(itemIndex, 1);
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setResumes,
  setCurrentResume,
  updateField,
  updatePersonalInfo,
  addExperience,
  updateExperience,
  removeExperience,
  addEducation,
  updateEducation,
  removeEducation,
  setSkills,
  addProject,
  updateProject,
  removeProject,
  addCertification,
  updateCertification,
  removeCertification,
  addLanguage,
  updateLanguage,
  removeLanguage,
  addAward,
  updateAward,
  removeAward,
  addCustomSection,
  updateCustomSectionTitle,
  removeCustomSection,
  addCustomSectionItem,
  updateCustomSectionItem,
  removeCustomSectionItem,
  setLoading,
} = resumeSlice.actions;

export default resumeSlice.reducer;