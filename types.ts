export enum DocType {
  DESIGN_FEEDBACK = 'Design Feedback',
  MEETING_NOTES = 'Meeting Notes',
  BUG_REPORT = 'Bug Report',
  EMAIL_DRAFT = 'Email Draft',
  LINKEDIN_POST = 'LinkedIn Post',
  TWEET_THREAD = 'Tweet Thread',
  BLOG_POST = 'Blog Post'
}

export enum DocLength {
  COMPACT = 'Compact',
  DETAILED = 'Detailed'
}

export enum WritingStyle {
  PROFESSIONAL = 'Professional',
  CASUAL = 'Casual',
  DIRECT = 'Direct & Blunt',
  EMPATHETIC = 'Empathetic',
  VIRAL = 'Viral / Engaging'
}

export interface ProcessingConfig {
  docType: DocType;
  length: DocLength;
  style: WritingStyle;
}

export interface GeneratedContent {
  rawTranscript: string;
  structuredOutput: string;
  timestamp: string;
}

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}