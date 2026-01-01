import { GoogleGenAI } from "@google/genai";
import { ProcessingConfig, DocType } from '../types';

// We use Gemini Flash for speed and cost-efficiency as requested
const MODEL_NAME = 'gemini-3-flash-preview';

export const processTranscript = async (
  transcript: string, 
  config: ProcessingConfig
): Promise<string> => {
  if (!transcript.trim()) return '';

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are an expert ghostwriter and editor. 
    Your task is to take a raw, potentially rambling stream-of-consciousness voice transcript and convert it into a structured, valuable asset.

    Input Transcript: "${transcript}"

    Configuration:
    - Output Format: ${config.docType}
    - Detail Level: ${config.length}
    - Tone/Style: ${config.style}

    Guidelines based on format:
    - Design Feedback: Use sections like "Visuals", "UX/Usability", "Copy", and "Action Items".
    - Meeting Notes: Extract "Key Points", "Decisions Made", and "Action Items".
    - Bug Report: Format as "Observed Behavior", "Expected Behavior", "Steps to Reproduce" (inferred).
    - Email Draft: Meaningful subject line, body, sign-off.
    - LinkedIn Post: Professional but engaging hook, short paragraphs, appropriate emojis, 3-5 hashtags at the end.
    - Tweet Thread: Series of short tweets numbered (1/x), punchy, viral style, no hashtags in middle of text.
    - Blog Post: Catchy Title, Introduction, H2 Headers for sections, Conclusion.

    Constraints:
    - Fix grammar and stuttering.
    - Remove filler words (um, ah, like).
    - Do NOT make up facts not present in the transcript.
    - Use Markdown for formatting.
    - For lists, use hyphens (-) not asterisks (*).
    - Output ONLY the formatted content.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    
    return response.text || "Failed to generate content.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to process transcript with AI.");
  }
};