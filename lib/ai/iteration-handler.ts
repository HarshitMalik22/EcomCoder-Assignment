import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { AnthropicBedrock } from '@anthropic-ai/bedrock-sdk';
import { parseGeneratedCode } from './parser';

export interface RefineRequest {
    currentCode: string;
    instruction: string;
    model?: 'claude' | 'openai';
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
    const { currentCode, instruction, model = 'claude' } = request;

    if ((process.env.ANTHROPIC_API_KEY || process.env.AWS_ACCESS_KEY_ID) && model === 'claude') {
        let anthropic: any;

        const apiKey = process.env.ANTHROPIC_API_KEY || '';

        if (apiKey.startsWith('ABSK')) {
            try {
                const decoded = Buffer.from(apiKey.substring(4), 'base64').toString();
                const [accessKey, secretKey] = decoded.split(':');

                anthropic = new AnthropicBedrock({
                    awsAccessKey: accessKey,
                    awsSecretKey: secretKey,
                    awsRegion: process.env.AWS_REGION || 'us-east-1',
                });
            } catch (e) {
                console.error("Failed to decode custom Bedrock key", e);
                throw new Error("Invalid custom Bedrock key format");
            }
        } else if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
            anthropic = new AnthropicBedrock({
                awsAccessKey: process.env.AWS_ACCESS_KEY_ID,
                awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
                awsRegion: process.env.AWS_REGION || 'us-east-1',
            });
        } else {
            anthropic = new Anthropic({
                apiKey: apiKey,
                baseURL: process.env.ANTHROPIC_BASE_URL
            });
        }
        const isBedrock = apiKey.startsWith('ABSK') || !!process.env.AWS_ACCESS_KEY_ID;
        const modelId = isBedrock ? 'us.anthropic.claude-opus-4-5-20251101-v1:0' : 'claude-opus-4-5-20251101';

        const msg = await anthropic.messages.create({
            model: modelId,
            max_tokens: 4096,
            system: SYSTEM_PROMPT_REFINE,
            messages: [
                { role: 'user', content: `Current Code:\n${currentCode}\n\nInstruction: ${instruction}` }
            ]
        });
        const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
        return parseGeneratedCode(text);
    } else {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT_REFINE },
                { role: 'user', content: `Current Code:\n${currentCode}\n\nInstruction: ${instruction}` }
            ],
            max_tokens: 4000
        });
        return parseGeneratedCode(response.choices[0].message.content || '');
    }
}
