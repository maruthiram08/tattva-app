/**
 * Event and Theme keyword patterns for Ramayana shlokas
 * Used for initial rule-based tagging before LLM enhancement
 */

export const EVENT_KEYWORDS: Record<string, string[]> = {
  // Bala Kanda Events
  narada_visit: ["narada", "valmiki", "enquir", "query", "question"],
  rama_birth: ["birth", "born", "dasharatha sons", "four sons"],
  bow_breaking: ["bow", "shiva bow", "broke", "janaka", "swayamvara"],
  sita_marriage: ["marriage", "wedding", "sita", "janaka", "wed"],

  // Ayodhya Kanda Events
  coronation_plan: ["coronation", "abhisheka", "king", "heir"],
  kaikeyi_boons: ["kaikeyi", "boon", "manthara", "demand"],
  exile_announcement: ["exile", "forest", "fourteen years", "vanavasa"],
  dasharatha_grief: ["dasharatha", "grief", "sorrow", "death", "mourn"],
  bharata_return: ["bharata", "return", "ayodhya", "nandigrama"],

  // Aranya Kanda Events
  chitrakuta: ["chitrakuta", "citr akūṭa"],
  viradha_encounter: ["viradha", "demon", "encounter"],
  agastya_visit: ["agastya", "sage", "bow", "weapon"],
  shurpanakha: ["shurpanakha", "disfigure", "nose", "ears"],
  golden_deer: ["golden deer", "maricha", "deer"],
  sita_abduction: ["abduct", "ravana", "carry away", "kidnap"],
  jatayu_fight: ["jatayu", "bird", "fight", "wing"],

  // Kishkindha Kanda Events
  meet_hanuman: ["hanuman", "first meet", "encounter"],
  sugriva_alliance: ["sugriva", "alliance", "friend", "pact"],
  vali_duel: ["vali", "sugriva", "duel", "fight", "combat"],
  vali_death: ["vali", "death", "kill", "arrow"],
  vanara_search: ["vanara", "search", "sita", "direction"],

  // Sundara Kanda Events
  ocean_crossing: ["ocean", "leap", "cross", "sea"],
  lanka_entry: ["lanka", "enter", "city"],
  sita_found: ["ashoka", "grove", "sita", "found", "meet"],
  lanka_burning: ["fire", "burn", "lanka", "tail"],
  return_news: ["return", "news", "found sita"],

  // Yuddha Kanda Events
  rama_army: ["army", "march", "vanara", "bridge"],
  bridge_construction: ["bridge", "sea", "nala", "ocean"],
  vibhishana_join: ["vibhishana", "join", "surrender", "ally"],
  battle_begins: ["war", "battle", "commence"],
  kumbhakarna_death: ["kumbhakarna", "sleep", "death"],
  indrajit_battle: ["indrajit", "magic", "illusion"],
  ravana_death: ["ravana", "death", "kill", "final"],
  sita_agnipariksha: ["fire", "test", "agni", "purity"],
  return_ayodhya: ["return", "ayodhya", "pushpaka"],
  rama_coronation: ["coronation", "king", "throne", "crown"],
};

export const THEME_KEYWORDS: Record<string, string[]> = {
  // Dharma & Ethics
  dharma: ["dharma", "righteousness", "duty", "right"],
  rajadharma: ["royal", "king", "ruler", "governance", "rajadharma"],
  filial_dharma: ["father", "son", "parent", "obey", "respect"],
  duty_vs_desire: ["duty", "desire", "conflict", "choice"],
  duty_vs_emotion: ["duty", "emotion", "love", "sorrow", "grief"],
  sacrifice: ["sacrifice", "renounce", "give up", "abandon"],

  // Relationships
  loyalty: ["loyal", "devoted", "allegiance", "faithful"],
  brotherhood: ["brother", "sibling", "bharata", "lakshmana"],
  love: ["love", "affection", "attachment", "devotion"],
  marriage: ["husband", "wife", "spouse", "married"],

  // Moral Concepts
  truth: ["truth", "truthful", "honest", "satya"],
  promise: ["promise", "vow", "pledge", "oath"],
  honor: ["honor", "reputation", "dignity", "respect"],
  revenge: ["revenge", "vengeance", "retaliation"],
  justice: ["justice", "fair", "right", "wrong"],

  // Actions & Qualities
  courage: ["courage", "brave", "valor", "fearless"],
  compassion: ["compassion", "mercy", "kindness", "pity"],
  anger: ["anger", "wrath", "rage", "fury"],
  pride: ["pride", "arrogance", "ego"],
  humility: ["humble", "modest", "respectful"],

  // Narrative Themes
  exile: ["exile", "forest", "vanavasa", "banish"],
  war: ["war", "battle", "fight", "combat"],
  search: ["search", "find", "look", "seek"],
  reunion: ["reunion", "meet", "reunite", "together"],
  victory: ["victory", "win", "triumph", "success"],
  death: ["death", "die", "kill", "slay"],

  // Spiritual
  devotion: ["devot", "worship", "pray", "bhakti"],
  fate: ["fate", "destiny", "ordained"],
  divine: ["divine", "god", "deity", "celestial"],
};

/**
 * Extract event tags from text using keywords
 */
export function extractEventKeywords(text: string): string[] {
  const lowerText = text.toLowerCase();
  const foundEvents = new Set<string>();

  for (const [event, keywords] of Object.entries(EVENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        foundEvents.add(event);
        break;
      }
    }
  }

  return Array.from(foundEvents);
}

/**
 * Extract theme tags from text using keywords
 */
export function extractThemeKeywords(text: string): string[] {
  const lowerText = text.toLowerCase();
  const foundThemes = new Set<string>();

  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        foundThemes.add(theme);
        break;
      }
    }
  }

  return Array.from(foundThemes);
}
