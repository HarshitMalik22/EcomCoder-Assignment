# EcomCoder Technical Write-up & Demo Script

## 1. Demo Script (Screen Recording 3-5min)

**0:00 – 0:45: Introduction & Scraping**
*   **Action**: Open your app’s home page. Paste a target URL (e.g., `https://ecomcoder.com` or a clean landing page like `https://udemy.com`).
*   **Narration**: "Hi, this is Harshit. I've built EcomCoder, a 'Visual Replica' generator that converts any website section into clean, editable React code using Google's Gemini 2.5 Flash. Let's start by pasting a URL."
*   **Action**: Click **"Analyze"**. Show the loading state.
*   **Visual**: Pause when the grid of detected sections (Header, Hero, Features) appears.
*   **Narration**: "The system uses Playwright to analyze the DOM, intelligently breaking the site into semantic sections like Hero, Features, and Footer. It captures both the HTML structure and a high-fidelity screenshot for the AI to reference."

**0:45 – 1:30: Generation & Preview**
*   **Action**: Select the "Hero" section card. Click **"Generate Component"**.
*   **Visual**: Show the loading spinner, then the transition to the Split View (Code on left, Live Preview on right).
*   **Narration**: "I strictly prompt the AI to generate self-contained code. It analyzes the screenshot for 'vibes' (colors, spacing) and the HTML for structure. Unlike standard code gen, this runs in a sandboxed environment. I built a custom parser that strips out Next.js-specific imports in real-time to prevent crashes."

**1:30 – 2:30: Iteration & Refinement**
*   **Action**: Notice a detail to change (e.g., "Make the background darker" or "Change the button color to blue").
*   **Action**: Type this into the chat/command input below the preview.
*   **Visual**: Show the preview updating with the new style while keeping the layout intact.
*   **Narration**: "The iteration engine maintains context. If I ask to 'make the buttons rounder,' it selectively updates the styles without hallucinating new structural elements."

**2:30 – 3:30: Robustness & Error Handling**
*   **Action**: (Optional) Click "Regenerate" or pick a complex section.
*   **Narration**: "A major challenge was AI compatibility. LLMs love importing `next/image`, which breaks live previews. I implemented a robust sanitization layer. If the AI hallucinates a component that doesn't exist, my parser automatically detects it and injects a fallback 'stub' component so the preview never crashes—it just highlights the missing piece."
*   **Action**: Show the "Copy Code" button and paste it into a dummy file or VS Code to show it's valid TypeScript.

**3:30 – 4:00: Conclusion**
*   **Narration**: "And that's EcomCoder. It turns inspiration into implementation in seconds, handling the heavy lifting of structure, styling, and asset mapping automatically."

---

## 2. Technical Q&A

### What was the hardest part?
The hardest part was **creating a stable "Sandboxed" Preview Environment**. AI models are trained on modern Next.js examples, so they aggressively try to import `next/image`, `next/link`, or generic non-existent `<Icon />` components. This constantly caused the live preview to crash with "Module not found" or "Hydration Mismatch" errors.

**Solution**: I built a dedicated **Sanitization & Parsing Engine** (`lib/ai/parser.ts`) that acts as a middleware. It:
1.  Intercepts the AI's response.
2.  Strips out framework-specific imports using Regex.
3.  Converts `<Image>` components to standard `<img>` tags.
4.  **Auto-Stubs Undefined Components**: If the AI uses a `<Card>` component but forgets to define it, the parser injects a dummy definition `const Card = ({children}) => <div>{children}</div>` so the code remains valid and runnable.

### How did you decide component boundaries?
I utilized **Playwright's DOM inspection** capabilities to detect semantic boundaries. Instead of blindly taking everything, the scraper looks for high-level semantic tags first (`<header>`, `<footer>`, `<section>`, `<main>`).

For pages without semantic HTML, I implemented a heuristic based on **Intersection Observers and Viewport Geometry**. The scraper calculates the height and screen coverage of elements; if a `div` covers the full width and has significant height, it's treated as a distinct "row" or section.

### What broke, and how did you handle it?
**1. Hydration Mismatches**: Browser extensions (Grammarly, AdBlock) inject attributes like `bis_skin_checked` into the DOM. When the scraper captured this HTML, React would crash on hydration.
*   **Fix**: Added a cleaning step in the scraper that removes known extension attributes before passing HTML to the AI.

**2. AI Hallucinations**: The AI often hallucinated "Lucide" icons that don't exist, or custom components.
*   **Fix**: Implemented a parser check that verifies imports against `lucide-react` exports. If an icon is invalid, it falls back to a generic `<Star />` icon.

**3. Preview Crashes**: Sometimes the generated code would just throw a runtime error.
*   **Fix**: Wrapped the Live Preview in a React **Error Boundary**. Instead of the whole app going white, the user sees a helpful "Preview Crashed" message with the error details and a "Try Again" button.

### How did you use AI in your workflow?
I used **Gemini 2.5 Flash** for its speed and multimodal capabilities. The workflow follows a "Visual Replica" pattern:
1.  **Input**: Section Screenshot + Raw HTML + Image Asset URLs.
2.  **Prompting**: I used a "Design DNA" approach in the system prompt, instructing the AI to first analyze the "roundness," "shadow depth," and "accent colors" before writing code.
3.  **Strict Constraints**: The prompt explicitly forbids external dependencies (except `lucide-react`) to ensure the code works immediately in the preview.

### What would you improve with more time?
1.  **Auth-Protected Scraping**: Add session-cookie injection to allow users to scrape sections from their own private dashboards (e.g., Jira, logged-in SaaS views).
2.  **Asset Hosting Pipeline**: Currently we link to original image URLs. I would implement an intermediary step that uploads these assets to S3/Cloudinary to ensure the generated components don't break if the original site enables hotlink protection.
