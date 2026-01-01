export type DocType = 'SUMMARY' | 'DESIGN_FEEDBACK' | 'MEETING_NOTES' | 'BUG_REPORT' | 'EMAIL_DRAFT' | 'LINKEDIN_POST' | 'TWEET_THREAD' | 'BLOG_POST';
export type DocLength = 'CONCISE' | 'BALANCED' | 'DETAILED';
export type WritingStyle = 'CONVERSATIONAL' | 'PROFESSIONAL' | 'CREATIVE' | 'DIRECT' | 'TECHNICAL';

export interface ProcessingConfig {
    docType: DocType;
    length: DocLength;
    style: WritingStyle;
}

export interface UserProfile {
    id: string;
    email: string;
    is_pro: boolean;
    created_at: string;
}
