/**
 * Retrieval Configurations for 45 MVP Categories
 * Based on PRD Section 5: Retrieval Granularity
 *
 * Defines HOW to retrieve context from Pinecone for each category
 */

import { CategoryId } from '@/lib/types/templates';

export type RetrievalGranularity = 'shloka' | 'sarga' | 'kanda' | 'multi-shloka' | 'sarga-range';

export interface RetrievalConfig {
  categoryId: CategoryId;
  granularity: RetrievalGranularity;
  topK: number; // Number of vectors to retrieve
  includeTranslation: boolean;
  includeComments: boolean;
  requiresExplanation: boolean; // Always true
  metadataFilters?: {
    kanda?: string;
    sarga?: number;
    has_translation?: boolean;
    has_comments?: boolean;
  };
}

/**
 * Retrieval configuration lookup table for all 45 categories
 */
export const RETRIEVAL_CONFIGS: Record<CategoryId, RetrievalConfig> = {
  // STORY & EPISODE (1-15)
  // Categories 1-2: Overview questions - retrieve at Kanda level
  1: {
    // Epic overview
    categoryId: 1,
    granularity: 'kanda',
    topK: 50, // Get representative shlokas from across all Kandas
    includeTranslation: false,
    includeComments: false,
    requiresExplanation: true,
  },
  2: {
    // Kanda overview
    categoryId: 2,
    granularity: 'kanda',
    topK: 30, // Get representative shlokas from the specific Kanda
    includeTranslation: false,
    includeComments: false,
    requiresExplanation: true,
  },
  3: {
    // Sarga overview
    categoryId: 3,
    granularity: 'sarga',
    topK: 20, // Get all shlokas from the specific Sarga
    includeTranslation: false,
    includeComments: false,
    requiresExplanation: true,
  },

  // Categories 4-15: Episode/Event questions - retrieve at Sarga range level
  4: {
    // Story chronology
    categoryId: 4,
    granularity: 'sarga-range',
    topK: 30,
    includeTranslation: false,
    includeComments: false,
    requiresExplanation: true,
  },
  5: {
    // Timeline sequencing
    categoryId: 5,
    granularity: 'sarga-range',
    topK: 25,
    includeTranslation: false,
    includeComments: false,
    requiresExplanation: true,
  },
  6: {
    // Major plot events
    categoryId: 6,
    granularity: 'sarga-range',
    topK: 30,
    includeTranslation: false,
    includeComments: false,
    requiresExplanation: true,
  },
  7: {
    // Minor episodes
    categoryId: 7,
    granularity: 'sarga',
    topK: 15,
    includeTranslation: false,
    includeComments: false,
    requiresExplanation: true,
  },
  8: {
    // Cause-effect relationships
    categoryId: 8,
    granularity: 'sarga-range',
    topK: 25,
    includeTranslation: false,
    includeComments: false,
    requiresExplanation: true,
  },
  9: {
    // Narrative turning points
    categoryId: 9,
    granularity: 'sarga-range',
    topK: 20,
    includeTranslation: false,
    includeComments: false,
    requiresExplanation: true,
  },
  10: {
    // Exile episodes
    categoryId: 10,
    granularity: 'sarga-range',
    topK: 30,
    includeTranslation: false,
    includeComments: false,
    requiresExplanation: true,
  },
  11: {
    // Abduction episode
    categoryId: 11,
    granularity: 'sarga-range',
    topK: 25,
    includeTranslation: false,
    includeComments: false,
    requiresExplanation: true,
  },
  12: {
    // Search journey episodes
    categoryId: 12,
    granularity: 'sarga-range',
    topK: 30,
    includeTranslation: false,
    includeComments: false,
    requiresExplanation: true,
  },
  13: {
    // War & battle episodes
    categoryId: 13,
    granularity: 'sarga-range',
    topK: 35,
    includeTranslation: false,
    includeComments: false,
    requiresExplanation: true,
  },
  14: {
    // Return & coronation
    categoryId: 14,
    granularity: 'sarga-range',
    topK: 25,
    includeTranslation: false,
    includeComments: false,
    requiresExplanation: true,
  },
  15: {
    // Post-war events
    categoryId: 15,
    granularity: 'sarga-range',
    topK: 20,
    includeTranslation: false,
    includeComments: false,
    requiresExplanation: true,
  },

  // CHARACTER UNDERSTANDING (16-25)
  16: {
    // Character identity
    categoryId: 16,
    granularity: 'multi-shloka',
    topK: 15,
    includeTranslation: false,
    includeComments: false,
    requiresExplanation: true,
  },
  17: {
    // Character lineage
    categoryId: 17,
    granularity: 'multi-shloka',
    topK: 10,
    includeTranslation: false,
    includeComments: false,
    requiresExplanation: true,
  },
  18: {
    // Character role in story
    categoryId: 18,
    granularity: 'multi-shloka',
    topK: 20,
    includeTranslation: false,
    includeComments: false,
    requiresExplanation: true,
  },
  19: {
    // Character actions
    categoryId: 19,
    granularity: 'sarga-range',
    topK: 25,
    includeTranslation: false,
    includeComments: false,
    requiresExplanation: true,
  },
  20: {
    // Character relationships
    categoryId: 20,
    granularity: 'multi-shloka',
    topK: 20,
    includeTranslation: false,
    includeComments: false,
    requiresExplanation: true,
  },
  21: {
    // Duty-driven decisions
    categoryId: 21,
    granularity: 'sarga-range',
    topK: 20,
    includeTranslation: false,
    includeComments: false,
    requiresExplanation: true,
  },
  22: {
    // Loyalty-driven decisions
    categoryId: 22,
    granularity: 'sarga-range',
    topK: 20,
    includeTranslation: false,
    includeComments: false,
    requiresExplanation: true,
  },
  23: {
    // Sacrificial choices
    categoryId: 23,
    granularity: 'sarga-range',
    topK: 15,
    includeTranslation: false,
    includeComments: false,
    requiresExplanation: true,
  },
  24: {
    // Consequences of actions
    categoryId: 24,
    granularity: 'sarga-range',
    topK: 20,
    includeTranslation: false,
    includeComments: false,
    requiresExplanation: true,
  },
  25: {
    // Character evolution (INTERPRETIVE)
    categoryId: 25,
    granularity: 'sarga-range',
    topK: 25,
    includeTranslation: false,
    includeComments: true, // Interpretive - needs comments
    requiresExplanation: true,
  },

  // DHARMA & ETHICS (26-33)
  26: {
    // Definition of dharma
    categoryId: 26,
    granularity: 'multi-shloka',
    topK: 20,
    includeTranslation: true, // Explicit textual basis
    includeComments: false,
    requiresExplanation: true,
  },
  27: {
    // Personal dharma
    categoryId: 27,
    granularity: 'multi-shloka',
    topK: 15,
    includeTranslation: true,
    includeComments: false,
    requiresExplanation: true,
  },
  28: {
    // Familial dharma
    categoryId: 28,
    granularity: 'multi-shloka',
    topK: 15,
    includeTranslation: true,
    includeComments: false,
    requiresExplanation: true,
  },
  29: {
    // Royal dharma
    categoryId: 29,
    granularity: 'multi-shloka',
    topK: 20,
    includeTranslation: true,
    includeComments: false,
    requiresExplanation: true,
  },
  30: {
    // Duty vs desire (INTERPRETIVE)
    categoryId: 30,
    granularity: 'sarga-range',
    topK: 20,
    includeTranslation: true,
    includeComments: true, // Interpretive
    requiresExplanation: true,
  },
  31: {
    // Duty vs emotion (INTERPRETIVE)
    categoryId: 31,
    granularity: 'sarga-range',
    topK: 20,
    includeTranslation: true,
    includeComments: true, // Interpretive
    requiresExplanation: true,
  },
  32: {
    // Consequences of adharma
    categoryId: 32,
    granularity: 'sarga-range',
    topK: 20,
    includeTranslation: false,
    includeComments: false,
    requiresExplanation: true,
  },
  33: {
    // Moral dilemmas (INTERPRETIVE)
    categoryId: 33,
    granularity: 'sarga-range',
    topK: 20,
    includeTranslation: true,
    includeComments: true, // Interpretive
    requiresExplanation: true,
  },

  // VERSE MEANING & LANGUAGE (34-40)
  34: {
    // Meaning of specific shloka
    categoryId: 34,
    granularity: 'shloka',
    topK: 5, // Specific verse + context
    includeTranslation: true, // ALWAYS for verse questions
    includeComments: false,
    requiresExplanation: true,
  },
  35: {
    // Translation clarification
    categoryId: 35,
    granularity: 'shloka',
    topK: 5,
    includeTranslation: true,
    includeComments: false,
    requiresExplanation: true,
  },
  36: {
    // Explanation of verse
    categoryId: 36,
    granularity: 'shloka',
    topK: 5,
    includeTranslation: true,
    includeComments: false,
    requiresExplanation: true,
  },
  37: {
    // Context of verse
    categoryId: 37,
    granularity: 'sarga',
    topK: 15, // Verse + surrounding context
    includeTranslation: true,
    includeComments: false,
    requiresExplanation: true,
  },
  38: {
    // Sanskrit terms
    categoryId: 38,
    granularity: 'shloka',
    topK: 10,
    includeTranslation: true,
    includeComments: false,
    requiresExplanation: true,
  },
  39: {
    // Narrative explanation
    categoryId: 39,
    granularity: 'sarga',
    topK: 15,
    includeTranslation: true,
    includeComments: false,
    requiresExplanation: true,
  },
  40: {
    // Popular confusions
    categoryId: 40,
    granularity: 'multi-shloka',
    topK: 15,
    includeTranslation: true,
    includeComments: false,
    requiresExplanation: true,
  },

  // INTERPRETATION (41-43) - All INTERPRETIVE
  41: {
    // Ambiguity in text
    categoryId: 41,
    granularity: 'shloka',
    topK: 10,
    includeTranslation: true,
    includeComments: true, // Interpretive
    requiresExplanation: true,
  },
  42: {
    // Multiple interpretations
    categoryId: 42,
    granularity: 'shloka',
    topK: 10,
    includeTranslation: true,
    includeComments: true, // Interpretive
    requiresExplanation: true,
  },
  43: {
    // Narrative silence
    categoryId: 43,
    granularity: 'shloka',
    topK: 10,
    includeTranslation: true,
    includeComments: true, // Interpretive
    requiresExplanation: true,
  },

  // META / TRUST (44-45)
  44: {
    // Source transparency
    categoryId: 44,
    granularity: 'shloka',
    topK: 5, // Minimal retrieval - mostly metadata answer
    includeTranslation: false,
    includeComments: false,
    requiresExplanation: false, // Meta question
  },
  45: {
    // Refusal
    categoryId: 45,
    granularity: 'shloka',
    topK: 0, // No retrieval for refusals
    includeTranslation: false,
    includeComments: false,
    requiresExplanation: false,
  },
};

/**
 * Get retrieval config for a category
 */
export function getRetrievalConfig(categoryId: CategoryId): RetrievalConfig {
  const config = RETRIEVAL_CONFIGS[categoryId];
  if (!config) {
    throw new Error(`No retrieval config found for category ${categoryId}`);
  }
  return config;
}

/**
 * Check if comments are required for a category
 */
export function requiresComments(categoryId: CategoryId): boolean {
  const config = getRetrievalConfig(categoryId);
  return config.includeComments;
}

/**
 * Check if translation is required for a category
 */
export function requiresTranslation(categoryId: CategoryId): boolean {
  const config = getRetrievalConfig(categoryId);
  return config.includeTranslation;
}
