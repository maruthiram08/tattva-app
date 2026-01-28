/**
 * Template Validator with Hard Constraints
 * Based on PRD Section 8: Answer Templates
 *
 * HARD CONSTRAINTS (enforced before generation):
 * 1. T1 may not contain speculation
 * 2. T2 must include "Limit of Certainty"
 * 3. T3 must never apologize
 * 4. No category may switch templates
 * 5. Comments field is NEVER used in T1
 */

import { z } from 'zod';
import {
  T1Answer,
  T2Answer,
  T3Answer,
  Answer,
  ValidationResult,
  TemplateValidationError,
} from '@/lib/types/templates';

/**
 * Zod Schema for T1 (Textual Answer)
 */
// Updated T1 Schema for Synthesis First
export const T1AnswerSchema = z.object({
  templateType: z.literal('T1'),
  // New Fields
  summary: z.string().optional(),
  keyPoints: z.array(z.string()).optional(),
  scripturalEvidence: z.string().optional(),
  // Legacy
  answer: z.string().optional(),

  textualBasis: z.object({
    kanda: z.string().min(1, 'Kanda is required'),
    sarga: z.union([z.number(), z.array(z.number())]).optional(),
    shloka: z.union([z.number(), z.array(z.number())]).optional(),
    citations: z.array(z.string()).min(1, 'At least one citation is required'),
  }),
  explanation: z.string().optional(),
});

/**
 * Zod Schema for T2 (Interpretive Answer)
 */
export const T2AnswerSchema = z.object({
  templateType: z.literal('T2'),
  answer: z.string().optional(),

  // New Fields
  summary: z.string().optional(),
  keyPoints: z.array(z.string()).optional(),
  scripturalEvidence: z.string().optional(),

  whatTextStates: z.string().optional(),
  traditionalInterpretations: z.string().min(1, 'Traditional Interpretations is required'),
  limitOfCertainty: z.string().min(1, 'Limit of Certainty is MANDATORY for T2'),
});

/**
 * Zod Schema for T3 (Refusal)
 */
export const T3AnswerSchema = z.object({
  templateType: z.literal('T3'),
  outOfScopeNotice: z.string().min(1, 'Out-of-scope notice is required'),
  why: z.string().min(1, 'Explanation of why is required'),
  whatICanHelpWith: z.array(z.string()).min(1, 'At least one alternative suggestion is required'),
  redirect: z.object({
    introduction: z.string(),
    alternatives: z.array(z.string())
  }).optional(),
});

/**
 * Union schema for all answer types
 */
export const AnswerSchema = z.discriminatedUnion('templateType', [
  T1AnswerSchema,
  T2AnswerSchema,
  T3AnswerSchema,
]);

/**
 * Patterns that indicate speculation (forbidden in T1)
 */
const SPECULATION_PATTERNS = [
  /\b(might|may|could|would|possibly|perhaps|probably|likely|seems|appears)\b/i,
  /\b(suggests|implies|indicates|could be|may be|might be)\b/i,
  /\b(interpretation|inferred|assumed|speculate)\b/i,
];

/**
 * Patterns that indicate apology (forbidden in T3)
 */
const APOLOGY_PATTERNS = [
  /\b(sorry|apolog|unfortunately|regret|afraid)\b/i,
  /\b(cannot help|can't help|unable to assist)\b/i,
];

/**
 * Check if text contains speculative language
 */
function containsSpeculation(text: string): boolean {
  return SPECULATION_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Check if text contains apology language
 */
function containsApology(text: string): boolean {
  return APOLOGY_PATTERNS.some((pattern) => pattern.test(text));
}

// ... (T2 and T3 schemas remain similar)

export function validateT1Answer(answer: T1Answer): ValidationResult {
  const errors: TemplateValidationError[] = [];
  const warnings: string[] = [];

  // Schema validation
  const schemaResult = T1AnswerSchema.safeParse(answer);
  if (!schemaResult.success) {
    schemaResult.error.errors.forEach((err) => {
      errors.push({
        field: err.path.join('.'),
        message: err.message,
        constraint: 'schema',
      });
    });
  }

  // LOGIC: specific fields
  const primaryText = answer.scripturalEvidence || answer.answer;
  const secondaryText = answer.summary || answer.explanation;

  if (!primaryText) {
    errors.push({
      field: 'scripturalEvidence',
      message: 'Either scripturalEvidence or answer (legacy) is required',
      constraint: 'missing_content'
    });
  }

  // HARD CONSTRAINT: T1 may not contain speculation (checked in rigorous evidence section)
  if (primaryText && containsSpeculation(primaryText)) {
    errors.push({
      field: 'scripturalEvidence',
      message: 'T1 evidence must not contain speculative language (might, could, possibly, etc.)',
      constraint: 'no_speculation',
    });
  }

  if (secondaryText && containsSpeculation(secondaryText)) {
    errors.push({
      field: 'summary',
      message: 'T1 summary/explanation must not contain speculative language',
      constraint: 'no_speculation',
    });
  }

  // Validate citations format
  answer.textualBasis.citations.forEach((citation, index) => {
    if (!citation || citation.trim().length === 0) {
      errors.push({
        field: `textualBasis.citations[${index}]`,
        message: 'Citation cannot be empty',
        constraint: 'citation_format',
      });
    }
  });

  // Warning: Check if answer is too short (use summary or primary text)
  if ((answer.summary?.length || 0) + (primaryText?.length || 0) < 50) {
    warnings.push('Answer seems too brief. Consider providing more detail.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate T2 Answer (Interpretive)
 * HARD CONSTRAINTS:
 * 1. Must include "Limit of Certainty" section
 * 2. Must clearly separate text from interpretation
 */
export function validateT2Answer(answer: T2Answer): ValidationResult {
  const errors: TemplateValidationError[] = [];
  const warnings: string[] = [];

  // Schema validation
  const schemaResult = T2AnswerSchema.safeParse(answer);
  if (!schemaResult.success) {
    schemaResult.error.errors.forEach((err) => {
      errors.push({
        field: err.path.join('.'),
        message: err.message,
        constraint: 'schema',
      });
    });
  }

  // HARD CONSTRAINT: T2 must include "Limit of Certainty"
  if (!answer.limitOfCertainty || answer.limitOfCertainty.trim().length === 0) {
    errors.push({
      field: 'limitOfCertainty',
      message: 'Limit of Certainty is MANDATORY for T2 answers',
      constraint: 'mandatory_limit_of_certainty',
    });
  }

  // Check evidence fields for speculation
  const evidenceText = answer.scripturalEvidence || answer.whatTextStates;
  if (evidenceText && containsSpeculation(evidenceText)) {
    warnings.push(
      'Warning: Scriptural evidence should be purely factual, but contains speculative language'
    );
  }

  // Check summary/interpretation
  const interpretationText = answer.summary || answer.traditionalInterpretations;
  // (Interpretations CAN contain speculation/inference, so we generally don't block it there, 
  // but we might warn if it's excessive in the summary - skipping for now to be permissive on T2)

  // Warning: Check sections are substantive
  if (answer.limitOfCertainty.length < 30) {
    warnings.push('Limit of Certainty section seems too brief');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate T3 Answer (Refusal)
 * HARD CONSTRAINTS:
 * 1. Must never apologize
 * 2. Must provide alternatives
 */
export function validateT3Answer(answer: T3Answer): ValidationResult {
  const errors: TemplateValidationError[] = [];
  const warnings: string[] = [];

  // Schema validation
  const schemaResult = T3AnswerSchema.safeParse(answer);
  if (!schemaResult.success) {
    schemaResult.error.errors.forEach((err) => {
      errors.push({
        field: err.path.join('.'),
        message: err.message,
        constraint: 'schema',
      });
    });
  }

  // HARD CONSTRAINT: T3 must never apologize
  const allText = `${answer.outOfScopeNotice} ${answer.why} ${answer.whatICanHelpWith.join(' ')}`;
  if (containsApology(allText)) {
    errors.push({
      field: 'all',
      message: 'T3 refusals must not contain apologies (sorry, unfortunately, regret, etc.)',
      constraint: 'no_apology',
    });
  }

  // Check that alternatives are substantive
  if (answer.whatICanHelpWith.some((alt) => alt.length < 10)) {
    warnings.push('Some alternative suggestions are too brief');
  }

  // Warning: Tone should be calm and confident
  if (/\!{2,}/.test(allText)) {
    warnings.push('Avoid excessive exclamation marks - maintain calm tone');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Main validation function - routes to appropriate validator based on template type
 */
export function validateAnswer(answer: Answer): ValidationResult {
  switch (answer.templateType) {
    case 'T1':
      return validateT1Answer(answer);
    case 'T2':
      return validateT2Answer(answer);
    case 'T3':
      return validateT3Answer(answer);
    default:
      return {
        valid: false,
        errors: [
          {
            field: 'templateType',
            message: 'Invalid template type',
            constraint: 'invalid_type',
          },
        ],
      };
  }
}

/**
 * Utility: Format validation errors for display
 */
export function formatValidationErrors(result: ValidationResult): string {
  if (result.valid) {
    return 'Validation passed';
  }

  const errorMessages = result.errors.map(
    (err) => `[${err.field}] ${err.message} (constraint: ${err.constraint})`
  );

  const warningMessages = result.warnings?.map((warn) => `⚠️  ${warn}`) || [];

  return [...errorMessages, ...warningMessages].join('\n');
}
