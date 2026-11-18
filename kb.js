/* Knowledge base: international law (IHR), WHO and CDC references, and verified India availability
   for non-yellow-fever travel vaccines. Checked 13 Nov 2026. */
(function () {
  const C = window.CURATED;
  Object.assign(C.sources, {
    "who-ihr": { pub: "WHO", title: "International Health Regulations (2005) as amended in 2014, 2022 and 2024 (in force from 19 Sep 2025)", url: "https://apps.who.int/gb/bd/pdf_files/IHR_2014-2022-2024-en.pdf", docDate: "2025-09-19", tier: 1, group: "law" },
    "who-ihr-2025": { pub: "WHO", title: "News release: amended International Health Regulations enter into force, 19 Sep 2025", url: "https://www.who.int/news/item/19-09-2025-amended-international-health-regulations-enter-into-force", docDate: "2025-09-19", tier: 1, group: "law" },
    "who-ihr-annex7": { pub: "WHO", title: "IHR Annex 7 amendment: yellow-fever certificate valid for the life of the person vaccinated (from 11 Jul 2016)", url: "https://www.who.int/docs/default-source/documents/emergencies/travel-advice/extension-to-life-on-yellow-fever-vaccination-en.pdf", docDate: "2016-07-11", tier: 1, group: "law", evergreen: true },
    "who-typhoid-pp": { pub: "WHO", title: "WHO position paper on typhoid vaccines (WER No. 32, 2026)", url: "https://www.who.int/publications/i/item/who-wer10132-166-180", docDate: "2026-08-18", tier: 1, group: "who" },
    "cdc-yb-typhoid": { pub: "US CDC", title: "CDC Yellow Book 2026: Typhoid and paratyphoid fever", url: "https://www.cdc.gov/yellow-book/hcp/travel-associated-infections-diseases/typhoid-and-paratyphoid-fever.html", docDate: "2025-04-23", tier: 2, group: "cdc" },
    "cdc-yb-hepa": { pub: "US CDC", title: "CDC Yellow Book 2026: Hepatitis A", url: "https://www.cdc.gov/yellow-book/hcp/travel-associated-infections-diseases/hepatitis-a.html", docDate: "2025-04-23", tier: 2, group: "cdc" },
    "cdc-yb-lmt": { pub: "US CDC", title: "CDC Yellow Book 2026: Last-minute travelers (single-dose vaccines)", url: "https://www.cdc.gov/yellow-book/hcp/preparing-international-travelers/last-minute-travelers.html", docDate: "2025-04-23", tier: 2, group: "cdc" },
    "cdc-yb-principles": { pub: "US CDC", title: "CDC Yellow Book 2026: Vaccination and immunoprophylaxis, general principles", url: "https://www.cdc.gov/yellow-book/hcp/preparing-international-travelers/vaccination-and-immunoprophylaxis-general-principles.html", docDate: "2025-04-23", tier: 2, group: "cdc" },
    "nhm-uip": { pub: "MoHFW (National Health Mission)", title: "Universal Immunization Programme: vaccines provided free (children and pregnant women)", url: "https://nhm.gov.in/index1.php?lang=1&level=2&sublinkid=824&lid=220", docDate: null, tier: 1, group: "india" },
    "nvhcp-plan": { pub: "MoHFW (NVHCP)", title: "National Action Plan: Combating Viral Hepatitis in India (hepatitis B in UIP: birth dose plus 6, 10, 14 weeks)", url: "https://nvhcp.mohfw.gov.in/common_libs/National-Action-Plan-Combating-Viral-Hepatitis-in-India.pdf", docDate: "2019-01-01", tier: 1, group: "india", evergreen: true },
    "tcv-india-review": { pub: "Vaccine: X (peer-reviewed, Mogasale et al. 2024)", title: "Typhoid conjugate vaccine implementation in India: TCVs sold in the private market; NTAGI recommended UIP inclusion (2022)", url: "https://www.coalitionagainsttyphoid.org/publications/typhoid-conjugate-vaccine-implementation-in-india-a-review-of-supportive-evidence/", docDate: "2024-01-01", tier: 2, group: "india", evergreen: true },
    "aiims-bbsr-travel": { pub: "AIIMS Bhubaneswar", title: "Travel Health Clinic, Dept. of Community and Family Medicine", url: "https://aiimsbhubaneswar.nic.in/travel-health-clinic/", docDate: null, tier: 1, group: "india" },
    "aiims-rishikesh-avc": { pub: "AIIMS Rishikesh", title: "Community and Family Medicine: Adult Vaccination Centre and Yellow Fever Vaccination Centre", url: "https://aiimsrishikesh.edu.in/a1_1/?page_id=1063", docDate: null, tier: 1, group: "india" },
    "aiims-nagpur-yf": { pub: "AIIMS Nagpur", title: "Yellow Fever Vaccination Centre at the Adult Immunisation Clinic (opened 23 Apr 2026)", url: "https://aiimsnagpur.edu.in/news/news/the-yellow-fever-vaccination-centre-started-at-aiims-nagpur", docDate: "2026-04-23", tier: 1, group: "india" },
  });
  // Existing sources: tag their groups for the Knowledge base screen; mark fixed legal texts as evergreen.
  const G = { "who-ith-2022": "who", "who-ith": "who", "who-polio-ec45": "who", "who-afro-kenya-w41": "who", "cdc-yb-yf": "cdc", "mohfw-yf": "india", "mohfw-yfvc": "india", "mohfw-polio": "india", "mohfw-ebola-advisory": "india", "mea-missions": "mea", "mea-madad": "mea", "mea-emergency": "mea" };
  Object.entries(C.sources).forEach(([id, s]) => { if (!s.group) s.group = G[id] || (/^cdc|^us CDC/i.test(id) || /CDC/.test(s.pub) ? "cdc" : /NaTHNaC/.test(s.pub) ? "other-gov" : /^(hci|mea)/.test(id) ? "mea" : "dest"); });
  C.sources["mohfw-polio"].evergreen = true; // legal order in force until replaced

  C.sources["who-ith-ch6"] = { pub: "WHO", title: "International Travel and Health, chapter 6: yellow fever vaccine (certificate valid from day 10, for life; medical exemption letter if contraindicated)", url: "https://cdn.who.int/media/docs/default-source/travel-and-health/9789241580472-eng-chapter-6.pdf", docDate: null, tier: 1, group: "who" };
  C.sources["mohfw-yf"].title = "Yellow fever vaccination: content for the public (contraindications, side effects, endemic-country list, quarantine, validity, fee)";

  /* MoHFW (IHPOE) yellow-fever contraindications, as published on ihpoe.mohfw.gov.in/vaccination.php (checked 14 Nov 2026). */
  C.yfContra = {
    contra: [
      "Allergy to eggs, chicken or gelatin. The vaccine is prepared in chick embryos; people allergic to egg protein must not take it, as it can cause a severe, possibly fatal, allergic reaction.",
      "Pregnant women, or anyone who could be pregnant now or in the next two weeks.",
      "Infants younger than 9 months.",
      "People with HIV/AIDS, including CD4 count below 200 per mm³ or below 15% of total lymphocytes.",
      "Weakened immunity from cancer or other conditions, a transplant, radiotherapy, or drugs such as steroids, cancer chemotherapy or other immune-affecting medicines.",
      "Acute or moderate illness, with or without fever: postpone until well.",
      "Thymus disorders such as myasthenia gravis, DiGeorge syndrome or thymoma, or thymus removed.",
      "Major liver or kidney disease.",
    ],
    notes: [
      "Nursing mothers should avoid or postpone travel to an area with yellow-fever risk.",
      "Adults 60 and over, or with conditions such as diabetes or hypertension, may be at higher risk of side effects.",
      "The final decision to vaccinate rests with the Nodal Officer of the yellow-fever centre, after weighing risk against benefit.",
    ],
  };

  /* Travel-vaccine facts for India (schedule from WHO/CDC; availability from Indian official sources). */
  C.vaccineInfo = {
    typhoid: {
      schedule: "Injectable: 1 dose at least 2 weeks before travel (CDC). Typhoid conjugate vaccines (TCV) give longer protection than the older Vi polysaccharide vaccine (WHO, 2026). Not 100% effective; no vaccine protects against paratyphoid.",
      india: "Available in India in the private sector on a doctor's prescription: typhoid conjugate vaccines are sold in the private market. Not part of the free Universal Immunization Programme (NTAGI recommended adding TCV; national introduction not confirmed by an official source).",
      status: "private", srcs: ["cdc-yb-typhoid", "who-typhoid-pp", "tcv-india-review", "nhm-uip"] },
    hepa: {
      schedule: "2 doses, 6 to 12 months apart. One dose before departure gives protection for the trip; adults over 40, people with weak immunity or liver disease should get the first dose as soon as travel is planned (CDC).",
      india: "Available in India in the private sector on prescription. Not part of the free Universal Immunization Programme. Many adults raised in India are already immune; your doctor may test before vaccinating.",
      status: "private", srcs: ["cdc-yb-hepa", "nhm-uip"] },
    hepb: {
      schedule: "3 doses at 0, 1 and 6 months; accelerated schedules exist for last-minute travel (CDC). Start early.",
      india: "Free under the Universal Immunization Programme for infants only (birth dose, then 6, 10, 14 weeks). Adults: private sector, and some Government adult-vaccination clinics (verified: AIIMS Rishikesh).",
      status: "mixed", srcs: ["nvhcp-plan", "nhm-uip", "aiims-rishikesh-avc", "cdc-yb-lmt"] },
    rabies: {
      schedule: "Pre-exposure: 2 or 3 doses before travel depending on the schedule your doctor uses. After any bite abroad you still need prompt post-exposure care.",
      india: "Anti-rabies vaccine is widely used in Government hospitals for post-exposure care. Pre-exposure vaccination for travel: private sector, and some Government adult-vaccination clinics (verified: AIIMS Rishikesh).",
      status: "mixed", srcs: ["aiims-rishikesh-avc", "cdc-yb-principles"] },
    mening: {
      schedule: "1 dose of quadrivalent ACYW vaccine, at least 10 days before arrival for Saudi pilgrim rules. Conjugate vaccine is preferred.",
      india: "Haj Committee of India pilgrims are vaccinated through the Committee's process. Others: private sector on prescription; Government availability for private travellers is not verified.",
      status: "mixed", srcs: ["moh-sa-umrah"] },
  };

  /* Government clinics verified to offer adult or travel vaccination beyond yellow fever. Stock varies: call first. */
  C.govClinics = [
    { name: "Travel Health Clinic, AIIMS Bhubaneswar", city: "Bhubaneswar", state: "Odisha", where: "Room 52, Block C, OPD Complex", days: "Monday and Thursday (working days)", time: "Registration 7:30 am to 1 pm and 2 to 3 pm; vaccination 9 am to 1 pm and 2 to 3:30 pm", phone: "0674-2476789", email: "vaccines@aiimsbhubaneswar.edu.in",
      offers: "Pre-travel consultation and vaccination. Lists hepatitis A, typhoid, rabies, hepatitis B, meningococcal and yellow fever among travellers' vaccines; the page does not say which are stocked on a given day.", bring: "Travel details and original passport or ID", src: "aiims-bbsr-travel" },
    { name: "Adult Vaccination Centre, AIIMS Rishikesh", city: "Rishikesh", state: "Uttarakhand", where: "Dept. of Community and Family Medicine",
      offers: "Adult vaccines given in the past year included rabies, hepatitis B, pneumococcal, influenza, HPV and MMR. Typhoid and hepatitis A: not stated.", src: "aiims-rishikesh-avc" },
    { name: "Adult Immunisation Clinic, AIIMS Nagpur", city: "Nagpur", state: "Maharashtra", where: "Room 24, Ground Floor, IPD Block",
      offers: "Hosts the yellow-fever centre. Which other adult travel vaccines it stocks: Information not verified.", src: "aiims-nagpur-yf" },
  ];
})();

/* ===== Travel vaccine reference (checked 15 Nov 2026) ===== */
(function () {
  const C = window.CURATED;
  Object.assign(C.sources, {
    "who-rabies-2018": { pub: "WHO", title: "Rabies vaccines and immunoglobulins: WHO position paper, April 2018 (summary)", url: "https://cdn.who.int/media/docs/default-source/immunization/position_paper_documents/rabies/pp-rabies-summary-2018.pdf", docDate: "2018-04-19", tier: 1, group: "who", evergreen: true },
    "nrcp-prep": { pub: "MoHFW (National Rabies Control Programme)", title: "Rabies prophylaxis guideline decisions: PrEP days 0, 7, 21/28 (ID or IM); travellers as a high-risk group", url: "https://rabiesfreeindia.mohfw.gov.in/resources/uploads/PageContentPdf/170687215557.pdf", docDate: null, tier: 1, group: "india" },
    "who-hepa-2022": { pub: "WHO", title: "Hepatitis A vaccines: WHO position paper, October 2022 (summary)", url: "https://cdn.who.int/media/docs/default-source/immunization/position_paper_documents/hepatitis/sage_hepatitisa_positionpaper_summary_2022.pdf", docDate: "2022-10-07", tier: 1, group: "who", evergreen: true },
    "who-cholera": { pub: "WHO", title: "Cholera vaccines (position paper 2017): oral vaccines, doses and intervals", url: "https://www.who.int/teams/immunization-vaccines-and-biologicals/diseases/cholera", docDate: "2017-08-25", tier: 1, group: "who", evergreen: true },
    "who-pp-table": { pub: "WHO", title: "Summary of WHO position papers: recommendations for routine immunization (Table 1)", url: "https://cdn.who.int/media/docs/default-source/immunization/tables/immunization-routine-table1.pdf", docDate: null, tier: 1, group: "who" },
    "cdc-typhoid-hcp": { pub: "US CDC", title: "Clinical guidance for typhoid and paratyphoid fever: vaccines, ages, timing, boosters", url: "https://www.cdc.gov/typhoid-fever/hcp/clinical-guidance/index.html", docDate: null, tier: 2, group: "cdc" },
    "cdc-adult-sched": { pub: "US CDC", title: "Adult immunization schedule notes (hepatitis A and B, MenACWY travel boosters)", url: "https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-notes.html", docDate: null, tier: 2, group: "cdc" },
    "cdc-yb-children": { pub: "US CDC", title: "CDC Yellow Book: travel vaccine recommendations for infants and children", url: "https://www.cdc.gov/yellow-book/hcp/family-travel/travel-vaccine-recommendations-for-infants-and-children.html", docDate: null, tier: 2, group: "cdc" },
    "pib-uip-2026": { pub: "PIB, Government of India", title: "Universal Immunisation Programme schedule (National Vaccination Day, March 2026), incl. JE in endemic districts", url: "https://static.pib.gov.in/WriteReadData/specificdocs/documents/2026/mar/doc2026320830601.pdf", docDate: "2026-03-16", tier: 1, group: "india" },
    "fda-ixchiq": { pub: "US FDA", title: "FDA update on the safety of Ixchiq (chikungunya vaccine, live): licence suspended 22 Aug 2025", url: "https://www.fda.gov/vaccines-blood-biologics/safety-availability-biologics/fda-update-safety-ixchiq-chikungunya-vaccine-live", docDate: "2025-08-22", tier: 2, group: "other-gov" },
    "nathnac-chik": { pub: "UK NaTHNaC (TravelHealthPro)", title: "Chikungunya vaccination information (Ixchiq and Vimkunya)", url: "https://www.travelhealthpro.org.uk/news/843/chikungunya-vaccination-information", docDate: "2025-08-29", tier: 2, group: "other-gov" },
  });

  /* General rules that apply to every traveller */
  C.vaccinePrinciples = [
    { t: "Start early", b: "Ideally see a travel-medicine doctor 4 to 8 weeks before departure; some vaccines need several doses or time to work.", src: "cdc-yb-principles" },
    { t: "Short of time? Still go", b: "Several vaccines give useful protection from a single dose even close to departure: hepatitis A, influenza, meningococcal ACWY, polio (IPV) booster, injectable typhoid, tetanus-diphtheria, and cholera for selected travellers.", src: "cdc-yb-lmt" },
    { t: "Live vaccines", b: "Yellow fever, MMR, oral typhoid (Ty21a), live hepatitis A and live JE vaccines are live. They are generally avoided in pregnancy and in weakened immunity. Two live injectable vaccines are given on the same day or at least 4 weeks apart.", src: "cdc-yb-principles" },
    { t: "Keep records", b: "Ask for every dose to be written on your vaccination card. Yellow-fever proof must be the International Certificate (ICVP) from a Government-authorised centre.", src: "mohfw-yf" },
    { t: "Vaccines are not the whole answer", b: "No vaccine protects against malaria, dengue or traveller's diarrhoea. Food and water care and mosquito-bite prevention still matter.", src: "who-ith-ch6" },
  ];

  /* Per-vaccine reference. Rows in `options`: [product/type, age, dose & route, schedule, booster]. */
  C.vaccineRef = [
    { key: "yf", name: "Yellow fever", type: "Live attenuated",
      who: "Travellers aged 9 months or more going to yellow-fever risk areas; legally required by some countries and by India on return from listed countries.",
      options: [["Yellow-fever vaccine", "9 months and over", "0.5 mL, single injection", "1 dose; certificate valid from day 10", "None: valid for life (IHR Annex 7)"]],
      timing: "At least 10 days before arriving in a risk area (and before returning to India, for India's rule).",
      contra: ["Infants under 9 months (WHO: contraindicated under 6 months, not recommended at 6–8 months except in epidemics)", "Allergy to eggs, chicken or gelatin", "Pregnancy (now or within two weeks)", "HIV with CD4 below 200/mm³ or other weakened immunity", "Thymus disorder or thymus removed", "Major liver or kidney disease"],
      caution: ["Acute illness: postpone", "Breastfeeding: avoid or postpone travel to risk areas", "Age 60+ or diabetes, hypertension: higher risk of side effects; the Nodal Officer decides"],
      india: "Only at Government-authorised yellow-fever centres (75 listed in the Centres tab). Rs 300 per dose at Government centres.",
      srcs: ["mohfw-yf", "who-ihr-annex7", "who-pp-table"] },
    { key: "typhoid", name: "Typhoid", type: "Conjugate (TCV) or polysaccharide (ViPS): inactivated injections. Ty21a: live oral",
      who: "Travellers to typhoid-endemic areas, especially long stays, visiting family and friends, or eating outside hotels. South Asia, including Nepal, has high risk.",
      options: [
        ["Typhoid conjugate vaccine (TCV)", "From 6 months; upper age 45 or 65 years depending on product", "0.5 mL IM", "1 dose", "Protection wanes after several years; need for a booster depends on national policy (WHO 2026)"],
        ["Vi polysaccharide (ViPS)", "2 years and over", "0.5 mL IM", "1 dose, at least 2 weeks before travel", "Every 2 years if still at risk (CDC)"],
        ["Oral Ty21a", "6 years and over", "1 capsule by mouth every other day", "4 capsules, finished at least 1 week before travel", "Every 5 years if still at risk (CDC)"],
      ],
      timing: "Injectable: at least 2 weeks before travel. Oral: finish 1 week before.",
      contra: ["Severe allergy to a previous dose or a vaccine component", "Ty21a (live): pregnancy, weakened immunity including HIV"],
      caution: ["Acute fever: postpone either vaccine", "Ty21a: not during acute gastroenteritis; no antibiotics from 72 hours before the first capsule to 72 hours after the last", "No typhoid vaccine prevents paratyphoid; protection is 50–80% for older vaccines, so food and water care still matter"],
      india: "TCVs are sold in India's private market; not in the free national programme for adult travellers.",
      srcs: ["who-typhoid-pp", "cdc-typhoid-hcp", "cdc-yb-typhoid", "tcv-india-review"] },
    { key: "hepa", name: "Hepatitis A", type: "Inactivated (injection) or live attenuated (single dose)",
      who: "Unvaccinated travellers aged 1 year and over to most low- and middle-income destinations. Many adults raised in India are already immune; a blood test can avoid an unnecessary dose.",
      options: [
        ["Inactivated", "12 months and over", "IM", "2 doses, 6 to 18 months apart; WHO also accepts 1 dose in children. Over 40: 2 doses preferred", "None needed after the full course"],
        ["Live attenuated (used in India and China)", "18 months and over", "Subcutaneous", "1 dose", "None"],
      ],
      timing: "Protection starts 2 to 4 weeks after the first dose; give one dose even close to departure.",
      contra: ["Severe allergy to a previous dose or component", "Live vaccine: pregnancy and severe immunosuppression"],
      caution: ["Weakened immunity: 2 doses of inactivated vaccine", "Inactivated vaccine can be considered in pregnancy when the risk is real"],
      india: "Available in the private sector on prescription; not in the free national programme.",
      srcs: ["who-hepa-2022", "who-ith-ch6", "cdc-yb-hepa"] },
    { key: "hepb", name: "Hepatitis B", type: "Recombinant (inactivated)",
      who: "Unvaccinated travellers, especially long stays, possible medical or dental care abroad, tattoos, or new sexual partners.",
      options: [
        ["Standard", "All ages", "IM", "3 doses: 0, 1 and 6 months", "Not routinely"],
        ["Accelerated", "All ages", "IM", "0, 1, 2 and 12 months", "Dose at 12 months completes the course"],
        ["Combined hep A + B (accelerated)", "18 years and over", "IM", "Days 0, 7 and 21–30", "Dose at 12 months"],
        ["Two-dose adjuvanted product (Heplisav-B)", "18 years and over", "IM", "2 doses, 1 month apart", "None. Availability in India: Information not verified"],
      ],
      timing: "Start 6 months before for the standard course, or use an accelerated schedule; even one or two doses give some protection.",
      contra: ["Severe allergy to a previous dose or component (including yeast)"],
      caution: ["Safe in pregnancy and weakened immunity (non-live)"],
      india: "Free under the national programme for infants only (birth, 6, 10, 14 weeks). Adults: private sector and some Government adult-vaccination clinics.",
      srcs: ["cdc-adult-sched", "cdc-yb-lmt", "nvhcp-plan"] },
    { key: "rabies", name: "Rabies (pre-exposure)", type: "Inactivated cell-culture vaccine",
      who: "Travellers likely to meet dogs, monkeys or bats: long stays, rural travel, trekking, cycling, children, places far from good medical care.",
      options: [
        ["WHO 2018 schedule", "All ages", "Intradermal 0.1 mL at 2 sites, or intramuscular 1 dose", "2 visits: days 0 and 7", "Only if high risk continues"],
        ["India (National Rabies Control Programme)", "All ages", "Intradermal 0.1 mL, or intramuscular full dose", "3 visits: days 0, 7 and 21 or 28", "Per programme guidance"],
      ],
      timing: "Finish before departure: 1 week (WHO) or 3–4 weeks (India's schedule).",
      contra: ["Severe allergy to a previous dose (pre-exposure only; after a bite there is no contraindication)"],
      caution: ["Weakened immunity: assessed case by case; antibody testing may be needed", "After any bite or scratch abroad you still need wound washing and 2 vaccine doses (days 0 and 3), but no immunoglobulin"],
      india: "Anti-rabies vaccine is widely available, including in Government hospitals; ask for a pre-exposure course.",
      srcs: ["who-rabies-2018", "nrcp-prep"] },
    { key: "mening", name: "Meningococcal ACWY", type: "Conjugate (preferred) or polysaccharide; non-live",
      who: "Required by Saudi Arabia for Hajj and Umrah pilgrims aged 1 year and over; recommended for the African meningitis belt in the dry season (December to June).",
      options: [["Quadrivalent conjugate (MenACWY)", "Age depends on product; 1 dose from 2 years in most travellers", "IM", "1 dose", "Every 5 years if risk continues (vaccinated at 7+); after 3 years if first dose before age 7"]],
      timing: "At least 10 days before arrival (Saudi rule). Certificate valid 5 years for conjugate, 3 years for polysaccharide.",
      contra: ["Severe allergy to a previous dose or component"],
      caution: ["Make sure the certificate names the vaccine type, or Saudi Arabia treats it as valid for 3 years only"],
      india: "Haj Committee pilgrims are vaccinated through the Committee. Others: private sector on prescription.",
      srcs: ["moh-sa-umrah", "cdc-adult-sched", "cdc-yb-lmt"] },
    { key: "je", name: "Japanese encephalitis", type: "Inactivated (Vero cell) or live attenuated",
      who: "Travellers spending a month or more in rural Asia, or shorter trips with time near rice fields and pigs in the rainy season.",
      options: [
        ["Inactivated Vero-cell", "6 months and over (product-specific)", "IM", "2 doses, 4 weeks apart", "Per product"],
        ["Live attenuated (SA 14-14-2)", "8 months and over", "Subcutaneous", "1 dose (India's programme: 2 doses at 9–12 and 16–24 months in endemic districts)", "Not established"],
      ],
      timing: "Complete the course at least 1 week before travel (CDC).",
      contra: ["Severe allergy to a previous dose", "Live vaccine: pregnancy and weakened immunity"],
      caution: ["Mosquito-bite prevention from dusk to dawn"],
      india: "Free under the national programme for children in endemic districts (and adult campaigns in some). For travellers: private sector; availability varies.",
      srcs: ["who-ith-ch6", "pib-uip-2026", "cdc-yb-principles"] },
    { key: "cholera", name: "Cholera (oral)", type: "Inactivated oral vaccine",
      who: "Not routinely for most travellers. Consider for aid and health workers, or travel to outbreak areas with poor access to care.",
      options: [
        ["Shanchol / Euvichol", "1 year and over", "By mouth", "2 doses, 14 days apart", "After 2–3 years if risk continues"],
        ["Dukoral (with buffer)", "2 years and over", "By mouth", "2 doses 1–6 weeks apart (3 doses at 2–5 years)", "Every 2 years (every 6 months at 2–5 years)"],
      ],
      timing: "Finish at least 1 week before travel.",
      contra: ["Severe allergy to a previous dose"],
      caution: ["Avoid food and drink 1 hour before and after Dukoral", "Safe water and food remain the main protection"],
      india: "Availability for individual travellers: Information not verified.",
      srcs: ["who-cholera", "who-pp-table", "cdc-yb-lmt"] },
    { key: "polio", name: "Polio (OPV or IPV)", type: "Oral live (OPV) or inactivated injection (IPV)",
      who: "Required by India for residents and NRIs travelling to the 11 countries on India's June 2024 list. Adults who completed childhood polio vaccination may get one lifetime IPV booster for destinations with recent poliovirus.",
      options: [["India's rule (MoHFW 2024)", "All ages", "OPV or IPV", "1 dose at least 4 weeks before departure, with a certificate", "Per WHO travel recommendations"]],
      timing: "At least 4 weeks before departure for India's rule.",
      contra: ["Severe allergy to a previous dose", "OPV (live): weakened immunity, prefer IPV"],
      caution: [],
      india: "Given at Government centres; ask for the polio vaccination certificate.",
      srcs: ["mohfw-polio", "who-polio-ec45", "cdc-yb-lmt"] },
    { key: "flu", name: "Seasonal influenza", type: "Inactivated injection",
      who: "Recommended for Hajj and Umrah pilgrims, older travellers and anyone with chronic illness; useful for any trip in flu season.",
      options: [["Seasonal influenza vaccine", "6 months and over", "IM", "1 dose (9 years and over); 2 doses 4 weeks apart for children 6 months–8 years vaccinated for the first time", "Every year"]],
      timing: "At least 2 weeks before travel.",
      contra: ["Severe allergy to a previous dose"],
      caution: ["Recommended in pregnancy"],
      india: "Available in the private sector and some Government adult-vaccination clinics.",
      srcs: ["who-pp-table", "moh-sa-umrah"] },
    { key: "chik", name: "Chikungunya", type: "Virus-like particle (Vimkunya, non-live) or live (Ixchiq)",
      who: "Considered only for selected travellers, such as long stays in outbreak areas.",
      options: [
        ["Vimkunya (VLP)", "12 years and over", "IM", "1 dose", "Not established"],
        ["Ixchiq (live)", "Adults only", "IM", "1 dose", "US licence suspended (22 Aug 2025) over serious adverse events"],
      ],
      timing: "Before travel, per product.",
      contra: ["Ixchiq: suspended in the USA; UK limits it to healthy adults aged 18–59"],
      caution: ["Mosquito-bite prevention is the main protection"],
      india: "Availability in India: Information not verified.",
      srcs: ["fda-ixchiq", "nathnac-chik"] },
  ];
})();
