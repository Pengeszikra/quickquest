# The Royal Gazette: A Single-Line Noble Intrigue

*This is a submission for the [Built with Google Gemini: Writing Challenge](https://dev.to/challenges/mlh-built-with-google-gemini-02-25-26)*

## What I Built with Google Gemini
I built a minimalist, narrative-driven RPG that lives entirely within a **single line of pixels**—the black divider of a digital newspaper. 

The project solves the problem of "narrative clutter" by stripping a role-playing game down to its absolute essentials: movement, dialogue, and combat, all rendered in a 1-character-high sticky bar. Users read a dynamic news portal about a disgraced noble while simultaneously playing as that noble in the "header" of the page.

**Google Gemini's Role:**
Gemini acted as a Lead Architect and Senior Developer. It didn't just "write code"; it:
- **Translated high-level "vibes"** (e.g., "make it look like an old news portal") into precise Tailwind CSS 4 implementations.
- **Adapted legacy systems**: It analyzed the complex `rogmor` repository and surgically extracted a "minimal" version of its combat and ability systems (Body, Reflex, Soul) to run in a single `<div>`.
- **Iterated on UX constraints**: It solved the technical challenge of rendering high-fidelity pixel sprites and health bars within a constrained horizontal line while maintaining a "newspaper" aesthetic.

## Demo
The project is a single-page application consisting of `index.html`, `app.js`, and a sprite-based `assets` folder. 
- **The Quest:** Locate the Merchant, recover the Shattered Ring, and reach the Lady.
- **The Tech:** Vanilla JS, Tailwind CSS 4, and Rogmor Sprite Assets.

## What I Learned
- **Constraint-Driven Design:** Designing for a 1-character-high space forced me to prioritize "symbolic" gameplay over literal graphics.
- **Modern Asset Pipelines:** I learned how to efficiently map JSON-based sprite sheets (`faces.json`) to CSS `background-position` values for pixel-perfect rendering without a heavy game engine.
- **Contextual UI:** Integrating a game as a functional UI element (a divider) taught me how to blend interactive content with static information seamlessly.

## Google Gemini Feedback
- **What worked well:** The ability to provide Gemini with a local path to another repository (`~/repo/rogmor`) and have it autonomously analyze and adapt that logic was incredible. It understood the "mechanical soul" of the previous project and refitted it for this minimalist challenge.
- **Friction points:** Fine-tuning the "look and feel" of the URL-bar version (before we moved to the header) was tricky due to browser-level URL encoding of emojis. Gemini correctly suggested switching to a DOM-based "sticky line" when the browser's URL limitations became a bottleneck for the "vibe."
- **Candid Thought:** Gemini is an expert at "Code Archaeology"—digging through my old projects to find reusable patterns for new challenges.

---
**Tags:** #GoogleGeminiChallenge #WebDev #Minimalism #RPG #TailwindCSS
