/**
 * Template Types for Tattva Answer System
 * Based on PRD Section 8: Answer Templates
 */

export type TemplateType = 'T1' | 'T2' | 'T3';

export type CategoryId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
  11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 |
  21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 |
  31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 |
  41 | 42 | 43 | 44 | 45;

export interface Category {
  id: CategoryId;
  name: string;
  template: TemplateType;
  description: string;
  group: 'story' | 'character' | 'dharma' | 'verse' | 'interpretation' | 'meta';
}

/**
 * T1 — Textual Answer Template
 * Used when the text is explicit and explanatory
 */
export interface T1Answer {
  templateType: 'T1';
  answer: string;
  textualBasis: {
    kanda: string;
    sarga?: number | number[];
    shloka?: number | number[];
    citations: string[];
  };
  explanation: string;
}

/**
 * T2 — Interpretive Answer Template
 * Used when inference or commentary is involved
 */
export interface T2Answer {
  templateType: 'T2';
  answer: string;
  whatTextStates: string;
  traditionalInterpretations: string;
  limitOfCertainty: string; // MANDATORY - must be present
}

/**
 * T3 — Refusal Template
 * Used when question is out of scope
 */
export interface T3Answer {
  templateType: 'T3';
  outOfScopeNotice: string;
  why: string;
  whatICanHelpWith: string[];
}

export type Answer = T1Answer | T2Answer | T3Answer;

/**
 * Classification result from the classify API
 */
export interface ClassificationResult {
  categoryId: CategoryId;
  categoryName: string;
  template: TemplateType;
  confidence: number;
  reasoning: string;
  shouldAnswer: boolean; // false = refuse with T3
}

/**
 * Validation error for template compliance
 */
export interface TemplateValidationError {
  field: string;
  message: string;
  constraint: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: TemplateValidationError[];
  warnings?: string[];
}
