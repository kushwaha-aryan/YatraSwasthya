/* YatraSwasthya: travel-health guide for Indian travellers. Vanilla JS, no build step. */
(function () {
  "use strict";
  const D = window.APPDATA, C = window.CURATED;
  const byId = Object.fromEntries(D.countries.map((c) => [c.id, c]));
  const KEY = "yatraswasthya-v1";
  const DAY = 864e5;

  /* ---------- utils ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  let DATEFMT = "long";
  const fmt = (s) => { if (!s) return ""; const d = typeof s === "string" ? parse(s) : s; return DATEFMT === "num" ? `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}` : `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`; };
  const fmtShort = (s) => { const d = typeof s === "string" ? parse(s) : s; return `${d.getDate()} ${MON[d.getMonth()]}`; };
  const addDays = (s, n) => iso(new Date(parse(s).getTime() + n * DAY));
  const today = () => { const t = new Date(); return iso(t); };
  const daysUntil = (s) => Math.round((parse(s) - parse(today())) / DAY);
  const uid = () => Math.random().toString(36).slice(2, 9);
  const code = (c) => { const w = c.name.replace(/\(.*?\)/g, "").split(/[\s/-]+/).filter((x) => x && !/^(of|the|and|da)$/i.test(x)); return (w.length > 1 ? w.map((x) => x[0]).join("").slice(0, 3) : w[0].slice(0, 3)).toUpperCase(); };
  const cname = (id) => (byId[id] ? byId[id].name : id);
  const listNames = (ids) => { const n = ids.map(cname); return n.length < 2 ? n.join("") : n.slice(0, -1).join(", ") + " and " + n[n.length - 1]; };

  /* ---------- state ---------- */
  const exampleTrip = () => ({ id: "t-example", example: true, stops: [{ country: "kenya", kind: "stay", regions: ["Nairobi city", "Maasai Mara / Narok"] }], depart: addDays(today(), 56), ret: addDays(today(), 70), type: "safari" });
  function defaultState() {
    return {
      profile: { state: "", city: "", age: "adult", flags: {} },
      trips: [],
      active: null,
      vacc: {},
      checks: {},
      followed: [],
      reports: [],
      notif: { outbreaks: true, rules: true, tasks: true, centres: false, mode: "instant" },
      seen: {}, emergency: {},
      brief: {},
      eval: { scores: {} },
      onboarded: false, settings: {}, v: 3,
    };
  }
  const DEFAULT_SETTINGS = { theme: "system", accent: "teal", text: "m", density: "comfy", contrast: false, motion: true, haptics: true, start: "home", dateFmt: "long", srcCompact: false };
  /* Shared-device mode keeps data only in this browser tab (sessionStorage) and never in long-term storage. */
  const MODE_KEY = "yatraswasthya-mode";
  let SHARED = false;
  try { SHARED = localStorage.getItem(MODE_KEY) === "shared"; } catch (e) { /* storage unavailable */ }
  const store = () => { try { return SHARED ? sessionStorage : localStorage; } catch (e) { return null; } };
  let S;
  try { S = JSON.parse(store().getItem(KEY)) || defaultState(); } catch (e) { S = defaultState(); }
  const save = () => { try { store().setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable: state lives in memory */ } };
  function setShared(on) {
    try {
      if (on) { localStorage.setItem(MODE_KEY, "shared"); localStorage.removeItem(KEY); }
      else { localStorage.removeItem(MODE_KEY); sessionStorage.removeItem(KEY); }
    } catch (e) { /* storage unavailable */ }
    SHARED = on; save();
  }
  function wipeAll() { try { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); } catch (e) { /* ignore */ } S = defaultState(); migrate(); }
  function migrate() {
    if (S.onboarded === undefined) S.onboarded = true; // people who used earlier versions skip the welcome
    if (!S.v || S.v < 2) {
      // Earlier versions pre-filled an example Kenya trip, Mumbai, a tick and a followed country. Remove them unless the person changed them.
      const ex = (S.trips || []).find((t) => t.id === "t-example");
      const ch = JSON.stringify((S.checks || {})["t-example"] || {}), vc = JSON.stringify((S.vacc || {})["t-example"] || {});
      if (ex && ch === '{"book-consult":true}' && vc === '{"hepa":"have"}' && ex.depart === "2027-01-10") {
        S.trips = S.trips.filter((t) => t !== ex); delete S.checks["t-example"]; delete S.vacc["t-example"];
        if (S.active === "t-example") S.active = S.trips[0] ? S.trips[0].id : null;
        if (JSON.stringify(S.followed) === '["kenya"]') S.followed = [];
        if (S.profile && S.profile.state === "Maharashtra" && S.profile.city === "Mumbai" && !S.profileSet) { S.profile.state = ""; S.profile.city = ""; }
      }
      S.v = 2;
    }
    S.settings = Object.assign({}, DEFAULT_SETTINGS, S.settings || {});
    ["trips", "followed", "reports"].forEach((k) => { if (!Array.isArray(S[k])) S[k] = []; });
    ["vacc", "checks", "seen", "emergency", "notif", "brief"].forEach((k) => { if (!S[k] || typeof S[k] !== "object") S[k] = {}; });
    if (!S.eval || typeof S.eval !== "object") S.eval = { scores: {} };
    if (!S.eval.scores || typeof S.eval.scores !== "object") S.eval.scores = {};
    S.v = 3;
  }
  migrate();

  /* ---------- appearance & device ---------- */
  function applySettings() {
    const st = S.settings, r = document.documentElement;
    if (st.theme === "system") delete r.dataset.theme; else r.dataset.theme = st.theme;
    r.dataset.accent = st.accent; r.dataset.text = st.text; r.dataset.density = st.density;
    r.dataset.contrast = st.contrast ? "on" : "off"; r.dataset.motion = st.motion ? "on" : "off"; r.dataset.src = st.srcCompact ? "compact" : "full";
    DATEFMT = st.dateFmt;
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.content = getComputedStyle(r).getPropertyValue("--bg").trim() || "#0b6b6f";
  }
  const buzz = (ms = 8) => { try { if (S.settings.haptics && navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* not supported */ } };
  const standalone = () => { try { return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; } catch (e) { return false; } };
  let installPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installPrompt = e; });
  window.addEventListener("appinstalled", () => { installPrompt = null; toast("Installed. Open YatraSwasthya from your home screen."); });
  try { if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {}); } catch (e) { /* offline mode unavailable */ }
  function download(name, mime, text) {
    const blob = new Blob([text], { type: mime });
    try { const f = new File([blob], name, { type: mime }); if (navigator.canShare && navigator.canShare({ files: [f] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) { navigator.share({ files: [f], title: name }).catch(() => {}); return; } } catch (e) { /* fall through */ }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  async function share(title, text) {
    if (navigator.share) { try { await navigator.share({ title, text }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
    copy(text);
  }
  const ui = { tab: "home", tripView: "list", wiz: null, risksFilter: "all", alertsFilter: "all", vaccineFilter: "yf", centreQ: "", hideDefence: true, cState: null, cCity: null, showRaw: {}, brief: null, briefState: null, eval: null };

  const trip = () => S.trips.find((t) => t.id === S.active) || S.trips[0];

  /* ---------- sources & freshness ---------- */
  function srcStatus(id, asOf) {
    const s = C.sources[id];
    if (!s) return { cls: "unv", word: "Not verified" };
    if (s.tier === 3) return { cls: "media", word: "Media report of official update" };
    const d = asOf || s.docDate;
    if (d && !s.evergreen && daysUntil(d) < -730) return { cls: "due", word: "Review due" };
    return { cls: "", word: "Verified" };
  }
  function srcChip(id, asOf, extra) {
    const s = C.sources[id];
    if (!s) return `<span class="src unv"><span class="dot"></span>Information not verified</span>`;
    const st = srcStatus(id, asOf);
    const dateTxt = asOf ? `as of ${fmt(asOf)}` : `checked ${fmt(C.checkedOn)}`;
    return `<button class="src ${st.cls}" data-act="src" data-id="${id}" data-asof="${asOf || ""}" data-extra="${esc(extra || "")}"><span class="dot"></span><span><b>${esc(s.pub)}</b> ${dateTxt}${st.cls === "due" ? " · Review due" : ""}</span></button>`;
  }
  function ithChip(c, year) {
    return `<button class="src due" data-act="src" data-id="who-ith-2022" data-extra="${esc("Country information last confirmed to WHO: " + (year || "not stated"))}"><span class="dot"></span><span><b>WHO country list 2022</b> · country info ${esc(year || "n/a")} · Review due</span></button>`;
  }
  const LABEL = { required: "Required for entry", reentry: "Required to re-enter India", indiatrip: "Required by India for this trip", recommended: "Recommended", consider: "Consider (ask your doctor)", routine: "Routine", outbreak: "Outbreak reported", alert: "Health alert", endemic: "Endemic risk", notreq: "Not required", unverified: "Information not verified", over: "Declared over / no active cases", check: "Read rule", general: "General advice" };
  const lbl = (k) => `<span class="lbl lbl-${k === "check" || k === "general" ? "routine" : k}">${LABEL[k]}</span>`;

  /* ---------- rule engine ---------- */
  const isIndiaYF = (id) => D.indiaYF.includes(id);
  function yfEntryKind(c) {
    const t = (c.yfEntry || "").toLowerCase().trim();
    if (!t) return "unknown";
    if (t === "no" || t.startsWith("no ")) return "no";
    if (/required for all travellers/.test(t)) return "all";
    if (/arriving from|having transited|coming from/.test(t)) return "from-risk";
    return "other";
  }
  const ageReq = (t) => { const m = /aged\s+(\d+)\s+(year|month)s?\s+or\s+over/i.exec(t || ""); return m ? `aged ${m[1]} ${m[2]}${m[1] === "1" ? "" : "s"} and over` : ""; };

  // Region-limited advice: true when the traveller chose regions and every one is in the pack's list.
  function allRegionsIn(stop, list) {
    return !!(list && stop.regions && stop.regions.length && stop.regions.every((r) => list.includes(r)));
  }
  const packRegionLimited = (stop) => { const p = C.packs[stop.country]; return !!p && allRegionsIn(stop, p.yfLow); };
  // Conditional pack items: apply when any chosen region matches OR the trip type matches.
  function applies(item, stop, t) {
    if (!item.ifRegions && !item.ifType) return true;
    if (item.ifRegions && (stop.regions || []).some((r) => item.ifRegions.includes(r))) return true;
    if (item.ifType && t.type === item.ifType) return true;
    // a regional item with no regions chosen still applies (we cannot rule it out), unless it is type-gated
    return !!item.ifRegions && !item.ifType && !(stop.regions && stop.regions.length);
  }
  const profileMatch = (list) => { const P = S.profile, f = P.flags || {}; return list.some((k) => f[k] || P.age === k); };

  function assess(t) {
    const P = S.profile;
    const stops = t.stops.filter((s) => byId[s.country]).map((s) => ({ ...s, c: byId[s.country] }));
    const visited = stops.filter((s) => s.kind !== "transit-short");
    const out = { must: [], entry: [], vaccines: [], risks: [], alerts: [], stops };
    const dep = t.depart, ret = t.ret;

    // 1. Destination yellow-fever entry rules, in itinerary order
    stops.forEach((s, i) => {
      if (s.kind === "transit-short") return;
      const k = yfEntryKind(s.c), raw = s.c.yfEntry;
      const anyTransitCounts = /transited through an airport/i.test(raw || "") && !/12 hours/i.test(raw || "");
      const prior = stops.slice(0, i).filter((p) => isIndiaYF(p.country) && (p.kind !== "transit-short" || anyTransitCounts));
      let item = { stop: s, raw, year: s.c.yfYear };
      if (k === "no") Object.assign(item, { label: "notreq", title: `${s.c.name}: no yellow-fever certificate needed to enter`, body: `${s.c.name} does not require proof of yellow-fever vaccination at entry.` });
      else if (k === "all") Object.assign(item, { label: "required", title: `${s.c.name}: yellow-fever certificate required to enter`, body: `Required for all travellers ${ageReq(raw)}. You may be refused entry without a valid certificate.`, due: addDays(dep, -10) });
      else if (k === "from-risk") {
        if (prior.length) Object.assign(item, { label: "required", title: `${s.c.name}: yellow-fever certificate required to enter`, body: `You reach ${s.c.name} after ${listNames(prior.map((p) => p.country))}, a country with yellow-fever risk. ${s.c.name} requires a certificate from such travellers ${ageReq(raw)}.`, due: addDays(dep, -10) });
        else Object.assign(item, { label: "notreq", title: `${s.c.name}: not required on direct travel from India`, body: `${s.c.name} asks for a certificate only from travellers arriving from (and for some countries, transiting) a yellow-fever risk country. India is not one. This changes if your route passes through such a country first.` });
      } else Object.assign(item, { label: "check", title: `${s.c.name}: entry rule needs reading`, body: "This country's rule has conditions the app cannot apply automatically. Read the WHO text below and confirm with the embassy." });
      out.entry.push(item);
      if (item.label === "required") out.must.push({ ...item, kind: "yf-entry" });
      if (s.c.other) out.entry.push({ stop: s, label: "check", title: `${s.c.name}: other requirements`, body: "WHO lists additional requirements for some travellers to this country (for example pilgrims or long stays).", raw: s.c.other, year: s.c.otherYear });
    });

    // 2. India's own rules
    const yfStops = stops.filter((s) => isIndiaYF(s.country));
    if (yfStops.length) {
      const transitOnly = yfStops.every((s) => s.kind !== "stay");
      out.must.unshift({
        kind: "yf-reentry", label: "reentry", key: "yf",
        title: "Yellow-fever certificate to re-enter India",
        body: `${listNames(yfStops.map((s) => s.country))} ${yfStops.length > 1 ? "are" : "is"} on India's list of yellow-fever countries. On your return, anyone without a valid certificate can be quarantined until it becomes valid or for up to 6 days. The certificate is valid from 10 days after vaccination, for life, and only if issued by a Government-authorised centre. Photocopies, digital copies and altered cards are not accepted.${transitOnly ? " Transit only: India exempts passengers who stayed inside the airport, if the Health Officer agrees." : ""}${P.age === "infant" ? " Infants under 9 months should not receive the vaccine; India's rule exempts infants up to 9 months." : ""}`,
        due: addDays(t.ret || dep, -10), protectBy: addDays(dep, -10), src: "mohfw-yf",
        dueNote: "Certificate must be valid when you arrive back in India",
      });
    }
    const polioStops = visited.filter((s) => D.indiaPolio[s.country]);
    if (polioStops.length) {
      out.must.push({
        kind: "polio", label: "indiatrip", key: "polio",
        title: "Polio vaccine certificate (OPV/IPV) for this destination",
        body: `India requires Indian residents and NRIs travelling to ${listNames(polioStops.map((s) => s.country))} to take one dose of OPV or IPV at least 4 weeks before departure, whatever their age or vaccination history. The certificate is valid for 1 year. It is free at Government yellow-fever centres and from District Immunisation Officers.`,
        due: addDays(dep, -28), src: "mohfw-polio",
      });
    }

    // 2b. Destination pack legal items and notes (e.g. Hajj / Umrah)
    visited.forEach((s) => {
      const p = C.packs[s.country]; if (!p) return;
      (p.must || []).forEach((m) => {
        if (!applies(m, s, t)) return;
        if (m.ifProfile && !profileMatch(m.ifProfile)) { out.entry.push({ stop: s, label: "check", title: m.elseTitle, body: m.elseBody, src: m.src }); return; }
        out.must.push({ kind: "pack", key: m.key, label: m.label, title: m.title, body: m.body, src: m.src, due: addDays(dep, m.dueDays || -28), stop: s });
      });
      (p.notes || []).forEach((n) => { if (applies(n, s, t)) out.entry.push({ stop: s, label: "check", title: n.title, body: n.body, src: n.src }); });
    });

    // 3. Vaccines
    const flags = P.flags || {};
    const liveWarn = flags.pregnant || flags.immuno ? "You noted pregnancy or weakened immunity: yellow fever is a live vaccine. Your doctor must assess whether it is safe, and may issue a medical exemption letter instead. Note that India does not accept an exemption letter in place of quarantine rules." : "";
    const yfRecStops = visited.filter((s) => (s.c.yfWho || "").toLowerCase().startsWith("yes"));
    const yfReq = out.must.filter((m) => m.kind === "yf-reentry" || m.kind === "yf-entry");
    if (yfReq.length || yfRecStops.length) {
      const labels = [...new Set(yfReq.map((m) => m.label))];
      const limited = yfRecStops.length && yfRecStops.every(packRegionLimited);
      if (yfRecStops.length) labels.push(limited ? "consider" : "recommended");
      out.vaccines.push({
        key: "yf", name: "Yellow fever", labels,
        why: [yfReq.length ? "A certificate is legally required for this trip (see Must do)." : "", yfRecStops.length ? `WHO: ${yfRecStops.map((s) => `${s.c.name}: ${s.c.yfWho.replace(/^yes\s*/i, "") || "vaccination recommended"}`).join(" ")}` : "", limited ? "Your chosen regions are ones where WHO says vaccination is generally not recommended; India's re-entry rule still applies." : ""].filter(Boolean).join(" "),
        doses: "1 dose. Certificate (ICVP) valid from 10 days after vaccination, for life. Rs 300 per dose at Government centres. Infants under 9 months should not be vaccinated; people aged 60+ or with conditions such as diabetes or hypertension get an extra risk assessment by the centre's officer.",
        due: addDays(dep, -10), legalBy: yfStops.length ? addDays(t.ret || dep, -10) : null, src: "mohfw-yf", live: true, warn: liveWarn, centre: "yf",
      });
    }
    if (polioStops.length) out.vaccines.push({ key: "polio", name: "Polio (OPV or IPV) with certificate", labels: ["indiatrip"], why: "Required by India for travel to this destination (MoHFW, June 2024).", doses: "1 additional dose at least 4 weeks before departure, regardless of earlier doses. Certificate valid 1 year. Free of cost.", due: addDays(dep, -28), src: "mohfw-polio", centre: "polio" });
    out.must.filter((m) => m.kind === "pack" && m.key === "mening").forEach((m) => out.vaccines.push({ key: "mening", name: "Meningococcal ACYW (quadrivalent)", labels: ["required"], why: m.body, doses: "1 dose, at least 10 days before arrival. Ask for a conjugate vaccine (certificate valid 5 years) and make sure the certificate names the vaccine type.", due: m.due, src: m.src, centre: "other" }));
    out.must.filter((m) => m.kind === "pack" && m.key === "covid-pil").forEach((m) => out.vaccines.push({ key: "covid-pil", name: "COVID-19 (for Saudi pilgrim rules)", labels: ["required"], why: m.body, doses: "Your doctor will advise on the dose and timing; carry proof of vaccination.", due: m.due, src: m.src, centre: "other" }));
    visited.forEach((s) => { const p = C.packs[s.country]; if (!p) return; p.vaccines.forEach((v) => {
      if (!applies(v, s, t)) return;
      const have = out.vaccines.find((x) => x.key === v.key);
      if (have) { if (v.label === "recommended" && have.labels.includes("consider")) have.labels = ["recommended"]; return; }
      out.vaccines.push({ key: v.key, name: v.name, labels: [v.label], why: v.why, doses: C.vaccineInfo && C.vaccineInfo[v.key] ? "" : "Doses and schedule depend on the product and your history; your doctor will advise.", due: addDays(dep, v.dueDays || (v.multi ? -56 : -28)), multi: v.multi, src: v.src, centre: "other" });
    }); });
    const unpacked = visited.filter((s) => !C.packs[s.country]);
    if (unpacked.length) out.vaccines.push({ key: "dest-other", name: "Other destination-specific vaccines", labels: ["unverified"], why: `This app has not yet verified destination-specific recommendations (such as hepatitis A, typhoid or rabies) for ${listNames(unpacked.map((s) => s.country))}. A travel-medicine doctor will advise; WHO and CDC publish country guidance.`, src: "who-ith", noStatus: true });
    out.vaccines.push({ key: "routine", name: "Routine vaccines", labels: ["routine"], why: "Make sure these are up to date before any international trip: MMR (measles, mumps, rubella), tetanus-diphtheria (Td/Tdap), polio, influenza, chickenpox (varicella) and COVID-19.", src: "who-ith-2022", due: addDays(dep, -28) });

    // 4. Risks
    visited.forEach((s) => {
      const c = s.c;
      const p = C.packs[s.country];
      const lowMal = p && allRegionsIn(s, p.malariaLow);
      if (p) p.risks.forEach((r) => {
        if (!applies(r, s, t) || out.risks.find((x) => x.country === s.country && x.name === r.name)) return;
        const item = { country: s.country, ...r, label: "endemic" };
        const noRegions = !(s.regions && s.regions.length);
        if (/^Malaria/.test(r.name) && lowMal) { item.tablets = false; item.prevent = "For the regions you chose, tablets are not usually advised: mosquito-bite prevention only. If your plans change to the risk areas, ask your doctor. " + r.prevent; }
        else if (/^Malaria/.test(r.name) && r.tablets && noRegions && (r.ifRegions || p.malariaAsk)) { item.tablets = false; item.prevent = "Whether you need tablets depends on where you go. Add your regions to this trip for a precise answer, and tell your doctor your route. " + r.prevent; }
        out.risks.push(item);
      });
      if (c.malText && !(p && (p.noMalaria || p.risks.some((r) => /^Malaria/.test(r.name)))) && !out.risks.find((x) => x.country === s.country && /^Malaria/.test(x.name))) {
        const free = /malaria-free|no (indigenous|local)|no malaria/i.test(c.malText) && !c.malPrev;
        if (!free) {
          const prev = { A: "Mosquito-bite prevention only.", B: "Mosquito-bite prevention, plus preventive tablets in risk areas. Your doctor chooses the drug.", C: "Mosquito-bite prevention, plus preventive tablets (WHO lists atovaquone-proguanil, doxycycline or mefloquine) in risk areas. Your doctor chooses the drug." }[(c.malPrev || "").trim()[0]] || "See WHO text; discuss prevention with your doctor.";
          out.risks.push({ country: s.country, name: "Malaria", route: "mosquito", scope: /entire country|whole country|throughout the country/i.test(c.malText) ? "country" : "regions", where: c.malText, prevent: prev, malPrev: c.malPrev, src: "ith", year: c.malYear, label: "endemic" });
        }
      }
      if ((c.yfWho || "").toLowerCase().startsWith("yes") && !out.risks.find((x) => x.country === s.country && x.name === "Yellow fever")) out.risks.push({ country: s.country, name: "Yellow fever", route: "mosquito", scope: /recommended for all travellers aged 9 months or over\.?$/i.test(c.yfWho.replace(/^yes\s*/i, "")) || c.yfWho.trim().toLowerCase() === "yes" ? "country" : "regions", where: c.yfWho.replace(/^yes\s*/i, "") || "WHO recommends vaccination for travellers to this country.", prevent: "Vaccination; day-time mosquito-bite prevention.", src: "ith", year: c.yfYear, label: "endemic" });
    });
    out.risks.push({ country: null, name: "Food- and water-borne infections", route: "food", scope: "general", where: "Travellers' diarrhoea, typhoid and hepatitis A are common travel infections in many regions.", prevent: "Safe water, food cooked and served hot, hand hygiene. Carry oral rehydration salts.", src: "who-ith", label: "general" });

    // 5. Alerts
    visited.forEach((s) => { out.alerts.push(...alertsFor(s.country)); });
    out.malaria = out.risks.some((r) => /^Malaria/.test(r.name) && (r.tablets || (r.src === "ith" && /[BC]/.test(r.malPrev || ""))));
    out.mosquito = out.risks.some((r) => r.route === "mosquito");
    return out;
  }

  function alertsFor(id) {
    const list = C.alerts.filter((a) => a.country === id).map((a) => ({ ...a }));
    const p = D.whoPolio[id];
    if (p) list.push({ id: "polio-" + id, country: id, type: "alert", sev: "monitor", disease: "Poliovirus detected", status: "WHO temporary recommendations in force", summary: p.join(". ") + ".", scope: "Country listed by WHO (polio IHR Emergency Committee)", asOf: "2026-04-30", todo: ["Complete polio vaccination before travel", D.indiaPolio[id] ? "India requires a polio certificate for travel to this country" : "Check whether your destination or India requires a polio certificate"], sources: ["who-polio-ec45"] });
    return list;
  }
  const sevWord = { monitor: "Monitor", precautions: "Take extra precautions", reconsider: "Reconsider non-essential travel", avoid: "Avoid travel (official advice)" };

  /* ---------- checklist & timeline ---------- */
  function checklist(t, a) {
    const dep = t.depart, ret = t.ret, V = S.vacc[t.id] || {}, items = [];
    const add = (g, id, text, due, extra) => items.push({ g, id, text, due, ...extra });
    add("vacc", "book-consult", "Book a travel-medicine consultation", addDays(dep, -56), { why: "Allows time for vaccines that need several doses or weeks to work." });
    a.vaccines.forEach((v) => {
      if (v.noStatus) return;
      if (v.key === "routine") return add("vacc", "routine", "Check routine vaccines are up to date", v.due, { why: "MMR, Td/Tdap, polio, flu, chickenpox, COVID-19" });
      const st = V[v.key];
      if (st === "have" || st === "skip") return;
      const legal = v.labels.some((l) => ["required", "reentry", "indiatrip"].includes(l));
      if (!legal && st !== "plan" && !v.labels.includes("recommended")) return;
      add("vacc", "v-" + v.key, (v.multi ? "Start " : "Get ") + v.name + (v.key === "yf" ? " vaccine and certificate" : ""), v.due, { label: v.labels[0] });
    });
    if (a.malaria) add("meds", "antimalarial", "Get an antimalarial prescription from your doctor", addDays(dep, -28), { why: "Some tablets start 1 to 2 days before travel, others 1 to 2 weeks before." });
    add("meds", "rx-copies", "Pack prescription medicines in original packs, with prescription copies (generic names)", addDays(dep, -3));
    add("meds", "kit", "Pack oral rehydration salts and a basic first-aid kit", addDays(dep, -3));
    add("ins", "insurance", `Buy travel health insurance that covers ${listNames(a.stops.filter((s) => s.kind !== "transit-short").map((s) => s.country))} and medical evacuation`, addDays(dep, -28));
    add("food", "water", "Drink sealed bottled, boiled or treated water; avoid ice made from tap water", null);
    add("food", "food", "Eat food that is cooked and served hot; peel fruit yourself", null);
    add("food", "hands", "Wash or sanitise hands before eating", null);
    if (a.mosquito) {
      add("vector", "repellent", "Pack an insect repellent for skin", addDays(dep, -3));
      add("vector", "cover", "Wear long sleeves and trousers, especially at dawn and dusk", null);
      if (a.malaria) add("vector", "net", "Sleep under a mosquito net or in screened or air-conditioned rooms", null);
    }
    if (a.risks.some((r) => /Rabies|lyssavirus/.test(r.name))) add("vector", "animals", "Avoid touching dogs, monkeys and other animals; know where to get rabies care", null);
    if (a.must.some((m) => m.kind.startsWith("yf"))) add("docs", "icvp", "Carry the ORIGINAL yellow-fever certificate (ICVP) in hand luggage", addDays(dep, -1), { why: "Photocopies and digital copies are not accepted on arrival in India." });
    if (a.must.some((m) => m.kind === "polio")) add("docs", "polio-cert", "Carry the polio vaccination certificate", addDays(dep, -1));
    if (a.must.some((m) => m.key === "mening")) add("docs", "mening-cert", "Carry the meningococcal ACYW certificate (vaccine type stated) for Hajj/Umrah", addDays(dep, -1));
    if (a.must.some((m) => m.key === "covid-pil")) add("docs", "covid-cert", "Carry proof of COVID-19 vaccination", addDays(dep, -1));
    if (a.risks.some((r) => r.route === "environment" && /Heat/.test(r.name))) add("food", "heat", "Plan for heat: water bottle, hat or umbrella, rest in the shade", null);
    if (a.risks.some((r) => /Altitude/.test(r.name))) add("meds", "altitude", "Ask your doctor about altitude-sickness prevention for your trek", addDays(dep, -14));
    add("docs", "contacts", "Save emergency contacts offline (Emergency screen)", addDays(dep, -1));
    add("docs", "passport", "Check passport validity and visa requirements", addDays(dep, -56));
    if (a.malaria) add("after", "finish-am", "Finish the antimalarial course exactly as prescribed after you return", addDays(ret, 1));
    add("after", "fever", "If you get a fever after return, see a doctor and say where you travelled", addDays(ret, 1), { why: a.malaria ? "Malaria can appear weeks to months after return." : "" });
    if (a.alerts.some((x) => /Ebola/.test(x.disease) && x.type !== "over")) add("after", "ebola-21", "Watch for fever or other symptoms for 21 days after leaving; report travel history", addDays(ret, 1));
    return items;
  }
  const GROUPS = { vacc: "Vaccinations", meds: "Medicines and supplies", ins: "Travel insurance", food: "Food and water", vector: "Mosquitoes, ticks and animals", docs: "Documents and certificates", after: "After you return" };

  function timeline(t, items) {
    const dep = t.depart;
    const ms = [
      { key: "w8", date: addDays(dep, -56), title: "8 weeks before" },
      { key: "w4", date: addDays(dep, -28), title: "4 weeks before" },
      { key: "w2", date: addDays(dep, -14), title: "2 weeks before" },
      { key: "w0", date: addDays(dep, -7), title: "Departure week" },
      { key: "trip", date: dep, title: "During the trip" },
      { key: "after", date: addDays(t.ret, 1), title: "After you return" },
    ];
    ms.forEach((m) => (m.items = []));
    items.filter((i) => i.due).forEach((i) => {
      const d = i.due;
      let m;
      if (i.g === "after") m = ms[5];
      else if (d < ms[1].date) m = ms[0];
      else if (d < ms[2].date) m = ms[1];
      else if (d < ms[3].date) m = ms[2];
      else m = ms[3];
      m.items.push(i);
    });
    ms[4].items.push({ id: "trip-alerts", text: "Re-check alerts for your destination", due: null }, { id: "trip-food", text: "Follow food, water and bite precautions", due: null });
    return ms;
  }

  /* ---------- render helpers ---------- */
  const back = (act) => `<button class="iconbtn" data-act="${act}" aria-label="Back"><svg viewBox="0 0 24 24"><path d="M15.5 5 8.5 12l7 7-1.4 1.4L5.7 12l8.4-8.4z"/></svg></button>`;
  const appbar = (title, backAct, right) => `<header class="appbar">${backAct ? back(backAct) : ""}<h1>${title}</h1>${right || ""}</header>`;
  const disclaimer = `<p class="foot">General travel-health information from official sources. It does not replace a consultation with a qualified travel-medicine doctor, who will advise on your health, medicines and itinerary.</p>`;
  const tripTitle = (t) => t.stops.map((s) => cname(s.country)).join(" → ");
  const codes = (t) => t.stops.filter((s) => s.kind !== "transit-short").map((s) => `<span class="flagcode">${code(byId[s.country])}</span>`).join(" ");

  function progress(t) {
    const a = assess(t), items = checklist(t, a), ch = S.checks[t.id] || {};
    const done = items.filter((i) => ch[i.id]).length;
    return { a, items, done, total: items.length, pct: items.length ? Math.round((done / items.length) * 100) : 0 };
  }

  /* ---------- views ---------- */
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  const countdown = (d) => d < 14 ? plural(d, "day") : plural(Math.floor(d / 7), "week") + (d % 7 ? " " + plural(d % 7, "day") : "");
  const planBar = (sub) => `<button class="planbar" data-act="new-trip"><span class="pb-i">${ICON.plus}</span><span class="pb-t"><b>Plan a new trip</b><span>${sub || "Where are you travelling? Add destination and dates"}</span></span><span class="chev">›</span></button>`;
  const QI = {
    trip: `<svg viewBox="0 0 24 24"><path d="M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7z"/></svg>`,
    pin: `<svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>`,
    sos: `<svg viewBox="0 0 24 24"><path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .6 3.6 1 1 0 0 1-.25 1z"/></svg>`,
    card: `<svg viewBox="0 0 24 24"><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2v10h16V7zm2 2h6v2H6zm0 4h9v2H6z"/></svg>`,
    list: `<svg viewBox="0 0 24 24"><path d="M9 6h12v2H9zm0 5h12v2H9zm0 5h12v2H9zM4 5.5 5.5 7 8 4.5 9 5.5 5.5 9 3 6.5zm0 5 1.5 1.5L8 9.5l1 1L5.5 14 3 11.5zm0 5 1.5 1.5L8 14.5l1 1L5.5 19 3 16.5z"/></svg>`,
  };
  const quick = (t) => `<div class="quick">${[
    t ? ["open-sub", "checklist", QI.list, "Checklist"] : ["me-sub-go", "vguide", QI.list, "Vaccine guide"],
    ["tab", "centres", QI.pin, "Centres"],
    ["open-sub", "emergency", QI.sos, "Emergency"],
    t ? ["open-sub", "brief", QI.card, "Health brief"] : ["tab", "alerts", ICON.bell, "Alerts"],
  ].map(([a, v, ic, l]) => `<button class="q" data-act="${a}" ${a === "tab" ? `data-tab="${v}"` : a === "open-sub" ? `data-sub="${v}" data-id="${t ? t.id : ""}"` : a === "me-sub-go" ? `data-v="${v}"` : ""}><span class="qi">${ic}</span><span>${l}</span></button>`).join("")}</div>`;
  function viewHome() {
    const t = trip();
    let h = `<header class="appbar"><h1>Namaste</h1><button class="iconbtn" data-act="go-notif" aria-label="Notifications"><svg viewBox="0 0 24 24"><path d="M12 22a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5.5-6.8V3.5a1.5 1.5 0 0 0-3 0v.7A7 7 0 0 0 5 11v5l-2 2v1h18v-1z"/></svg></button></header><div class="stack">` + planBar(t && t.example ? "The trip below is an example. Add your own destination and dates" : null);
    if (t) {
      const pr = progress(t), d = daysUntil(t.depart);
      const next = pr.items.filter((i) => !(S.checks[t.id] || {})[i.id] && i.due).sort((x, y) => (x.due < y.due ? -1 : 1))[0];
      h += `<section class="card hero"><div class="spread"><div><div class="row">${codes(t)}${t.example ? `<span class="tag-ex">Example trip</span>` : `<span class="tiny muted">Your next trip</span>`}</div><h2 style="margin-top:8px">${esc(tripTitle(t))}</h2><p class="small muted num">${fmt(t.depart)} to ${fmt(t.ret)}</p></div><div class="ring" style="--p:${pr.pct}"><span class="num">${pr.done}/${pr.total}</span></div></div>
      <p class="num" style="margin-top:10px;font:600 1rem var(--font-display)">${d > 0 ? `${countdown(d)} to go` : d === 0 ? "Departing today" : "Trip started or past"}</p>
      ${next ? `<p class="small" style="margin-top:4px">Next: ${esc(next.text)} · ${next.due < today() ? "<b>do this now</b>" : `by <span class="num">${fmtShort(next.due)}</span>`}</p>` : ""}
      <div class="row" style="margin-top:12px"><button class="btn sm" style="background:var(--accent-ink);color:var(--accent);border-color:var(--accent-ink)" data-act="open-trip" data-id="${t.id}">Open trip</button><button class="btn sm ghost" style="color:inherit;border-color:currentColor" data-act="open-sub" data-sub="checklist" data-id="${t.id}">Checklist</button></div></section>`;
      h += quick(t);
      const must = pr.a.must;
      if (must.length) h += `<section class="card req"><div class="spread"><h3>Must do for this trip</h3><span class="tiny muted">${must.length} legal requirement${must.length > 1 ? "s" : ""}</span></div><div class="list">${must.map((m) => `<div class="li"><div class="stack" style="gap:4px"><div class="row">${lbl(m.label)}</div><b class="small">${esc(m.title)}</b>${daysUntil(m.due) >= 0 ? `<span class="tiny muted num">Latest date: ${fmt(m.due)}</span>` : `<span class="tiny" style="color:var(--req)"><b>Deadline passed</b> (${fmt(m.due)}). Open the trip for what to do now.</span>`}</div></div>`).join("")}</div></section>`;
    }
    if (!t) h += quick(null) + `<div class="card"><h3>New here?</h3><p class="small" style="margin-top:4px">Plan your own trip with the button above, or look around with an example trip to Kenya first. You can delete it any time.</p><button class="btn ghost sm" style="margin-top:10px" data-act="add-example">Explore an example trip</button></div>`;
    const changes = [...new Set([...S.followed, ...(t ? t.stops.map((s) => s.country) : [])])].flatMap(alertsFor).sort((x, y) => (x.asOf < y.asOf ? 1 : -1)).slice(0, 3);
    h += `<div class="section-title"><h2>What changed</h2><a href="#alerts" class="small">All alerts</a></div>`;
    h += changes.length ? changes.map(alertRow).join("") : `<p class="notice">No verified alerts for your followed places. Endemic risks still apply.</p>`;

    if (S.trips.length > 1) h += `<div class="section-title"><h2>Other trips</h2></div>` + S.trips.filter((x) => x !== t).map(tripRow).join("");
    return h + `</div>` + disclaimer;
  }

  function alertRow(a) {
    return `<button class="card tight ${a.type === "outbreak" ? "warn" : ""}" style="text-align:left;cursor:pointer;width:100%" data-act="alert" data-id="${a.id}"><div class="spread"><div class="row">${lbl(a.type)}<span class="flagcode">${code(byId[a.country])}</span></div><span class="tiny muted num">${fmt(a.asOf)}</span></div><p style="margin-top:6px"><b>${esc(cname(a.country))}: ${esc(a.disease)}</b></p><p class="small muted">${esc(a.scope)}</p></button>`;
  }
  function tripRow(t) {
    const d = daysUntil(t.depart), pr = progress(t);
    return `<button class="card tight triprow" data-act="open-trip" data-id="${t.id}"><div class="spread"><div class="row">${codes(t)}<b>${esc(tripTitle(t))}</b>${t.example ? `<span class="tag-ex">Example</span>` : ""}</div><span class="chev">›</span></div><div class="spread" style="margin-top:6px"><span class="small muted num">${fmt(t.depart)} to ${fmt(t.ret)}</span><span class="tiny num">${d > 0 ? countdown(d) + " to go" : d === 0 ? "Today" : "Past"}</span></div><div class="progress thin" style="margin-top:8px"><i style="width:${pr.pct}%"></i></div><span class="tiny muted">${pr.done} of ${pr.total} checklist items done</span></button>`;
  }

  function viewTrips() {
    if (ui.wiz) return viewWizard();
    if (ui.tripView !== "list") return viewTripSub();
    return appbar("Your trips") + `<div class="stack">${planBar(S.trips.length ? "Add another destination and dates" : null)}${S.trips.map(tripRow).join("") || `<div class="empty"><span class="brand-mark big"></span><h2>No trips yet</h2><p class="small muted">Add where and when you're going. The app works out what's required, recommended and when to do it.</p><button class="btn ghost sm" style="margin-top:6px" data-act="add-example">Or explore an example trip (Kenya)</button></div>`}</div>` + disclaimer;
  }

  /* --- wizard --- */
  const STATES = [...new Set(D.centres.map((c) => c.state))].sort();
  const ALL_STATES = [...new Set([...STATES, "Andaman & Nicobar Islands", "Arunachal Pradesh", "Chandigarh", "Haryana", "Ladakh", "Lakshadweep", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Puducherry", "Sikkim", "Tripura"])].sort();
  const wizFoot = (btn, hint) => `<div class="wizfoot">${ui.wiz.step > 0 ? `<button class="btn ghost" data-act="wiz-back">Back</button>` : ""}<span class="tiny muted wf-h">${hint || ""}</span>${btn}</div>`;
  function viewWizard() {
    const w = ui.wiz, steps = ["Where", "When", "About you", "For your doctor"];
    let h = appbar("Plan a new trip", null, `<button class="linkbtn" data-act="wiz-cancel">Cancel</button>`) + `<ol class="stepper" aria-label="Step ${w.step + 1} of 4">${steps.map((x, i) => `<li class="${i < w.step ? "done" : i === w.step ? "on" : ""}"><span>${i < w.step ? "✓" : i + 1}</span><em>${x}</em></li>`).join("")}</ol><div class="stack" style="margin-top:14px">`;
    if (w.step === 0) {
      h += `<h2>Where are you going?</h2><p class="small muted">Add each country in order. Add transit stops too: some rules depend on them.</p>`;
      h += w.stops.map((s, i) => {
        const c = byId[s.country], pack = C.packs[s.country];
        return `<div class="card tight"><div class="spread"><div class="row"><span class="flagcode">${code(c)}</span><b>${i + 1}. ${esc(c.name)}</b></div><button class="linkbtn small" data-act="wiz-rm" data-i="${i}">Remove</button></div>
        <div class="seg" role="group" aria-label="Stop type" style="margin-top:10px">${[["stay", "Staying"], ["transit-short", "Transit < 12 h"], ["transit-long", "Transit 12 h+"]].map(([k, l]) => `<button aria-pressed="${s.kind === k}" data-act="wiz-kind" data-i="${i}" data-k="${k}">${l}</button>`).join("")}</div>
        ${pack && pack.regions.length && s.kind === "stay" ? `<p class="small muted" style="margin-top:10px">Regions you'll visit (changes some advice):</p><div class="chips" style="margin-top:6px">${pack.regions.map((r) => `<button class="chip" aria-pressed="${(s.regions || []).includes(r)}" data-act="wiz-region" data-i="${i}" data-r="${esc(r)}">${esc(r)}</button>`).join("")}</div>` : ""}</div>`;
      }).join("");
      h += `<label class="f" for="cq">Add a country<input id="cq" type="search" placeholder="Search, e.g. Kenya, UAE, Brazil" autocomplete="off" value="${esc(w.q || "")}" data-on="wiz-q"></label><div id="sugg"></div>`;
      h += wizFoot(`<button class="btn" data-act="wiz-next" ${w.stops.some((s) => s.kind === "stay") ? "" : "disabled"}>Continue</button>`, w.stops.some((s) => s.kind === "stay") ? "" : "Add at least one country you'll stay in");
    } else if (w.step === 1) {
      const dd = w.depart ? daysUntil(w.depart) : null;
      h += `<h2>When?</h2><div class="row" style="flex-wrap:nowrap"><label class="f" style="flex:1" for="wd">Departure<input type="date" id="wd" value="${w.depart || ""}" min="${today()}" data-on="wiz-date" data-k="depart"></label><label class="f" style="flex:1" for="wr">Return<input type="date" id="wr" value="${w.ret || ""}" min="${w.depart || today()}" data-on="wiz-date" data-k="ret"></label></div>`;
      if (dd != null) h += dd < 28 ? `<div class="banner warn"><b>Under 4 weeks to go.</b> Some vaccines need time to work. Book a travel-medicine consultation now; it is often not too late.</div>` : `<p class="small muted num">${Math.floor(dd / 7)} weeks before departure.</p>`;
      h += wizFoot(`<button class="btn" data-act="wiz-next" ${w.depart && w.ret && w.ret >= w.depart ? "" : "disabled"}>Continue</button>`, w.depart && w.ret && w.ret < w.depart ? "Return date is before departure" : !(w.depart && w.ret) ? "Choose both dates" : "");
    } else if (w.step === 2) {
      const cities = [...new Set(D.centres.filter((c) => c.state === w.state).map((c) => c.city))].sort();
      h += `<h2>About you</h2><p class="small muted">Your home state and city are used only to show nearby vaccination centres.</p>
      <label class="f" for="ws">Home state<select id="ws" data-on="wiz-field" data-k="state">${`<option value="" ${w.state ? "" : "selected"}>Choose your state</option>` + ALL_STATES.map((s) => `<option ${s === w.state ? "selected" : ""}>${esc(s)}</option>`).join("")}</select></label>
      <label class="f" for="wc">Home city<input id="wc" type="text" list="cityList" value="${esc(w.city || "")}" data-on="wiz-field" data-k="city"><datalist id="cityList">${cities.map((c) => `<option value="${esc(c)}">`).join("")}</datalist></label>
      <p class="small" style="font-weight:500">Age group</p><div class="chips">${[["infant", "Under 9 months"], ["child", "Child"], ["adult", "18–59"], ["senior", "60+"]].map(([k, l]) => `<button class="chip" aria-pressed="${w.age === k}" data-act="wiz-set" data-k="age" data-v="${k}">${l}</button>`).join("")}</div>
      <p class="small" style="font-weight:500">Trip type</p><div class="chips">${[["city", "City / leisure"], ["safari", "Safari / rural"], ["business", "Business"], ["study", "Study"], ["family", "Visiting family"], ["pilgrimage", "Pilgrimage"]].map(([k, l]) => `<button class="chip" aria-pressed="${w.type === k}" data-act="wiz-set" data-k="type" data-v="${k}">${l}</button>`).join("")}</div>
      ${w.stops.some((s) => s.country === "saudi-arabia") ? `<p class="tiny muted">Going for Hajj or Umrah? Choose Pilgrimage (or the Hajj/Umrah region in step 1) to add Saudi pilgrim health requirements.</p>` : ""}
      ` + wizFoot(`<button class="btn" data-act="wiz-next">Continue</button>`);
    } else {
      h += `<h2>Things your doctor should know <span class="muted small">(optional)</span></h2><p class="small muted">These don't change what is required. They add "discuss with your doctor" flags to vaccines such as yellow fever. Stored only on this device.</p><div class="card">${DOCFLAGS.map(([k, l]) => `<label class="toggle" for="fl-${k}"><span>${l}</span><input class="switch" type="checkbox" id="fl-${k}" ${w.flags[k] ? "checked" : ""} data-on="wiz-flag" data-k="${k}"></label>`).join("")}</div>
      ` + wizFoot(`<button class="btn" data-act="wiz-done">Build my plan</button>`, "These details are optional");
    }
    return h + `</div>`;
  }
  function renderSuggest() {
    const box = $("#sugg"); if (!box) return;
    const q = (ui.wiz.q || "").trim().toLowerCase();
    if (q.length < 2) { box.innerHTML = ""; return; }
    const hits = D.countries.filter((c) => (c.name + " " + c.syn).toLowerCase().includes(q)).slice(0, 8);
    D.aliases.filter((a) => a.alias.toLowerCase().includes(q)).forEach((a) => { const c = byId[a.to]; if (c && !hits.includes(c)) hits.push({ ...c, aliasOf: a.alias }); });
    box.innerHTML = hits.length ? `<div class="suggest">${hits.slice(0, 8).map((c) => `<button data-act="wiz-add" data-id="${c.id}"><span class="flagcode">${code(c)}</span><span>${esc(c.aliasOf ? c.aliasOf + " (" + c.name + ")" : c.name)}${isIndiaYF(c.id) ? ` <span class="tiny" style="color:var(--india)">· India YF list</span>` : ""}</span></button>`).join("")}</div>` : `<p class="notice">No match in WHO's country list. Try another spelling.</p>`;
  }

  /* --- trip sub views --- */
  const SUBS = [["dash", "Overview"], ["reqs", "Rules"], ["vaccines", "Vaccines"], ["risks", "Risks"], ["talerts", "Alerts"], ["checklist", "Checklist"], ["timeline", "Timeline"], ["brief", "Health brief"], ["card", "Health card"], ["emergency", "Emergency"]];
  const subnav = (cur) => `<nav class="subnav" aria-label="Trip sections">${SUBS.map(([k, l]) => `<button data-act="sub" data-sub="${k}" aria-current="${k === cur ? "page" : "false"}">${l}</button>`).join("")}</nav>`;
  function viewTripSub() {
    const t = trip();
    if (!t && ui.tripView === "emergency") return viewEmergency(null);
    if (!t) { ui.tripView = "list"; return viewTrips(); }
    const fn = { dash: viewDash, reqs: viewReqs, vaccines: viewVaccines, risks: viewRisks, talerts: viewTripAlerts, checklist: viewChecklist, timeline: viewTimeline, brief: viewBrief, emergency: viewEmergency, card: viewCard }[ui.tripView] || viewDash;
    const html = fn(t), cut = html.indexOf("</header>") + 9;
    return cut > 8 ? html.slice(0, cut) + subnav(ui.tripView === "dash" || !fn ? "dash" : ui.tripView) + html.slice(cut) : html;
  }

  function viewDash(t) {
    const pr = progress(t), a = pr.a;
    const rec = a.vaccines.filter((v) => v.labels.includes("recommended")).map((v) => v.name);
    const malaria = a.risks.filter((r) => /^Malaria/.test(r.name));
    const live = a.alerts.filter((x) => x.type === "outbreak");
    const packNote = a.stops.filter((s) => s.kind !== "transit-short").map((s) => C.packs[s.country] ? `${s.c.name}: detailed pack verified ${fmt(C.packs[s.country].verified)}` : `${s.c.name}: WHO and India rules only`).join(" · ");
    let h = appbar(esc(tripTitle(t)), "trip-list", `<button class="iconbtn" data-act="del-trip" aria-label="Delete trip"><svg viewBox="0 0 24 24"><path d="M9 3h6l1 2h4v2H4V5h4zm-3 6h12l-1 12H7z"/></svg></button>`);
    h += `<div class="stack"><div class="row">${codes(t)}<span class="small muted num">${fmt(t.depart)} to ${fmt(t.ret)}</span>${t.example ? `<span class="tiny muted">· Example trip</span>` : ""}</div>`;
    h += a.stops.some((s) => s.regions && s.regions.length) ? `<p class="small">Your regions: ${esc(a.stops.flatMap((s) => s.regions || []).join(", "))}</p>` : "";
    h += `<p class="tiny muted">${esc(packNote)}</p>`;
    const yfm = a.must.find((m) => m.kind === "yf-reentry"), yfe = a.must.some((m) => m.kind === "yf-entry"), V0 = (S.vacc[t.id] || {}).yf;
    if (V0 !== "have" && daysUntil(t.depart) >= 0 && daysUntil(t.depart) < 10 && (yfm || yfe)) {
      const legalOk = yfm && daysUntil(yfm.due) >= 0;
      h += `<div class="banner req" style="flex-direction:column;gap:4px"><b>Under 10 days to departure: get the yellow-fever vaccine now if you haven't.</b><span>The certificate becomes valid, and protection starts, 10 days after the dose.</span>${yfe ? `<span>Your destination requires a valid certificate on arrival: check with the airline and embassy whether you can still travel on these dates.</span>` : ""}${yfm ? (legalOk ? `<span>For India's rule, a dose given by <b>${fmt(yfm.due)}</b> will be valid when you return on ${fmt(t.ret)}.</span>` : `<span>A dose given now will not be valid by your return on ${fmt(t.ret)}: you can be quarantined until it becomes valid, or for up to 6 days. Consider changing your return date.</span>`) : ""}<span>Until then, avoid mosquito bites. Speak to a Government yellow-fever centre today.</span></div>`;
    }
    h += `<section class="card req"><div class="spread"><h3>Must do (legal)</h3><button class="linkbtn small" data-act="sub" data-sub="reqs">All rules</button></div>${a.must.length ? `<div class="list">${a.must.map((m) => `<div class="li"><div class="stack" style="gap:6px;width:100%"><div class="row">${lbl(m.label)}</div><b>${esc(m.title)}</b>${dueLine(m)}${m.src ? srcChip(m.src) : ithChip(m.stop.c, m.year)}</div></div>`).join("")}</div>` : `<p class="small" style="margin-top:6px">No vaccination certificate is legally required for this itinerary, based on WHO's country list and India's rules.</p>`}</section>`;
    h += `<section class="card rec"><div class="spread"><h3>Strongly advised</h3><button class="linkbtn small" data-act="sub" data-sub="vaccines">Vaccines</button></div><div class="list">
      ${rec.length ? `<div class="li"><div><div class="row">${lbl("recommended")}</div><p class="small" style="margin-top:4px">${esc(rec.join(", "))}</p></div></div>` : ""}
      ${malaria.length ? `<div class="li"><div><div class="row">${lbl("endemic")}<b class="small">Malaria prevention</b></div><p class="small" style="margin-top:4px">${esc(malaria[0].prevent)}</p></div></div>` : ""}
      <div class="li"><div><div class="row">${lbl("routine")}</div><p class="small" style="margin-top:4px">Check routine vaccines are up to date.</p></div></div></div></section>`;
    h += `<section class="card ${live.length ? "warn" : ""}"><div class="spread"><h3>Outbreaks and alerts</h3><button class="linkbtn small" data-act="sub" data-sub="talerts">Details</button></div>${a.alerts.length ? `<div class="list">${a.alerts.map((x) => `<div class="li"><div style="width:100%"><div class="spread">${lbl(x.type)}<span class="tiny muted num">as of ${fmt(x.asOf)}</span></div><p class="small" style="margin-top:4px"><b>${esc(x.disease)}</b>: ${esc(x.scope)}</p></div></div>`).join("")}</div>` : `<p class="small" style="margin-top:6px">No verified alerts in this app as of ${fmt(C.checkedOn)}.</p>`}<p class="tiny muted" style="margin-top:8px">No alert does not mean no risk. See Disease risks.</p></section>`;
    h += `<section class="card rec"><div class="spread"><h3>Personal Health Brief</h3><button class="linkbtn small" data-act="sub" data-sub="brief">Open</button></div><p class="small muted" style="margin-top:6px">Get a grounded, personal brief using your trip, optional health details, and manual climate and air inputs. Health details stay in this browser only.</p><div class="row" style="margin-top:10px"><button class="btn sm" data-act="sub" data-sub="brief">Open health brief</button></div></section>`;
    const tiles = [["reqs", "Requirements", `${a.entry.length + a.must.filter((m) => m.kind !== "yf-entry").length} rules`], ["vaccines", "Vaccines", `${a.vaccines.length} cards`], ["risks", "Disease risks", `${a.risks.length} risks`], ["talerts", "Alerts", `${a.alerts.length} for this trip`], ["centres", "Centres near you", `${esc(S.profile.city || S.profile.state)}`], ["checklist", "Checklist", `${pr.done} of ${pr.total} done`], ["timeline", "Timeline", "8 weeks to return"], ["brief", "Health brief", "Personal + climate"], ["card", "Health card", "Show at clinic"], ["emergency", "Emergency", "Missions and contacts"]];
    h += `<div class="tiles">${tiles.map(([k, l, s]) => `<button class="tile" data-act="${k === "centres" ? "trip-centres" : "sub"}" data-sub="${k}"><span class="t">${l}</span><span class="s">${s}</span></button>`).join("")}</div>`;
    h += `<div class="row"><button class="btn" data-act="share-summary"><svg class="ico" viewBox="0 0 24 24"><path d="M18 16a3 3 0 0 0-2.4 1.2l-6.7-3.4a3 3 0 0 0 0-1.6l6.7-3.4A3 3 0 1 0 15 7l-6.7 3.4a3 3 0 1 0 0 3.2L15 17a3 3 0 1 0 3-1z"/></svg>Share summary</button><button class="btn ghost" data-act="sub" data-sub="card">Health card</button><button class="btn ghost" data-act="ics">Add to calendar</button></div><p class="tiny muted">Share the summary with your doctor, or add every due date to your phone's calendar.</p>`;
    return h + `</div>` + disclaimer;
  }

  function viewReqs(t) {
    const a = assess(t);
    let h = appbar("Requirements", "dash") + `<div class="stack"><p class="small muted">Two borders apply: your destination's entry rules, and India's own rules when you leave and return.</p>`;
    h += `<div class="section-title"><h2>India's rules for this trip</h2></div>`;
    const ind = a.must.filter((m) => m.kind !== "yf-entry" && m.kind !== "pack");
    const pk = a.must.filter((m) => m.kind === "pack");
    h += ind.length ? ind.map((m) => `<div class="card req"><div class="row">${lbl(m.label)}</div><h3 style="margin-top:8px">${esc(m.title)}</h3><p class="small" style="margin-top:6px">${esc(m.body)}</p><p style="margin-top:6px">${dueLine(m)}</p><div style="margin-top:8px">${srcChip(m.src)}</div></div>`).join("") : `<div class="card"><div class="row">${lbl("notreq")}</div><p class="small" style="margin-top:6px">None of your countries is on India's yellow-fever list or India's polio list (June 2024).</p><div class="row" style="margin-top:8px">${srcChip("mohfw-yf")}${srcChip("mohfw-polio")}</div></div>`;
    if (pk.length) h += `<div class="section-title"><h2>Destination legal requirements</h2></div>` + pk.map((m) => `<div class="card req"><div class="row">${lbl(m.label)}<span class="flagcode">${code(m.stop.c)}</span></div><h3 style="margin-top:8px">${esc(m.title)}</h3><p class="small" style="margin-top:6px">${esc(m.body)}</p><p style="margin-top:6px">${dueLine(m)}</p><div style="margin-top:8px">${srcChip(m.src)}</div></div>`).join("");
    h += `<div class="section-title"><h2>Destination entry rules</h2></div>`;
    h += a.entry.map((e) => `<div class="card ${e.label === "required" ? "req" : ""}"><div class="row">${lbl(e.label)}<span class="flagcode">${code(e.stop.c)}</span></div><h3 style="margin-top:8px">${esc(e.title)}</h3><p class="small" style="margin-top:6px">${esc(e.body)}</p>${e.raw ? `<details style="margin-top:8px"><summary class="small linkbtn">WHO wording</summary><p class="who-q" style="margin-top:6px">${esc(e.raw)}</p></details>` : ""}<div style="margin-top:8px">${e.src ? srcChip(e.src) : ithChip(e.stop.c, e.year)}</div></div>`).join("");
    h += `<p class="notice">WHO's 2022 list is the latest complete official list of country entry rules. Countries can change their rules at any time, so confirm with the embassy or consulate before you travel.</p>`;
    return h + `</div>` + disclaimer;
  }

  const DOCFLAGS = [["pregnant", "Pregnant, or could be in the next two weeks"], ["nursing", "Breastfeeding"], ["immuno", "Weakened immunity (HIV, cancer, transplant, steroids, chemotherapy)"], ["egg", "Allergy to eggs, chicken or gelatin"], ["thymus", "Thymus disorder or thymus removed (e.g. myasthenia gravis)"], ["organ", "Major liver or kidney disease"], ["chronic", "Other long-term illness (e.g. diabetes, hypertension)"], ["acute", "Currently unwell or have a fever"]];
  /* Personalised yellow-fever checks from MoHFW's contraindication list. Returns [{level, text}] */
  function yfChecks() {
    const f = S.profile.flags || {}, age = S.profile.age, out = [];
    const X = (k, level, text) => { if (k) out.push({ level, text }); };
    X(age === "infant", "stop", "Under 9 months: MoHFW lists infants younger than 9 months as not to be vaccinated.");
    X(f.egg, "stop", "Allergy to eggs, chicken or gelatin: MoHFW says do not take this vaccine. It is made in chick embryos and can cause a severe allergic reaction.");
    X(f.pregnant, "stop", "Pregnancy (now or possible in the next two weeks): listed by MoHFW as a contraindication.");
    X(f.immuno, "stop", "Weakened immunity: MoHFW lists HIV (CD4 below 200 per mm³ or under 15% of lymphocytes), cancer, transplant, radiotherapy, steroids, chemotherapy and other immune-affecting drugs as contraindications.");
    X(f.thymus, "stop", "Thymus disorder (myasthenia gravis, DiGeorge syndrome, thymoma) or thymus removed: listed by MoHFW as a contraindication.");
    X(f.organ, "stop", "Major liver or kidney disease: listed by MoHFW as a contraindication.");
    X(f.acute, "wait", "Unwell now (with or without fever): MoHFW says postpone the vaccine until you are well.");
    X(f.nursing, "wait", "Breastfeeding: MoHFW advises nursing mothers to avoid or postpone travel to yellow-fever risk areas.");
    X(age === "senior" || f.chronic, "caution", "Age 60+ or conditions such as diabetes or hypertension: MoHFW notes a higher risk of side effects. The centre's Nodal Officer weighs risk against benefit.");
    return out;
  }
  function yfSafetyBlock(required) {
    const ch = yfChecks(), stop = ch.some((c) => c.level === "stop");
    const LV = { stop: ["req", "Do not take without specialist advice"], wait: ["warn", "Postpone"], caution: ["warn", "Extra caution"] };
    let h = ch.map((c) => `<div class="banner ${LV[c.level][0]}" style="margin-top:8px;flex-direction:column;gap:2px"><b class="tiny" style="text-transform:uppercase;letter-spacing:.04em">${LV[c.level][1]}</b><span>${esc(c.text)}</span></div>`).join("");
    if (stop && required) h += `<div class="banner req" style="margin-top:8px;flex-direction:column;gap:4px"><b>If you cannot be vaccinated but the certificate is required</b><span>WHO: a letter of medical exemption is needed when the vaccine is contraindicated for medical reasons. Ask the yellow-fever centre's Nodal Officer. Whether a destination, or India on your return, accepts the letter: check before you book (Information not verified for each country).</span><div class="row">${srcChip("who-ith-ch6")}</div></div>`;
    h += `<details class="contra"><summary>Who should not get this vaccine (MoHFW)</summary><ul class="small">${C.yfContra.contra.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><p class="small" style="font-weight:600;margin-top:6px">To note</p><ul class="small">${C.yfContra.notes.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><div class="row" style="margin-top:6px">${srcChip("mohfw-yf")}</div>${ch.length ? "" : `<p class="tiny muted" style="margin-top:6px">Nothing in your profile matches this list. Add health details in Me so the app can flag them.</p>`}</details>`;
    return h;
  }

  /* Deadline line: never shows a past date as a plain "Do by". */
  function dueLine(m) {
    if (!m.due) return "";
    const d = daysUntil(m.due), note = m.dueNote ? `<br><span class="tiny muted">${esc(m.dueNote)}</span>` : "";
    const prot = m.protectBy ? (daysUntil(m.protectBy) >= 0 ? `<br><span class="tiny">For protection during the trip: by <b>${fmt(m.protectBy)}</b></span>` : `<br><span class="tiny" style="color:var(--warn)">Too late for full protection from the first day of the trip: protection starts 10 days after the dose. Avoid mosquito bites.</span>`) : "";
    if (d >= 0) return `<span class="small num">Do by <b>${fmt(m.due)}</b>${d <= 7 ? ` <span class="lbl lbl-alert" style="font-size:.7rem">${d === 0 ? "today" : plural(d, "day") + " left"}</span>` : ""}${note}${prot}</span>`;
    return `<span class="small" style="color:var(--req)"><b>Deadline passed</b> (${fmt(m.due)}). ${m.kind === "yf-reentry" ? "A dose taken now will not be valid when you return to India: you can be quarantined until it becomes valid, or for up to 6 days. Speak to a Government yellow-fever centre today, and consider changing your return date." : "Speak to a doctor or the authority today about what is still possible."}</span>`;
  }

  function vaccineCard(t, v) {
    const st = (S.vacc[t.id] || {})[v.key];
    const flags = S.profile.flags || {};
    const doc = [];
    if (v.live && v.key !== "yf" && (flags.pregnant || flags.immuno)) doc.push(v.warn);
    const late = v.due && v.due < today() && st !== "have";
    return `<div class="card ${v.labels.some((l) => ["required", "reentry", "indiatrip"].includes(l)) ? "req" : ""}"><div class="row">${v.labels.map(lbl).join("")}</div><h3 style="margin-top:8px">${esc(v.name)}</h3><p class="small" style="margin-top:6px">${esc(v.why)}</p>
      ${v.doses || v.due ? `<dl class="kv" style="margin-top:10px">${v.doses ? `<dt>Doses</dt><dd>${esc(v.doses)}</dd>` : ""}${v.due ? `<dt>${v.legalBy ? "For protection" : "Get by"}</dt><dd class="num">${late ? `<span style="color:var(--req)"><b>As soon as possible.</b> The ideal date (${fmt(v.due)}) has passed${v.key === "yf" ? "; protection starts 10 days after the dose, so avoid mosquito bites early in the trip" : "; a late dose can still help, ask your doctor"}.</span>` : `<b>${fmt(v.due)}</b>`}</dd>` : ""}${v.legalBy ? `<dt>For India's certificate</dt><dd class="num">${daysUntil(v.legalBy) >= 0 ? `by <b>${fmt(v.legalBy)}</b> <span class="tiny muted">(valid on return)</span>` : `<span style="color:var(--req)"><b>Cannot be valid on your return</b> (needed by ${fmt(v.legalBy)}). Speak to a yellow-fever centre today.</span>`}</dd>` : ""}</dl>` : ""}
      ${(() => { const k = C.vaccineInfo && C.vaccineInfo[v.key]; return k ? `<dl class="kv" style="margin-top:8px"><dt>Schedule</dt><dd>${esc(k.schedule)}</dd><dt>In India</dt><dd>${esc(k.india)}</dd></dl><div class="row" style="margin-top:6px">${k.srcs.map((x) => srcChip(x)).join("")}</div>` : ""; })()}
      ${v.key === "yf" ? `<div class="row" style="margin-top:6px">${srcChip("who-ihr-annex7")}</div>` : ""}
      ${(C.vaccineRef || []).some((r) => r.key === v.key) ? `<button class="linkbtn small" style="margin-top:8px" data-act="vguide" data-k="${v.key}">Full guide: schedule, dose, route, who should not get it ›</button>` : ""}
      ${v.key === "yf" ? yfSafetyBlock(v.labels.some((l) => ["required", "reentry", "indiatrip"].includes(l))) : ""}
      ${doc.map((d) => `<div class="banner warn" style="margin-top:8px">${esc(d)}</div>`).join("")}
      ${v.noStatus ? "" : `<div class="spread" style="margin-top:10px"><div class="status3" role="group" aria-label="My status for ${esc(v.name)}">${[["have", "Already have"], ["plan", "Plan to get"], ["skip", "Skip (doctor advised)"]].map(([k, l]) => `<button aria-pressed="${st === k}" data-act="vstatus" data-k="${v.key}" data-v="${k}">${l}</button>`).join("")}</div></div>`}
      <div class="row" style="margin-top:10px">${v.centre && v.centre !== "other" ? `<button class="btn sm" data-act="find-centre" data-v="${v.centre}">Find a centre</button>` : v.centre === "other" ? `<button class="btn sm ghost" data-act="find-centre" data-v="other">Where to get it</button>` : ""}${v.src === "who-ith-2022" ? `<button class="src due" data-act="src" data-id="who-ith-2022"><span class="dot"></span><span><b>WHO</b> ITH 2022</span></button>` : srcChip(v.src)}</div></div>`;
  }
  function viewVaccines(t) {
    const a = assess(t);
    const sec = { req: [], rec: [], con: [], rou: [] };
    a.vaccines.forEach((v) => {
      if (v.labels.some((l) => ["required", "reentry", "indiatrip"].includes(l))) sec.req.push(v);
      else if (v.labels.includes("recommended") || v.labels.includes("unverified")) sec.rec.push(v);
      else if (v.labels.includes("consider")) sec.con.push(v);
      else sec.rou.push(v);
    });
    let h = appbar("Vaccines", "dash", `<span class="small muted num">${fmtShort(t.depart)}</span>`) + `<div class="stack"><p class="notice">Whether a vaccine is right for you depends on your health. <b>Your doctor makes the final decision.</b></p>`;
    [["req", "Required by law"], ["rec", "Recommended"], ["con", "Consider (discuss with your doctor)"], ["rou", "Routine"]].forEach(([k, l]) => {
      h += `<div class="section-title"><h2>${l}</h2><span class="tiny muted">${sec[k].length}</span></div>`;
      h += sec[k].length ? sec[k].map((v) => vaccineCard(t, v)).join("") : `<p class="small muted">None for this itinerary.</p>`;
    });
    return h + `</div>` + disclaimer;
  }

  function viewRisks(t) {
    const a = assess(t);
    const routes = [["all", "All"], ["mosquito", "Mosquito"], ["food", "Food & water"], ["animal", "Animal"], ["person", "Person to person"], ["environment", "Heat & altitude"]].filter(([k]) => k === "all" || a.risks.some((r) => r.route === k));
    const list = a.risks.filter((r) => ui.risksFilter === "all" || r.route === ui.risksFilter);
    let h = appbar("Disease risks", "dash") + `<div class="stack"><p class="small muted">Background risks at your destination. These are not outbreaks; current outbreaks are under Alerts.</p><div class="chips">${routes.map(([k, l]) => `<button class="chip" aria-pressed="${ui.risksFilter === k}" data-act="risk-f" data-v="${k}">${l}</button>`).join("")}</div>`;
    h += list.map((r) => `<div class="card"><div class="spread"><div class="row">${lbl(r.label)}${r.country ? `<span class="flagcode">${code(byId[r.country])}</span>` : ""}</div><span class="tiny muted">${r.scope === "country" ? "Country-wide" : r.scope === "regions" ? "Specific regions" : "All destinations"}</span></div><h3 style="margin-top:8px">${esc(r.name)}</h3>
      <dl class="kv" style="margin-top:8px"><dt>Spread</dt><dd>${{ mosquito: "Mosquito bites", food: "Contaminated food or water", animal: "Bites or scratches from animals", person: "From person to person", environment: "Environment (heat, altitude)" }[r.route]}</dd><dt>Where</dt><dd>${esc(r.where)}</dd><dt>Prevention</dt><dd>${esc(r.prevent)}</dd></dl>
      <div style="margin-top:8px">${r.src === "ith" ? ithChip(byId[r.country], r.year) : srcChip(r.src)}</div>${/^Malaria/.test(r.name) ? `<p class="tiny" style="margin-top:8px;color:var(--req)">A fever during or after the trip is a medical emergency until malaria is ruled out. Get tested and mention your travel.</p>` : ""}</div>`).join("") || `<p class="notice">No risks of this type listed.</p>`;
    h += `<p class="notice">Many risks cannot be prevented by a vaccine; what you do matters. A risk not listed here may still exist.</p>`;
    return h + `</div>` + disclaimer;
  }

  function alertCard(x, full) {
    return `<div class="card ${x.type === "outbreak" ? "warn" : ""}"><div class="spread"><div class="row">${lbl(x.type)}<span class="flagcode">${code(byId[x.country])}</span></div><span class="tiny muted">${esc(sevWord[x.sev] || "")}</span></div>
      <h3 style="margin-top:8px">${esc(cname(x.country))}: ${esc(x.disease)}</h3><p class="small muted">${esc(x.status)} · ${esc(x.scope)}</p><p class="small" style="margin-top:6px">${esc(x.summary)}</p>
      ${x.officialLevel ? `<p class="small" style="margin-top:6px"><b>Official level:</b> ${esc(x.officialLevel)}</p>` : ""}
      ${x.noVaccine ? `<p class="small" style="margin-top:6px">${esc(x.noVaccine)}</p>` : ""}
      ${full && x.todo ? `<p class="small" style="margin-top:8px;font-weight:600">What to do</p><ul class="small" style="margin:4px 0 0;padding-left:18px">${x.todo.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>` : ""}
      ${full && x.india ? `<div class="banner req" style="margin-top:8px"><span><b>India side:</b> ${esc(x.india)}</span></div>` : ""}
      ${full && x.timeline ? `<p class="small" style="margin-top:8px;font-weight:600">Timeline</p><div class="list">${x.timeline.map(([d, s]) => `<div class="li small"><span class="num muted" style="min-width:84px">${fmt(d)}</span><span>${esc(s)}</span></div>`).join("")}</div>` : ""}
      <div class="row" style="margin-top:8px">${x.sources.map((s) => srcChip(s, x.asOf)).join("")}</div>${full ? "" : `<button class="linkbtn small" style="margin-top:8px" data-act="alert" data-id="${x.id}">What to do</button>`}</div>`;
  }
  function viewTripAlerts(t) {
    const a = assess(t);
    let h = appbar("Alerts for this trip", "dash") + `<div class="stack">`;
    const ob = a.alerts.filter((x) => x.type === "outbreak"), al = a.alerts.filter((x) => x.type !== "outbreak");
    h += `<div class="section-title"><h2>Outbreak reported</h2></div>` + (ob.length ? ob.map((x) => alertCard(x, true)).join("") : `<p class="notice">No verified outbreaks for your destinations as of ${fmt(C.checkedOn)}. This does not mean there is no risk; see Disease risks.</p>`);
    h += `<div class="section-title"><h2>Health alerts</h2></div>` + (al.length ? al.map((x) => alertCard(x, true)).join("") : `<p class="notice">No verified health alerts as of ${fmt(C.checkedOn)}.</p>`);
    return h + `</div>` + disclaimer;
  }

  function viewChecklist(t) {
    const pr = progress(t), ch = S.checks[t.id] || (S.checks[t.id] = {});
    let h = appbar("Checklist", "dash", `<span class="small muted num">${pr.done}/${pr.total}</span>`) + `<div class="progress"><i style="width:${pr.pct}%"></i></div><div style="margin-top:12px">`;
    Object.entries(GROUPS).forEach(([g, name]) => {
      const its = pr.items.filter((i) => i.g === g); if (!its.length) return;
      const d = its.filter((i) => ch[i.id]).length;
      h += `<details class="grp" ${d < its.length ? "open" : ""}><summary><span>${name}</span><span class="small muted num">${d}/${its.length}</span></summary>${its.map((i) => { const late = i.due && i.due < today() && !ch[i.id]; return `<label class="check ${ch[i.id] ? "done" : ""}" for="c-${i.id}"><input type="checkbox" id="c-${i.id}" ${ch[i.id] ? "checked" : ""} data-on="check" data-id="${i.id}"><span class="stack" style="gap:2px"><span class="ct">${esc(i.text)}</span>${i.label ? `<span>${lbl(i.label)}</span>` : ""}${i.why ? `<span class="tiny muted">${esc(i.why)}</span>` : ""}${i.due ? (late ? `<span class="tiny num" style="color:var(--warn)"><b>Do now</b> · ideal date was ${fmt(i.due)}; it is often not too late</span>` : `<span class="tiny num muted">By ${fmt(i.due)}</span>`) : ""}</span></label>`; }).join("")}</details>`;
    });
    h += `</div><div class="row" style="margin-top:14px"><button class="btn" data-act="share-summary">Share summary</button><button class="btn ghost" data-act="ics">Add due dates to calendar</button></div><p class="notice" style="margin-top:12px">Medicines such as antimalarials need a prescription. Check your insurance covers the countries and activities on this trip.</p>`;
    return h + disclaimer;
  }

  function viewTimeline(t) {
    const pr = progress(t), ms = timeline(t, pr.items), now = today(), ch = S.checks[t.id] || {};
    let cur = ms.findIndex((m, i) => now < (ms[i + 1] ? ms[i + 1].date : "9999")); if (now < ms[0].date) cur = -1;
    let h = appbar("Pre-travel timeline", "dash", `<span class="small muted num">dep ${fmtShort(t.depart)}</span>`) + `<div class="tl" style="margin-top:8px">`;
    ms.forEach((m, i) => {
      const lateAny = m.items.some((it) => it.due && it.due < now && !ch[it.id]);
      h += `<div class="tl-item ${i < cur ? "past" : ""} ${i === cur ? "now" : ""} ${lateAny ? "late" : ""}"><div class="tl-date num">${fmt(m.date)}${i === cur ? `<span class="here">You are here</span>` : ""}</div><h3>${m.title}</h3>${m.items.length ? `<ul class="small" style="margin:6px 0 0;padding-left:18px">${m.items.map((it) => `<li style="${ch[it.id] ? "text-decoration:line-through;color:var(--muted)" : ""}">${esc(it.text)}${it.due && it.g !== "after" ? ` <span class="num muted">(by ${fmtShort(it.due)})</span>` : ""}</li>`).join("")}</ul>` : `<p class="small muted">Nothing due.</p>`}</div>`;
    });
    h += `</div>`;
    if (ms.some((m) => m.items.some((it) => it.due && it.due < now && !ch[it.id]))) h += `<div class="banner warn">Some items are past their ideal date, often because the trip was planned at short notice. Do them now: it is often not too late. Speak to a travel-medicine doctor this week.</div>`;
    return h + disclaimer;
  }

  function viewEmergency(t) {
    const visited = t ? t.stops.filter((s) => s.kind !== "transit-short") : [];
    const my = S.emergency || {};
    let h = appbar("Emergency help", t ? "dash" : "home-back") + `<div class="stack"><div class="banner req"><span>In a medical emergency, call local emergency services first.</span></div>`;
    if (!t) h += `<p class="notice">Add a trip to see verified local emergency numbers and Indian mission contacts for your destination.</p><button class="btn" data-act="new-trip">Plan a trip</button>`;
    visited.forEach((s) => {
      const p = C.packs[s.country];
      h += `<div class="section-title"><h2>${esc(cname(s.country))}</h2></div>`;
      if (p && p.emergency) h += p.emergency.map((e) => `<div class="card tight"><div class="spread"><b class="small">${esc(e.label)}</b>${e.status === "verified" ? "" : e.status === "conflicting" ? `<span class="lbl lbl-alert">Conflicting sources</span>` : lbl("unverified")}</div>${e.numbers.length ? `<p class="num" style="margin-top:4px;font:600 1.05rem var(--font-display)">${e.numbers.map(esc).join(" · ")}</p><div class="row" style="margin-top:6px">${e.numbers.map((n) => `<a class="btn sm" href="tel:${n.replace(/[^+\d]/g, "")}">Call ${esc(n)}</a>`).join("")}<button class="btn sm ghost" data-act="copy" data-text="${esc(e.numbers.join(", "))}">Copy</button></div>` : ""}${e.note ? `<p class="tiny muted" style="margin-top:6px">${esc(e.note)}</p>` : ""}${e.src ? `<div style="margin-top:6px">${srcChip(e.src)}</div>` : ""}</div>`).join("");
      else h += `<div class="card tight"><b class="small">Indian mission in ${esc(cname(s.country))}</b><p class="small" style="margin-top:4px">${lbl("unverified")} Contact numbers for this country are not yet verified in the app.</p><p class="small" style="margin-top:6px">Find the embassy or consulate in the Ministry of External Affairs directory.</p><div style="margin-top:6px">${srcChip("mea-missions")}</div></div><div class="card tight"><b class="small">Local emergency number</b><p class="small" style="margin-top:4px">${lbl("unverified")}</p></div>`;
    });
    h += `<div class="section-title"><h2>Always available</h2></div><div class="card tight"><b class="small">MADAD: Ministry of External Affairs consular help portal</b><p class="small muted" style="margin-top:4px">For Indians abroad needing consular assistance (not visa or passport queries).</p><div style="margin-top:6px">${srcChip("mea-madad")}</div></div>`;
    h += `<div class="section-title"><h2>Your own contacts</h2><span class="tiny muted">saved on this device</span></div><div class="card"><div class="stack"><label class="f" for="em-ins">Insurer assistance line<input id="em-ins" type="text" value="${esc(my.ins || "")}" data-on="em" data-k="ins" placeholder="From your policy document"></label><label class="f" for="em-con">Emergency contact (name and number)<input id="em-con" type="text" value="${esc(my.con || "")}" data-on="em" data-k="con"></label></div></div>`;
    h += `<details class="grp" style="margin-top:10px"><summary>What to tell a doctor</summary><div class="small" style="padding-bottom:12px">${t ? `Countries: ${esc(tripTitle(t))}. Dates: ${fmt(t.depart)} to ${fmt(t.ret)}. Vaccines marked as received: ${esc(Object.entries(S.vacc[t.id] || {}).filter(([, v]) => v === "have").map(([k]) => k).join(", ") || "none recorded")}. Mention any antimalarial tablets you are taking.` : "Add a trip to fill this in."}</div></details>`;
    h += `<details class="grp"><summary>Red-flag symptoms</summary><ul class="small" style="padding:0 0 12px 18px;margin:0"><li>Fever during or after travel to a malaria area</li><li>Unexplained bleeding or bruising</li><li>Difficulty breathing, confusion, stiff neck</li><li>Severe or bloody diarrhoea, signs of dehydration</li><li>Any animal bite or scratch (rabies risk)</li></ul></details>`;
    return h + `</div>` + disclaimer;
  }


  /* ---------- Personal Health Brief, climate and evaluation ---------- */
  const EMERGENCY_SYMPTOMS = [
    ["breathless", "Severe breathlessness"],
    ["speaking", "Difficulty speaking"],
    ["blue_lips", "Blue lips"],
    ["confusion", "Confusion"],
    ["collapse", "Collapse or fainting"],
    ["chest_pain", "Severe chest pain"],
    ["heat_confusion_collapse", "Heat symptoms with confusion or collapse"],
  ];

  function briefStore(tid) {
    if (!S.brief || typeof S.brief !== "object") S.brief = {};
    if (!S.brief[tid] || typeof S.brief[tid] !== "object") S.brief[tid] = { medicines: "", conditions: "", allergies: "", ageGroup: (S.profile && S.profile.age) || "adult", pregnant: false, foodStyle: "", stayStyle: "", climate: {}, last: null };
    const b = S.brief[tid];
    if (!b.climate || typeof b.climate !== "object") b.climate = {};
    return b;
  }
  function clearBriefDetails(tid) {
    S.brief[tid] = { medicines: "", conditions: "", allergies: "", ageGroup: (S.profile && S.profile.age) || "adult", pregnant: false, foodStyle: "", stayStyle: "", climate: {}, last: null };
    save();
  }
  function splitLines(v) { return String(v == null ? "" : v).split(/\n|,|;/).map((s) => s.trim()).filter(Boolean); }
  function briefInputFromStore(t, b) {
    return { medicines: splitLines(b.medicines), conditions: splitLines(b.conditions), allergies: splitLines(b.allergies), ageGroup: b.ageGroup || (S.profile && S.profile.age) || "adult", pregnant: !!b.pregnant, foodStyle: b.foodStyle || "", stayStyle: b.stayStyle || "", climate: b.climate || {} };
  }
  function climateCuratedForCountry(id) {
    const CL = window.CLIMATE || {}; const places = CL.places || {};
    if (places[id]) return places[id];
    return null;
  }
  function cpcbCategory(aqi) {
    if (aqi == null || aqi === "" || !Number.isFinite(Number(aqi))) return null;
    const v = Number(aqi);
    const cats = (((window.CLIMATE || {}).cpcb || {}).categories || []);
    for (const c of cats) {
      const m = String(c.range).match(/(\d+)\s*-\s*(\d+|\+)/);
      if (!m) continue;
      const lo = Number(m[1]), hi = m[2] === "+" ? Infinity : Number(m[2]);
      if (v >= lo && v <= hi) return c.name;
    }
    if (v > 500) return "Severe";
    return null;
  }
  function heatBand(tempC, humidityPct, heatCategory) {
    const hc = String(heatCategory || "").toLowerCase();
    if (/very high|extreme|severe/.test(hc)) return "Very high";
    if (/high/.test(hc)) return "High";
    if (/moderate|medium/.test(hc)) return "Moderate";
    if (/low|mild|cool/.test(hc)) return "Low";
    const t = tempC == null || tempC === "" ? null : Number(tempC);
    const h = humidityPct == null || humidityPct === "" ? null : Number(humidityPct);
    if (t == null || !Number.isFinite(t)) return heatCategory ? String(heatCategory) : "not available";
    let score = 0;
    if (t >= 40) score = 3; else if (t >= 35) score = 2; else if (t >= 30) score = 1; else score = 0;
    if (h != null && Number.isFinite(h) && h >= 60 && t >= 30) score += 1;
    return score >= 3 ? "Very high" : score === 2 ? "High" : score === 1 ? "Moderate" : "Low";
  }
  function isIndianContext(t, climate) {
    const stops = (t && t.stops) || [];
    if (stops.some((s) => s.country === "india")) return true;
    const place = String((climate && (climate.place || climate.label)) || "").toLowerCase();
    return /india|delhi|mumbai|kolkata|chennai|bengaluru|bangalore|hyderabad|pune|ahmedabad/.test(place);
  }
  function hasAsthmaCopd(profile, inp) {
    if (profile && profile.asthmaCopd) return true;
    if (inp && inp.climate && inp.climate.asthmaCopd) return true;
    const cond = ((inp && inp.conditions) || []).join(" ").toLowerCase();
    return /asthma|copd|chronic obstructive|bronch/.test(cond);
  }
  function computeClimateScore(profile, climate, trip) {
    const c = climate || {};
    const breakdown = [];
    let total = 0;
    const symptoms = Array.isArray(c.symptoms) ? c.symptoms : [];
    const emergencyReasons = [];
    if (symptoms.includes("breathless")) emergencyReasons.push("Severe breathlessness");
    if (symptoms.includes("speaking")) emergencyReasons.push("Difficulty speaking");
    if (symptoms.includes("blue_lips")) emergencyReasons.push("Blue lips");
    if (symptoms.includes("confusion")) emergencyReasons.push("Confusion");
    if (symptoms.includes("collapse")) emergencyReasons.push("Collapse or fainting");
    if (symptoms.includes("chest_pain")) emergencyReasons.push("Severe chest pain");
    if (symptoms.includes("heat_confusion_collapse")) emergencyReasons.push("Heat symptoms with confusion or collapse");
    const emergency = emergencyReasons.length > 0;

    const age = (profile && profile.ageGroup) || (S.profile && S.profile.age) || "adult";
    let agePts = 0;
    if (age === "infant" || age === "senior") agePts = 1;
    breakdown.push({ factor: "Age group", value: age === "infant" ? "Under 9 months" : age === "child" ? "Child" : age === "senior" ? "60+" : "18-59", points: agePts, note: agePts ? "Higher vulnerability age group (counted once)." : "Not in higher age-vulnerability group (counted once)." });
    total += agePts;

    const asthma = !!(profile && profile.asthmaCopd);
    const asthmaPts = asthma ? 2 : 0;
    breakdown.push({ factor: "Asthma/COPD", value: asthma ? "Yes" : "No / not stated", points: asthmaPts });
    total += asthmaPts;

    const smokePts = (profile && profile.smoking) ? 1 : 0;
    breakdown.push({ factor: "Smoking", value: (profile && profile.smoking) ? "Yes" : "No / not stated", points: smokePts });
    total += smokePts;

    const ohRaw = c.outdoorHours;
    const oh = (ohRaw == null || ohRaw === "") ? null : Number(ohRaw);
    let outPts = 0; let outVal = "Not provided";
    if (oh != null && Number.isFinite(oh)) {
      outVal = oh + " hours/day";
      if (oh > 6) outPts = 2; else if (oh > 2) outPts = 1; else outPts = 0;
    }
    breakdown.push({ factor: "Outdoor hours/day", value: outVal, points: outPts });
    total += outPts;

    const aqiRaw = c.aqi;
    const aqi = (aqiRaw == null || aqiRaw === "") ? null : Number(aqiRaw);
    const pm25Raw = c.pm25;
    const pm25 = (pm25Raw == null || pm25Raw === "") ? null : Number(pm25Raw);
    const indian = isIndianContext(trip, c);
    let aqiPts = 0; let aqiCat = c.aqiCategory || null; let scaleNote = "";
    if (aqi != null && Number.isFinite(aqi)) {
      if (indian) { aqiCat = cpcbCategory(aqi) || aqiCat; scaleNote = "CPCB AQI"; }
      else { scaleNote = c.scale ? String(c.scale) : "Scale/source not verified in this app"; }
      const cat = String(aqiCat || "").toLowerCase();
      if (/severe/.test(cat)) aqiPts = 4;
      else if (/very poor/.test(cat)) aqiPts = 3;
      else if (/poor/.test(cat)) aqiPts = 2;
      else if (/moderate/.test(cat)) aqiPts = 1;
      else if (aqi > 400) aqiPts = 4;
      else if (aqi > 300) aqiPts = 3;
      else if (aqi > 200) aqiPts = 2;
      else if (aqi > 100) aqiPts = 1;
      else aqiPts = 0;
      const aqiVal = aqi + (aqiCat ? " (" + aqiCat + ")" : "") + (scaleNote ? " - " + scaleNote : "");
      breakdown.push({ factor: "AQI", value: aqiVal, points: aqiPts, note: "AQI points counted once. PM2.5 not double-counted with AQI." });
      total += aqiPts;
    } else if (pm25 != null && Number.isFinite(pm25)) {
      breakdown.push({ factor: "AQI", value: "Not available", points: 0, note: "PM2.5 provided (" + pm25 + ") but AQI not provided; PM2.5 not used as AQI points to avoid double-counting." });
    } else {
      breakdown.push({ factor: "AQI", value: "Not available", points: 0, note: "No AQI provided (counted once)." });
    }

    const hb = heatBand(c.tempC, c.humidityPct, c.heatCategory);
    let heatPts = 0;
    if (/very high/i.test(hb)) heatPts = 2; else if (/high/i.test(hb)) heatPts = 2; else if (/moderate/i.test(hb)) heatPts = 1; else heatPts = 0;
    const heatParts = [];
    if (c.tempC != null && c.tempC !== "") heatParts.push(c.tempC + " C");
    if (c.humidityPct != null && c.humidityPct !== "") heatParts.push(c.humidityPct + "% humidity");
    if (c.heatCategory) heatParts.push(String(c.heatCategory));
    const heatVal = (heatParts.join(", ") || "Not available") + (hb !== "not available" ? " (" + hb + ")" : "");
    breakdown.push({ factor: "Heat", value: heatVal, points: heatPts });
    total += heatPts;

    let band = "Low";
    if (total >= 8) band = "Very high"; else if (total >= 5) band = "High"; else if (total >= 3) band = "Moderate"; else band = "Low";

    const anyData = (aqi != null && Number.isFinite(aqi)) || (pm25 != null && Number.isFinite(pm25)) || (c.tempC != null && c.tempC !== "") || (c.humidityPct != null && c.humidityPct !== "") || !!c.heatCategory || !!c.asOf || !!c.source || !!c.place;
    return { total, band, breakdown, emergency, emergencyReasons, illustrative: true, anyData, scale: indian ? "CPCB AQI (for Indian destinations)" : (c.scale || "Scale/source not verified in this app"), asOf: c.asOf || "", source: c.source || "", place: c.place || "" };
  }

  function doctorReasonsForInput(inp) {
    const reasons = [];
    if (inp.pregnant) reasons.push("Pregnancy (or possible pregnancy)");
    const cond = (inp.conditions || []).map((s) => String(s).toLowerCase());
    const condText = cond.join(" ");
    if (/immun|hiv|transplant|cancer|chemo|steroid|dialysis|immune/.test(condText)) reasons.push("Immunosuppression or immune-affecting condition");
    const serious = cond.some((x) => /diabetes|heart|cardiac|kidney|renal|liver|copd|asthma|epilep|hypertension|blood pressure|stroke/.test(x));
    if (serious || (inp.conditions || []).length >= 2) reasons.push("Serious or multiple chronic conditions");
    const meds = inp.medicines || [];
    if (meds.length >= 3) reasons.push("Multiple medicines (possible interactions)");
    else if (meds.length >= 2 && ((inp.conditions || []).length >= 1 || serious)) reasons.push("Multiple medicines and health conditions (possible interactions)");
    return reasons;
  }

  function ruleBasedBrief(t, inp) {
    const a = assess(t);
    const doctorReasons = doctorReasonsForInput(inp);
    const doctorNeededBase = doctorReasons.length > 0;
    const profForScore = { ageGroup: inp.ageGroup, asthmaCopd: hasAsthmaCopd(null, inp), smoking: !!(inp.climate && inp.climate.smoking) };
    const climateScore = computeClimateScore(profForScore, inp.climate || {}, t);
    const emergency = !!climateScore.emergency;
    const doctorNeeded = doctorNeededBase || emergency;
    const brief = {
      doctor_needed: doctorNeeded,
      doctor_reason: emergency ? "Emergency symptoms reported. Seek emergency care now. This needs a doctor. Do not rely on this brief." : (doctorNeededBase ? "This needs a doctor. Do not rely on this brief. Reasons: " + doctorReasons.join("; ") + "." : ""),
      emergency_now: emergency,
      emergency_reason: emergency ? "Seek emergency care now. Reported: " + climateScore.emergencyReasons.join(", ") + "." : "",
      summary: emergency ? "Emergency symptoms reported. Seek emergency care now. This brief does not replace urgent medical care." : "Rule-based personal health brief generated from your trip and this app's verified destination data. It does not replace a doctor or pharmacist.",
      trip_risks: a.risks.filter((r) => r.country).slice(0, 10).map((r) => ({ item: r.name, why: r.prevent, source: r.src === "ith" ? "WHO ITH 2022" : (C.sources[r.src] ? C.sources[r.src].pub : String(r.src || "App data")) })),
      vaccine_entry_notes: [
        ...a.must.slice(0, 8).map((m) => ({ item: m.title, detail: m.body || "", source: (m.src && C.sources[m.src]) ? C.sources[m.src].pub : (m.src || "WHO ITH 2022 / MoHFW") })),
        ...a.entry.filter((e) => e.label === "required" || e.label === "check").slice(0, 4).map((e) => ({ item: e.title, detail: e.body || "", source: "WHO ITH 2022" }))
      ],
      personal_factors: [],
      climate_air: {},
      not_verified: ["Not verified: ask a doctor or pharmacist."],
      actions: [],
      disclaimer: "General travel-health information from official sources. It does not replace a consultation with a qualified travel-medicine doctor, who will advise on your health, medicines and itinerary."
    };

    if (inp.pregnant) brief.personal_factors.push({ factor: "Pregnancy", note: "Pregnancy can change vaccine and medicine safety. This needs a doctor. Do not rely on this brief. Discuss with a qualified doctor before travel." });
    (inp.conditions || []).slice(0, 10).forEach((x) => brief.personal_factors.push({ factor: "Condition", note: x + ". Discuss travel risks and medicines with a doctor. No dose or medicine change advice is provided here." }));
    (inp.allergies || []).slice(0, 10).forEach((x) => brief.personal_factors.push({ factor: "Allergy", note: x + ". Tell your doctor and vaccination centre. No dose advice is provided here." }));
    (inp.medicines || []).slice(0, 10).forEach((x) => brief.personal_factors.push({ factor: "Medicine", note: x + ". Carry prescriptions and generic names. Do not start, stop, or change any medicine without a doctor or pharmacist." }));
    if (!brief.personal_factors.length) brief.personal_factors.push({ factor: "Personal details", note: "No personal health details entered. Add them if you want a more tailored discussion with your doctor." });

    const clim = inp.climate || {};
    const climAvail = climateScore.anyData;
    const scaleSrc = [climateScore.scale || (isIndianContext(t, clim) ? "CPCB AQI" : "Scale/source not verified"), clim.asOf || climateScore.asOf ? "as of " + (clim.asOf || climateScore.asOf) : "", clim.source || climateScore.source || ""].filter(Boolean).join(" | ");
    if (emergency) {
      brief.climate_air = {
        available: climAvail,
        summary: "Emergency symptoms reported. Seek emergency care now. Symptom severity is separate from the illustrative vulnerability score.",
        score_explanation: "Illustrative vulnerability score: " + climateScore.band + " (" + climateScore.total + " points), not clinically validated. " + climateScore.breakdown.map((b) => b.factor + ": " + b.value + " (+" + b.points + ")").join("; ") + ".",
        exposure_reduction: ["Move to a safer/cooler place if heat-related and seek urgent medical help now.", "Do not delay emergency care."],
        when_to_see_doctor: ["Seek emergency care now."],
        source_note: scaleSrc || "Not available"
      };
      brief.actions = ["Seek emergency care now.", "Call local emergency services or go to the nearest emergency department.", "Do not rely on this brief for emergency symptoms."];
    } else {
      const reductions = [];
      if (climateScore.total >= 3 || /poor|very poor|severe|moderate/i.test(String(cpcbCategory(clim.aqi) || clim.aqiCategory || ""))) reductions.push("Limit outdoor exertion when air quality is poor; follow local advisories and consider a well-fitted mask if locally advised.");
      if (/high|very/i.test(heatBand(clim.tempC, clim.humidityPct, clim.heatCategory))) reductions.push("Avoid midday heat, drink safe fluids regularly, and rest in shade or a cool place.");
      reductions.push("Follow existing trip precautions for mosquitoes, food and water, and hygiene.");
      const seeDoc = ["See a doctor before travel if you have chronic illness, are pregnant, take multiple medicines, or have concerns about heat or air exposure."];
      if (hasAsthmaCopd(profForScore, inp) || (inp.conditions || []).some((x) => /heart|lung|breath|cardiac/i.test(x))) seeDoc.push("If you have breathing, heart, or lung conditions, ask a doctor how to manage symptoms during travel, poor air quality, or heat.");
      seeDoc.push("Seek urgent care for severe or worsening symptoms (for example trouble breathing, chest pain, confusion, or collapse).");
      brief.climate_air = {
        available: climAvail,
        summary: climAvail ? ("Climate/air inputs recorded. Illustrative vulnerability score: " + climateScore.band + " (" + climateScore.total + " points), not clinically validated. No diagnosis or disease probability is provided.") : "Climate and air data: not available. Use existing rule-based advice for heat, mosquitoes, food and water, and seek local official updates if needed.",
        score_explanation: climateScore.breakdown.map((b) => b.factor + ": " + b.value + " (+" + b.points + ")" + (b.note ? " [" + b.note + "]" : "")).join("; "),
        exposure_reduction: reductions,
        when_to_see_doctor: seeDoc,
        source_note: climAvail ? (scaleSrc || "Not available") : "Not available"
      };
      brief.actions = [
        "Review required/recommended vaccines and certificates for this trip and discuss them with a travel-medicine doctor.",
        a.must.length ? "Complete legal/entry requirements before travel dates where applicable." : "Confirm entry and health requirements with official sources before travel.",
        "Carry prescriptions and medicines in original packs with generic names. Do not start, stop, or change medicine without a doctor or pharmacist."
      ];
      if (!climAvail) brief.not_verified.push("Climate and air data: not available in this app snapshot/manual input. Use local official sources if needed.");
    }

    if (doctorNeeded) brief.not_verified.push("Personal medical safety and interactions: not verified. Ask a doctor or pharmacist.");
    brief._score = climateScore;
    return brief;
  }

  function buildBriefContext(t, inp, a) {
    const stops = a.stops.map((s) => ({ country: s.country, name: s.c.name, kind: s.kind, regions: s.regions || [] }));
    const packs = a.stops.filter((s) => s.kind !== "transit-short" && C.packs[s.country]).map((s) => {
      const p = C.packs[s.country];
      return { country: s.country, verified: p.verified, must: (p.must || []).map((m) => ({ title: m.title || m.key, body: m.body || "", src: m.src })), notes: (p.notes || []).map((n) => ({ title: n.title, body: n.body, src: n.src })), vaccines: (p.vaccines || []).map((v) => ({ name: v.name, label: v.label, why: v.why, src: v.src })), risks: (p.risks || []).map((r) => ({ name: r.name, where: r.where, prevent: r.prevent, src: r.src })) };
    });
    return {
      checkedOn: C.checkedOn,
      trip: { stops, depart: t.depart, ret: t.ret, type: t.type || "" },
      assessment: {
        must: a.must.map((m) => ({ title: m.title, body: m.body, due: m.due, label: m.label, src: m.src || "who-ith-2022" })),
        entry: a.entry.map((e) => ({ title: e.title, body: e.body, label: e.label, country: e.stop && e.stop.country, year: e.year })),
        vaccines: a.vaccines.map((v) => ({ name: v.name, labels: v.labels, why: v.why, src: v.src })),
        risks: a.risks.map((r) => ({ name: r.name, where: r.where, prevent: r.prevent, route: r.route, country: r.country || null, src: r.src })),
        alerts: a.alerts.map((x) => ({ disease: x.disease, status: x.status, summary: x.summary, country: x.country, type: x.type, asOf: x.asOf, sources: x.sources }))
      },
      packs,
      climate: inp.climate || null,
      climateScore: computeClimateScore({ ageGroup: inp.ageGroup, asthmaCopd: hasAsthmaCopd(null, inp), smoking: !!(inp.climate && inp.climate.smoking) }, inp.climate || {}, t),
      disclaimer: disclaimer.replace(/<[^>]+>/g, "")
    };
  }

  function renderScoreBreakdown(score) {
    if (!score) return "";
    return '<div class="card tight"><div class="spread"><h3>Climate/air vulnerability score</h3><span class="lbl ' + (score.band === "Very high" || score.band === "High" ? "lbl-alert" : score.band === "Moderate" ? "lbl-consider" : "lbl-recommended") + '">' + esc(score.band) + ' · ' + score.total + ' pts</span></div>'
      + '<p class="tiny muted" style="margin-top:6px">Illustrative, not clinically validated. Transparent rule-based score. Symptom severity is separate from the score.</p>'
      + '<div class="list" style="margin-top:8px">' + score.breakdown.map((b) => '<div class="li"><span class="small" style="flex:1"><b>' + esc(b.factor) + '</b><br><span class="muted">' + esc(b.value) + '</span>' + (b.note ? '<br><span class="tiny muted">' + esc(b.note) + '</span>' : '') + '</span><span class="num small"><b>+' + b.points + '</b></span></div>').join("") + '</div></div>';
  }

  function renderBriefBlock(res, meta) {
    const r = res || {};
    const emergency = r.emergency_now === true;
    const doctorNeeded = r.doctor_needed === true || emergency;
    let h = "";
    if (meta && meta.loading) return '<div class="card ai-loading"><div class="ai-pulse"></div><h3>Generating personal health brief...</h3><p class="small muted" style="margin-top:6px">Using your trip and app destination data only. Health details stay in this browser and are not stored on the server.</p></div>';
    if (meta && meta.fallback) h += '<div class="banner warn"><b>' + esc(meta.fallbackReason || "AI unavailable") + '</b><span>Showing rule-based brief from your trip and app data. ' + esc(meta.stateNote || "") + '</span></div>';
    if (!res) return h;
    if (!meta || !meta.fallback) h += '<div class="notice ai-note"><b>AI Personal Health Brief</b><span>Generated from your trip and app data. This is not medical advice and model output is not clinically reviewed. Compare with <b>Show rule-based brief</b> and consult a real doctor or pharmacist when needed.</span></div>';
    if (emergency) h += '<div class="banner req" style="flex-direction:column;gap:4px"><b>Seek emergency care now</b><span>' + esc(r.emergency_reason || "Emergency symptoms reported. Seek emergency care now.") + '</span></div>';
    if (doctorNeeded) h += '<div class="banner req" style="flex-direction:column;gap:4px"><b>This needs a doctor. Do not rely on this brief.</b><span>' + esc(r.doctor_reason || "Discuss with a qualified doctor or pharmacist before travel.") + '</span></div>';
    if (r.summary) h += '<div class="card"><h3>Summary</h3><p class="small" style="margin-top:6px">' + esc(r.summary) + '</p></div>';
    if (Array.isArray(r.trip_risks) && r.trip_risks.length) h += '<div class="card"><h3>Trip risks (from app data)</h3><div class="list">' + r.trip_risks.map((x) => '<div class="li"><div class="stack" style="gap:2px"><b class="small">' + esc(x.item || "") + '</b><span class="small">' + esc(x.why || "") + '</span><span class="tiny muted">' + esc(x.source || "") + '</span></div></div>').join("") + '</div></div>';
    if (Array.isArray(r.vaccine_entry_notes) && r.vaccine_entry_notes.length) h += '<div class="card"><h3>Vaccines and entry notes (from app data)</h3><div class="list">' + r.vaccine_entry_notes.map((x) => '<div class="li"><div class="stack" style="gap:2px"><b class="small">' + esc(x.item || "") + '</b><span class="small">' + esc(x.detail || "") + '</span><span class="tiny muted">' + esc(x.source || "") + '</span></div></div>').join("") + '</div></div>';
    if (Array.isArray(r.personal_factors) && r.personal_factors.length) h += '<div class="card"><h3>Personal factors</h3><div class="list">' + r.personal_factors.map((x) => '<div class="li"><div class="stack" style="gap:2px"><b class="small">' + esc(x.factor || "") + '</b><span class="small">' + esc(x.note || "") + '</span></div></div>').join("") + '</div><p class="tiny muted" style="margin-top:8px">No doses or medicine start/stop/change advice is provided. Ask a doctor or pharmacist.</p></div>';
    if (r.climate_air && typeof r.climate_air === "object") {
      const ca = r.climate_air;
      h += '<div class="card"><h3>Climate and air</h3><p class="small" style="margin-top:6px">' + esc(ca.summary || (ca.available ? "Available." : "Climate and air data: not available.")) + '</p>';
      if (ca.score_explanation) h += '<p class="small" style="margin-top:6px"><b>Score explanation:</b> ' + esc(ca.score_explanation) + '</p>';
      if (Array.isArray(ca.exposure_reduction) && ca.exposure_reduction.length) h += '<p class="small" style="margin-top:8px"><b>Exposure reduction:</b></p><ul class="small" style="margin:4px 0 0;padding-left:18px">' + ca.exposure_reduction.map((x) => '<li>' + esc(x) + '</li>').join("") + '</ul>';
      if (Array.isArray(ca.when_to_see_doctor) && ca.when_to_see_doctor.length) h += '<p class="small" style="margin-top:8px"><b>When to see a doctor:</b></p><ul class="small" style="margin:4px 0 0;padding-left:18px">' + ca.when_to_see_doctor.map((x) => '<li>' + esc(x) + '</li>').join("") + '</ul>';
      h += '<p class="tiny muted" style="margin-top:8px">' + esc(ca.source_note || "Source/date: not available") + '</p></div>';
    }
    if (Array.isArray(r.actions) && r.actions.length) h += '<div class="card"><h3>Actions</h3><ul class="small" style="margin:6px 0 0;padding-left:18px">' + r.actions.map((x) => '<li>' + esc(x) + '</li>').join("") + '</ul></div>';
    if (Array.isArray(r.not_verified) && r.not_verified.length) h += '<div class="notice"><b>Not verified / limits</b><ul class="small" style="margin:6px 0 0;padding-left:18px">' + r.not_verified.map((x) => '<li>' + esc(x) + '</li>').join("") + '</ul></div>';
    h += '<p class="foot">' + esc(r.disclaimer || "General travel-health information from official sources. It does not replace a consultation with a qualified travel-medicine doctor, who will advise on your health, medicines and itinerary.") + '</p>';
    return h;
  }

  function viewBrief(t) {
    const b = briefStore(t.id);
    const inp = briefInputFromStore(t, b);
    const score = computeClimateScore({ ageGroup: inp.ageGroup, asthmaCopd: hasAsthmaCopd(null, inp), smoking: !!(inp.climate && inp.climate.smoking) }, inp.climate || {}, t);
    const curated = climateCuratedForCountry((t.stops[0] || {}).country);
    const st = (ui.briefState && ui.briefState.tripId === t.id) ? ui.briefState : { status: "idle" };
    let resultHtml = "";
    if (st.status === "loading") resultHtml = renderBriefBlock(null, { loading: true });
    else if (st.status === "error") resultHtml = renderBriefBlock(st.result, { fallback: true, fallbackReason: st.error || "AI unavailable or invalid.", stateNote: "AI response was not used." });
    else if (st.status === "ok" && st.result) resultHtml = renderBriefBlock(st.result, { fallback: !!st.fallback, fallbackReason: st.fallbackReason, stateNote: st.stateNote || "" });
    else if (b.last && b.last.result) resultHtml = renderBriefBlock(b.last.result, { fallback: !!b.last.fallback, fallbackReason: b.last.fallbackReason || "" });

    let h = appbar("Personal Health Brief", "dash") + '<div class="stack">';
    h += '<p class="notice"><b>Grounded brief.</b> Uses your trip and this app\'s verified destination data only. Health details stay in this browser and are not stored on the server. This is not medical advice and model output is not clinically reviewed.</p>';
    if (score.emergency) h += '<div class="banner req" style="flex-direction:column;gap:4px"><b>Seek emergency care now</b><span>Emergency symptoms selected: ' + esc(score.emergencyReasons.join(", ")) + '. Emergency care comes first - the app shows urgent guidance and a rule-based brief for this case.</span></div>';
    h += '<div class="card"><h3>Your trip</h3><p class="small" style="margin-top:6px"><b>' + esc(tripTitle(t)) + '</b></p><p class="small muted num">' + fmt(t.depart) + ' to ' + fmt(t.ret) + '</p><p class="tiny muted" style="margin-top:4px">Trip context is taken from the app\'s destination data and rules.</p></div>';

    h += '<div class="card"><h3>Personal details (optional, browser-only)</h3><div class="stack" style="margin-top:10px">'
      + '<label class="f" for="bh-cond">Conditions<textarea id="bh-cond" rows="2" data-on="brief" data-k="conditions" data-tid="' + esc(t.id) + '" placeholder="e.g. asthma, diabetes (one per line or comma-separated)">' + esc(b.conditions || "") + '</textarea></label>'
      + '<label class="f" for="bh-all">Allergies<textarea id="bh-all" rows="2" data-on="brief" data-k="allergies" data-tid="' + esc(t.id) + '" placeholder="e.g. egg allergy, penicillin">' + esc(b.allergies || "") + '</textarea></label>'
      + '<label class="f" for="bh-med">Medicines<textarea id="bh-med" rows="2" data-on="brief" data-k="medicines" data-tid="' + esc(t.id) + '" placeholder="Medicine names (no doses needed)">' + esc(b.medicines || "") + '</textarea></label>'
      + '<div class="row" style="flex-wrap:nowrap"><label class="f" style="flex:1" for="bh-age">Age group<select id="bh-age" data-on="brief" data-k="ageGroup" data-tid="' + esc(t.id) + '">' + [["infant","Under 9 months"],["child","Child"],["adult","18-59"],["senior","60+"]].map(([k,l]) => '<option value="' + k + '" ' + (inp.ageGroup===k?"selected":"") + '>' + l + '</option>').join("") + '</select></label><label class="f" style="flex:1" for="bh-preg">Pregnancy<select id="bh-preg" data-on="brief" data-k="pregnant" data-tid="' + esc(t.id) + '"><option value="no" ' + (!inp.pregnant?"selected":"") + '>No / not stated</option><option value="yes" ' + (inp.pregnant?"selected":"") + '>Yes or possible</option></select></label></div>'
      + '<div class="row" style="flex-wrap:nowrap"><label class="f" style="flex:1" for="bh-food">Food style<input id="bh-food" type="text" data-on="brief" data-k="foodStyle" data-tid="' + esc(t.id) + '" value="' + esc(b.foodStyle || "") + '" placeholder="e.g. street food, hotel"></label><label class="f" style="flex:1" for="bh-stay">Stay style<input id="bh-stay" type="text" data-on="brief" data-k="stayStyle" data-tid="' + esc(t.id) + '" value="' + esc(b.stayStyle || "") + '" placeholder="e.g. city, rural, camping"></label></div>'
      + '</div></div>';

    h += '<div class="card"><h3>Climate and air exposure (manual / curated)</h3>'
      + '<p class="small muted" style="margin-top:6px">No live AQI or weather APIs are used. Enter values manually or use curated data if available. If unavailable, the app will show "not available" and use existing rule-based advice.</p>';
    if (curated) h += '<div class="notice" style="margin-top:8px"><b>Curated snapshot:</b> ' + esc(curated.label || "") + '. ' + esc(curated.note || "") + ' <span class="tiny muted">As of ' + esc(curated.asOf || "n/a") + ' | ' + esc(curated.source || "") + '</span></div>';
    else h += '<p class="tiny muted" style="margin-top:8px">Curated snapshot for this destination: not available.</p>';
    const symSel = Array.isArray(inp.climate.symptoms) ? inp.climate.symptoms : [];
    h += '<div class="stack" style="margin-top:10px">'
      + '<div class="row" style="flex-wrap:nowrap"><label class="f" style="flex:1" for="bh-aqi">AQI<input id="bh-aqi" type="text" inputmode="numeric" data-on="brief" data-k="climate.aqi" data-tid="' + esc(t.id) + '" value="' + esc(inp.climate.aqi == null ? "" : inp.climate.aqi) + '" placeholder="e.g. 180"></label><label class="f" style="flex:1" for="bh-pm">PM2.5<input id="bh-pm" type="text" inputmode="decimal" data-on="brief" data-k="climate.pm25" data-tid="' + esc(t.id) + '" value="' + esc(inp.climate.pm25 == null ? "" : inp.climate.pm25) + '" placeholder="e.g. 90"></label></div>'
      + '<div class="row" style="flex-wrap:nowrap"><label class="f" style="flex:1" for="bh-temp">Temp (C)<input id="bh-temp" type="text" inputmode="decimal" data-on="brief" data-k="climate.tempC" data-tid="' + esc(t.id) + '" value="' + esc(inp.climate.tempC == null ? "" : inp.climate.tempC) + '" placeholder="e.g. 38"></label><label class="f" style="flex:1" for="bh-hum">Humidity (%)<input id="bh-hum" type="text" inputmode="decimal" data-on="brief" data-k="climate.humidityPct" data-tid="' + esc(t.id) + '" value="' + esc(inp.climate.humidityPct == null ? "" : inp.climate.humidityPct) + '" placeholder="e.g. 70"></label></div>'
      + '<label class="f" for="bh-heat">Heat category<select id="bh-heat" data-on="brief" data-k="climate.heatCategory" data-tid="' + esc(t.id) + '"><option value="">Not specified</option>' + ["Low","Moderate","High","Very high"].map((x) => '<option value="' + x + '" ' + (String(inp.climate.heatCategory||"")===x?"selected":"") + '>' + x + '</option>').join("") + '</select></label>'
      + '<div class="row" style="flex-wrap:nowrap"><label class="f" style="flex:1" for="bh-out">Outdoor hours/day<input id="bh-out" type="text" inputmode="decimal" data-on="brief" data-k="climate.outdoorHours" data-tid="' + esc(t.id) + '" value="' + esc(inp.climate.outdoorHours == null ? "" : inp.climate.outdoorHours) + '" placeholder="e.g. 5"></label><label class="f" style="flex:1" for="bh-scale">AQI scale/source<input id="bh-scale" type="text" data-on="brief" data-k="climate.scale" data-tid="' + esc(t.id) + '" value="' + esc(inp.climate.scale || (isIndianContext(t, inp.climate) ? "CPCB AQI" : "")) + '" placeholder="' + (isIndianContext(t, inp.climate) ? "CPCB AQI" : "Scale/source (if known)") + '"></label></div>'
      + '<div class="row" style="flex-wrap:nowrap"><label class="f" style="flex:1" for="bh-asof">As of<input id="bh-asof" type="text" data-on="brief" data-k="climate.asOf" data-tid="' + esc(t.id) + '" value="' + esc(inp.climate.asOf || "") + '" placeholder="YYYY-MM-DD or date"></label><label class="f" style="flex:1" for="bh-src">Source<input id="bh-src" type="text" data-on="brief" data-k="climate.source" data-tid="' + esc(t.id) + '" value="' + esc(inp.climate.source || "") + '" placeholder="e.g. CPCB / local bulletin"></label></div>'
      + '<label class="f" for="bh-place">Place label<input id="bh-place" type="text" data-on="brief" data-k="climate.place" data-tid="' + esc(t.id) + '" value="' + esc(inp.climate.place || (curated ? curated.label : "")) + '" placeholder="City or area"></label>'
      + '<label class="toggle" for="bh-smoke"><span><span class="small">Smoking</span><br><span class="tiny muted">Used in illustrative vulnerability score</span></span><input class="switch" type="checkbox" id="bh-smoke" ' + (inp.climate.smoking ? "checked" : "") + ' data-on="brief" data-k="climate.smoking" data-tid="' + esc(t.id) + '"></label>'
      + '<label class="toggle" for="bh-asthma"><span><span class="small">Asthma or COPD</span><br><span class="tiny muted">Used in illustrative vulnerability score</span></span><input class="switch" type="checkbox" id="bh-asthma" ' + (inp.climate.asthmaCopd ? "checked" : "") + ' data-on="brief" data-k="climate.asthmaCopd" data-tid="' + esc(t.id) + '"></label>'
      + '<div><p class="small" style="font-weight:600;margin-bottom:6px">Emergency symptoms (separate from score)</p><div class="stack" style="gap:6px">' + EMERGENCY_SYMPTOMS.map(([k,l]) => '<label class="toggle" for="bh-s-' + k + '"><span class="small">' + l + '</span><input class="switch" type="checkbox" id="bh-s-' + k + '" ' + (symSel.includes(k) ? "checked" : "") + ' data-on="brief" data-k="climate.symptom" data-sym="' + k + '" data-tid="' + esc(t.id) + '"></label>').join("") + '</div><p class="tiny muted" style="margin-top:6px">If any emergency symptom is selected, the app shows urgent advice to seek emergency care now and skips the AI brief.</p></div>'
      + '</div></div>';

    h += renderScoreBreakdown(score);
    h += '<div class="row"><button class="btn" data-act="brief-generate" data-id="' + esc(t.id) + '" ' + (st.status === "loading" ? "disabled" : "") + '>' + (st.status === "loading" ? "Generating..." : "Generate personal health brief") + '</button><button class="btn ghost" data-act="brief-rule" data-id="' + esc(t.id) + '">Show rule-based brief</button><button class="btn ghost" data-act="brief-clear" data-id="' + esc(t.id) + '">Clear my details</button></div>';
    h += '<p class="tiny muted">Tap <b>Generate personal health brief</b> to create an AI brief grounded in app destination data (structured JSON). If a doctor or pharmacist review is needed, the brief will clearly warn you to use the <b>rule-based brief</b> and consult a real doctor. No doses or medicine start/stop/change advice is provided.</p>';
    if (resultHtml) h += '<div class="section-title"><h2>Brief</h2></div><div class="stack">' + resultHtml + '</div>';
    return h + '</div>';
  }

  async function requestBrief(t) {
    const b = briefStore(t.id);
    const inp = briefInputFromStore(t, b);
    inp.destinationText = tripTitle(t);
    const climateScore = computeClimateScore({ ageGroup: inp.ageGroup, asthmaCopd: hasAsthmaCopd(null, inp), smoking: !!(inp.climate && inp.climate.smoking) }, inp.climate || {}, t);
    const rb = ruleBasedBrief(t, inp);
    if (climateScore.emergency) {
      ui.briefState = { tripId: t.id, status: "ok", result: rb, fallback: true, fallbackReason: "Emergency symptoms selected. AI brief skipped. Seek emergency care now." };
      b.last = { at: new Date().toISOString(), result: rb, fallback: true, fallbackReason: "Emergency symptoms selected. AI brief skipped. Seek emergency care now." };
      save(); render(); return;
    }
    ui.briefState = { tripId: t.id, status: "loading" }; render();
    try {
      const a = assess(t);
      const context = buildBriefContext(t, inp, a);
      const resp = await fetch("/api/brief", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...inp, trip: { countries: a.stops.map((s) => s.c.name), dates: t.depart + " to " + t.ret, regions: a.stops.flatMap((s) => s.regions || []), type: t.type || "" }, context }) });
      let data = null;
      try { data = await resp.json(); } catch (_) { data = null; }
      if (!resp.ok || !data || data.ok !== true || !data.brief) {
        const reason = (data && data.error) ? data.error : (!navigator.onLine ? "Offline" : "AI unavailable or invalid response");
        ui.briefState = { tripId: t.id, status: "ok", result: rb, fallback: true, fallbackReason: reason + ". Showing rule-based brief." };
        b.last = { at: new Date().toISOString(), result: rb, fallback: true, fallbackReason: reason + ". Showing rule-based brief." };
      } else {
        ui.briefState = { tripId: t.id, status: "ok", result: data.brief, fallback: false, model: data.model || "" };
        b.last = { at: new Date().toISOString(), result: data.brief, fallback: false, model: data.model || "" };
      }
    } catch (e) {
      const reason = !navigator.onLine ? "Offline" : "Network or server error";
      ui.briefState = { tripId: t.id, status: "ok", result: rb, fallback: true, fallbackReason: reason + ". Showing rule-based brief." };
      b.last = { at: new Date().toISOString(), result: rb, fallback: true, fallbackReason: reason + ". Showing rule-based brief." };
    }
    save(); render();
  }

  /* ---------- Evaluate ---------- */
  const EVAL_PROFILES = [
    { id: "p01", name: "Healthy adult, Kenya safari", needsDoctor: false, climateCase: false, emergency: false, trip: { stops: [{ country: "kenya", kind: "stay", regions: ["Nairobi city", "Maasai Mara / Narok"] }], depart: addDays(today(), 42), ret: addDays(today(), 56), type: "safari" }, inp: { conditions: [], allergies: [], medicines: [], ageGroup: "adult", pregnant: false, foodStyle: "mixed", stayStyle: "safari lodge", climate: { aqi: null, pm25: null, tempC: null, humidityPct: null, heatCategory: "Moderate", outdoorHours: 6, smoking: false, asthmaCopd: false, symptoms: [], asOf: "", source: "", scale: "Scale/source not verified in this app", place: "Kenya" } } },
    { id: "p02", name: "Pregnant traveller, UAE (doctor-needed)", needsDoctor: true, climateCase: false, emergency: false, trip: { stops: [{ country: "united-arab-emirates", kind: "stay", regions: [] }], depart: addDays(today(), 30), ret: addDays(today(), 37), type: "city" }, inp: { conditions: [], allergies: [], medicines: [], ageGroup: "adult", pregnant: true, foodStyle: "hotel", stayStyle: "city", climate: { aqi: null, pm25: null, tempC: 36, humidityPct: 55, heatCategory: "High", outdoorHours: 3, smoking: false, asthmaCopd: false, symptoms: [], asOf: "", source: "", scale: "Scale/source not verified in this app", place: "UAE" } } },
    { id: "p03", name: "Immunosuppressed with multiple medicines (doctor-needed)", needsDoctor: true, climateCase: false, emergency: false, trip: { stops: [{ country: "thailand", kind: "stay", regions: [] }], depart: addDays(today(), 21), ret: addDays(today(), 31), type: "city" }, inp: { conditions: ["Kidney transplant", "Hypertension"], allergies: ["Penicillin"], medicines: ["tacrolimus", "prednisone", "amlodipine"], ageGroup: "adult", pregnant: false, foodStyle: "street food", stayStyle: "city", climate: { aqi: null, pm25: null, tempC: 33, humidityPct: 75, heatCategory: "High", outdoorHours: 4, smoking: false, asthmaCopd: false, symptoms: [], asOf: "", source: "", scale: "Scale/source not verified in this app", place: "Thailand" } } },
    { id: "p04", name: "Senior with asthma, Delhi poor AQI (climate)", needsDoctor: false, climateCase: true, emergency: false, trip: { stops: [{ country: "india", kind: "stay", regions: [] }], depart: addDays(today(), 14), ret: addDays(today(), 20), type: "city" }, inp: { conditions: ["Asthma"], allergies: [], medicines: ["inhaler"], ageGroup: "senior", pregnant: false, foodStyle: "home-cooked", stayStyle: "city", climate: { aqi: 260, pm25: null, tempC: 32, humidityPct: 40, heatCategory: "Moderate", outdoorHours: 5, smoking: false, asthmaCopd: true, symptoms: [], asOf: "2026-11-13", source: "Manual entry (example)", scale: "CPCB AQI", place: "Delhi, India" } } },
    { id: "p05", name: "Child, coastal heat and humidity (climate)", needsDoctor: false, climateCase: true, emergency: false, trip: { stops: [{ country: "thailand", kind: "stay", regions: [] }], depart: addDays(today(), 25), ret: addDays(today(), 32), type: "family" }, inp: { conditions: [], allergies: [], medicines: [], ageGroup: "child", pregnant: false, foodStyle: "hotel", stayStyle: "beach", climate: { aqi: null, pm25: null, tempC: 35, humidityPct: 80, heatCategory: "High", outdoorHours: 6, smoking: false, asthmaCopd: false, symptoms: [], asOf: "2026-11-13", source: "Manual entry (example)", scale: "Scale/source not verified in this app", place: "Thailand coast" } } },
    { id: "p06", name: "Adult smoker, moderate AQI and long outdoor hours (climate)", needsDoctor: false, climateCase: true, emergency: false, trip: { stops: [{ country: "united-arab-emirates", kind: "stay", regions: [] }], depart: addDays(today(), 18), ret: addDays(today(), 24), type: "business" }, inp: { conditions: [], allergies: [], medicines: [], ageGroup: "adult", pregnant: false, foodStyle: "mixed", stayStyle: "city", climate: { aqi: 150, pm25: null, tempC: 39, humidityPct: 30, heatCategory: "High", outdoorHours: 7, smoking: true, asthmaCopd: false, symptoms: [], asOf: "2026-11-13", source: "Manual entry (example)", scale: "Scale/source not verified in this app", place: "UAE" } } },
    { id: "p07", name: "Senior with heat symptoms and confusion (emergency override, climate)", needsDoctor: true, climateCase: true, emergency: true, trip: { stops: [{ country: "saudi-arabia", kind: "stay", regions: ["Riyadh, Jeddah or Eastern Province"] }], depart: addDays(today(), 10), ret: addDays(today(), 16), type: "city" }, inp: { conditions: ["Hypertension"], allergies: [], medicines: ["amlodipine"], ageGroup: "senior", pregnant: false, foodStyle: "mixed", stayStyle: "city", climate: { aqi: 120, pm25: null, tempC: 42, humidityPct: 35, heatCategory: "Very high", outdoorHours: 5, smoking: false, asthmaCopd: false, symptoms: ["heat_confusion_collapse"], asOf: "2026-11-13", source: "Manual entry (example)", scale: "Scale/source not verified in this app", place: "Saudi Arabia" } } },
    { id: "p08", name: "Hajj pilgrim, routine conditions", needsDoctor: false, climateCase: false, emergency: false, trip: { stops: [{ country: "saudi-arabia", kind: "stay", regions: ["Hajj (Makkah, Mina, Arafat, Madinah)"] }], depart: addDays(today(), 50), ret: addDays(today(), 65), type: "pilgrimage" }, inp: { conditions: [], allergies: [], medicines: [], ageGroup: "adult", pregnant: false, foodStyle: "mixed", stayStyle: "pilgrimage", climate: { aqi: null, pm25: null, tempC: 38, humidityPct: 25, heatCategory: "High", outdoorHours: 8, smoking: false, asthmaCopd: false, symptoms: [], asOf: "", source: "", scale: "Scale/source not verified in this app", place: "Makkah region" } } },
    { id: "p09", name: "Traveller to Sri Lanka, dengue-season precautions", needsDoctor: false, climateCase: false, emergency: false, trip: { stops: [{ country: "sri-lanka", kind: "stay", regions: [] }], depart: addDays(today(), 28), ret: addDays(today(), 36), type: "city" }, inp: { conditions: [], allergies: [], medicines: [], ageGroup: "adult", pregnant: false, foodStyle: "street food", stayStyle: "city", climate: { aqi: null, pm25: null, tempC: 30, humidityPct: 78, heatCategory: "Moderate", outdoorHours: 5, smoking: false, asthmaCopd: false, symptoms: [], asOf: "", source: "", scale: "Scale/source not verified in this app", place: "Sri Lanka" } } },
    { id: "p10", name: "Nepal trek, altitude planning", needsDoctor: false, climateCase: false, emergency: false, trip: { stops: [{ country: "nepal", kind: "stay", regions: [] }], depart: addDays(today(), 35), ret: addDays(today(), 48), type: "city" }, inp: { conditions: [], allergies: [], medicines: [], ageGroup: "adult", pregnant: false, foodStyle: "mixed", stayStyle: "trek", climate: { aqi: null, pm25: null, tempC: 15, humidityPct: 40, heatCategory: "Low", outdoorHours: 7, smoking: false, asthmaCopd: false, symptoms: [], asOf: "", source: "", scale: "Scale/source not verified in this app", place: "Nepal" } } },
    { id: "p11", name: "UK business traveller, no climate data", needsDoctor: false, climateCase: false, emergency: false, trip: { stops: [{ country: "united-kingdom", kind: "stay", regions: [] }], depart: addDays(today(), 20), ret: addDays(today(), 26), type: "business" }, inp: { conditions: [], allergies: [], medicines: [], ageGroup: "adult", pregnant: false, foodStyle: "hotel", stayStyle: "city", climate: { aqi: null, pm25: null, tempC: null, humidityPct: null, heatCategory: "", outdoorHours: null, smoking: false, asthmaCopd: false, symptoms: [], asOf: "", source: "", scale: "", place: "" } } },
    { id: "p12", name: "Malaysia family trip, routine precautions", needsDoctor: false, climateCase: false, emergency: false, trip: { stops: [{ country: "malaysia", kind: "stay", regions: [] }], depart: addDays(today(), 40), ret: addDays(today(), 50), type: "family" }, inp: { conditions: [], allergies: ["Seafood"], medicines: [], ageGroup: "adult", pregnant: false, foodStyle: "mixed", stayStyle: "city", climate: { aqi: null, pm25: null, tempC: 31, humidityPct: 75, heatCategory: "Moderate", outdoorHours: 4, smoking: false, asthmaCopd: false, symptoms: [], asOf: "", source: "", scale: "Scale/source not verified in this app", place: "Malaysia" } } },
    { id: "p13", name: "Indonesia traveller with serious chronic conditions (doctor-needed)", needsDoctor: true, climateCase: false, emergency: false, trip: { stops: [{ country: "indonesia", kind: "stay", regions: [] }], depart: addDays(today(), 22), ret: addDays(today(), 33), type: "city" }, inp: { conditions: ["Diabetes", "Heart disease"], allergies: [], medicines: ["metformin", "aspirin"], ageGroup: "senior", pregnant: false, foodStyle: "mixed", stayStyle: "city", climate: { aqi: null, pm25: null, tempC: 32, humidityPct: 80, heatCategory: "High", outdoorHours: 3, smoking: false, asthmaCopd: false, symptoms: [], asOf: "", source: "", scale: "Scale/source not verified in this app", place: "Indonesia" } } },
    { id: "p14", name: "Singapore short trip, low-risk baseline", needsDoctor: false, climateCase: false, emergency: false, trip: { stops: [{ country: "singapore", kind: "stay", regions: [] }], depart: addDays(today(), 15), ret: addDays(today(), 19), type: "business" }, inp: { conditions: [], allergies: [], medicines: [], ageGroup: "adult", pregnant: false, foodStyle: "hotel", stayStyle: "city", climate: { aqi: null, pm25: null, tempC: 31, humidityPct: 70, heatCategory: "Moderate", outdoorHours: 3, smoking: false, asthmaCopd: false, symptoms: [], asOf: "", source: "", scale: "Scale/source not verified in this app", place: "Singapore" } } },
  ];

  function evalTripForProfile(p) { return { id: "eval-" + p.id, stops: p.trip.stops, depart: p.trip.depart, ret: p.trip.ret, type: p.trip.type || "city" }; }
  function evalRuleForProfile(p) { const t = evalTripForProfile(p); return ruleBasedBrief(t, p.inp); }
  function evalScoreStore() { if (!S.eval || typeof S.eval !== "object") S.eval = { scores: {}, results: {} }; if (!S.eval.scores || typeof S.eval.scores !== "object") S.eval.scores = {}; return S.eval.scores; }
  function evalResultStore() { if (!S.eval || typeof S.eval !== "object") S.eval = { scores: {}, results: {} }; if (!S.eval.results || typeof S.eval.results !== "object") S.eval.results = {}; return S.eval.results; }
  function evalScoreRow(pid) {
    const all = evalScoreStore();
    if (!all[pid]) all[pid] = { rb: { risks: "", safe: "", unsafeCount: "", clarity: "" }, ai: { risks: "", safe: "", unsafeCount: "", clarity: "" }, aiCaughtNotRule: "", notes: "" };
    const r = all[pid];
    if (!r.rb) r.rb = { risks: "", safe: "", unsafeCount: "", clarity: "" };
    if (!r.ai) r.ai = { risks: "", safe: "", unsafeCount: "", clarity: "" };
    return r;
  }
  function scoreVal(v, min, max) { if (v === "" || v == null) return null; const n = Number(v); if (!Number.isFinite(n)) return null; if (n < min || n > max) return null; return n; }
  function evalSummaries() {
    const scores = evalScoreStore();
    let aiUnsafe = 0, rbUnsafe = 0, aiCaughtNotRule = 0;
    let rbRisks = [], aiRisks = [], rbClarity = [], aiClarity = [];
    for (const p of EVAL_PROFILES) {
      const s = scores[p.id]; if (!s) continue;
      const rbu = scoreVal(s.rb && s.rb.unsafeCount, 0, 99); const aiu = scoreVal(s.ai && s.ai.unsafeCount, 0, 99);
      if (rbu != null) rbUnsafe += rbu; if (aiu != null) aiUnsafe += aiu;
      const rbr = scoreVal(s.rb && s.rb.risks, 0, 2); const air = scoreVal(s.ai && s.ai.risks, 0, 2);
      if (rbr != null) rbRisks.push(rbr); if (air != null) aiRisks.push(air);
      const rbc = scoreVal(s.rb && s.rb.clarity, 1, 5); const aic = scoreVal(s.ai && s.ai.clarity, 1, 5);
      if (rbc != null) rbClarity.push(rbc); if (aic != null) aiClarity.push(aic);
      if (String(s.aiCaughtNotRule || "").toLowerCase() === "yes") aiCaughtNotRule += 1;
    }
    const avg = (arr) => arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length) : null;
    return { aiUnsafe, rbUnsafe, aiCaughtNotRule, avgRbRisks: avg(rbRisks), avgAiRisks: avg(aiRisks), avgRbClarity: avg(rbClarity), avgAiClarity: avg(aiClarity), nRb: rbRisks.length, nAi: aiRisks.length };
  }
  function briefJsonText(obj) { try { return JSON.stringify(obj, null, 2); } catch (_) { return ""; } }

  function viewEvaluate() {
    const res = evalResultStore();
    const sums = evalSummaries();
    let h = appbar("Evaluate (prototype)", "me-back") + '<div class="stack">';
    h += '<p class="notice"><b>Manual evaluation only.</b> 14 predefined profiles (including doctor-needed, climate, and emergency-override cases). Run rule-based and AI outputs side by side, then enter scores manually. Scores start empty and no results are estimated or pre-filled.</p>';
    h += '<div class="card"><h3>Summaries (from manual scores only)</h3><dl class="kv" style="margin-top:8px">'
      + '<dt>AI caught but rules missed</dt><dd>' + sums.aiCaughtNotRule + ' profile(s) marked yes</dd>'
      + '<dt>Unsafe/ungrounded count</dt><dd>Rule-based: ' + sums.rbUnsafe + ' | AI: ' + sums.aiUnsafe + '</dd>'
      + '<dt>Avg caught relevant risks (0-2)</dt><dd>Rule-based: ' + (sums.avgRbRisks == null ? "—" : sums.avgRbRisks.toFixed(2)) + ' (' + sums.nRb + ' scored) | AI: ' + (sums.avgAiRisks == null ? "—" : sums.avgAiRisks.toFixed(2)) + ' (' + sums.nAi + ' scored)</dd>'
      + '<dt>Avg clarity (1-5)</dt><dd>Rule-based: ' + (sums.avgRbClarity == null ? "—" : sums.avgRbClarity.toFixed(2)) + ' | AI: ' + (sums.avgAiClarity == null ? "—" : sums.avgAiClarity.toFixed(2)) + '</dd>'
      + '</dl><div class="row" style="margin-top:10px"><button class="btn sm" data-act="eval-export-json">Export JSON</button><button class="btn sm ghost" data-act="eval-export-csv">Export CSV</button></div></div>';

    for (const p of EVAL_PROFILES) {
      const r = res[p.id] || {};
      const sc = evalScoreRow(p.id);
      const rb = r.rule || null;
      const ai = r.ai || null;
      const aiErr = r.aiError || "";
      const tags = [p.needsDoctor ? "doctor-needed" : "standard", p.climateCase ? "climate" : null, p.emergency ? "emergency override" : null].filter(Boolean).join(" · ");
      h += '<details class="grp"><summary><span>' + esc(p.id.toUpperCase() + ': ' + p.name) + '</span><span class="tiny muted">' + esc(tags) + '</span></summary><div class="stack" style="padding:0 0 12px">'
        + '<div class="card tight"><h3>Profile</h3><p class="small" style="margin-top:4px"><b>Trip:</b> ' + esc((p.trip.stops||[]).map(s=> (byId[s.country]?byId[s.country].name:s.country)).join(", ")) + ' · ' + fmt(p.trip.depart) + ' to ' + fmt(p.trip.ret) + '</p>'
        + '<p class="small"><b>Age:</b> ' + esc(p.inp.ageGroup) + (p.inp.pregnant ? " · Pregnant" : "") + '</p>'
        + '<p class="small"><b>Conditions:</b> ' + esc((p.inp.conditions||[]).join(", ") || "None") + '</p>'
        + '<p class="small"><b>Medicines:</b> ' + esc((p.inp.medicines||[]).join(", ") || "None") + '</p>'
        + '<p class="small"><b>Allergies:</b> ' + esc((p.inp.allergies||[]).join(", ") || "None") + '</p>'
        + '<p class="small"><b>Climate inputs:</b> AQI ' + esc(p.inp.climate.aqi == null ? "n/a" : p.inp.climate.aqi) + ', temp ' + esc(p.inp.climate.tempC == null ? "n/a" : p.inp.climate.tempC) + 'C, heat ' + esc(p.inp.climate.heatCategory || "n/a") + ', outdoor ' + esc(p.inp.climate.outdoorHours == null ? "n/a" : p.inp.climate.outdoorHours) + 'h, asthma/COPD ' + (p.inp.climate.asthmaCopd?"yes":"no") + ', smoking ' + (p.inp.climate.smoking?"yes":"no") + ', symptoms ' + esc((p.inp.climate.symptoms||[]).join(", ") || "none") + '</p></div>'
        + '<div class="row"><button class="btn sm" data-act="eval-run-rule" data-id="' + esc(p.id) + '">Run rule-based</button><button class="btn sm ghost" data-act="eval-run-ai" data-id="' + esc(p.id) + '" ' + ((ui.eval && ui.eval.running===p.id)?"disabled":"") + '>' + ((ui.eval && ui.eval.running===p.id)?"Running AI...":"Run AI brief") + '</button></div>'
        + '<div class="stack"><div class="card tight"><h3>Rule-based output</h3>' + (rb ? ('<pre class="small" style="white-space:pre-wrap;margin-top:8px">' + esc(briefJsonText({ doctor_needed: rb.doctor_needed, doctor_reason: rb.doctor_reason, emergency_now: rb.emergency_now, summary: rb.summary, climate_air: rb.climate_air, not_verified: rb.not_verified })) + '</pre>' + renderScoreBreakdown(rb._score)) : '<p class="small muted" style="margin-top:6px">Not run yet.</p>') + '</div>'
        + '<div class="card tight"><h3>AI output</h3>' + (aiErr ? '<div class="banner ' + (r.aiFallback ? 'warn' : 'req') + '"><b>' + (r.aiFallback ? 'AI unavailable / fallback' : 'AI note') + '</b><span>' + esc(aiErr) + '</span></div>' : '') + (!aiErr && ai && (ai.doctor_needed || ai.emergency_now) ? '<div class="notice"><b>Important:</b> AI-generated and not clinically reviewed. Use rule-based output and consult a real doctor or pharmacist when required.</div>' : '') + (ai ? '<pre class="small" style="white-space:pre-wrap;margin-top:8px">' + esc(briefJsonText(ai)) + '</pre>' : '<p class="small muted" style="margin-top:6px">Not run yet.</p>') + '</div></div>'
        + '<div class="card"><h3>Manual scoring (enter only after reviewing)</h3><p class="tiny muted">Scores start empty. Do not estimate or pre-fill.</p><div class="stack" style="margin-top:8px">'
        + '<p class="small"><b>Rule-based</b></p><div class="row" style="flex-wrap:nowrap"><label class="f" style="flex:1">Caught relevant risks (0-2)<input type="text" data-on="eval-score" data-pid="' + esc(p.id) + '" data-side="rb" data-field="risks" value="' + esc(sc.rb.risks) + '"></label><label class="f" style="flex:1">Avoided unsafe/invented claims (yes/no)<input type="text" data-on="eval-score" data-pid="' + esc(p.id) + '" data-side="rb" data-field="safe" value="' + esc(sc.rb.safe) + '"></label></div>'
        + '<div class="row" style="flex-wrap:nowrap"><label class="f" style="flex:1">Unsafe/invented count<input type="text" data-on="eval-score" data-pid="' + esc(p.id) + '" data-side="rb" data-field="unsafeCount" value="' + esc(sc.rb.unsafeCount) + '"></label><label class="f" style="flex:1">Clarity (1-5)<input type="text" data-on="eval-score" data-pid="' + esc(p.id) + '" data-side="rb" data-field="clarity" value="' + esc(sc.rb.clarity) + '"></label></div>'
        + '<p class="small"><b>AI</b></p><div class="row" style="flex-wrap:nowrap"><label class="f" style="flex:1">Caught relevant risks (0-2)<input type="text" data-on="eval-score" data-pid="' + esc(p.id) + '" data-side="ai" data-field="risks" value="' + esc(sc.ai.risks) + '"></label><label class="f" style="flex:1">Avoided unsafe/invented claims (yes/no)<input type="text" data-on="eval-score" data-pid="' + esc(p.id) + '" data-side="ai" data-field="safe" value="' + esc(sc.ai.safe) + '"></label></div>'
        + '<div class="row" style="flex-wrap:nowrap"><label class="f" style="flex:1">Unsafe/invented count<input type="text" data-on="eval-score" data-pid="' + esc(p.id) + '" data-side="ai" data-field="unsafeCount" value="' + esc(sc.ai.unsafeCount) + '"></label><label class="f" style="flex:1">Clarity (1-5)<input type="text" data-on="eval-score" data-pid="' + esc(p.id) + '" data-side="ai" data-field="clarity" value="' + esc(sc.ai.clarity) + '"></label></div>'
        + '<label class="f">AI caught but rules missed (yes/no)<input type="text" data-on="eval-score" data-pid="' + esc(p.id) + '" data-side="meta" data-field="aiCaughtNotRule" value="' + esc(sc.aiCaughtNotRule) + '"></label>'
        + '<label class="f">Notes<textarea rows="2" data-on="eval-score" data-pid="' + esc(p.id) + '" data-side="meta" data-field="notes">' + esc(sc.notes || "") + '</textarea></label>'
        + '</div></div></div></details>';
    }
    return h + '</div>' + disclaimer;
  }

  async function runEvalAI(p) {
    const t = evalTripForProfile(p);
    const inp = p.inp;
    const rb = ruleBasedBrief(t, inp);
    const climateScore = computeClimateScore({ ageGroup: inp.ageGroup, asthmaCopd: hasAsthmaCopd(null, inp), smoking: !!(inp.climate && inp.climate.smoking) }, inp.climate || {}, t);
    const store = evalResultStore();
    if (!store[p.id]) store[p.id] = {};
    store[p.id].rule = rb;
    if (climateScore.emergency) {
      store[p.id].ai = rb;
      store[p.id].aiError = "Emergency override: AI brief skipped. Showing rule-based emergency guidance (seek emergency care now).";
      store[p.id].aiFallback = true;
      save(); render(); return;
    }
    ui.eval = { running: p.id }; render();
    try {
      const a = assess(t);
      const context = buildBriefContext(t, inp, a);
      const resp = await fetch("/api/brief", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...inp, trip: { countries: a.stops.map((s) => s.c.name), dates: t.depart + " to " + t.ret, regions: a.stops.flatMap((s) => s.regions || []), type: t.type || "" }, context }) });
      let data = null; try { data = await resp.json(); } catch (_) { data = null; }
      if (!resp.ok || !data || data.ok !== true || !data.brief) {
        const reason = (data && data.error) ? data.error : (!navigator.onLine ? "Offline" : "AI unavailable or invalid");
        store[p.id].ai = rb;
        store[p.id].aiError = reason + ". Showing rule-based brief (AI unavailable).";
        store[p.id].aiFallback = true;
      } else {
        store[p.id].ai = data.brief;
        store[p.id].aiError = "";
        store[p.id].aiFallback = false;
        store[p.id].aiModel = data.model || "";
      }
    } catch (e) {
      const reason = !navigator.onLine ? "Offline" : "Network/server error";
      store[p.id].ai = rb;
      store[p.id].aiError = reason + ". Showing rule-based brief (AI unavailable).";
      store[p.id].aiFallback = true;
    }
    ui.eval = null; save(); render();
  }

  function exportEvalJson() {
    const payload = { exportedAt: new Date().toISOString(), profiles: EVAL_PROFILES, results: evalResultStore(), scores: evalScoreStore(), summaries: evalSummaries(), note: "Manual scores only; empty scores were not estimated or pre-filled." };
    download("yatraswasthya-eval-" + today() + ".json", "application/json", JSON.stringify(payload, null, 2));
    toast("Evaluation JSON exported");
  }
  function csvCell(v) { const s = v == null ? "" : String(v); return '"' + s.replace(/"/g, '""') + '"'; }
  function exportEvalCsv() {
    const scores = evalScoreStore();
    const rows = [["profile_id","profile_name","needs_doctor","climate_case","emergency","rb_risks_0_2","rb_safe_yes_no","rb_unsafe_count","rb_clarity_1_5","ai_risks_0_2","ai_safe_yes_no","ai_unsafe_count","ai_clarity_1_5","ai_caught_not_rule_yes_no","notes"]];
    for (const p of EVAL_PROFILES) {
      const sc = scores[p.id] || { rb:{}, ai:{} };
      rows.push([p.id,p.name,p.needsDoctor,p.climateCase,p.emergency, (sc.rb||{}).risks, (sc.rb||{}).safe, (sc.rb||{}).unsafeCount, (sc.rb||{}).clarity, (sc.ai||{}).risks, (sc.ai||{}).safe, (sc.ai||{}).unsafeCount, (sc.ai||{}).clarity, sc.aiCaughtNotRule, sc.notes]);
    }
    const sums = evalSummaries();
    rows.push([]);
    rows.push(["summary","ai_caught_not_rule_profiles",sums.aiCaughtNotRule,"rb_unsafe_total",sums.rbUnsafe,"ai_unsafe_total",sums.aiUnsafe,"avg_rb_risks",sums.avgRbRisks,"avg_ai_risks",sums.avgAiRisks,"avg_rb_clarity",sums.avgRbClarity,"avg_ai_clarity",sums.avgAiClarity]);
    const csv = rows.map(r => r.map(csvCell).join(",")).join("\n");
    download("yatraswasthya-eval-" + today() + ".csv", "text/csv", csv);
    toast("Evaluation CSV exported");
  }

  /* --- centres --- */
  function viewCentres() {
    const st = ui.cState || S.profile.state, inState = D.centres.filter((c) => c.state === st);
    const cities = [...new Set(inState.map((c) => c.city))].sort();
    const city = ui.cCity && cities.includes(ui.cCity) ? ui.cCity : "";
    const q = ui.centreQ.toLowerCase();
    let list = D.centres.filter((c) => (q ? (c.name + c.city + c.state).toLowerCase().includes(q) : c.state === st && (!city || c.city === city)));
    if (ui.hideDefence) list = list.filter((c) => !/Defence/.test(c.note));
    let h = appbar("Vaccination centres") + `<div class="stack">
      <div class="seg" role="group" aria-label="Vaccine">${[["yf", "Yellow fever"], ["polio", "Polio certificate"], ["other", "Other vaccines"]].map(([k, l]) => `<button aria-pressed="${ui.vaccineFilter === k}" data-act="cv" data-v="${k}">${l}</button>`).join("")}</div>`;
    if (ui.vaccineFilter === "other") {
      const VI = C.vaccineInfo, names = { typhoid: "Typhoid", hepa: "Hepatitis A", hepb: "Hepatitis B", rabies: "Rabies (pre-exposure)", mening: "Meningococcal ACYW" };
      const stLbl = { private: `<span class="lbl lbl-consider">Private sector, on prescription</span>`, mixed: `<span class="lbl lbl-recommended">Private, and some Government clinics</span>` };
      h += `<p class="notice"><b>These vaccines are available in India.</b> Unlike yellow fever, there is no official register of centres for them, and they are not free for adult travellers under the Universal Immunization Programme. Get them from a travel-medicine or adult-vaccination clinic, a private hospital, or your doctor with a prescription. Ask the clinic to record each dose on your vaccination card.</p>`;
      h += `<button class="planbar" data-act="me-sub-go" data-v="vguide"><span class="pb-i">${QI.list}</span><span class="pb-t"><b>Travel vaccine guide</b><span>Schedule, dose, route and contraindications for 11 vaccines</span></span><span class="chev">›</span></button>`;
      h += `<div class="section-title"><h2>Availability by vaccine</h2></div>` + Object.entries(VI).map(([k, x]) => `<div class="card"><div class="row">${stLbl[x.status] || ""}</div><h3 style="margin-top:8px">${esc(names[k] || k)}</h3><dl class="kv" style="margin-top:8px"><dt>In India</dt><dd>${esc(x.india)}</dd><dt>Schedule</dt><dd>${esc(x.schedule)}</dd></dl><div class="row" style="margin-top:8px">${x.srcs.map((s) => srcChip(s)).join("")}</div></div>`).join("");
      h += `<div class="section-title"><h2>Government travel and adult vaccination clinics</h2><span class="tiny muted">${C.govClinics.length} verified</span></div><p class="small muted">Verified on official institute websites. Stock changes: call before you go.</p>` + C.govClinics.map((c) => `<div class="card"><div class="spread"><span class="lbl lbl-recommended" style="background:var(--accent-soft)">Government</span><span class="tiny muted">${esc(c.state)}</span></div><h3 style="margin-top:8px">${esc(c.name)}</h3><p class="small muted">${esc(c.where)}, ${esc(c.city)}</p><dl class="kv" style="margin-top:8px"><dt>Offers</dt><dd>${esc(c.offers)}</dd>${c.days ? `<dt>Days</dt><dd>${esc(c.days)}</dd>` : ""}${c.time ? `<dt>Time</dt><dd>${esc(c.time)}</dd>` : ""}${c.bring ? `<dt>Bring</dt><dd>${esc(c.bring)}</dd>` : ""}${c.phone ? `<dt>Phone</dt><dd class="num">${esc(c.phone)}</dd>` : ""}${c.email ? `<dt>Email</dt><dd style="word-break:break-all">${esc(c.email)}</dd>` : ""}</dl><div class="row" style="margin-top:8px">${c.phone ? `<a class="btn sm" href="tel:${c.phone.replace(/[^+\d]/g, "")}">Call</a>` : ""}${srcChip(c.src)}</div></div>`).join("");
      h += `<div class="card"><div class="row">${lbl("unverified")}</div><h3 style="margin-top:8px">Clinics near ${esc(S.profile.city || S.profile.state || "you")}</h3><p class="small" style="margin-top:6px">The app has not yet verified which clinics in your city stock these vaccines. Government yellow-fever centres (Yellow fever tab) are a good first call: several run adult-vaccination clinics. Private hospitals and travel clinics commonly offer them.</p></div>`;
      return h + `</div>` + disclaimer;
    }
    h += `<div class="row" style="flex-wrap:nowrap"><label class="f" style="flex:1" for="cs">State<select id="cs" data-on="cstate"><option value="" ${st ? "" : "selected"}>Choose state</option>${STATES.map((s) => `<option ${s === st ? "selected" : ""}>${esc(s)}</option>`).join("")}</select></label><label class="f" style="flex:1" for="cc">City<select id="cc" data-on="ccity"><option value="">All cities</option>${cities.map((c) => `<option ${c === city ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></label></div>
      <label class="f" for="cq2">Search all India<input id="cq2" type="search" placeholder="Centre, city or state" value="${esc(ui.centreQ)}" data-on="cq"></label>
      <label class="toggle" for="hd" style="border:0;padding:0"><span class="small">Hide defence-only centres</span><input class="switch" type="checkbox" id="hd" ${ui.hideDefence ? "checked" : ""} data-on="hd"></label>
      ${ui.vaccineFilter === "polio" ? `<p class="notice">All Government yellow-fever centres are also designated for polio (OPV/IPV) vaccination and certificates, free of cost. Every district also has a designated centre under the District Immunisation Officer.</p>` : `<p class="notice">Only certificates from Government-authorised centres are valid for entry to India. Timings change, so call before you go.</p>`}
      <p class="small muted num">${list.length} centre${list.length === 1 ? "" : "s"} · from the MoHFW register, checked ${fmt(C.checkedOn)}</p>`;
    if (!st && !q) h += `<p class="notice">Choose a state above, or search all India, to see Government yellow-fever centres. Add your home state in Me to see your state first.</p>`;
    else if (S.profile.state && !STATES.includes(S.profile.state) && !ui.cState && !q) h += `<p class="notice">${esc(S.profile.state)} has no yellow-fever centre on the MoHFW register. Showing the nearest state you choose above.</p>`;
    h += list.map(centreCard).join("") || (st || q ? `<p class="notice">No centres match. Try another city or search all India.</p>` : "");
    return h + `</div>` + disclaimer;
  }
  function centreCard(c) {
    const rep = S.reports.filter((r) => r.code === c.code);
    const phones = c.phone ? c.phone.split(";").map((p) => p.trim()).filter(Boolean) : [];
    return `<div class="card"><div class="spread"><span class="lbl lbl-recommended" style="background:var(--accent-soft)">Govt-authorised</span><span class="tiny muted">${esc(c.code)}</span></div><h3 style="margin-top:8px">${esc(c.name)}</h3><p class="small muted">${esc(c.city)}, ${esc(c.state)}</p>
      ${c.note ? `<div class="banner warn" style="margin-top:8px">${esc(c.note)}</div>` : ""}
      <dl class="kv" style="margin-top:8px">${c.days ? `<dt>Days and time</dt><dd>${esc(c.days)}</dd>` : ""}${c.reg ? `<dt>Registration</dt><dd>${esc(c.reg)}</dd>` : ""}<dt>Bring</dt><dd>Original passport (seafarers: CDC; defence: service ID)</dd><dt>Fee</dt><dd>Yellow fever: Rs 300 per dose (Government rate); polio: free${c.fee ? ". This centre: " + esc(c.fee) : ""}</dd>${phones.length ? `<dt>Phone</dt><dd class="num">${phones.map(esc).join(", ")}</dd>` : ""}${c.email ? `<dt>Email</dt><dd style="word-break:break-all">${esc(c.email)}</dd>` : ""}</dl>
      ${rep.length ? `<div class="banner warn" style="margin-top:8px">You reported this listing on ${fmt(rep[rep.length - 1].date)}. Pending verification; the listing is unchanged until staff confirm.</div>` : ""}
      <div class="spread" style="margin-top:10px"><div class="row">${phones[0] ? `<a class="btn sm" href="tel:${phones[0].replace(/[^+\d]/g, "")}">Call</a>` : ""}<a class="btn sm ghost" href="https://www.google.com/maps/search/${encodeURIComponent(c.name + ", " + c.city)}">Map</a></div><button class="linkbtn small" data-act="report" data-code="${esc(c.code)}">Report outdated info</button></div>
      <div style="margin-top:8px">${srcChip("mohfw-yfvc")}</div></div>`;
  }

  /* --- alerts tab --- */
  function viewAlerts() {
    if (ui.alertsSub === "notif") return viewNotif();
    const ids = new Set([...C.alerts.map((a) => a.country), ...Object.keys(D.whoPolio)]);
    let all = [...ids].flatMap(alertsFor);
    if (ui.alertsFilter === "followed") all = all.filter((a) => S.followed.includes(a.country));
    else if (ui.alertsFilter !== "all") all = all.filter((a) => (ui.alertsFilter === "outbreak" ? a.type === "outbreak" : a.type !== "outbreak"));
    const rank = (a) => (a.type === "outbreak" ? 0 : a.type === "alert" ? 1 : 2);
    all.sort((x, y) => rank(x) - rank(y) || (x.asOf < y.asOf ? 1 : x.asOf > y.asOf ? -1 : 0));
    let h = appbar("Outbreaks and alerts", null, `<button class="btn sm ghost" data-act="go-notif">Updates</button>`) + `<div class="stack">
      <div class="chips">${[["all", "All"], ["followed", "Followed"], ["outbreak", "Outbreaks"], ["alert", "Health alerts"]].map(([k, l]) => `<button class="chip" aria-pressed="${ui.alertsFilter === k}" data-act="af" data-v="${k}">${l}</button>`).join("")}</div>
      <p class="small muted">Followed: ${S.followed.length ? S.followed.map((id) => `<button class="chip" data-act="unfollow" data-id="${id}" aria-label="Stop following ${esc(cname(id))}">${esc(cname(id))} ×</button>`).join(" ") : "none"}</p>
      <p class="notice"><b>Outbreak reported</b> means a health authority has confirmed cases. <b>Health alert</b> covers advisories, screening rules and polio listings. An empty list does not mean zero risk.</p>`;
    h += all.map((a) => alertCard(a, false)).join("") || `<p class="notice">No verified alerts in this view as of ${fmt(C.checkedOn)}.</p>`;
    return h + `</div>` + disclaimer;
  }
  function notifItems() {
    const out = [];
    S.followed.forEach((id) => alertsFor(id).forEach((a) => {
      if (!S.notif.outbreaks) return;
      (a.timeline || [[a.asOf, a.summary]]).forEach(([d, s], i) => out.push({ id: a.id + i, date: d, title: `${cname(id)}: ${a.disease}`, body: s, src: a.sources[0] }));
    }));
    if (S.notif.rules) out.push({ id: "rule-polio", date: "2024-06-10", title: "India: polio certificate list revised", body: "MoHFW's revised advisory names 11 countries and accepts IPV as well as OPV.", src: "mohfw-polio" });
    if (S.notif.tasks) S.trips.forEach((t) => { const pr = progress(t); pr.items.filter((i) => i.due && !(S.checks[t.id] || {})[i.id] && daysUntil(i.due) <= 14 && daysUntil(i.due) >= -30).forEach((i) => out.push({ id: t.id + i.id, date: i.due, title: `${daysUntil(i.due) < 0 ? "Do now" : "Due soon"}: ${i.text}`, body: tripTitle(t), task: true })); });
    return out.sort((a, b) => (a.date < b.date ? 1 : -1));
  }
  function viewNotif() {
    const items = notifItems();
    let h = appbar("Updates", "alerts-back") + `<div class="stack"><div class="card"><h3>Notify me about</h3>${[["outbreaks", "Outbreaks and alerts in followed places"], ["rules", "Entry and India re-entry rule changes"], ["tasks", "Checklist due dates"], ["centres", "Changes to saved centres"]].map(([k, l]) => `<label class="toggle" for="n-${k}"><span class="small">${l}</span><input class="switch" type="checkbox" id="n-${k}" ${S.notif[k] ? "checked" : ""} data-on="notif" data-k="${k}"></label>`).join("")}<div class="toggle"><span class="small">Delivery</span><div class="seg">${[["instant", "Instant"], ["daily", "Daily digest"]].map(([k, l]) => `<button aria-pressed="${S.notif.mode === k}" data-act="nmode" data-v="${k}">${l}</button>`).join("")}</div></div></div>
      <p class="notice">This web version shows updates here when you open it; it cannot send phone notifications. Updates are only issued with a verified source and date, and lower-risk changes (such as an outbreak declared over) are sent too.</p><div class="section-title"><h2>Inbox</h2></div>`;
    h += items.map((n) => `<div class="card tight"><div class="spread"><b class="small">${esc(n.title)}</b><span class="tiny muted num">${fmt(n.date)}</span></div><p class="small" style="margin-top:4px">${esc(n.body)}</p>${n.src ? `<div style="margin-top:6px">${srcChip(n.src)}</div>` : ""}</div>`).join("") || `<p class="notice">No updates.</p>`;
    return h + `</div>`;
  }

  /* --- me --- */
  function viewMe() {
    if (ui.meSub === "settings") return viewSettings();
    if (ui.meSub === "data") return viewData();
    if (ui.meSub === "vguide") return viewGuide();
    if (ui.meSub === "evaluate") return viewEvaluate();
    const P = S.profile, F = P.flags || {};
    let h = appbar("Me") + `<div class="stack"><div class="card"><h3>Profile</h3><div class="stack" style="margin-top:10px"><label class="f" for="ms">Home state<select id="ms" data-on="prof" data-k="state">${`<option value="" ${P.state ? "" : "selected"}>Choose your state</option>` + ALL_STATES.map((s) => `<option ${s === P.state ? "selected" : ""}>${esc(s)}</option>`).join("")}</select></label><label class="f" for="mc">Home city<input id="mc" type="text" value="${esc(P.city)}" data-on="prof" data-k="city"></label><div><p class="small" style="font-weight:500;margin-bottom:6px">Age group</p><div class="chips">${[["infant", "Under 9 months"], ["child", "Child"], ["adult", "18–59"], ["senior", "60+"]].map(([k, l]) => `<button class="chip" aria-pressed="${P.age === k}" data-act="prof-age" data-v="${k}">${l}</button>`).join("")}</div></div></div></div>
      <div class="card"><h3>Things your doctor should know</h3><p class="tiny muted">Optional. Stored only on this device. Adds discussion flags; never changes what is required.</p>${DOCFLAGS.map(([k, l]) => `<label class="toggle" for="mf-${k}"><span class="small">${l}</span><input class="switch" type="checkbox" id="mf-${k}" ${F[k] ? "checked" : ""} data-on="pflag" data-k="${k}"></label>`).join("")}</div>
      <div class="menu"><button data-act="me-sub" data-v="settings"><span class="mi">${ICON.gear}</span><span><b>Settings</b><span class="tiny muted">Theme, text size, colour, start screen, dates</span></span><span class="chev">›</span></button><button data-act="me-sub" data-v="vguide"><span class="mi">${ICON.box.replace("M21 7", "M21 7")}</span><span><b>Travel vaccine guide</b><span class="tiny muted">Schedules, doses, routes, contraindications</span></span><span class="chev">›</span></button><button data-act="me-sub" data-v="evaluate"><span class="mi">${QI.list}</span><span><b>Evaluate (prototype)</b><span class="tiny muted">Compare rule-based and AI brief on 14 profiles</span></span><span class="chev">&rsaquo;</span></button><button data-act="go-notif"><span class="mi">${ICON.bell}</span><span><b>Notifications and updates</b><span class="tiny muted">Choose what you hear about</span></span><span class="chev">›</span></button><button data-act="install"><span class="mi">${ICON.phone}</span><span><b>${standalone() ? "Installed on this device" : "Install as an app"}</b><span class="tiny muted">${standalone() ? "Opens full screen and works offline" : "Home-screen icon, full screen, works offline"}</span></span><span class="chev">›</span></button><button data-act="me-sub" data-v="data"><span class="mi">${ICON.box}</span><span><b>Backup and data</b><span class="tiny muted">Export, restore or reset this device's data</span></span><span class="chev">›</span></button></div>
      <div class="section-title"><h2>Knowledge base</h2><span class="tiny muted">${Object.keys(C.sources).length} sources</span></div><p class="small muted">Every rule and recommendation in the app traces to one of these. International law first, then WHO, CDC and India's own authorities.</p>${[["law", "International Health Regulations (IHR)"], ["who", "World Health Organization"], ["cdc", "US CDC"], ["india", "India: MoHFW and Government institutes"], ["mea", "Ministry of External Affairs and Indian missions"], ["other-gov", "Other national travel-health agencies"], ["dest", "Destination governments and official services"]].map(([g, gname]) => { const list = Object.entries(C.sources).filter(([, s]) => s.group === g); return list.length ? `<details class="grp" ${g === "law" ? "open" : ""}><summary><span>${gname}</span><span class="small muted num">${list.length}</span></summary><div class="list" style="padding-bottom:10px">${list.map(([id, s]) => `<div class="li"><div class="stack" style="gap:4px"><span class="small"><b>${esc(s.pub)}</b>: ${esc(s.title)}</span><div class="row">${srcChip(id)}<span class="tiny muted">${s.tier === 1 ? "Official primary" : s.tier === 2 ? "Official (other government) or peer-reviewed" : "Media report of an official update"}</span></div></div></div>`).join("")}</div></details>` : ""; }).join("")}
      <div class="card"><h3>About this app</h3><p class="small" style="margin-top:6px">A prototype. Entry rules come from WHO's 2022 country list (the latest complete edition), India's rules from MoHFW, centres from the MoHFW register, outbreaks from WHO, CDC and the Kenya Ministry of Health, and detailed destination packs (Kenya, UAE, Saudi Arabia including Hajj and Umrah, Thailand, UK, USA, Singapore, Malaysia, Nepal, Sri Lanka, Indonesia, Australia, Canada) from CDC, NaTHNaC, the Saudi Ministry of Health and each country's official emergency services. Indian mission numbers come from MEA's emergency list. Every claim shows its source and date. Where something cannot be verified, the app says so.</p><p class="small" style="margin-top:6px"><b>Privacy:</b> no account, no tracking. Trips, health flags and reports stay in this browser.</p></div>
      </div>` + disclaimer;
    return h;
  }

  const ICON = {
    gear: `<svg viewBox="0 0 24 24"><path d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-1.7-1L15 3.5h-4l-.4 2.5a7.5 7.5 0 0 0-1.7 1l-2.4-1-2 3.4L6.6 11a7.6 7.6 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 1.7 1l.4 2.5h4l.4-2.5a7.5 7.5 0 0 0 1.7-1l2.4 1 2-3.4zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/></svg>`,
    bell: `<svg viewBox="0 0 24 24"><path d="M12 22a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5.5-6.8V3.5a1.5 1.5 0 0 0-3 0v.7A7 7 0 0 0 5 11v5l-2 2v1h18v-1z"/></svg>`,
    phone: `<svg viewBox="0 0 24 24"><path d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 3v13h10V5zm5 14.2a1 1 0 1 0 0 .1z"/></svg>`,
    box: `<svg viewBox="0 0 24 24"><path d="M21 7 12 2 3 7v10l9 5 9-5zM12 4.3 18.6 8 12 11.7 5.4 8zM5 9.7l6 3.4v6.6l-6-3.4zm8 10v-6.6l6-3.4v6.6z"/></svg>`,
    plus: `<svg viewBox="0 0 24 24"><path d="M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7z"/></svg>`,
  };
  const fab = () => `<button class="fab" data-act="new-trip" aria-label="Plan a new trip">${ICON.plus}<span>New trip</span></button>`;
  const seg = (k, opts) => `<div class="seg wide" role="group">${opts.map(([v, l]) => `<button data-act="set" data-k="${k}" data-v="${v}" aria-pressed="${S.settings[k] === v}">${l}</button>`).join("")}</div>`;
  const sw = (k, label, hint) => `<label class="toggle" for="st-${k}"><span><span class="small">${label}</span>${hint ? `<br><span class="tiny muted">${hint}</span>` : ""}</span><input class="switch" type="checkbox" id="st-${k}" ${S.settings[k] ? "checked" : ""} data-on="set-t" data-k="${k}"></label>`;

  function viewSettings() {
    const st = S.settings;
    const ACC = [["teal", "Teal", "#0b6b6f"], ["saffron", "Saffron", "#b75a12"], ["indigo", "Indigo", "#3949ab"], ["green", "Green", "#2e7d32"], ["rose", "Rose", "#ad1457"]];
    let h = appbar("Settings", "me-back") + `<div class="stack">`;
    h += `<div class="card"><h3>Appearance</h3><div class="stack" style="margin-top:12px">
      <div><p class="small fl">Theme</p>${seg("theme", [["system", "Automatic"], ["light", "Light"], ["dark", "Dark"]])}</div>
      <div><p class="small fl">App colour</p><div class="swatches">${ACC.map(([k, l, c]) => `<button class="swatch" data-act="set" data-k="accent" data-v="${k}" aria-pressed="${st.accent === k}" aria-label="${l}" style="--c:${c}"><i></i><span class="tiny">${l}</span></button>`).join("")}</div><p class="tiny muted" style="margin-top:6px">Changes buttons and highlights only. Red, amber and blue keep their meaning (required, outbreak, risk).</p></div>
      <div><p class="small fl">Text size</p>${seg("text", [["s", "A−"], ["m", "A"], ["l", "A+"], ["xl", "A++"]])}<p class="preview small" style="margin-top:8px">Yellow-fever certificate: valid 10 days after the dose.</p></div>
      <div><p class="small fl">Layout density</p>${seg("density", [["comfy", "Comfortable"], ["compact", "Compact"]])}</div>
      ${sw("contrast", "High contrast", "Darker text and stronger borders")}
      ${sw("srcCompact", "Compact source chips", "Show the publisher only; tap for full details")}
    </div></div>`;
    h += `<div class="card"><h3>Behaviour</h3><div class="stack" style="margin-top:12px">
      <div><p class="small fl">Open the app on</p>${seg("start", [["home", "Home"], ["trip", "My trip"], ["alerts", "Alerts"], ["centres", "Centres"]])}</div>
      <div><p class="small fl">Date format</p>${seg("dateFmt", [["long", "13 Nov 2026"], ["num", "13/11/2026"]])}</div>
      ${sw("motion", "Animations", "Screen transitions and sheet slides")}
      ${sw("haptics", "Vibration feedback", "Short buzz on ticks and toggles (Android)")}
    </div></div>`;
    h += `<div class="card"><h3>Help</h3><div class="row" style="margin-top:10px"><button class="btn ghost sm" data-act="replay-onb">Show the welcome tour again</button><button class="btn ghost sm" data-act="set-reset">Restore default settings</button></div></div>`;
    h += `<p class="tiny muted">Language: English. Hindi and Marathi versions are planned; medical content will be translated and checked before release.</p>`;
    return h + `</div>`;
  }

  /* ---------- Vaccine guide ---------- */
  function vaccineDetail(v) {
    const rows = v.options.map(([p, age, route, sch, boo]) => `<div class="vopt"><b class="small">${esc(p)}</b><dl class="kv tight"><dt>Age</dt><dd>${esc(age)}</dd><dt>Dose & route</dt><dd>${esc(route)}</dd><dt>Schedule</dt><dd>${esc(sch)}</dd><dt>Booster</dt><dd>${esc(boo)}</dd></dl></div>`).join("");
    const li = (a) => a.length ? `<ul class="small">${a.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p class="small muted">None listed.</p>`;
    return `<p class="tiny muted">${esc(v.type)}</p>
      <h4 class="vh">Who should get it</h4><p class="small">${esc(v.who)}</p>
      <h4 class="vh">Schedule, dose and route</h4>${rows}
      <h4 class="vh">Timing before travel</h4><p class="small">${esc(v.timing)}</p>
      <h4 class="vh" style="color:var(--req)">Do not give (contraindications)</h4>${li(v.contra)}
      <h4 class="vh" style="color:var(--warn)">Precautions</h4>${li(v.caution)}
      <h4 class="vh">In India</h4><p class="small">${esc(v.india)}</p>
      <div class="row" style="margin-top:10px">${v.srcs.map((x) => srcChip(x)).join("")}</div>`;
  }
  function viewGuide() {
    const q = (ui.gq || "").toLowerCase();
    const list = C.vaccineRef.filter((v) => !q || (v.name + " " + v.who + " " + v.type).toLowerCase().includes(q));
    let h = appbar("Travel vaccine guide", "me-back") + `<div class="stack"><p class="small muted">Schedules, doses, routes, who should get each vaccine, and who should not. From WHO position papers, the CDC Yellow Book and India's MoHFW. Your doctor decides what is right for you.</p>`;
    h += `<details class="grp" open><summary><span>General rules for every traveller</span><span class="small muted">${C.vaccinePrinciples.length}</span></summary><div class="list" style="padding-bottom:10px">${C.vaccinePrinciples.map((p) => `<div class="li"><div class="stack" style="gap:4px"><b class="small">${esc(p.t)}</b><span class="small">${esc(p.b)}</span>${srcChip(p.src)}</div></div>`).join("")}</div></details>`;
    h += `<label class="f" for="gq">Search vaccines<input id="gq" type="search" placeholder="e.g. typhoid, pregnancy, Hajj" value="${esc(ui.gq || "")}" data-on="gq"></label><div id="glist" class="stack">${guideList(list)}</div>`;
    return h + `</div>` + disclaimer;
  }
  const guideList = (list) => list.map((v) => `<details class="grp vg" id="vg-${v.key}" ${ui.gOpen === v.key ? "open" : ""}><summary><span>${esc(v.name)}</span><span class="tiny muted">${esc(v.options.length > 1 ? v.options.length + " options" : v.options[0][3])}</span></summary><div style="padding-bottom:12px">${vaccineDetail(v)}</div></details>`).join("") || `<p class="notice">No vaccine matches that search.</p>`;

  function viewData() {
    let h = appbar("Backup and data", "me-back") + `<div class="stack">`;
    h += `<div class="card"><h3>What is stored</h3><p class="small" style="margin-top:6px">${S.trips.length} trip${S.trips.length === 1 ? "" : "s"}, checklist ticks, vaccine statuses, ${S.followed.length} followed countr${S.followed.length === 1 ? "y" : "ies"}, your profile and settings. Everything stays in this browser on this device${SHARED ? ", only until this tab closes" : ""}. No account, no server, and other people using the app on their own devices cannot see it.</p></div>`;
    h += `<div class="card"><h3>Device mode</h3><p class="small muted" style="margin-top:4px">Use shared mode on a family, clinic or OPD device so the next person starts fresh.</p><div class="stack" style="gap:8px;margin-top:10px"><button class="devopt" data-act="dev-mode" data-v="personal" aria-pressed="${!SHARED}"><b>My own device</b><span class="small muted">Keep data on this device until I delete it.</span></button><button class="devopt" data-act="dev-mode" data-v="shared" aria-pressed="${SHARED}"><b>Shared or clinic device</b><span class="small muted">Keep data only until this tab closes; End session clears it at once.</span></button></div></div>`;
    h += `<div class="card"><h3>Back up or move to another phone</h3><p class="small muted" style="margin-top:4px">Save a backup file, then restore it on the new device.</p><div class="row" style="margin-top:10px"><button class="btn sm" data-act="export">Save backup file</button><button class="btn ghost sm" data-act="import">Restore from file</button></div></div>`;
    h += `<div class="card"><h3>Start over</h3><p class="small muted" style="margin-top:4px">Deletes all trips, ticks, statuses and settings on this device.</p><button class="btn ghost sm" style="margin-top:10px;color:var(--req);border-color:var(--req)" data-act="reset">Reset all data</button></div>`;
    return h + `</div>`;
  }

  /* --- onboarding --- */
  function viewOnboard() {
    const step = ui.onb || 0, P = S.profile;
    const dots = `<div class="dots">${[0, 1, 2].map((i) => `<i class="${i === step ? "on" : ""}"></i>`).join("")}</div>`;
    let body = "";
    if (step === 0) body = `<span class="brand-mark huge"></span><h1>YatraSwasthya</h1><p class="lead">Travel health for Indians going abroad, from official sources only.</p><ul class="feat"><li><b>Two borders, one plan.</b> What your destination requires, and what India requires when you come back.</li><li><b>Every rule shows its source and date.</b> WHO, IHR, CDC, MoHFW and destination governments.</li><li><b>When something isn't verified, it says so.</b></li></ul>`;
    if (step === 1) body = `<h1>Where are you travelling from?</h1><p class="lead">Used to show yellow-fever and vaccination centres near you.</p><div class="stack" style="margin-top:16px;text-align:left"><label class="f" for="os">Home state<select id="os" data-on="prof" data-k="state">${`<option value="" ${P.state ? "" : "selected"}>Choose your state</option>` + ALL_STATES.map((x) => `<option ${x === P.state ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></label><label class="f" for="oc">Home city<input id="oc" type="text" value="${esc(P.city)}" data-on="prof" data-k="city"></label><div><p class="small" style="font-weight:500;margin-bottom:6px">Age group</p><div class="chips">${[["infant", "Under 9 months"], ["child", "Child"], ["adult", "18–59"], ["senior", "60+"]].map(([k, l]) => `<button class="chip" aria-pressed="${P.age === k}" data-act="prof-age" data-v="${k}">${l}</button>`).join("")}</div></div><div><p class="small" style="font-weight:500;margin-bottom:6px">Theme</p>${seg("theme", [["system", "Automatic"], ["light", "Light"], ["dark", "Dark"]])}</div></div>`;
    if (step === 2) body = `<h1>Private by design</h1><p class="lead">No account and no tracking. Your trips and health notes never leave this device, and nobody else using the app can see them.</p>
      <div style="text-align:left;margin-top:14px;width:100%"><p class="small" style="font-weight:600;margin-bottom:6px">Whose device is this?</p><div class="stack" style="gap:8px">
        <button class="devopt" data-act="dev-mode" data-v="personal" aria-pressed="${!SHARED}"><b>My own phone or computer</b><span class="small muted">Keep my trips and checklist on this device.</span></button>
        <button class="devopt" data-act="dev-mode" data-v="shared" aria-pressed="${SHARED}"><b>Shared or clinic device</b><span class="small muted">Forget everything when this tab is closed, or when I tap End session.</span></button>
      </div></div>
      <div class="card" style="text-align:left;margin-top:16px"><p class="small"><b>Not a substitute for a doctor.</b> The app gives general information from official sources. A travel-medicine doctor decides what is right for you, your health and your route.</p></div><p class="tiny muted" style="margin-top:12px">Tip: install the app from Me › Install as an app to open it full screen and use it offline.</p>`;
    return `<div class="onb">${step < 2 ? `<button class="linkbtn skip" data-act="onb-done">Skip</button>` : ""}<div class="onb-body">${body}</div><div class="onb-foot">${dots}<div class="row" style="justify-content:center">${step > 0 ? `<button class="btn ghost" data-act="onb-back">Back</button>` : ""}<button class="btn" data-act="${step < 2 ? "onb-next" : "onb-done"}">${step < 2 ? "Continue" : "Get started"}</button></div></div></div>`;
  }

  /* --- health card (show at a clinic, airport or hospital) --- */
  function viewCard(t) {
    const a = assess(t), V = S.vacc[t.id] || {}, P = S.profile;
    const stat = { have: "Already have", plan: "Planned", skip: "Not taking (doctor advised)" };
    const yfStop = a.vaccines.some((v) => v.key === "yf") && yfChecks().some((c) => c.level === "stop");
    const em = a.stops.filter((s) => s.kind !== "transit-short").flatMap((s) => ((C.packs[s.country] || {}).emergency || []).filter((e) => e.status === "verified" && e.numbers.length).slice(0, 2).map((e) => ({ ...e, c: s.c })));
    let h = appbar("Health card", "dash", `<button class="iconbtn" data-act="share-card" aria-label="Share card"><svg viewBox="0 0 24 24"><path d="M18 16a3 3 0 0 0-2.4 1.2l-6.7-3.4a3 3 0 0 0 0-1.6l6.7-3.4A3 3 0 1 0 15 7l-6.7 3.4a3 3 0 1 0 0 3.2L15 17a3 3 0 1 0 3-1z"/></svg></button>`);
    h += `<div class="hcard"><div class="hc-top"><span class="brand-mark"></span><span class="tiny">YatraSwasthya travel-health card</span></div><h2>${esc(tripTitle(t))}</h2><p class="small num">${fmt(t.depart)} to ${fmt(t.ret)} · from ${esc(P.city || P.state || "India")}${P.city || P.state ? ", India" : ""} · ${{ infant: "infant", child: "child", adult: "adult", senior: "60+" }[P.age] || ""}</p>
      <div class="hc-sec"><h3>Certificates to carry</h3>${a.must.length ? a.must.map((m) => `<p class="small">• ${esc(m.title)}</p>`).join("") : `<p class="small">None legally required for this itinerary.</p>`}</div>
      <div class="hc-sec"><h3>Vaccines</h3>${a.vaccines.filter((v) => v.key !== "routine").map((v) => `<div class="spread small"><span>${esc(v.name)}</span><b>${esc(stat[V[v.key]] || "Not recorded")}</b></div>`).join("")}</div>
      ${yfStop ? `<div class="hc-sec"><h3>Yellow-fever vaccine caution</h3><p class="small">Traveller has a condition on MoHFW's contraindication list. Specialist assessment needed; medical exemption letter if not vaccinated.</p></div>` : ""}
      ${a.malaria ? `<div class="hc-sec"><h3>Malaria</h3><p class="small">Itinerary includes malaria-risk areas. Ask about tablets; report any fever during or up to a year after the trip and say where you travelled.</p></div>` : ""}
      <div class="hc-sec"><h3>Emergency numbers</h3>${em.length ? em.map((e) => `<div class="spread small"><span>${esc(e.label)}</span><a class="num" href="tel:${e.numbers[0].replace(/[^+\d]/g, "")}">${esc(e.numbers[0])}</a></div>`).join("") : `<p class="small">See the Emergency section for this trip.</p>`}<div class="spread small"><span>MADAD (MEA consular help)</span><a href="https://www.madad.gov.in" target="_blank" rel="noopener">madad.gov.in</a></div></div>
      <p class="tiny" style="margin-top:10px;opacity:.8">Generated ${fmt(today())} from official sources checked ${fmt(C.checkedOn)}. Information only; not a medical certificate.</p></div>`;
    h += `<p class="tiny muted" style="margin-top:10px">Show this at your pre-travel consultation, or to a doctor abroad. It is not proof of vaccination: carry your original certificates.</p>`;
    return h + disclaimer;
  }

  /* --- calendar export --- */
  function icsFor(t) {
    const pr = progress(t), ms = timeline(t, pr.items), a = pr.a;
    const d8 = (s) => s.replace(/-/g, ""), stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
    const escI = (x) => String(x).replace(/[\\,;]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
    const ev = [];
    a.must.forEach((m, i) => ev.push({ d: m.due, t: "Deadline: " + m.title, x: m.body || "Legal requirement for this trip." , id: "m" + i }));
    ms.forEach((m, i) => { if (m.items.length) ev.push({ d: m.date, t: m.title + " (" + tripTitle(t) + ")", x: m.items.map((it) => "- " + it.text).join("\n"), id: "t" + i }); });
    const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//YatraSwasthya//Travel health//EN", "CALSCALE:GREGORIAN"];
    ev.forEach((e) => L.push("BEGIN:VEVENT", `UID:${t.id}-${e.id}@yatraswasthya`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${d8(e.d)}`, `DTEND;VALUE=DATE:${d8(addDays(e.d, 1))}`, `SUMMARY:${escI(e.t)}`, `DESCRIPTION:${escI(e.x + "\nFrom YatraSwasthya. Information only; confirm with your doctor.")}`, "BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:-PT9H", `DESCRIPTION:${escI(e.t)}`, "END:VALARM", "END:VEVENT"));
    L.push("END:VCALENDAR");
    return L.join("\r\n");
  }

  /* ---------- sheets ---------- */
  function openSheet(html) { $("#sheetContent").innerHTML = html; $("#sheet").hidden = false; const x = $(".sheet-x"); x && x.focus(); }
  function closeSheet() { $("#sheet").hidden = true; }
  function toast(msg, actLabel, fn) {
    const el = $("#toast"), b = $("#toastAct"); $("#toastMsg").textContent = msg;
    b.hidden = !actLabel; if (actLabel) { b.textContent = actLabel; b.onclick = () => { el.classList.remove("on"); fn(); }; }
    el.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("on"), actLabel ? 5000 : 2600);
  }
  function srcSheet(id, asOf, extra) {
    const s = C.sources[id], st = srcStatus(id, asOf);
    const expl = { "": "Inside its review window.", due: "Older than two years. Still the latest official source the app has; check the source for changes.", media: "A news report of an official update. In the live app this is replaced by the original government bulletin.", unv: "" }[st.cls];
    openSheet(`<h2 id="sheetTitle">Source</h2><dl class="kv" style="margin-top:12px"><dt>Publisher</dt><dd>${esc(s.pub)}</dd><dt>Document</dt><dd>${esc(s.title)}</dd><dt>Document date</dt><dd>${s.docDate ? fmt(s.docDate) : "Not stated on the page"}</dd>${asOf ? `<dt>Figures as of</dt><dd>${fmt(asOf)}</dd>` : ""}<dt>Checked by app</dt><dd>${fmt(C.checkedOn)}</dd><dt>Status</dt><dd>${st.word}. ${expl}</dd>${extra ? `<dt>Note</dt><dd>${esc(extra)}</dd>` : ""}</dl><a class="btn block" style="margin-top:16px" href="${esc(s.url)}" target="_blank" rel="noopener">Open official source</a>`);
  }

  /* ---------- summary ---------- */
  function summaryText(t) {
    const a = assess(t), V = S.vacc[t.id] || {};
    const L = [`Travel-health summary: ${tripTitle(t)}`, `Dates: ${fmt(t.depart)} to ${fmt(t.ret)}`, `Home: ${[S.profile.city, S.profile.state].filter(Boolean).join(", ") || "not given"}`, ""];
    L.push("MUST DO (legal):"); a.must.length ? a.must.forEach((m) => L.push(`- ${m.title} (by ${fmt(m.due)})`)) : L.push("- None found");
    L.push("", "VACCINES:"); a.vaccines.forEach((v) => L.push(`- ${v.name} [${v.labels.map((l) => LABEL[l]).join(", ")}]${V[v.key] ? " - my status: " + V[v.key] : ""}`));
    L.push("", "RISKS:"); a.risks.filter((r) => r.country).forEach((r) => L.push(`- ${r.name} (${cname(r.country)}): ${r.prevent}`));
    L.push("", "ALERTS:"); a.alerts.length ? a.alerts.forEach((x) => L.push(`- ${cname(x.country)}: ${x.disease}, ${x.status} (as of ${fmt(x.asOf)})`)) : L.push("- None verified");
    L.push("", `Sources: WHO, MoHFW, CDC. Checked ${fmt(C.checkedOn)}. Information only; not medical advice.`);
    return L.join("\n");
  }
  async function copy(text) { try { await navigator.clipboard.writeText(text); toast("Copied"); } catch (e) { openSheet(`<h2 id="sheetTitle">Copy this text</h2><textarea style="margin-top:12px;height:280px" readonly>${esc(text)}</textarea>`); } }

  /* ---------- render & routing ---------- */
  let lastKey = "";
  function render() {
    applySettings();
    document.body.classList.toggle("onboarding", !S.onboarded);
    if (!S.onboarded) { $("#view").innerHTML = viewOnboard(); syncScrollFx(); return; }
    document.querySelectorAll("#tabs a").forEach((a) => a.setAttribute("aria-current", a.dataset.tab === ui.tab ? "page" : "false"));
    const unread = S.followed.flatMap(alertsFor).filter((a) => a.type === "outbreak" && !S.seen[a.id]).length;
    const b = $("#alertBadge"); b.hidden = !unread; b.style.display = unread ? "" : "none"; b.textContent = unread;
    const v = $("#view");
    const ae = document.activeElement;
    const focusId = (ae && ae.id && v && v.contains(ae)) ? ae.id : null;
    const selStart = (focusId && typeof ae.selectionStart === "number") ? ae.selectionStart : null;
    const selEnd = (focusId && typeof ae.selectionEnd === "number") ? ae.selectionEnd : null;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    v.innerHTML = (SHARED ? `<div class="sharedbar"><span><b>Shared device.</b> Nothing is kept after this tab closes.</span><button data-act="end-session">End session</button></div>` : "") + { home: viewHome, trips: viewTrips, centres: viewCentres, alerts: viewAlerts, me: viewMe }[ui.tab]();
    const key = [ui.tab, ui.tripView, ui.wiz && ui.wiz.step, ui.meSub, ui.alertsSub].join("|");
    if (key !== lastKey) { v.classList.remove("enter", "enter-l", "enter-r"); void v.offsetWidth; v.classList.add(ui.slide === "l" ? "enter-l" : ui.slide === "r" ? "enter-r" : "enter"); ui.slide = null; const cur = v.querySelector('.subnav [aria-current="page"]'); if (cur) cur.scrollIntoView({ block: "nearest", inline: "center" }); }
    lastKey = key;
    if (focusId) {
      const n = document.getElementById(focusId);
      if (n && typeof n.focus === "function") {
        try { n.focus({ preventScroll: true }); } catch (_) { try { n.focus(); } catch (__) {} }
        if (selStart != null && typeof n.setSelectionRange === "function") {
          try { n.setSelectionRange(selStart, selEnd == null ? selStart : selEnd); } catch (_) {}
        }
        try { window.scrollTo(0, scrollY); } catch (_) {}
      }
    }
    if (ui.tab === "trips" && ui.wiz && ui.wiz.step === 0) renderSuggest();
    requestAnimationFrame(() => { observeReveals(v); syncScrollFx(); });
  }
  function setTab(h) { ui.tab = ["home", "trips", "centres", "alerts", "me"].includes(h) ? h : "home"; if (ui.tab !== "me") ui.meSub = null; buzz(5); if (ui.tab === "alerts") { ui.alertsSub = ui.pendingNotif ? "notif" : null; ui.pendingNotif = false; } render(); window.scrollTo(0, 0); }
  function go(tab) { if (location.hash !== "#" + tab) location.hash = tab; else setTab(tab); }
  window.addEventListener("hashchange", () => setTab(location.hash.slice(1)));

  const ACT = {
    tab: (el) => go(el.dataset.tab),
    set: (el) => { S.settings[el.dataset.k] = el.dataset.v; save(); buzz(); render(); },
    "set-reset": () => { S.settings = { ...DEFAULT_SETTINGS }; save(); render(); toast("Default settings restored"); },
    "me-sub-go": (el) => { ui.meSub = el.dataset.v; go("me"); render(); window.scrollTo(0, 0); },
    "me-sub": (el) => { ui.meSub = el.dataset.v; render(); window.scrollTo(0, 0); },
    "me-back": () => { ui.meSub = null; render(); },
    vguide: (el) => { const v = C.vaccineRef.find((r) => r.key === el.dataset.k); if (v) openSheet(`<h2 id="sheetTitle">${esc(v.name)}</h2>${vaccineDetail(v)}<button class="btn ghost block" style="margin-top:14px" data-act="vguide-all" data-k="${v.key}">Open the full vaccine guide</button>`); },
    "vguide-all": (el) => { closeSheet(); ui.gq = ""; ui.gOpen = el.dataset.k; ui.meSub = "vguide"; go("me"); render(); setTimeout(() => { const d = document.getElementById("vg-" + el.dataset.k); if (d) d.scrollIntoView({ block: "start" }); }, 80); },
    "onb-next": () => { ui.onb = (ui.onb || 0) + 1; render(); },
    "onb-back": () => { ui.onb = Math.max(0, (ui.onb || 0) - 1); render(); },
    "dev-mode": (el) => { setShared(el.dataset.v === "shared"); render(); },
    "add-example": () => { if (!S.trips.some((t) => t.id === "t-example")) S.trips.unshift(exampleTrip()); S.active = "t-example"; ui.tripView = "dash"; save(); go("trips"); render(); toast("Example trip added. Delete it from the trip screen when you're done."); },
    "end-session": () => openSheet(`<h2 id="sheetTitle">End session?</h2><p class="small" style="margin-top:8px">This deletes all trips, ticks and health details entered on this device, ready for the next person.</p><div class="row" style="margin-top:14px"><button class="btn" data-act="end-session-yes">End and clear</button><button class="btn ghost" data-close>Keep going</button></div>`),
    "end-session-yes": () => { wipeAll(); save(); closeSheet(); ui.meSub = null; ui.tripView = "list"; ui.wiz = null; ui.onb = 0; go("home"); render(); toast("Session ended. All data cleared."); },
    "onb-done": () => { S.onboarded = true; ui.onb = 0; save(); go("home"); render(); },
    "replay-onb": () => { S.onboarded = false; ui.onb = 0; save(); render(); window.scrollTo(0, 0); },
    install: async () => {
      if (standalone()) return toast("Already installed on this device");
      if (installPrompt) { installPrompt.prompt(); try { await installPrompt.userChoice; } catch (e) { /* dismissed */ } installPrompt = null; return; }
      const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      openSheet(`<h2 id="sheetTitle">Install YatraSwasthya</h2><ol class="small steps" style="margin-top:12px">${ios ? `<li>Open this page in <b>Safari</b>.</li><li>Tap the <b>Share</b> button.</li><li>Choose <b>Add to Home Screen</b>, then <b>Add</b>.</li>` : `<li>Open this page in <b>Chrome</b> or <b>Edge</b> (not inside another app).</li><li>Open the browser menu <b>⋮</b>.</li><li>Choose <b>Install app</b> or <b>Add to Home screen</b>.</li>`}</ol><p class="tiny muted" style="margin-top:10px">Installed, it opens full screen like any app, and the last-loaded information stays available offline. If the option is missing, open the page directly in the browser rather than inside a preview.</p>`);
    },
    "share-summary": () => { const t = trip(); if (t) share("Travel-health summary", summaryText(t)); },
    "share-card": () => { const t = trip(); if (t) share("Travel-health card", summaryText(t)); },
    ics: () => { const t = trip(); if (!t) return; download(`travel-health-${t.stops.map((s) => s.country).join("-")}.ics`, "text/calendar", icsFor(t)); toast("Calendar file ready. Open it to add the reminders."); },
    export: () => { download(`yatraswasthya-backup-${today()}.json`, "application/json", JSON.stringify({ app: "yatraswasthya", version: 1, exported: new Date().toISOString(), data: S }, null, 1)); toast("Backup saved"); },
    import: () => { const f = $("#importFile"); f.value = ""; f.click(); },
    src: (el) => srcSheet(el.dataset.id, el.dataset.asof || null, el.dataset.extra),
    "open-trip": (el) => { S.active = el.dataset.id; save(); ui.tripView = "dash"; ui.wiz = null; go("trips"); render(); },
    "open-sub": (el) => { if (el.dataset.id) S.active = el.dataset.id; ui.tripView = el.dataset.sub; ui.wiz = null; if (!trip() && el.dataset.sub === "emergency") { ui.tab = "trips"; } go("trips"); render(); },
    sub: (el) => { const o = SUBS.findIndex(([k]) => k === ui.tripView), n = SUBS.findIndex(([k]) => k === el.dataset.sub); ui.slide = o < 0 || n < 0 ? null : n > o ? "l" : "r"; ui.tripView = el.dataset.sub; render(); window.scrollTo(0, 0); },
    dash: () => { ui.tripView = "dash"; render(); },
    "trip-list": () => { ui.tripView = "list"; render(); },
    "home-back": () => go("home"),
    "trip-centres": () => { ui.vaccineFilter = "yf"; ui.cState = S.profile.state; ui.cCity = S.profile.city; go("centres"); },
    "find-centre": (el) => { ui.vaccineFilter = el.dataset.v === "other" ? "other" : el.dataset.v; ui.cState = S.profile.state; ui.cCity = S.profile.city; go("centres"); },
    "del-trip": () => openSheet(`<h2 id="sheetTitle">Delete this trip?</h2><p class="small" style="margin-top:8px">Its checklist and vaccine statuses on this device will be removed.</p><div class="row" style="margin-top:14px"><button class="btn" data-act="del-trip-yes">Delete</button><button class="btn ghost" data-close>Cancel</button></div>`),
    "del-trip-yes": () => {
      const gone = S.trips.find((t) => t.id === S.active), idx = S.trips.indexOf(gone);
      S.trips = S.trips.filter((t) => t !== gone); S.active = S.trips[0] ? S.trips[0].id : null; save(); closeSheet(); ui.tripView = "list"; buzz(15); render();
      if (gone) toast("Trip deleted", "Undo", () => { S.trips.splice(idx, 0, gone); S.active = gone.id; save(); render(); });
    },
    "new-trip": () => { ui.wiz = { step: 0, stops: [], depart: "", ret: "", state: S.profile.state, city: S.profile.city, age: S.profile.age, type: "city", flags: { ...(S.profile.flags || {}) }, q: "" }; buzz(); go("trips"); render(); window.scrollTo(0, 0); setTimeout(() => { const q = document.getElementById("cq"); if (q && matchMedia("(min-width: 600px)").matches) q.focus(); }, 60); },
    "wiz-cancel": () => { if (!ui.wiz.stops.length) return ACT["wiz-discard"](); openSheet(`<h2 id="sheetTitle">Discard this new trip?</h2><p class="small" style="margin-top:8px">The countries and dates you entered will be lost.</p><div class="row" style="margin-top:14px"><button class="btn" data-close>Keep editing</button><button class="btn ghost" style="color:var(--req);border-color:var(--req)" data-act="wiz-discard">Discard</button></div>`); },
    "wiz-discard": () => { closeSheet(); ui.wiz = null; ui.tripView = "list"; render(); },
    "wiz-back": () => { if (ui.wiz.step === 0) { ui.wiz = null; } else ui.wiz.step--; render(); },
    "wiz-next": () => { ui.wiz.step++; render(); window.scrollTo(0, 0); },
    "wiz-add": (el) => { ui.wiz.stops.push({ country: el.dataset.id, kind: "stay", regions: [] }); ui.wiz.q = ""; render(); },
    "wiz-rm": (el) => { ui.wiz.stops.splice(+el.dataset.i, 1); render(); },
    "wiz-kind": (el) => { ui.wiz.stops[+el.dataset.i].kind = el.dataset.k; render(); },
    "wiz-region": (el) => { const s = ui.wiz.stops[+el.dataset.i], r = el.dataset.r; s.regions = s.regions.includes(r) ? s.regions.filter((x) => x !== r) : [...s.regions, r]; render(); },
    "wiz-set": (el) => { ui.wiz[el.dataset.k] = el.dataset.v; render(); },
    "wiz-done": () => {
      const w = ui.wiz, id = "t-" + uid();
      S.trips.push({ id, stops: w.stops, depart: w.depart, ret: w.ret, type: w.type });
      S.profile = { ...S.profile, state: w.state, city: w.city, age: w.age, flags: w.flags };
      S.active = id; S.vacc[id] = {}; S.checks[id] = {};
      w.stops.forEach((s) => { if (!S.followed.includes(s.country)) S.followed.push(s.country); });
      save(); ui.wiz = null; ui.tripView = "dash"; render(); window.scrollTo(0, 0); toast("Plan ready. Alerts for these countries are followed.");
    },
    vstatus: (el) => { const t = trip(); S.vacc[t.id] = S.vacc[t.id] || {}; const cur = S.vacc[t.id][el.dataset.k]; S.vacc[t.id][el.dataset.k] = cur === el.dataset.v ? undefined : el.dataset.v; save(); render(); },
    "risk-f": (el) => { ui.risksFilter = el.dataset.v; render(); },
    af: (el) => { ui.alertsFilter = el.dataset.v; render(); },
    alert: (el) => { const id = el.dataset.id; const a = [...new Set([...C.alerts.map((x) => x.country), ...Object.keys(D.whoPolio)])].flatMap(alertsFor).find((x) => x.id === id); if (!a) return; S.seen[id] = true; save(); openSheet(`<div id="sheetTitle"></div>` + alertCard(a, true) + `<div class="row" style="margin-top:12px">${S.followed.includes(a.country) ? `<button class="btn ghost" data-act="unfollow" data-id="${a.country}">Stop following ${esc(cname(a.country))}</button>` : `<button class="btn" data-act="follow" data-id="${a.country}">Follow ${esc(cname(a.country))}</button>`}</div>`); render(); },
    follow: (el) => { if (!S.followed.includes(el.dataset.id)) S.followed.push(el.dataset.id); save(); closeSheet(); render(); toast("Following " + cname(el.dataset.id)); },
    unfollow: (el) => { S.followed = S.followed.filter((x) => x !== el.dataset.id); save(); closeSheet(); render(); },
    "go-notif": () => { if (ui.tab !== "alerts") { ui.pendingNotif = true; go("alerts"); } else { ui.alertsSub = "notif"; render(); } },
    "alerts-back": () => { ui.alertsSub = null; render(); },
    nmode: (el) => { S.notif.mode = el.dataset.v; save(); render(); },
    cv: (el) => { ui.vaccineFilter = el.dataset.v; render(); },
    report: (el) => openSheet(`<h2 id="sheetTitle">Report outdated information</h2><p class="small muted" style="margin-top:6px">${esc(D.centres.find((c) => c.code === el.dataset.code).name)}</p><form id="repForm" class="stack" style="margin-top:12px" data-code="${esc(el.dataset.code)}"><label class="f" for="rf">What looks wrong?<select id="rf" name="field"><option>Phone number</option><option>Days or timings</option><option>Registration method</option><option>Address</option><option>Centre closed or not vaccinating</option><option>Other</option></select></label><label class="f" for="rn">Details (optional)<textarea id="rn" name="note" rows="3" placeholder="What did you find? Please don't include personal details."></textarea></label><p class="tiny muted">Reports are checked by the app team against the MoHFW register and by phone. A report never changes the listing by itself.</p><button class="btn" type="submit">Send report</button></form>`),
    "prof-age": (el) => { S.profile.age = el.dataset.v; save(); render(); },
    reset: () => openSheet(`<h2 id="sheetTitle">Reset all data?</h2><p class="small" style="margin-top:8px">Removes your trips, checklist progress, contacts and reports from this browser, and restores the example trip.</p><div class="row" style="margin-top:14px"><button class="btn" data-act="reset-yes">Reset</button><button class="btn ghost" data-close>Cancel</button></div>`),
    "reset-yes": () => { wipeAll(); S.onboarded = true; ui.meSub = null; save(); closeSheet(); render(); toast("Data reset"); },
    "copy-summary": () => { const t = trip(); if (t) copy(summaryText(t)); },
    "brief-generate": (el) => { const t = S.trips.find((x) => x.id === el.dataset.id) || trip(); if (t) requestBrief(t); },
    "brief-rule": (el) => { const t = S.trips.find((x) => x.id === el.dataset.id) || trip(); if (!t) return; const b = briefStore(t.id); const inp = briefInputFromStore(t,b); const rb = ruleBasedBrief(t, inp); ui.briefState = { tripId: t.id, status: "ok", result: rb, fallback: true, fallbackReason: "Rule-based brief (generated without AI)." }; b.last = { at: new Date().toISOString(), result: rb, fallback: true, fallbackReason: "Rule-based brief (generated without AI)." }; save(); render(); },
    "brief-clear": (el) => { const t = S.trips.find((x) => x.id === el.dataset.id) || trip(); if (!t) return; clearBriefDetails(t.id); ui.briefState = { tripId: t.id, status: "idle" }; save(); render(); toast("Personal details cleared from this browser"); },
    "eval-run-rule": (el) => { const p = EVAL_PROFILES.find((x) => x.id === el.dataset.id); if (!p) return; const store = evalResultStore(); store[p.id] = store[p.id] || {}; store[p.id].rule = evalRuleForProfile(p); save(); render(); },
    "eval-run-ai": (el) => { const p = EVAL_PROFILES.find((x) => x.id === el.dataset.id); if (p) runEvalAI(p); },
    "eval-export-json": () => exportEvalJson(),
    "eval-export-csv": () => exportEvalCsv(),
    copy: (el) => copy(el.dataset.text),
  };
  const ON = {
    gq: (el) => { ui.gq = el.value; const q = el.value.toLowerCase(); const box = document.getElementById("glist"); if (box) box.innerHTML = guideList(C.vaccineRef.filter((v) => !q || JSON.stringify(v).toLowerCase().includes(q))); },
    "set-t": (el) => { S.settings[el.dataset.k] = el.checked; save(); buzz(); render(); },
    import: (el) => {
      const f = el.files && el.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => { try { const j = JSON.parse(r.result), d = j && j.app === "yatraswasthya" ? j.data : null; if (!d || !Array.isArray(d.trips) || !d.profile) throw new Error("bad"); S = d; migrate(); S.onboarded = true; save(); ui.meSub = null; ui.tripView = "list"; render(); toast(`Restored ${S.trips.length} trip${S.trips.length === 1 ? "" : "s"}`); } catch (e) { toast("That file isn't a YatraSwasthya backup"); } };
      r.readAsText(f);
    },
    "wiz-q": (el) => { ui.wiz.q = el.value; renderSuggest(); },
    "wiz-date": (el) => { ui.wiz[el.dataset.k] = el.value; if (el.dataset.k === "depart" && ui.wiz.ret && ui.wiz.ret < el.value) ui.wiz.ret = ""; render(); },
    "wiz-field": (el) => { ui.wiz[el.dataset.k] = el.value; if (el.dataset.k === "state") { ui.wiz.city = ""; render(); } },
    "wiz-flag": (el) => { ui.wiz.flags[el.dataset.k] = el.checked; },
    check: (el) => { const t = trip(); S.checks[t.id] = S.checks[t.id] || {}; S.checks[t.id][el.dataset.id] = el.checked; save(); buzz(el.checked ? 12 : 5); render(); },
    cstate: (el) => { ui.cState = el.value; ui.cCity = ""; ui.centreQ = ""; render(); },
    ccity: (el) => { ui.cCity = el.value; render(); },
    cq: (el) => { ui.centreQ = el.value; const pos = el.selectionStart; render(); const n = $("#cq2"); n.focus(); n.setSelectionRange(pos, pos); },
    hd: (el) => { ui.hideDefence = el.checked; render(); },
    notif: (el) => { S.notif[el.dataset.k] = el.checked; save(); render(); },
    prof: (el) => { S.profile[el.dataset.k] = el.value; S.profileSet = true; save(); },
    pflag: (el) => { S.profile.flags = S.profile.flags || {}; S.profile.flags[el.dataset.k] = el.checked; save(); },
    em: (el) => { S.emergency = S.emergency || {}; S.emergency[el.dataset.k] = el.value; save(); },
    brief: (el) => {
      const tid = el.dataset.tid; if (!tid) return; const b = briefStore(tid); const k = el.dataset.k || "";
      const val = el.type === "checkbox" ? !!el.checked : el.value;
      if (k === "pregnant") b.pregnant = String(val) === "yes" || val === true;
      else if (k === "climate.symptom") {
        const sym = el.dataset.sym; b.climate.symptoms = Array.isArray(b.climate.symptoms) ? b.climate.symptoms : [];
        if (el.checked) { if (!b.climate.symptoms.includes(sym)) b.climate.symptoms.push(sym); }
        else b.climate.symptoms = b.climate.symptoms.filter((x) => x !== sym);
      } else if (k.indexOf("climate.") === 0) {
        const ck = k.slice(8);
        if (["smoking", "asthmaCopd"].includes(ck)) b.climate[ck] = !!el.checked;
        else b.climate[ck] = val;
      } else {
        b[k] = val;
      }
      save();
      if (k === "climate.symptom" || k === "ageGroup" || k === "pregnant" || k === "climate.asthmaCopd" || k === "climate.smoking" || k === "climate.outdoorHours" || k === "climate.aqi" || k === "climate.pm25" || k === "climate.tempC" || k === "climate.humidityPct" || k === "climate.heatCategory") render();
    },
    "eval-score": (el) => {
      const pid = el.dataset.pid, side = el.dataset.side, field = el.dataset.field; if (!pid || !side || !field) return;
      const row = evalScoreRow(pid);
      if (side === "meta") row[field] = el.value;
      else { if (!row[side]) row[side] = {}; row[side][field] = el.value; }
      save();
    },
  };

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) { closeSheet(); return; }
    const tabA = e.target.closest("#tabs a[data-tab]");
    if (tabA && tabA.dataset.tab === "trips" && !ui.wiz) { ui.tripView = "list"; if (ui.tab === "trips") { render(); window.scrollTo(0, 0); } }
    const el = e.target.closest("[data-act]");
    if (el && ACT[el.dataset.act]) { e.preventDefault(); ACT[el.dataset.act](el, e); }
  });
  document.addEventListener("input", (e) => { const el = e.target.closest("[data-on]"); if (!el || !ON[el.dataset.on]) return; if (["wiz-q", "cq", "prof", "em", "gq", "brief", "eval-score"].includes(el.dataset.on)) ON[el.dataset.on](el); });
  document.addEventListener("change", (e) => { const el = e.target.closest("[data-on]"); if (!el || !ON[el.dataset.on]) return; if (!["wiz-q", "cq", "prof", "em", "gq", "brief", "eval-score"].includes(el.dataset.on)) ON[el.dataset.on](el); });
  document.addEventListener("submit", (e) => {
    if (e.target.id !== "repForm") return;
    e.preventDefault();
    const f = e.target, fd = new FormData(f);
    S.reports.push({ code: f.dataset.code, field: fd.get("field"), note: String(fd.get("note") || "").slice(0, 500), date: today() });
    save(); closeSheet(); render(); toast("Thanks. The team will re-check this listing.");
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#sheet").hidden) closeSheet(); });

  /* ---------- ambient motion (scroll-chasing bg + reveals) ---------- */
  const motionOn = () => !((S && S.settings && S.settings.motion === "off") || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches));
  let fxRAF = 0;
  function syncScrollFx() {
    if (!motionOn()) { document.documentElement.style.setProperty("--scroll-y", "0px"); return; }
    if (fxRAF) return;
    fxRAF = requestAnimationFrame(() => {
      fxRAF = 0;
      const y = Math.max(0, window.scrollY || window.pageYOffset || 0);
      document.documentElement.style.setProperty("--scroll-y", y + "px");
    });
  }
  let revealObs = null;
  function observeReveals(root) {
    if (!motionOn()) {
      (root || document).querySelectorAll(".reveal, .reveal-pending").forEach((el) => { el.classList.remove("reveal-pending"); el.classList.add("reveal", "in"); });
      return;
    }
    if (!("IntersectionObserver" in window)) {
      (root || document).querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
      return;
    }
    if (!revealObs) {
      revealObs = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); revealObs.unobserve(en.target); } });
      }, { threshold: 0.08, rootMargin: "0px 0px -8% 0px" });
    }
    const scope = root || document;
    const nodes = scope.querySelectorAll(".card, .banner, .notice, details.grp, .tile, .menu, .hero, .hcard, .li, .list");
    nodes.forEach((el) => {
      if (el.classList.contains("reveal")) return;
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92 && r.bottom > 0) { el.classList.add("reveal", "in"); }
      else { el.classList.add("reveal", "reveal-pending"); revealObs.observe(el); }
    });
  }

  // expose engine for tests
  window.__YS = { assess, checklist, timeline, byId, S: () => S };
  // swipe left/right between trip sections
  let tx = null, ty = 0;
  document.addEventListener("touchstart", (e) => { if (ui.tab === "trips" && ui.tripView !== "list" && !ui.wiz && $("#sheet").hidden && !e.target.closest(".subnav,input,select,textarea,.seg")) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; } else tx = null; }, { passive: true });
  document.addEventListener("touchend", (e) => {
    if (tx == null) return; const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; tx = null;
    if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) * 0.6) return;
    const i = SUBS.findIndex(([k]) => k === ui.tripView), j = i + (dx < 0 ? 1 : -1);
    if (i < 0 || j < 0 || j >= SUBS.length) return;
    ui.slide = dx < 0 ? "l" : "r"; ui.tripView = SUBS[j][0]; buzz(5); render(); window.scrollTo(0, 0);
  }, { passive: true });

  window.addEventListener("scroll", syncScrollFx, { passive: true });
  if (window.matchMedia) {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onM = () => { syncScrollFx(); try { render(); } catch (_) {} };
    if (mql.addEventListener) mql.addEventListener("change", onM); else if (mql.addListener) mql.addListener(onM);
  }

  const h0 = location.hash.slice(1);
  if (["home", "trips", "centres", "alerts", "me"].includes(h0)) ui.tab = h0;
  else { const st = S.settings.start; ui.tab = st === "trip" ? "trips" : st; if (st === "trip") ui.tripView = trip() ? "dash" : "list"; }
  render();
  syncScrollFx();
})();
