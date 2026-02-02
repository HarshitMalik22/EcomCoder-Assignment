# LevelUp - AI-Powered Web Component Generator

LevelUp is an intelligent development tool that allows you to instantly generate production-ready React components from any website URL. By combining headless browser scraping, computer vision, and Large Language Models (LLMs), LevelUp transforms visual web designs into clean, accessible, and modern Tailwind CSS code.

## Features

- 🌐 **Universal Scraping**: Analyze any public URL using Playwright-based scraping engine.
- 👁️ **Visual Section Detection**: Automatically identifies Hero sections, Features, Pricing tables, and headers.
- 🤖 **AI Code Generation**: Uses Claude 4.5 opus (Vision) or GPT-4o to generate pixel-perfect React components.
- ⚡ **Live Preview**: Instantly preview generated components in an isolated sandbox environment.
- 🎨 **Smart Refinement**: Iteratively refine designs using natural language ("Make it dark mode", "Add functionality").
- 📦 **One-Click Export**: Copy code or download `.tsx` files ready for your Next.js project.

## Architecture

LevelUp is built on a modern Next.js 14+ stack:

- **Frontend**: Next.js App Router, Tailwind CSS v4, Lucide React.
- **Backend (API)**: Next.js API Routes (Serverless).
- **Scraping**: Playwright (Headless Chromium) running on the same server instance.
- **AI**: Integration with Anthropic SDK (Claude) and OpenAI SDK.
- **Sandboxing**: Sandpack (CodeSandbox) for safe component previews.

## Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd levelup
   ```

2. **Install dependencies**:
   ```bash
   npm install
   npx playwright install chromium
   ```

3. **Configure Environment**:
   Copy `.env.example` to `.env.local` and add your API keys:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with ANTHROPIC_API_KEY or OPENAI_API_KEY
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to start.

## Usagae Guide

1. Enter a valid URL (e.g., `https://stripe.com`) on the landing page.
2. Wait for the engine to detect sections.
3. Select the sections you want to convert (e.g., Hero, Navbar).
4. Click "Generate".
5. View the result in the Live Preview. Use the Chat Interface to refine the code if needed.
6. Export or Copy the code to your project.

## Project Structure

- `app/`: Next.js App Router pages and API routes.
- `components/`: React UI components (URLInput, SectionSelector, LivePreview).
- `lib/scraper/`: Playwright and Cheerio scraping logic.
- `lib/ai/`: Prompts and LLM integration handling.
- `types/`: Shared TypeScript definitions.

## Limitations

- Basic Auth or Captcha-protected sites are not supported.
- Highly interactive WebGL canvases cannot be fully replicated in React/HTML/CSS code.
- Rate limits apply based on your LLM API provider.

---
Built with ❤️ by LevelUp Team.
