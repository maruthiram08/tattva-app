/**
 * Character extraction patterns for Ramayana shlokas
 * Rule-based extraction using regex for high-precision character identification
 */

export const CHARACTER_PATTERNS: Record<string, RegExp[]> = {
  // Main Characters
  rama: [
    /\b(rama|rāma|श्रीराम|राम)\b/gi,
    /\b(rāghava|raghava|राघव)\b/gi,
    /\b(kosala|kausala)\b/gi,
  ],

  sita: [
    /\b(sita|sītā|सीता)\b/gi,
    /\b(vaidehi|vaidehī|वैदेही)\b/gi,
    /\b(janaki|jānakī|जानकी)\b/gi,
    /\b(maithili|maithilī)\b/gi,
  ],

  lakshmana: [
    /\b(lakshmana|lakṣmaṇa|laxman|लक्ष्मण)\b/gi,
    /\b(saumitri|saumitra)\b/gi,
  ],

  hanuman: [
    /\b(hanuman|hanumān|हनुमान)\b/gi,
    /\b(anjaneya|āñjaneya)\b/gi,
    /\b(vāyuputra|vayuputra|पवनपुत्र)\b/gi,
    /\b(kesari)\b/gi,
  ],

  ravana: [
    /\b(ravana|rāvaṇa|रावण)\b/gi,
    /\b(daśānana|dashanana|दशानन)\b/gi,
    /\b(lankesh|laṅkeśa|लंकेश)\b/gi,
  ],

  // Royal Family - Ayodhya
  dasharatha: [
    /\b(dasharatha|daśaratha|दशरथ)\b/gi,
    /\b(rājan|राजा)\b/gi, // Context-dependent
  ],

  kaushalya: [
    /\b(kausalya|kauśalyā|कौशल्या)\b/gi,
  ],

  kaikeyi: [
    /\b(kaikeyi|kaikeyī|कैकेयी)\b/gi,
  ],

  sumitra: [
    /\b(sumitra|sumitrā|सुमित्रा)\b/gi,
  ],

  bharata: [
    /\b(bharata|bharata|भरत)\b/gi,
  ],

  shatrughna: [
    /\b(shatrughna|śatrughna|शत्रुघ्न)\b/gi,
  ],

  // Sages & Rishis
  vishwamitra: [
    /\b(vishwamitra|viśvāmitra|विश्वामित्र)\b/gi,
  ],

  vashishtha: [
    /\b(vashishtha|vasiṣṭha|वसिष्ठ)\b/gi,
  ],

  valmiki: [
    /\b(valmiki|vālmīki|वाल्मीकि)\b/gi,
  ],

  narada: [
    /\b(narada|nārada|नारद)\b/gi,
  ],

  agastya: [
    /\b(agastya|agastya|अगस्त्य)\b/gi,
  ],

  // Demons/Rakshasas
  shurpanakha: [
    /\b(shurpanakha|śūrpaṇakhā|शूर्पणखा)\b/gi,
  ],

  maricha: [
    /\b(maricha|mārīca|मारीच)\b/gi,
  ],

  kumbhakarna: [
    /\b(kumbhakarna|kumbhakarṇa|कुम्भकर्ण)\b/gi,
  ],

  vibhishana: [
    /\b(vibhishana|vibhīṣaṇa|विभीषण)\b/gi,
  ],

  indrajit: [
    /\b(indrajit|indrajit|इन्द्रजित)\b/gi,
    /\b(meghanada|meghanaāda)\b/gi,
  ],

  // Vanara (Monkey) Army
  sugriva: [
    /\b(sugriva|sugrīva|सुग्रीव)\b/gi,
  ],

  vali: [
    /\b(vali|vāli|bali|बालि)\b/gi,
  ],

  angada: [
    /\b(angada|aṅgada|अंगद)\b/gi,
  ],

  jambavan: [
    /\b(jambavan|jāmbavān|jambavanta|जाम्बवान)\b/gi,
  ],

  nala: [
    /\b(nala|nala)\b/gi,
  ],

  nila: [
    /\b(nila|nīla)\b/gi,
  ],

  // Other Important Characters
  janaka: [
    /\b(janaka|janaka|जनक)\b/gi,
  ],

  urmila: [
    /\b(urmila|ūrmilā|उर्मिला)\b/gi,
  ],

  mandodari: [
    /\b(mandodari|mandodarī|मंदोदरी)\b/gi,
  ],

  tara: [
    /\b(tara|tārā|तारा)\b/gi,
  ],

  sampati: [
    /\b(sampati|sampāti|संपाति)\b/gi,
  ],

  jatayu: [
    /\b(jatayu|jaṭāyu|जटायु)\b/gi,
  ],

  // Deities
  brahma: [
    /\b(brahma|brahmā|ब्रह्मा)\b/gi,
  ],

  vishnu: [
    /\b(vishnu|viṣṇu|विष्णु)\b/gi,
  ],

  shiva: [
    /\b(shiva|śiva|शिव)\b/gi,
    /\b(mahadeva|mahādeva)\b/gi,
  ],

  indra: [
    /\b(indra|indra|इंद्र)\b/gi,
  ],
};

/**
 * Extract character names from text using regex patterns
 */
export function extractCharacters(text: string): string[] {
  const foundCharacters = new Set<string>();

  for (const [character, patterns] of Object.entries(CHARACTER_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        foundCharacters.add(character);
        break; // Found this character, move to next
      }
    }
  }

  return Array.from(foundCharacters);
}
