# AI Prompt Strategy

LevelUp relies on carefully engineered prompts to ensure high-quality code generation.

## Component Generation Prompt

The generation process uses a **multi-modal prompt** (Image + Text) sent to Claude 3.5 Sonnet or GPT-4o.

### System Prompt
We enforce:
- Use of `lucide-react` for icons (no SVGs clutter).
- `tailwind-merge` handling.
- Mobile-first responsiveness.
- Strict TypeScript Usage.

### User Prompt
We provide the Section Type (e.g., "Hero") and the extracted HTML context.
"Recreate this 'Hero' section... Make it look exactly like the screenshot."

## Refinement Prompt

For the chat iteration, we use a "Delta Modifier" prompt:
"You are iterating on this component... Modify it based on the instruction: '{User Instruction}'."

We pass the *entire* current code back to the context to ensure the LLM has the full state, and ask it to return the *full* updated code. This avoids merge conflicts or partial updates.
