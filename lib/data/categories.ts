/**
 * 45 MVP Question Categories with Locked Template Mappings
 * Based on PRD Section 8: Template Mapping Table
 *
 * CRITICAL: Template assignments are LOCKED and cannot be changed dynamically
 */

import { Category, CategoryId } from '@/lib/types/templates';

export const CATEGORIES: Record<CategoryId, Category> = {
  // Story & Episode Understanding (1-15) - All T1
  1: {
    id: 1,
    name: 'Epic overview',
    template: 'T1',
    description: 'High-level summary of the entire Ramayana',
    group: 'story',
  },
  2: {
    id: 2,
    name: 'Kanda overview',
    template: 'T1',
    description: 'Summary of a specific Kanda (book)',
    group: 'story',
  },
  3: {
    id: 3,
    name: 'Sarga overview',
    template: 'T1',
    description: 'Summary of a specific Sarga (chapter)',
    group: 'story',
  },
  4: {
    id: 4,
    name: 'Story chronology',
    template: 'T1',
    description: 'Timeline and sequence of events',
    group: 'story',
  },
  5: {
    id: 5,
    name: 'Timeline sequencing',
    template: 'T1',
    description: 'Order of events in narrative',
    group: 'story',
  },
  6: {
    id: 6,
    name: 'Major plot events',
    template: 'T1',
    description: 'Key turning points in the narrative',
    group: 'story',
  },
  7: {
    id: 7,
    name: 'Minor episodes',
    template: 'T1',
    description: 'Smaller narrative events',
    group: 'story',
  },
  8: {
    id: 8,
    name: 'Cause–effect relationships',
    template: 'T1',
    description: 'How events lead to consequences',
    group: 'story',
  },
  9: {
    id: 9,
    name: 'Narrative turning points',
    template: 'T1',
    description: 'Critical moments that change the story direction',
    group: 'story',
  },
  10: {
    id: 10,
    name: 'Exile episodes',
    template: 'T1',
    description: 'Events during Rama\'s 14-year exile',
    group: 'story',
  },
  11: {
    id: 11,
    name: 'Abduction episode',
    template: 'T1',
    description: 'Sita\'s abduction by Ravana',
    group: 'story',
  },
  12: {
    id: 12,
    name: 'Search journey episodes',
    template: 'T1',
    description: 'Events during the search for Sita',
    group: 'story',
  },
  13: {
    id: 13,
    name: 'War & battle episodes',
    template: 'T1',
    description: 'Events during the war with Ravana',
    group: 'story',
  },
  14: {
    id: 14,
    name: 'Return & coronation',
    template: 'T1',
    description: 'Rama\'s return to Ayodhya and coronation',
    group: 'story',
  },
  15: {
    id: 15,
    name: 'Post-war events',
    template: 'T1',
    description: 'Events after Ravana\'s defeat',
    group: 'story',
  },

  // Character Understanding (16-25)
  16: {
    id: 16,
    name: 'Character identity',
    template: 'T1',
    description: 'Who a character is',
    group: 'character',
  },
  17: {
    id: 17,
    name: 'Character lineage',
    template: 'T1',
    description: 'Family and ancestry of characters',
    group: 'character',
  },
  18: {
    id: 18,
    name: 'Character role in story',
    template: 'T1',
    description: 'Character\'s function in the narrative',
    group: 'character',
  },
  19: {
    id: 19,
    name: 'Character actions',
    template: 'T1',
    description: 'What characters do in the story',
    group: 'character',
  },
  20: {
    id: 20,
    name: 'Character relationships',
    template: 'T1',
    description: 'Connections between characters',
    group: 'character',
  },
  21: {
    id: 21,
    name: 'Duty-driven decisions',
    template: 'T1',
    description: 'Choices made based on dharma',
    group: 'character',
  },
  22: {
    id: 22,
    name: 'Loyalty-driven decisions',
    template: 'T1',
    description: 'Choices made based on loyalty',
    group: 'character',
  },
  23: {
    id: 23,
    name: 'Sacrificial choices',
    template: 'T1',
    description: 'Self-sacrificing decisions',
    group: 'character',
  },
  24: {
    id: 24,
    name: 'Consequences of actions',
    template: 'T1',
    description: 'Results of character decisions',
    group: 'character',
  },
  25: {
    id: 25,
    name: 'Character evolution',
    template: 'T2', // Interpretive
    description: 'How characters change over time (requires inference)',
    group: 'character',
  },

  // Dharma & Ethics (26-33)
  26: {
    id: 26,
    name: 'Definition of dharma',
    template: 'T1',
    description: 'What dharma means in the text',
    group: 'dharma',
  },
  27: {
    id: 27,
    name: 'Personal dharma',
    template: 'T1',
    description: 'Individual duties and responsibilities',
    group: 'dharma',
  },
  28: {
    id: 28,
    name: 'Familial dharma',
    template: 'T1',
    description: 'Family duties and obligations',
    group: 'dharma',
  },
  29: {
    id: 29,
    name: 'Royal dharma',
    template: 'T1',
    description: 'Duties of kings and rulers',
    group: 'dharma',
  },
  30: {
    id: 30,
    name: 'Duty vs desire',
    template: 'T2', // Interpretive
    description: 'Conflicts between dharma and personal wishes',
    group: 'dharma',
  },
  31: {
    id: 31,
    name: 'Duty vs emotion',
    template: 'T2', // Interpretive
    description: 'Conflicts between dharma and feelings',
    group: 'dharma',
  },
  32: {
    id: 32,
    name: 'Consequences of adharma',
    template: 'T1',
    description: 'Results of violating dharma',
    group: 'dharma',
  },
  33: {
    id: 33,
    name: 'Moral dilemmas in text',
    template: 'T2', // Interpretive
    description: 'Ethical conflicts in the narrative',
    group: 'dharma',
  },

  // Verse Meaning & Language (34-40) - All T1
  34: {
    id: 34,
    name: 'Meaning of a specific shloka',
    template: 'T1',
    description: 'What a particular verse means',
    group: 'verse',
  },
  35: {
    id: 35,
    name: 'Translation clarification',
    template: 'T1',
    description: 'Explaining Sanskrit-to-English translation',
    group: 'verse',
  },
  36: {
    id: 36,
    name: 'Explanation of a verse',
    template: 'T1',
    description: 'Detailed meaning of a verse',
    group: 'verse',
  },
  37: {
    id: 37,
    name: 'Context of a verse',
    template: 'T1',
    description: 'Where and why a verse appears',
    group: 'verse',
  },
  38: {
    id: 38,
    name: 'Meaning of key Sanskrit terms',
    template: 'T1',
    description: 'Definition of Sanskrit words in context',
    group: 'verse',
  },
  39: {
    id: 39,
    name: 'Narrative explanation of verses',
    template: 'T1',
    description: 'Story-based explanation of verses',
    group: 'verse',
  },
  40: {
    id: 40,
    name: 'Clarifying popular confusions',
    template: 'T1',
    description: 'Correcting common misconceptions about the text',
    group: 'verse',
  },

  // Interpretation (41-43) - All T2
  41: {
    id: 41,
    name: 'Ambiguity in text',
    template: 'T2', // Interpretive
    description: 'Where the text is unclear or ambiguous',
    group: 'interpretation',
  },
  42: {
    id: 42,
    name: 'Multiple interpretations',
    template: 'T2', // Interpretive
    description: 'Different scholarly views on passages',
    group: 'interpretation',
  },
  43: {
    id: 43,
    name: 'Narrative silence',
    template: 'T2', // Interpretive
    description: 'What the text does not explicitly say',
    group: 'interpretation',
  },

  // Meta / Trust (44-45)
  44: {
    id: 44,
    name: 'Source transparency',
    template: 'T1',
    description: 'Questions about data sources and methodology',
    group: 'meta',
  },
  45: {
    id: 45,
    name: 'Why a question is refused',
    template: 'T3', // Refusal
    description: 'Out-of-scope questions',
    group: 'meta',
  },
};

/**
 * Get category by ID
 */
export function getCategoryById(id: CategoryId): Category {
  return CATEGORIES[id];
}

/**
 * Get all categories for a specific group
 */
export function getCategoriesByGroup(group: Category['group']): Category[] {
  return Object.values(CATEGORIES).filter((cat) => cat.group === group);
}

/**
 * Get all categories that use a specific template
 */
export function getCategoriesByTemplate(template: 'T1' | 'T2' | 'T3'): Category[] {
  return Object.values(CATEGORIES).filter((cat) => cat.template === template);
}

/**
 * Search categories by name (case-insensitive)
 */
export function searchCategories(query: string): Category[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(CATEGORIES).filter(
    (cat) =>
      cat.name.toLowerCase().includes(lowerQuery) ||
      cat.description.toLowerCase().includes(lowerQuery)
  );
}
