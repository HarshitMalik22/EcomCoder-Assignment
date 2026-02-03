import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseGeneratedCode } from './parser';

export interface RefineRequest {
    currentCode: string;
    instruction: string;
}

const SYSTEM_PROMPT_REFINE = `
You are an expert React/Tailwind Engineer.
Your task is to MODIFY the provided component based on the user's instruction.
- Maintain the original structure unless asked to change.
- Use standard Tailwind classes.
- Return ONLY the updated full component code including imports.
- Ensure the code is complete and not truncated.
- Do not add markdown fences if possible, or if you do, ensure they are valid.
- NO conversational text. Just code.
`;

export async function refineComponent(request: RefineRequest): Promise<string> {
    const { currentCode, instruction } = request;

    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing. Please add it to your .env.local file.");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Using Gemini 2.5 Flash on API v1 as requested
    const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }, { apiVersion: 'v1' });

    const prompt = `${SYSTEM_PROMPT_REFINE}\n\nCurrent Code:\n${currentCode}\n\nInstruction: ${instruction}`;

    try {
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return parseGeneratedCode(text);
    } catch (e) {
        console.error("Gemini Refinement Error", e);
        // Fallback to stable model if preview fails
        try {
            console.log("Falling back to gemini-1.5-pro-latest");
            const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
            const result = await fallbackModel.generateContent(prompt);
            const response = await result.response;
            return parseGeneratedCode(response.text());
        } catch (fallbackError) {
            throw new Error("Failed to refine component with Gemini.");
        }
    }
}
