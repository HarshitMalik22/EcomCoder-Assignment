# LevelUp - AI-Powered Web Component Generator

LevelUp is an intelligent development tool that allows you to instantly generate production-ready React components from any website URL. By combining headless browser scraping, computer vision, and Large Language Models (LLMs), LevelUp transforms visual web designs into clean, accessible, and modern Tailwind CSS code.

**Live Demo**: [https://levelup-demo.vercel.app](https://levelup-demo.vercel.app) *(Replace with actual deployment URL)*

## Features

- 🌐 **Universal Scraping**: Analyze any public URL using a custom Playwright engine with stealth techniques.
- 👁️ **Visual Section Detection**: Automatically identifies Hero sections, Features, Pricing tables, and headers using DOM heuristics.
- 🤖 **AI Code Generation**: Uses **Google Gemini 2.5 Flash (Vision)** to generate pixel-perfect React components.
- ⚡ **Live Preview**: Instantly preview generated components in an isolated Sandpack environment.
- 🎨 **Smart Refinement**: Iteratively refine designs using natural language ("Make it dark mode", "Add functionality").
- 📦 **One-Click Export**: Copy code or download ready-to-use `.tsx` files.

## Architecture

LevelUp is built on a modern Next.js 14+ stack:

- **Frontend**: Next.js App Router, Tailwind CSS v4, Lucide React.
- **Backend (API)**: Next.js API Routes (Serverless).
- **Scraping**: Playwright (Headless Chromium) with custom stealth scripts to bypass bot detection.
- **AI Engine**: Google Gemini 2.5 Flash (via Google AI Studio).
- **Sandboxing**: Sandpack (CodeSandbox) for safe component previews.

## Getting Started

### Prerequisites
- Node.js 18+
- A Google Cloud/AI Studio API Key (`GEMINI_API_KEY`)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd levelup
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # Installs Playwright browsers
   npx playwright install chromium
   ```

3. **Configure Environment**:
   Copy `.env.example` to `.env.local` and add your keys:
   ```bash
   cp .env.example .env.local
   ```
   **Required**:
   - `GEMINI_API_KEY`: Get one from [Google AI Studio](https://aistudio.google.com/).

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to start.

## Deployment

### Deploying to Vercel

LevelUp is optimized for Vercel.

1. **Push to GitHub**: Ensure your repo is up to date.
2. **Import to Vercel**: Create a new project in Vercel.
3. **Environment Variables**: Add `GEMINI_API_KEY` to the project settings.
4. **Build Settings**:
   - The project includes a `postinstall` script to ensure Playwright browsers are installed (`playwright install chromium`).
   - If you encounter issues, you may need to set the env var `PLAYWRIGHT_BROWSERS_PATH=0` in Vercel to use the local node_modules cache.

## Scraping & AI Strategy

### Scraping
We use **Playwright** with custom stealth modifications (mocking `navigator.webdriver`, `navigator.plugins`, etc.) to avoid detection by anti-bot systems like Cloudflare. We strip cookies/trackers for a clean capture.

### AI Prompting
We utilize a **multi-modal approach**:
1. **Vision**: We pass the screenshot of the specific section to Gemini.
2. **HTML Context**: We pass the cleaned HTML structure to aid in text extraction and hierarchy.
3. **System Prompt**: Enforces best practices (React, Tailwind, Lucide Icons, Mobile-First).

## Limitations

- **Auth/Captcha**: Pages behind login or heavy CAPTCHAs may not be fully accessible, though our stealth engine handles basic checks.
- **Canvas/WebGL**: Highly interactive 3D elements cannot be fully replicated in standard React/CSS.
- **Rate Limits**: Code generation depends on Gemini API quotas.

---
Built with ❤️ by the LevelUp Team.
