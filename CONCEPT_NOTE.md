## Problem addressed
Travellers from India often need to combine destination-specific vaccine/entry rules, local health risks, and personal factors (conditions, medicines, allergies, pregnancy, age, heat/air exposure). YatraSwasthya keeps guidance grounded in the app's verified destination data (WHO ITH/MoHFW-linked packs, curated alerts/rules, trip assessment, and centre information) and adds a Personal Health Brief that turns that context plus user-entered details into structured, safety-first guidance. A manual/curated climate-air layer (no live AQI/weather APIs, no invented values) adds CPCB categories for Indian destinations, transparent illustrative vulnerability scoring with emergency override so severe symptoms prompt urgent care.

## Description of the AI model
The Node backend (`server.js`, `POST /api/brief`) is provider-switchable via `AI_PROVIDER`, `AI_API_KEY`, and `AI_MODEL` (Anthropic Messages API first, example model `claude-3-5-haiku-latest`, low temperature). The client sends grounded context built only from app destination data for the selected trip. The server validates/sanitizes input, enforces request size/rate limits and timeout, requests schema-shaped JSON, and validates output before return. No health details are logged or stored. Safety rules forbid invented outbreaks/doses/drug interactions and any dose/start/stop/change medicine advice; require "not verified" when uncovered; require doctor-needed handling for pregnancy, immunosuppression, multiple interacting medicines, or serious chronic conditions; and fall back to a rule-based brief when AI is unavailable or invalid.

## Pilot results
Prototype evaluation is manual-only over 14 predefined profiles (including doctor-needed, climate, and emergency-override cases). Scores start empty and are never pre-filled/estimated. Results map to exported Evaluate JSON/CSV:
- Profiles evaluated: [N of 14]
- AI caught relevant risks but rule-based missed: [K profiles]
- Unsafe/ungrounded claims count: Rule-based [Rb_unsafe], AI [Ai_unsafe]
- Average caught relevant risks (0-2): Rule-based [Rb_risks_avg], AI [Ai_risks_avg]
- Average clarity (1-5): Rule-based [Rb_clarity_avg], AI [Ai_clarity_avg]
- Notes: [manual review notes]