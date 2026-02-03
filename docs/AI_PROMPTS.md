# AI Prompt Strategy

Website2Code relies on carefully engineered prompts to ensure high-quality code generation using **Google Gemini**.

## Component Generation Prompt

The generation process uses a **multi-modal prompt** (Image + Text) sent to **Gemini 2.5 Flash** (via API v1).

### System Prompt
We enforce a strict coding style:
- **Framework**: React (Function Components).
- **Styling**: Tailwind CSS (Mobile-first).
- **Icons**: `lucide-react` (No inline SVGs to keep code clean).
- **Structure**: Semantic HTML (section, h1, nav, etc.).
- **Self-Contained**: No external generic components; everything must be built inline or defined in the file.

### User Prompt strategy
We provide:
1. **The Screenshot**: A high-quality capture of the specific section (e.g., Hero, Pricing).
2. **The HTML Snippet**: Cleaned HTML from the scraper to provide text content and hierarchy context.
3. **Instruction**: "Recreate this section exactly as seen in the image."

Gemini's 1M+ token context window and native multimodal capabilities allow it to correlate the visual layout (image) with the DOM structure (HTML) effectively.

## Refinement Prompt

For the chat iteration ("Make the background blue"), we use a **Delta Modifier** approach:

1. We pass the **entire current code** history.
2. We append the **User's Modification Instruction**.
3. We ask Gemini to output the **complete, updated component code**.

We do not use incomplete "diffs" to avoid parsing errors. We expect a full replacement of the file content to ensure consistency.
