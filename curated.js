/* Hand-verified content. Every item names its source id and the date it was checked. */
window.CURATED = {
  checkedOn: "2026-11-13",

  sources: {
    "who-ith-2022": { pub: "WHO", title: "Vaccination requirements and WHO recommendations for international travellers (ITH Country List), 18 Nov 2022, revised 3 Jan 2023", url: "https://www.who.int/publications/m/item/vaccination-requirements-and-recommendations-for-international-travellers-and-malaria-situation-per-country-2022-edition", docDate: "2023-01-03", tier: 1 },
    "mohfw-yf": { pub: "MoHFW (IHPOE)", title: "Yellow fever vaccination: information for the public (endemic-country list, quarantine rules, validity, fee)", url: "https://ihpoe.mohfw.gov.in/vaccination.php", docDate: null, tier: 1 },
    "mohfw-yfvc": { pub: "MoHFW (IHPOE)", title: "List of Dte.GHS-authorised Yellow Fever Vaccination Centres", url: "https://ihpoe.mohfw.gov.in/vaccination_centres.php", docDate: null, tier: 1 },
    "mohfw-polio": { pub: "MoHFW (Dte.GHS)", title: "Office order and revised advisory: polio vaccination (OPV/IPV) for international travellers between India and polio-infected countries, 10 Jun 2024", url: "https://ihpoe.mohfw.gov.in/", docDate: "2024-06-10", tier: 1 },
    "who-polio-ec45": { pub: "WHO", title: "Statement of the 45th meeting of the Polio IHR Emergency Committee (data as of 30 Apr 2026)", url: "https://www.who.int/news/item/25-08-2026-statement-of-the-forty-fifth-meeting-of-the-polio-ihr-emergency-committee", docDate: "2026-08-25", tier: 1 },
    "cdc-kenya": { pub: "US CDC", title: "Kenya: Travelers' Health destination page", url: "https://wwwnc.cdc.gov/travel/destinations/traveler/none/kenya", docDate: "2025-04-23", tier: 2 },
    "cdc-ebola-kenya": { pub: "US CDC", title: "Travel Health Notice: Ebola Bundibugyo virus disease in Kenya (Level 1)", url: "https://wwwnc.cdc.gov/travel/notices/level1/ebola-kenya", docDate: null, tier: 2 },
    "cdc-ebola-summary": { pub: "US CDC", title: "Ebola (Bundibugyo virus) situation summary", url: "https://cdc.gov/ebola/situation-summary/index.html", docDate: "2026-10-23", tier: 2 },
    "kenya-moh-1106": { pub: "Kenya Ministry of Health (reported by Kenyans.co.ke)", title: "Update of 6 Nov 2026: sixth Ebola recovery; 42-day countdown", url: "https://www.kenyans.co.ke/news/129197-kenya-records-6th-ebola-recovery-ministry-outlines-42-day-countdown-ending-outbreak", docDate: "2026-11-06", tier: 3 },
    "who-afro-kenya-w41": { pub: "WHO AFRO", title: "Kenya weekly emergency situation report, week 41, 2026", url: "https://afro.who.int/sites/default/files/2026-10/Week%2041%20Situation%20Report.pdf", docDate: "2026-10-16", tier: 1 },
    "hci-nairobi-vacc": { pub: "High Commission of India, Nairobi", title: "Vaccination requirement: travelling from Kenya to India", url: "https://hcinairobi.gov.in/eoinrb_pages/NjMw", docDate: null, tier: 1 },
    "hci-nairobi-contact": { pub: "High Commission of India, Nairobi", title: "Contact us", url: "https://hcinairobi.gov.in/eoinrb_pages/MjY4", docDate: null, tier: 1 },
    "hci-nairobi-contact2": { pub: "High Commission of India, Nairobi", title: "Contact us (helpline for Indian nationals in distress)", url: "https://hcinairobi.gov.in/eoinrb_pages/MTYy", docDate: null, tier: 1 },
    "mohfw-ebola-advisory": { pub: "MoHFW (reported by Business Today)", title: "Ebola advisory to states: point-of-entry screening and 21-day monitoring (May 2026)", url: "https://www.businesstoday.in/amp/india/story/ebola-alert-in-india-centre-orders-screening-surveillance-after-who-emergency-532969-2026-05-23", docDate: "2026-05-23", tier: 3 },
    "mea-missions": { pub: "Ministry of External Affairs", title: "Countries/Regions & Missions/Posts (Indian missions abroad)", url: "https://www.mea.gov.in/indian-mission-abroad", docDate: null, tier: 1 },
    "mea-madad": { pub: "Ministry of External Affairs", title: "MADAD consular grievance portal", url: "https://www.madad.gov.in", docDate: null, tier: 1 },
    "who-ith": { pub: "WHO", title: "International travel and health: travel advice", url: "https://www.who.int/ith/en/", docDate: null, tier: 1 },
    "cdc-yb-yf": { pub: "US CDC", title: "CDC Yellow Book 2026: Yellow fever", url: "https://www.cdc.gov/yellow-book/hcp/travel-associated-infections-diseases/yellow-fever.html", docDate: null, tier: 2 }
  },

  /* Outbreaks and health alerts. type: outbreak | alert | over. sev: monitor | precautions | reconsider | avoid */
  alerts: [
    { id: "ke-ebola", country: "kenya", type: "outbreak", sev: "precautions", disease: "Ebola disease (Bundibugyo virus)",
      status: "Active, declining",
      summary: "First imported case confirmed 6 Oct 2026 in Nairobi. 9 confirmed cases and 2 deaths in total. On 6 Nov the Ministry reported a sixth recovery, with 1 patient still in care. The last contacts were due to finish quarantine by 11 Nov, after which a 42-day countdown runs before the outbreak can be declared over.",
      scope: "Nairobi only; no community spread reported", asOf: "2026-11-06",
      officialLevel: "CDC Level 1: Practice usual precautions",
      todo: ["Avoid contact with sick people and with blood or body fluids", "Avoid visiting facilities treating Ebola patients unless you need care", "Know the symptoms: fever, weakness, muscle pain, vomiting, diarrhoea, unexplained bleeding", "If symptoms start within 21 days of leaving Kenya, call a doctor and mention your travel"],
      india: "India has screened arrivals from Ebola-affected countries since May 2026, with 21-day monitoring. The advisory named DRC, Uganda and South Sudan. Whether Kenya has since been added: Information not verified.",
      noVaccine: "There is no licensed vaccine or specific treatment for the Bundibugyo strain.",
      sources: ["kenya-moh-1106", "cdc-ebola-kenya", "cdc-ebola-summary", "mohfw-ebola-advisory"],
      timeline: [["2026-10-06", "First imported case confirmed in Nairobi (patient died 5 Oct)"], ["2026-10-17", "Total rises to 7 confirmed, including health workers"], ["2026-10-23", "9 confirmed, 2 deaths (CDC)"], ["2026-11-06", "Sixth recovery; 1 patient in care"]] },
    { id: "ke-mpox", country: "kenya", type: "outbreak", sev: "monitor", disease: "Mpox (clade Ib)", status: "Ongoing",
      summary: "Kenya is responding to mpox in 23 counties.", scope: "23 of 47 counties", asOf: "2026-10-16",
      todo: ["Avoid close skin-to-skin and sexual contact with people who have a rash", "See a doctor for a new rash with fever"],
      sources: ["who-afro-kenya-w41"] },
    { id: "ke-measles", country: "kenya", type: "outbreak", sev: "monitor", disease: "Measles", status: "Ongoing",
      summary: "Measles outbreak active in four counties.", scope: "4 counties", asOf: "2026-10-16",
      todo: ["Make sure you have had two doses of a measles-containing vaccine (MMR)"], sources: ["who-afro-kenya-w41"] },
    { id: "cd-ebola", country: "democratic-republic-of-the-congo", type: "outbreak", sev: "reconsider", disease: "Ebola disease (Bundibugyo virus)", status: "Active",
      summary: "The largest Bundibugyo outbreak ever recorded: 10,141 confirmed cases and 4,928 confirmed deaths in CDC's latest summary. WHO declared it a Public Health Emergency of International Concern in May 2026.",
      scope: "Multiple provinces; Haut-Uélé and Tshopo at the highest level", asOf: "2026-10-23",
      officialLevel: "CDC Level 3 (Haut-Uélé, Tshopo): Reconsider nonessential travel. Level 2 elsewhere in DRC: Practice enhanced precautions",
      todo: ["Discuss whether to travel with a doctor", "Avoid contact with sick people, body fluids and dead bodies", "Report symptoms within 21 days of leaving"],
      india: "India's May 2026 advisory names DRC as a high-risk country: screening on arrival and 21-day monitoring.",
      noVaccine: "There is no licensed vaccine or specific treatment for the Bundibugyo strain.",
      sources: ["cdc-ebola-summary", "mohfw-ebola-advisory"] },
    { id: "ng-ebola", country: "nigeria", type: "outbreak", sev: "precautions", disease: "Ebola disease (Bundibugyo virus)", status: "Case reported",
      summary: "Nigeria reported its first case in this outbreak on 20 Oct 2026, confirmed as Bundibugyo virus.", scope: "Information not verified (location not in source)", asOf: "2026-10-20",
      todo: ["Avoid contact with sick people and body fluids", "Report symptoms within 21 days of leaving"],
      sources: ["cdc-ebola-summary"] },
    { id: "ug-ebola", country: "uganda", type: "over", sev: "monitor", disease: "Ebola disease (Bundibugyo virus)", status: "No active cases",
      summary: "CDC reports the last confirmed case in Uganda recovered and was released from care on 16 Jul 2026; no active cases are reported.", scope: "Country-wide", asOf: "2026-10-23",
      officialLevel: "CDC: DRC and Uganda notice at Level 2 (Practice enhanced precautions)",
      india: "India's May 2026 advisory named Uganda as a high-risk country (screening and 21-day monitoring).",
      sources: ["cdc-ebola-summary", "mohfw-ebola-advisory"] },
    { id: "ss-ebola-in", country: "south-sudan", type: "alert", sev: "monitor", disease: "Ebola: India arrival screening", status: "Advisory",
      summary: "India's May 2026 advisory lists South Sudan among high-risk countries. Arrivals are screened and monitored for 21 days.", scope: "Indian airports, ports and land borders", asOf: "2026-05-23",
      sources: ["mohfw-ebola-advisory"] }
  ],

  /* Destination packs with deeper verified content. Other countries use WHO + India rules only. */
  packs: {
    kenya: {
      verified: "2026-11-13",
      regions: ["Nairobi city", "Maasai Mara / Narok", "Mombasa and coast", "Rift Valley / central highlands", "North Eastern (Garissa, Wajir, Mandera)"],
      vaccines: [
        { key: "hepa", name: "Hepatitis A", label: "recommended", why: "Recommended for unvaccinated travellers aged 1 year and over going to Kenya.", src: "cdc-kenya" },
        { key: "typhoid", name: "Typhoid", label: "recommended", why: "Recommended for most travellers. The vaccine is not 100% effective, so food and water care still matter.", src: "cdc-kenya" },
        { key: "hepb", name: "Hepatitis B", label: "recommended", why: "Recommended for unvaccinated travellers younger than 60. Travellers 60 and over may be vaccinated.", src: "cdc-kenya", multi: true },
        { key: "rabies", name: "Rabies (pre-exposure)", label: "consider", why: "Dogs infected with rabies are common in Kenya, and post-exposure vaccine may only be available in larger cities. Consider it if your activities bring you near animals or you may be far from care.", src: "cdc-kenya", multi: true },
        { key: "cholera", name: "Cholera", label: "consider", why: "Active transmission is localised to Garissa, Migori, Mombasa, Nairobi, Narok and Turkana counties. Cholera is rare in travellers; vaccination may be considered for travel to those areas.", src: "cdc-kenya" },
        { key: "mening", name: "Meningococcal", label: "consider", why: "Recommended for travellers to the meningitis-belt areas of Kenya in the dry season (roughly December to June).", src: "cdc-kenya" }
      ],
      risks: [
        { name: "Malaria", route: "mosquito", scope: "regions", where: "All areas below 2,500 m including game parks; rare cases in central Nairobi", prevent: "Prescription tablets in risk areas (CDC lists atovaquone-proguanil, doxycycline, mefloquine, tafenoquine; chloroquine resistance). Your doctor chooses. Plus bite prevention.", src: "cdc-kenya" },
        { name: "Rabies", route: "animal", scope: "country", where: "Country-wide; dogs commonly infected, also some wildlife", prevent: "Avoid touching animals. Wash any bite or scratch with soap and water for 15 minutes and get post-exposure care urgently.", src: "cdc-kenya" },
        { name: "Cholera", route: "food", scope: "regions", where: "Garissa, Migori, Mombasa, Nairobi, Narok, Turkana counties", prevent: "Safe food and water, hand hygiene.", src: "cdc-kenya" },
        { name: "Measles", route: "person", scope: "regions", where: "Outbreak active in four counties (Oct 2026)", prevent: "Two doses of MMR.", src: "who-afro-kenya-w41" }
      ],
      emergency: [
        { label: "High Commission of India, Nairobi (general enquiries)", numbers: ["+254-20-2222567", "+254-733666195"], status: "verified", src: "hci-nairobi-contact", note: "UN Crescent, Gigiri, Nairobi" },
        { label: "High Commission of India, Nairobi (helpline for Indian nationals in distress)", numbers: ["+254 731900043"], status: "conflicting", src: "hci-nairobi-contact2", note: "Another High Commission page lists this number for passport and visa enquiries. Confirm before relying on it." },
        { label: "Assistant High Commission of India, Mombasa", numbers: ["+254 (0)41-2224433", "+254 (0)41-2311051"], status: "verified", src: "hci-nairobi-contact" },
        { label: "Kenya national emergency number", numbers: [], status: "unverified", note: "Not yet checked against a Kenyan Government source." }
      ]
    }
  }
};
