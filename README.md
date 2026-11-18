# YatraSwasthya (prototype adaptation)

Vanilla-JS PWA for travel health planning (Home, Trips, Centres, Alerts, Me) with an added grounded Personal Health Brief, manual/curated climate-air context, and a prototype evaluation screen. This is a prototype and not medical advice.

## What was added

- **Personal Health Brief** (`Trips` -> open a trip -> **Health brief**): browser-only optional inputs (conditions, allergies, medicines, age group, pregnancy, food/stay style) plus manual/curated climate-air inputs. Generates a grounded brief using only this app's destination data.
- **Node backend** (`server.js`): serves the static app and `POST /api/brief`.
  - Provider-switchable by env (starts with Anthropic).
  - Request validation, 20 KB request limit, simple IP rate limit, timeout, JSON extraction/validation.
  - No server-side logging or storage of health details.
  - If AI is unavailable, not configured, or returns invalid output, the client falls back to the rule-based brief and states that clearly.
- **Climate/air exposure layer** (`climate.js`): manual or curated dated/sourced snapshot only (no live AQI/weather APIs, no invented values). CPCB AQI categories are used for Indian destinations; other destinations label scale/source or show not verified. Includes a transparent, illustrative (not clinically validated) rule-based vulnerability score with points breakdown and emergency override behavior.
- **Evaluate (prototype)** (`Me` -> **Evaluate (prototype)**): 14 predefined profiles (including doctor-needed, climate, and emergency-override cases). Runs rule-based and AI outputs side by side per profile with manual-only scoring, summaries, and JSON/CSV export. Scores start empty and are never pre-filled or estimated.
- **Concept note** (`CONCEPT_NOTE.md`): grounded description and placeholder-only pilot results mapped to exported evaluation figures.
- **Service worker** (`sw.js`): cache bumped to `ys-v11`, `climate.js` precached, and `/api/` requests are never cached (network-only).

## Run locally

Requirements: Node.js 18+ (tested with Node 24).

```bash
cd YatraSwasthya/YatraSwasthya
npm install
cp .env.example .env   # Windows PowerShell: Copy-Item .env.example .env
# edit .env with your provider/model/key
npm start
```

Open: http://localhost:3000

Notes:
- Without `AI_API_KEY` (or with an unavailable/invalid provider response), **Generate personal health brief** will fall back to the rule-based brief and display the fallback state.
- The app still works as a static PWA for existing features; the AI endpoint requires the Node server.

## Environment variables

Defined in `.env` (see `.env.example`):

- `AI_PROVIDER` - provider id (default: `anthropic`)
- `AI_API_KEY` - provider API key (required for AI generation)
- `AI_MODEL` - model name/id (default example: `claude-3-5-haiku-latest`)
- `PORT` - server port (default: `3000`)

`.env` is gitignored. Do not commit secrets.

## Deploy

Deploy to any Node host that can run `node server.js` and serve HTTP:

1. Set `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`, and `PORT` as host environment variables.
2. Start command: `npm start` (or `node server.js`).
3. Ensure the process can read the static files in this folder.

Because this is a static frontend served by the same Node process, no separate frontend build is required.

## Personal Health Brief behavior and safety

- Grounding: server/client prompt context is built only from app destination data (`assess`, packs, curated, alerts/rules) for the selected trip. The model must not invent outbreaks, doses, drug interactions, or country rules.
- Structured output: API response is validated as JSON before rendering; content is rendered with existing `esc()` escaping.
- No medical dosing/changes: never advises doses or starting/stopping/changing medicine.
- Doctor-needed cases: pregnancy, immunosuppression, multiple interacting medicines, or serious chronic conditions trigger a clear "This needs a doctor. Do not rely on this brief." state.
- Climate/air: manual AQI/PM2.5, temperature/humidity or heat category, and optional small curated dated/sourced snapshot. Unavailable data is shown as "not available" with existing rule-based advice.
- Vulnerability score: transparent rule-based points breakdown (age group, asthma/COPD, smoking, outdoor hours/day, AQI, heat; age/AQI counted once; no PM2.5 double-count with AQI). Labeled illustrative and not clinically validated. Symptom severity is separate from score.
- Emergency override: severe breathlessness, difficulty speaking, blue lips, confusion, collapse, severe chest pain, or heat symptoms with confusion/collapse show urgent "seek emergency care now" and skip the AI brief.
- Privacy: health details stay in the browser (local storage/session storage patterns used by the app). "Clear my details" removes entered personal details for the trip. The server does not log or store health details.

## Demo checklist (short)

1. **Existing app intact:** open Home/Trips/Centres/Alerts/Me; create/open a trip and confirm existing subviews (Overview, Rules, Vaccines, Risks, Plan, Summary, Kit) still work.
2. **Personal Health Brief:** open a trip -> **Health brief**, enter optional personal/climate details, click **Show rule-based brief** (works without AI), then **Generate personal health brief** (uses AI when configured; otherwise shows fallback state). Use **Clear my details** to remove browser-stored inputs for that trip.
3. **Climate/air:** provide manual AQI/temp/heat/outdoor hours (and symptoms) and confirm "as of"/source/scale labeling, CPCB category for Indian destinations, "not available" behavior when empty, points breakdown, and emergency override skipping AI.
4. **Evaluate:** Me -> **Evaluate (prototype)**, run rule-based/AI per profile, enter manual scores only (start empty), review summaries, and export JSON/CSV.
5. **API/SW behavior:** with server running, `/api/brief` returns grounded JSON or fallback error; service worker does not cache `/api/`.

## Known limitations

- Dated snapshot: destination rules/packs/alerts and curated climate entries are based on app data snapshots (for example `CURATED.checkedOn` and curated "as of" dates), not live feeds.
- Not medical advice: outputs are general travel-health information and do not replace a qualified travel-medicine doctor or pharmacist.
- Model output not clinically reviewed: AI text is validated for structure and grounded-context intent but is not clinically reviewed.
- Manual/curated climate only: no live AQI/weather APIs; users must enter values or rely on small curated dated/sourced entries; unavailable data remains "not available".
- Prototype evaluation: Evaluate profiles are predefined examples and scoring is manual; exported figures should only reflect manually entered scores.
- Browser-only health details: details persist in browser storage for convenience until cleared; use shared-device mode/clear features as appropriate.
- Coverage depends on included destination data and packs; uncovered items are reported as not verified.
