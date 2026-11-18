/* Verified destination packs for the destinations Indians visit most. Checked 13 Nov 2026.
   Pack fields:
   regions[]                 chips shown in the trip wizard
   malariaLow[]              if every chosen region is in this list, malaria tablets are not advised
   vaccines[] {key,name,label,why,src,multi?,ifRegions?,ifType?,dueDays?}
   risks[]    {name,route,scope,where,prevent,src,tablets?,ifRegions?}
   must[]     legal items {key,label,title,body,src,dueDays,ifRegions?,ifType?,ifProfile?,elseTitle?,elseBody?}
   notes[]    entry items needing reading {title,body,src,ifRegions?,ifType?}
   noMalaria  pack confirms no malaria risk (overrides WHO text)
   emergency[] {label,numbers[],status,src,note}
   An item with ifRegions and/or ifType applies when any chosen region matches OR the trip type matches. */
(function () {
  const C = window.CURATED;
  const CDC = (slug) => `https://wwwnc.cdc.gov/travel/destinations/traveler/none/${slug}`;
  Object.assign(C.sources, {
    "mea-emergency": { pub: "Ministry of External Affairs", title: "Emergency numbers of Indian Missions/Posts abroad (last updated 04 Nov 2026)", url: "https://www.mea.gov.in/emergency-no-missionspost", docDate: "2026-11-04", tier: 1 },
    "cdc-uae": { pub: "US CDC", title: "United Arab Emirates: Travelers' Health destination page", url: CDC("united-arab-emirates"), docDate: null, tier: 2 },
    "cdc-saudi": { pub: "US CDC", title: "Saudi Arabia: Travelers' Health destination page", url: CDC("saudi-arabia"), docDate: null, tier: 2 },
    "moh-sa-umrah": { pub: "Saudi Ministry of Health", title: "Health requirements and recommendations for travellers to Saudi Arabia for Umrah, 1447H (2026)", url: "https://www.moh.gov.sa/en/HealthAwareness/Pilgrims-Health/Documents/Health-Regulations-Umrah-EN.pdf", docDate: null, tier: 1 },
    "ksa-hajj": { pub: "Saudi health authorities (document hosted by UAE MoFA)", title: "Health requirements and recommendations for travellers to Saudi Arabia for Hajj, 1447H (2026)", url: "https://www.mofa.gov.ae/-/media/Feature/News/files/Health-requirements-EN.pdf", docDate: null, tier: 1 },
    "nusuk-hajj": { pub: "Nusuk (Saudi Ministry of Hajj and Umrah)", title: "Hajj health guidelines", url: "https://hajj.nusuk.sa/nusuk/health/guidelines", docDate: null, tier: 1 },
    "srca": { pub: "Saudi Red Crescent Authority", title: "Contact us: important phone numbers", url: "https://srca.org.sa/en/contact-us/", docDate: null, tier: 1 },
    "uae-emergency": { pub: "UAE Government portal (u.ae)", title: "Handling emergencies", url: "https://u.ae/en/information-and-services/justice-safety-and-the-law/Safety/handling-emergencies", docDate: null, tier: 1 },
    "cdc-thailand": { pub: "US CDC", title: "Thailand: Travelers' Health destination page", url: CDC("thailand"), docDate: null, tier: 2 },
    "tat-calls": { pub: "Tourism Authority of Thailand", title: "Useful calls", url: "https://portal.tourismthailand.org/About-Thailand/Useful-Call", docDate: null, tier: 1 },
    "cdc-uk": { pub: "US CDC", title: "United Kingdom: Travelers' Health destination page", url: CDC("united-kingdom"), docDate: null, tier: 2 },
    "nhs-999": { pub: "NHS", title: "When to call 999", url: "https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-999/", docDate: null, tier: 1 },
    "nathnac-usa": { pub: "UK NaTHNaC (TravelHealthPro)", title: "United States of America: country information", url: "https://travelhealthpro.org.uk/countries/usa", docDate: null, tier: 2 },
    "us-911": { pub: "US National 911 Program (NHTSA)", title: "Calling 911", url: "https://www.911.gov/calling-911/", docDate: null, tier: 1 },
    "cdc-singapore": { pub: "US CDC", title: "Singapore: Travelers' Health destination page", url: CDC("singapore"), docDate: null, tier: 2 },
    "scdf": { pub: "Singapore Civil Defence Force", title: "Emergency Medical Services: call 995 or SMS 70995", url: "https://www.scdf.gov.sg/home/about-scdf/emergency-medical-services", docDate: null, tier: 1 },
    "cdc-malaysia": { pub: "US CDC", title: "Malaysia: Travelers' Health destination page", url: CDC("malaysia"), docDate: null, tier: 2 },
    "my-999": { pub: "Malaysian Government portal", title: "MERS 999 emergency line", url: "https://www.malaysia.gov.my/en/topics/mers-999-emergency-line", docDate: null, tier: 1 },
    "cdc-nepal": { pub: "US CDC", title: "Nepal: Travelers' Health destination page", url: CDC("nepal"), docDate: null, tier: 2 },
    "cdc-srilanka": { pub: "US CDC", title: "Sri Lanka: Travelers' Health destination page", url: CDC("sri-lanka"), docDate: null, tier: 2 },
    "lk-1990": { pub: "1990 Suwa Seriya Foundation", title: "Free island-wide pre-hospital ambulance service, dial 1990", url: "https://1990.lk", docDate: null, tier: 1 },
    "cdc-indonesia": { pub: "US CDC", title: "Indonesia: Travelers' Health destination page", url: CDC("indonesia"), docDate: null, tier: 2 },
    "nathnac-australia": { pub: "UK NaTHNaC (TravelHealthPro)", title: "Australia: country information", url: "https://travelhealthpro.org.uk/countries/australia", docDate: null, tier: 2 },
    "au-000": { pub: "Australian Government (Triple Zero)", title: "Other emergency numbers: 000 and 112 from mobiles", url: "https://www.triplezero.gov.au/triple-zero/other-emergency-numbers", docDate: null, tier: 1 },
    "nathnac-canada": { pub: "UK NaTHNaC (TravelHealthPro)", title: "Canada: country information", url: "https://travelhealthpro.org.uk/countries/canada", docDate: null, tier: 2 },
    "ca-911": { pub: "Government of Canada (IRCC)", title: "Phone numbers for emergencies and other services in Canada", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/ukraine-measures/settlement.html", docDate: null, tier: 1 },
  });

  /* Shared wording */
  const HEPA = (src) => ({ key: "hepa", name: "Hepatitis A", label: "recommended", why: "Recommended for unvaccinated travellers aged 1 year and over. Many adults who grew up in India are already immune; your doctor may check before vaccinating.", src });
  const HEPB = (src) => ({ key: "hepb", name: "Hepatitis B", label: "recommended", why: "Recommended for unvaccinated travellers younger than 60. Travellers 60 and over may be vaccinated after discussing with their doctor.", src, multi: true });
  const TYPH = (src) => ({ key: "typhoid", name: "Typhoid", label: "recommended", why: "Recommended for most travellers, especially those staying with friends or family or eating outside hotels. The vaccine is not 100% effective, so food and water care still matter.", src });
  const JE = (src) => ({ key: "je", name: "Japanese encephalitis", label: "consider", why: "Considered for stays of a month or more, or shorter trips with substantial time in rural or farming areas (rice fields, pigs), especially in the rainy season. Your doctor applies CDC's criteria.", src, multi: true });
  const RAB = (src, why) => ({ key: "rabies", name: "Rabies (pre-exposure)", label: "consider", why, src, multi: true });
  const RABIES_RISK = (src, where) => ({ name: "Rabies", route: "animal", scope: "country", where, prevent: "Avoid touching dogs, cats, monkeys and bats. Wash any bite or scratch with soap and running water for 15 minutes and get post-exposure care the same day.", src });
  const MISSION = (label, numbers, note) => ({ label, numbers, status: "verified", src: "mea-emergency", note: note || "Emergency number listed by MEA for Indian nationals in distress." });

  const PIL = ["Hajj (Makkah, Mina, Arafat, Madinah)", "Umrah (Makkah, Madinah)"];

  Object.assign(C.packs, {
    "united-arab-emirates": {
      verified: "2026-11-13", noMalaria: true, regions: [],
      vaccines: [HEPA("cdc-uae"), HEPB("cdc-uae"), TYPH("cdc-uae")],
      risks: [RABIES_RISK("cdc-uae", "Dogs are sometimes infected; rabies vaccine is available in the UAE"), { name: "Heat illness", route: "environment", scope: "country", where: "Very high summer temperatures", prevent: "Drink water regularly, avoid midday sun outdoors, wear a hat and light clothing.", src: "cdc-uae" }],
      emergency: [
        { label: "UAE: Police", numbers: ["999"], status: "verified", src: "uae-emergency" },
        { label: "UAE: Ambulance", numbers: ["998"], status: "verified", src: "uae-emergency", note: "From anywhere in the UAE. Fire (Civil Defence): 997." },
        MISSION("Embassy of India, Abu Dhabi", ["+97124492700"]),
        MISSION("Consulate General of India, Dubai", ["80046342", "+971543090571"], "80046342 is toll-free within the UAE."),
      ],
    },

    "saudi-arabia": {
      verified: "2026-11-13", malariaAsk: true,
      regions: [...PIL, "Riyadh, Jeddah or Eastern Province", "Asir or Jazan (south-west, near Yemen)"],
      malariaLow: [...PIL, "Riyadh, Jeddah or Eastern Province"],
      must: [
        { key: "mening", label: "required", ifRegions: PIL, ifType: "pilgrimage", dueDays: -10, src: "moh-sa-umrah",
          title: "Meningococcal (ACYW) vaccine certificate for Hajj or Umrah",
          body: "Saudi Arabia requires every pilgrim aged over 1 year to show a valid certificate for a quadrivalent ACYW meningococcal vaccine, given at least 10 days before arrival. Valid for 5 years if a conjugate vaccine, 3 years if polysaccharide. If the certificate does not state the vaccine type it is treated as valid for 3 years only. Haj Committee of India pilgrims are vaccinated through the Committee's process." },
        { key: "covid-pil", label: "required", ifRegions: PIL, ifType: "pilgrimage", ifProfile: ["pregnant", "chronic", "immuno"], dueDays: -14, src: "moh-sa-umrah",
          title: "COVID-19 vaccination proof (high-risk pilgrims)",
          body: "Saudi Arabia requires proof of COVID-19 vaccination from pilgrims in high-risk groups: aged over 65, pregnant, or with chronic heart, lung or kidney disease, weakened immunity, cancer or similar conditions. You marked a condition in your profile, so this likely applies to you. Confirm with your doctor and the latest Saudi notice.",
          elseTitle: "COVID-19 vaccination proof: required for some pilgrims",
          elseBody: "Required for high-risk pilgrims: aged over 65, pregnant, or with chronic heart, lung or kidney disease, weakened immunity, cancer or similar conditions. If none applies to you, it is not required." },
      ],
      vaccines: [
        HEPA("cdc-saudi"), HEPB("cdc-saudi"), TYPH("cdc-saudi"),
        { key: "flu", name: "Seasonal influenza", label: "recommended", ifRegions: PIL, ifType: "pilgrimage", src: "moh-sa-umrah", why: "Saudi Arabia recommends the seasonal flu vaccine for all pilgrims, especially older people and those with chronic illness. Crowds at the holy sites spread respiratory infections. A media report says the Haj Committee requires it for pilgrims aged 65 and over: Information not verified with the Committee." },
        RAB("cdc-saudi", "Dogs are sometimes found with rabies. Consider it if your activities bring you near animals."),
      ],
      risks: [
        { name: "Malaria", route: "mosquito", scope: "regions", ifRegions: ["Asir or Jazan (south-west, near Yemen)"], tablets: true, where: "Only in Asir and Jazan provinces near the Yemen border. No malaria in Jeddah, Makkah, Madinah, Riyadh or Ta'if.", prevent: "Prescription tablets for the south-western border areas; your doctor chooses. Plus bite prevention.", src: "cdc-saudi" },
        { name: "MERS (Middle East respiratory syndrome)", route: "animal", scope: "country", where: "Linked to camels", prevent: "Avoid contact with camels and do not drink raw camel milk or eat undercooked camel meat.", src: "moh-sa-umrah" },
        { name: "Heat stroke and dehydration", route: "environment", scope: "country", where: "Very high temperatures, especially during rituals in open areas", prevent: "Drink water often, use an umbrella, rest in shade, perform rituals in cooler hours where allowed.", src: "moh-sa-umrah" },
        { name: "Meningococcal disease", route: "person", scope: "regions", ifRegions: PIL, ifType: "pilgrimage", where: "Large crowds during Hajj and Umrah", prevent: "Vaccination (required). Hand hygiene; mask in crowds if you have a cough.", src: "moh-sa-umrah" },
      ],
      notes: [
        { title: "Saudi Arabia: Hajj health conditions", ifRegions: [PIL[0]], ifType: "pilgrimage", src: "ksa-hajj",
          body: "Saudi authorities ask that people with certain conditions do not perform Hajj, including: organ failure, severe neurological or psychiatric disorders, dementia, pregnancy in the last trimester or high-risk pregnancy, active infectious tuberculosis or haemorrhagic fever, and cancer under immunosuppressive treatment. Discuss your fitness to travel with your doctor." },
        { title: "Saudi Arabia: India is not on Saudi polio or yellow-fever lists", ifRegions: PIL, ifType: "pilgrimage", src: "moh-sa-umrah",
          body: "Saudi Arabia's 2026 Umrah requirements list the countries whose pilgrims need polio or yellow-fever certificates. India is not on these lists, so direct travel from India needs neither. This changes if you travel via a listed country." },
      ],
      emergency: [
        { label: "Saudi Arabia: Ambulance (Saudi Red Crescent)", numbers: ["997"], status: "verified", src: "srca", note: "Security patrols 999, Civil Defence 998. The Asefni app shares your location." },
        MISSION("Embassy of India, Riyadh", ["8002471234", "+966114884697", "+966542126748"], "8002471234 is toll-free within Saudi Arabia; +966-11-4884697 from abroad."),
        MISSION("Consulate General of India, Jeddah (covers Makkah and Madinah)", ["+966126648660", "+966122614093", "+966556122301"]),
      ],
    },

    thailand: {
      verified: "2026-11-13", malariaAsk: true,
      regions: ["Bangkok", "Chiang Mai / north", "Phuket, Krabi, Koh Samui", "Pattaya", "Rural border provinces (Myanmar, Cambodia, Malaysia)"],
      malariaLow: ["Bangkok", "Chiang Mai / north", "Phuket, Krabi, Koh Samui", "Pattaya"],
      vaccines: [HEPA("cdc-thailand"), HEPB("cdc-thailand"), TYPH("cdc-thailand"), JE("cdc-thailand"),
        RAB("cdc-thailand", "Dogs are sometimes infected and rabies vaccine is available in Thailand. Consider it for long stays, rural travel or work with animals."),
        { key: "chik", name: "Chikungunya", label: "consider", src: "cdc-thailand", why: "CDC says vaccination may be considered for stays of 6 months or more. Note: the US suspended the live vaccine (Ixchiq) in August 2025; the non-live Vimkunya (12 years and over) remains licensed there. Availability in India: Information not verified." }],
      risks: [
        { name: "Malaria", route: "mosquito", scope: "regions", tablets: true, where: "Provinces bordering Myanmar, Cambodia and Malaysia. Rare cases in Bangkok, Chiang Mai, Phuket and Koh Samui (no tablets advised); none in Krabi islands or Pattaya.", prevent: "Tablets only for the border provinces (CDC lists atovaquone-proguanil, doxycycline, tafenoquine). Bite prevention everywhere.", src: "cdc-thailand" },
        { name: "Dengue and chikungunya", route: "mosquito", scope: "country", where: "Country-wide, cities included", prevent: "Day-time mosquito-bite prevention: repellent, covered clothing.", src: "cdc-thailand" },
        RABIES_RISK("cdc-thailand", "Country-wide; dogs sometimes infected"),
      ],
      emergency: [
        { label: "Thailand: Medical emergency", numbers: ["1669"], status: "verified", src: "tat-calls" },
        { label: "Thailand: Tourist Police", numbers: ["1155"], status: "verified", src: "tat-calls", note: "Police 191, Fire 199, TAT call centre 1672." },
        MISSION("Embassy of India, Bangkok", ["+66618819218"]),
        MISSION("Consulate General of India, Chiang Mai", ["+660812876117"]),
      ],
    },

    "united-kingdom-with-channel-islands-and-isle-of-man": {
      verified: "2026-11-13", noMalaria: true, regions: [],
      vaccines: [HEPB("cdc-uk"),
        { key: "polio-adult", name: "Polio booster (adult, one-time IPV)", label: "consider", src: "cdc-uk", why: "Poliovirus has been identified in the UK in the past year (WHO lists a vaccine-derived type 2 environmental detection, 3 Mar 2026). CDC advises adults who completed the series as children may get one lifetime IPV booster. India does not require a polio certificate for the UK." }],
      risks: [
        { name: "Rabies (bats only)", route: "animal", scope: "country", where: "Rabies is not common in dogs; bats may carry bat lyssavirus", prevent: "Do not handle bats. Get medical care for any bat bite or scratch.", src: "cdc-uk" },
        { name: "Tick-borne infections", route: "animal", scope: "regions", where: "Woodland and grassland areas", prevent: "Avoid tick bites: covered legs, repellent, check skin after walks.", src: "cdc-uk" },
      ],
      emergency: [
        { label: "UK: Emergency (ambulance, police, fire)", numbers: ["999"], status: "verified", src: "nhs-999", note: "For life-threatening emergencies. NHS 111 is for urgent but non-emergency advice." },
        MISSION("High Commission of India, London", ["+442086295950", "+447768765035", "+447739363521"]),
      ],
    },

    "united-states-of-america": {
      verified: "2026-11-13", noMalaria: true, regions: [],
      vaccines: [{ key: "tetanus", name: "Tetanus booster", label: "recommended", src: "nathnac-usa", why: "Travellers should have completed a tetanus course; a booster is advised if your last dose was more than 10 years ago." },
        RAB("nathnac-usa", "Rabies is present in wild animals such as bats, foxes, raccoons and skunks. Pre-exposure vaccine is for some travellers only, such as those working with animals.")],
      risks: [
        { name: "Rabies (wild animals)", route: "animal", scope: "country", where: "Wild animals including bats and foxes", prevent: "Do not touch wild animals. Get urgent care after any bite or scratch, including from a bat.", src: "nathnac-usa" },
        { name: "Insect- and tick-borne diseases", route: "mosquito", scope: "regions", where: "Some areas; includes dengue and Zika in parts of the country", prevent: "Avoid insect and tick bites day and night. No vaccine.", src: "nathnac-usa" },
      ],
      emergency: [
        { label: "USA: Emergency", numbers: ["911"], status: "verified", src: "us-911" },
        MISSION("Consulate General of India, New York", ["+19178157066"]),
        MISSION("Consulate General of India, San Francisco", ["+14154836629"]),
        MISSION("Consulate General of India, Chicago", ["+13127538530"]),
        MISSION("Consulate General of India, Houston", ["+17136262148"]),
        MISSION("Consulate General of India, Atlanta", ["+14048352726"]),
        MISSION("Consulate General of India, Boston", ["+18573087144"]),
        { label: "Embassy of India, Washington DC (main line)", numbers: ["+12029397000"], status: "unverified", note: "Main line from the Government directory (igod). MEA's emergency list does not give a Washington emergency number: Information not verified." },
      ],
    },

    singapore: {
      verified: "2026-11-13", noMalaria: true, regions: [],
      vaccines: [HEPA("cdc-singapore"), HEPB("cdc-singapore"),
        { key: "typhoid", name: "Typhoid", label: "consider", src: "cdc-singapore", why: "Considered for long stays, visits to friends or family, or eating outside hotels and food courts with good hygiene." }],
      risks: [{ name: "Dengue", route: "mosquito", scope: "country", where: "Country-wide", prevent: "Day-time mosquito-bite prevention.", src: "cdc-singapore" }],
      emergency: [
        { label: "Singapore: Ambulance and fire (SCDF)", numbers: ["995"], status: "verified", src: "scdf", note: "SMS 70995 for people who cannot speak. Police: 999." },
        MISSION("High Commission of India, Singapore", ["+6562382541", "+6591729803"]),
      ],
    },

    malaysia: {
      verified: "2026-11-13", malariaAsk: true,
      regions: ["Kuala Lumpur", "Penang", "Langkawi / beach resorts", "Rural forested areas (Sabah, Sarawak, interior)"],
      malariaLow: ["Kuala Lumpur", "Penang", "Langkawi / beach resorts"],
      vaccines: [HEPA("cdc-malaysia"), HEPB("cdc-malaysia"), TYPH("cdc-malaysia"), JE("cdc-malaysia"),
        RAB("cdc-malaysia", "Dogs are sometimes infected. Consider it for rural travel, long stays or work with animals.")],
      risks: [
        { name: "Malaria (P. knowlesi)", route: "mosquito", scope: "regions", tablets: true, ifRegions: ["Rural forested areas (Sabah, Sarawak, interior)"], where: "Rural forested areas. None in Kuala Lumpur or Penang.", prevent: "Tablets for rural forested areas; your doctor chooses. Bite prevention.", src: "cdc-malaysia" },
        { name: "Dengue", route: "mosquito", scope: "country", where: "Country-wide", prevent: "Day-time mosquito-bite prevention.", src: "cdc-malaysia" },
        RABIES_RISK("cdc-malaysia", "Dogs sometimes infected"),
      ],
      emergency: [
        { label: "Malaysia: Emergency (MERS 999)", numbers: ["999"], status: "verified", src: "my-999", note: "Connects police, fire and rescue, and ambulance." },
        MISSION("High Commission of India, Kuala Lumpur", ["+60362052350", "+601137219570"]),
      ],
    },

    nepal: {
      verified: "2026-11-13", malariaAsk: true,
      regions: ["Kathmandu valley", "Pokhara", "Trekking (Everest, Annapurna, Langtang)", "Terai (Chitwan, Lumbini)", "Far west (Sudurpashchim, Karnali)"],
      malariaLow: ["Kathmandu valley", "Pokhara", "Trekking (Everest, Annapurna, Langtang)", "Terai (Chitwan, Lumbini)"],
      vaccines: [HEPA("cdc-nepal"), HEPB("cdc-nepal"),
        { ...TYPH("cdc-nepal"), why: "Recommended for most travellers. CDC notes Nepal's typhoid risk is among the highest in the world. Food and water care still matter." },
        { key: "cholera", name: "Cholera", label: "consider", src: "cdc-nepal", why: "Cholera is widespread in Nepal. Rare in travellers; vaccination may be considered for higher-risk travel such as aid work." },
        JE("cdc-nepal"),
        RAB("cdc-nepal", "Dogs are commonly infected and post-exposure vaccine may be limited to cities. Strongly consider it for trekking or remote travel.")],
      risks: [
        { name: "Malaria", route: "mosquito", scope: "regions", tablets: true, ifRegions: ["Far west (Sudurpashchim, Karnali)"], where: "Sudurpashchim and Karnali provinces below 2,000 m. None in Kathmandu, Pokhara or on typical treks.", prevent: "Tablets for the far-west risk areas; your doctor chooses. Bite prevention.", src: "cdc-nepal" },
        { name: "Altitude sickness", route: "environment", scope: "regions", ifRegions: ["Trekking (Everest, Annapurna, Langtang)"], where: "Treks above about 2,500 m", prevent: "Ascend slowly, include rest days, descend if symptoms worsen. Ask your doctor about medicines for altitude.", src: "cdc-nepal" },
        { name: "Cholera and typhoid", route: "food", scope: "country", where: "Country-wide", prevent: "Safe water and food, hand hygiene.", src: "cdc-nepal" },
        RABIES_RISK("cdc-nepal", "Country-wide; dogs commonly infected"),
      ],
      emergency: [
        MISSION("Embassy of India, Kathmandu", ["+9779851155007", "+9779851107021", "+9779851107022"]),
        { label: "Nepal national emergency number", numbers: [], status: "unverified", note: "Not yet checked against a Nepal Government source." },
      ],
    },

    "sri-lanka": {
      verified: "2026-11-13", noMalaria: true, regions: [],
      vaccines: [HEPA("cdc-srilanka"), HEPB("cdc-srilanka"), TYPH("cdc-srilanka"), JE("cdc-srilanka"),
        RAB("cdc-srilanka", "Dogs are commonly infected and CDC says rabies vaccine is typically not readily available. Consider it before you go.")],
      risks: [
        { name: "Dengue and chikungunya", route: "mosquito", scope: "country", where: "Country-wide. CDC Level 1 dengue notice.", prevent: "Day-time mosquito-bite prevention.", src: "cdc-srilanka" },
        RABIES_RISK("cdc-srilanka", "Country-wide; dogs commonly infected"),
      ],
      emergency: [
        { label: "Sri Lanka: Ambulance (1990 Suwa Seriya)", numbers: ["1990"], status: "verified", src: "lk-1990", note: "Free island-wide ambulance service, set up with a grant from India." },
        MISSION("High Commission of India, Colombo", ["+94773727832"]),
      ],
    },

    indonesia: {
      verified: "2026-11-13", malariaAsk: true,
      regions: ["Jakarta", "Bali (resort areas, Ubud)", "Gili Islands", "Lombok", "Labuan Bajo / Komodo", "Eastern Indonesia (Papua, Maluku, Nusa Tenggara)", "Rural Kalimantan, Sulawesi or Sumatra"],
      malariaLow: ["Jakarta", "Bali (resort areas, Ubud)", "Gili Islands"],
      vaccines: [HEPA("cdc-indonesia"), { ...HEPB("cdc-indonesia"), why: "Recommended for unvaccinated travellers of all ages to Indonesia." }, TYPH("cdc-indonesia"),
        RAB("cdc-indonesia", "Dogs are commonly infected, including in Bali. Consider it, especially for longer stays or rural travel."),
        { key: "chik", name: "Chikungunya", label: "consider", src: "cdc-indonesia", why: "CDC says vaccination may be considered for stays of 6 months or more. Note: the US suspended the live vaccine (Ixchiq) in August 2025; the non-live Vimkunya (12 years and over) remains licensed there. Availability in India: Information not verified." }],
      risks: [
        { name: "Malaria", route: "mosquito", scope: "regions", tablets: true, where: "All of eastern Indonesia including Labuan Bajo and Komodo; rural Kalimantan, Lombok, Sulawesi and Sumatra. None in Jakarta, Ubud, Bali resort areas or the Gili Islands.", prevent: "Tablets for risk areas; your doctor chooses. Bite prevention.", src: "cdc-indonesia" },
        { name: "Dengue", route: "mosquito", scope: "country", where: "Country-wide", prevent: "Day-time mosquito-bite prevention.", src: "cdc-indonesia" },
        RABIES_RISK("cdc-indonesia", "Country-wide including Bali; dogs commonly infected"),
      ],
      emergency: [
        MISSION("Embassy of India, Jakarta", ["+62816774883", "+62215256094"]),
        MISSION("Consulate General of India, Bali", ["+628158889107"]),
        { label: "Indonesia national emergency number", numbers: [], status: "unverified", note: "Not yet checked against an Indonesian Government source." },
      ],
    },

    australia: {
      verified: "2026-11-13", noMalaria: true, regions: [],
      vaccines: [{ key: "tetanus", name: "Tetanus booster", label: "recommended", src: "nathnac-australia", why: "Travellers should have completed a tetanus course; a booster is advised before remote travel if the last dose was more than 10 years ago." },
        { key: "hepb", name: "Hepatitis B", label: "consider", src: "nathnac-australia", multi: true, why: "NaTHNaC classes Australia as intermediate or high hepatitis B prevalence. Discuss with your doctor." }],
      risks: [
        { name: "Japanese encephalitis", route: "mosquito", scope: "regions", where: "Parts of Victoria, New South Wales, Queensland, Western Australia, South Australia and the Northern Territory; most cases December to March", prevent: "Avoid mosquito bites from dusk to dawn. Ask your doctor about the vaccine for rural stays.", src: "nathnac-australia" },
        { name: "Dengue", route: "mosquito", scope: "regions", where: "Queensland", prevent: "Day-time mosquito-bite prevention.", src: "nathnac-australia" },
        { name: "Bat lyssavirus", route: "animal", scope: "country", where: "Bats", prevent: "Do not handle bats. Seek care urgently after a bat bite or scratch.", src: "nathnac-australia" },
      ],
      emergency: [
        { label: "Australia: Emergency (Triple Zero)", numbers: ["000", "112"], status: "verified", src: "au-000", note: "112 works from mobile phones only." },
        MISSION("High Commission of India, Canberra", ["+61432585493"]),
        MISSION("Consulate General of India, Sydney", ["+61422026137"]),
        MISSION("Consulate General of India, Melbourne", ["+61430020828"]),
      ],
    },

    canada: {
      verified: "2026-11-13", noMalaria: true, regions: [],
      vaccines: [{ key: "tetanus", name: "Tetanus booster", label: "recommended", src: "nathnac-canada", why: "Travellers should have completed a tetanus course; a booster is advised if the last dose was more than 10 years ago." },
        RAB("nathnac-canada", "Rabies is present in wild animals such as foxes and bats. Pre-exposure vaccine is for some travellers only, such as those working with animals.")],
      risks: [{ name: "Rabies (wild animals)", route: "animal", scope: "country", where: "Wild animals including foxes and bats", prevent: "Do not touch wild animals. Get urgent care after any bite or scratch.", src: "nathnac-canada" }],
      emergency: [
        { label: "Canada: Emergency", numbers: ["911"], status: "verified", src: "ca-911" },
        MISSION("High Commission of India, Ottawa", ["+16138994622"]),
        MISSION("Consulate General of India, Toronto", ["+16476684108"]),
        MISSION("Consulate General of India, Vancouver", ["+16045519626"]),
      ],
    },
  });

  /* Kenya: replace the conflicting helpline with MEA's emergency list (04 Nov 2026) */
  const k = C.packs.kenya;
  k.malariaLow = ["Nairobi city"];
  k.yfLow = ["Nairobi city", "Mombasa and coast", "North Eastern (Garissa, Wajir, Mandera)"];
  k.risks.forEach((r) => { if (r.name === "Malaria") r.tablets = true; });
  k.emergency = [
    MISSION("High Commission of India, Nairobi (emergency)", ["+254734916532"]),
    { label: "High Commission of India, Nairobi (general enquiries)", numbers: ["+254-20-2222567", "+254-733666195"], status: "verified", src: "hci-nairobi-contact", note: "UN Crescent, Gigiri, Nairobi" },
    MISSION("Assistant High Commission of India, Mombasa (emergency)", ["+254104077376"]),
    { label: "Kenya national emergency number", numbers: [], status: "unverified", note: "Not yet checked against a Kenyan Government source." },
  ];
})();
