'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { ProcessingConfig } from "@/types";

const MODEL_NAME = 'gemini-1.5-flash-8b';

export async function processTranscript(
    transcript: string,
    config: ProcessingConfig
): Promise<string> {
    if (!transcript.trim()) return '';

    const apiKey = process.env.VITE_API_KEY; // We'll keep the name for now or update it in Vercel
    if (!apiKey) {
        throw new Error("API Key (VITE_API_KEY) not found in environment variables");
    }

    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `
    You are an expert ghostwriter and editor. 
    Your task is to take a raw, potentially rambling stream-of-consciousness voice transcript and convert it into a structured, valuable asset.

    Input Transcript: "${transcript}"

    Configuration:
    - Output Format: ${config.docType}
    - Detail Level: ${config.length}
    - Tone/Style: ${config.style}

    Guidelines based on format:
    - SUMMARY: Create a concise, high-level overview of the main ideas and takeaways.
    - DESIGN_FEEDBACK: Use sections like "Visuals", "UX/Usability", "Copy", and "Action Items".
    - MEETING_NOTES: Extract "Key Points", "Decisions Made", and "Action Items".
    - BUG_REPORT: Format as "Observed Behavior", "Expected Behavior", "Steps to Reproduce" (inferred).
    - EMAIL_DRAFT: Meaningful subject line, body, sign-off.
    - LINKEDIN_POST: Professional but engaging hook, short paragraphs, appropriate emojis, 3-5 hashtags at the end.
    - TWEET_THREAD: Series of short tweets numbered (1/x), punchy, viral style, no hashtags in middle of text.
    - BLOG_POST: Catchy Title, Introduction, H2 Headers for sections, Conclusion.

    Guidelines based on style:
    - CONVERSATIONAL: Write as if speaking naturally to a friend or colleague. Warm, accessible, and not overly stiff.
    - PROFESSIONAL: Polished, business-appropriate, and objective.
    - CREATIVE: Expressive, evocative, and compelling.
    - DIRECT: Concise, to the point, no fluff.
    - TECHNICAL: Precise, detailed, and using appropriate terminology.
    - OBSERVED BEHAVIOR: Output ONLY the requested format.
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text() || "Failed to generate content.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error(`Gemini API Error: ${error instanceof Error ? error.message : String(error)}`);
    }
}
