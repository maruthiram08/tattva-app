
import { validateAnswer, T1AnswerSchema } from './lib/validators/template-validator';
import { T1Answer } from './lib/types/templates';

console.log('Successfully imported validator');

const mockT1: T1Answer = {
    templateType: 'T1',
    summary: 'Test summary',
    scripturalEvidence: 'Test evidence',
    keyPoints: ['Point 1'],
    textualBasis: {
        kanda: 'Bala',
        citations: ['Bala 1.1']
    }
};

try {
    const result = validateAnswer(mockT1);
    console.log('Validation result:', result);
} catch (e) {
    console.error('Validation error:', e);
}
