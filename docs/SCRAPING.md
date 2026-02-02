# Scraping Strategy & Limitations

LevelUp uses a hybrid scraping approach to ensure maximum compatibility and accuracy.

## Architecture

We utilize **Playwright** as our primary engine due to its ability to render modern JavaScript-heavy websites (SPA, React, Vue apps) exactly as a user sees them.

### Workflow
1. **Navigation**: The scraper launches a headless Chromium instance and navigates to the target URL.
2. **Network Idle**: We wait for the `networkidle` state to ensure critical assets are loaded.
3. **Cleanup**: Invasive elements like cookie banners, popups, and iframes are programmatically removed using DOM manipulation to ensure a clean screenshot.
4. **Detection**: We inject a script (`evaluate`) to identify potential semantic sections (`<header>`, `<section>`, `<footer>`, major `<div>` containers) based on heuristics (size, position, tags).
5. **Capture**: We capture:
   - A full-page screenshot (for context/overlay).
   - Individual screenshots of each detected section (for the Vision AI).
   - HTML structure (for text and hierarchy reference).

## Fallback Mechanisms

If Playwright fails (e.g., due to timeout or detection issues), we have a **Cheerio-based** static scraper in `lib/scraper/cheerio-scraper.ts`. This is faster but only works for server-side rendered (SSR) or static content. Currently, the UI defaults to Playwright for visual accuracy.

## Limitations

1. **Anti-Bot Measures**: Sites with aggressive Cloudflare/Akamai protection may block the headless browser request (403 Forbidden).
2. **CAPTCHAs**: We do not solve CAPTCHAs.
3. **Dynamic Viewports**: The scraper uses a fixed 1280x800 viewport. Responsive layouts might look different on mobile; currently, we capture the desktop view standard.
4. **Authentication**: Pages behind login screens are not accessible.

## Future Improvements

- Implementing "Stealth Mode" plugin for Playwright to bypass basic bot detection.
- Adding Mobile Viewport scraping option.
- Proxy rotation service integration.
