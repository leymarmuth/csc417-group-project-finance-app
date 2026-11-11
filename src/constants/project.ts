/**
 * CSC 417 — GROUP PROJECT METADATA
 * ---------------------------------------------------------------------------
 * Aurum (a personal finance / wealth-tracking mobile application) is submitted
 * as a group project for the course unit CSC 417 at Moi University, Kenya.
 *
 * Everything course-related that the app displays is sourced from this file, so
 * the submission details live in exactly one place.
 */

export const PROJECT = {
  /** Course unit code. */
  courseCode: 'CSC 417',
  /** Course unit title. */
  courseTitle: 'Mobile Application Development',
  /** Institution the project is submitted to. */
  institution: 'Moi University',
  /** Where the app is designed to be used. */
  location: 'Eldoret, Kenya',
  /** Working title of the deliverable. */
  title: 'Aurum — Personal Finance & Wealth Tracker',
  /** Submission label. */
  submissionType: 'Group Project',
  /** Level of study. */
  studyLevel: 'Undergraduate',
  /** Academic year of submission. */
  academicYear: '2025 / 2026',
  /** One-line summary reused in a few places. */
  tagline: 'A premium mobile personal-finance app built in Kenya, with React Native & Expo.',
  /** Public repository (filled in after the first push). */
  repositoryUrl: 'https://github.com/<your-username>/csc417-group-project-finance-app',
} as const;

/** Modules/features delivered, used in the in-app "About this project" sheet. */
export const PROJECT_HIGHLIGHTS = [
  'Auth & sessions',
  'Full CRUD · 5 domains',
  'M-Pesa · bank · Sacco',
  'KSh by default',
  'Animated charts',
  'Offline-first',
  'Light & dark',
  'Verified · 0 errors',
] as const;

/** Stated course objectives — mirrored in the report. */
export const LEARNING_OUTCOMES = [
  'Design and build a complete, navigable mobile application.',
  'Apply a consistent design system and accessible interaction patterns.',
  'Implement persistent, offline-capable CRUD with referential integrity.',
  'Use animation purposefully to communicate state and hierarchy.',
  'Adapt a product to its local context — currency, payment habits and language.',
] as const;
