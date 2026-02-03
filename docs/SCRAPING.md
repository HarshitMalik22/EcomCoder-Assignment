# Scraping Strategy & Limitations

LevelUp uses a highly optimized **Playwright** engine designed for stealth and visual fidelity.

## Architecture

We utilize **Playwright (Headless Chromium)** as our exclusive scraping engine. We have deprecated Cheerio/static scraping to ensure we capture the visual state of modern Single Page Applications (SPAs).

### Stealth & Evasion
To bypass "403 Forbidden" errors and anti-bot systems (Cloudflare, Akamai), we inject custom scripts before navigation (`page.addInitScript`):

1. **WebDriver Override**: We delete `navigator.webdriver` to mask the headless state.
2. **Plugin Spoofing**: We inject fake plugin arrays to mimic a real desktop browser.
3. **Chrome Runtime Mock**: We mock `window.chrome` objects.
4. **Hardware Concurrency**: We emulate realistic CPU concurrency.
5. **Cookie Blocking**: We strip `Set-Cookie` headers from responses to ensure a stateless, tracker-free session.

### Workflow
1. **Launch**: Chromium launches with flags to disable automation features (`--disable-blink-features=AutomationControlled`).
2. **Navigation**: We wait for `networkidle` (no network connections for 500ms) to ensure the page is fully hydrated.
3. **Cleanup**: We programmatically remove cookie banners, popups, and sticky overlays that might obscure the screenshot.
4. **Detection**: We execute a heuristic algorithm in the browser context to identify major visual sections (Hero, Features, Footer) based on element size (`getBoundingClientRect`) and DOM depth.
5. **Capture**: We take high-quality JPEGs of each section.

## Limitations

1. **Aggressive Bot Protection**: While our stealth scripts work for 90% of sites, extremely sophisticated fingerprinting (e.g., heavily configured Distil Networks) may still block the request.
2. **CAPTCHAs**: We do not solve visual CAPTCHAs (ReCAPTCHA/hCaptcha).
3. **Private Content**: We cannot scrape pages requiring login.
4. **Dynamic Resizing**: Screenshots are taken at a fixed 1920x1080 viewport. Elements that only appear on scroll interaction might be missed if they are lazy-loaded *after* our initial scroll simulation.
