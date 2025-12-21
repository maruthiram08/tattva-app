/**
 * Sanskrit Etymology Handler
 * For questions about the meaning/etymology of Sanskrit names and terms
 */

export interface EtymologyAnswer {
    term: string;
    meaning: string;
    breakdown: string;
    significance?: string;
    relatedTerms?: string[];
}

/**
 * Common Sanskrit terms and their etymologies
 */
export const SANSKRIT_ETYMOLOGY: Record<string, EtymologyAnswer> = {
    "dasharatha": {
        term: "Dasharatha",
        meaning: "One who has ten chariots / One who can fight in ten directions",
        breakdown: "दश (dasha = ten) + रथ (ratha = chariot)",
        significance: "Signifies his prowess as a warrior king who could drive his chariot in all ten directions",
        relatedTerms: ["Raghu (ancestor)", "Kosala (kingdom)"]
    },
    "rama": {
        term: "Rama",
        meaning: "One who delights / One who is pleasing",
        breakdown: "राम (rāma) from √ram (to delight, to please)",
        significance: "The name signifies his nature as one who delights all beings",
        relatedTerms: ["Ramachandra", "Raghava"]
    },
    "sita": {
        term: "Sita",
        meaning: "The furrow / Born from the earth",
        breakdown: "सीता (sītā = furrow of a plough)",
        significance: "Named because she was found in a furrow while King Janaka was ploughing the field for a yajna",
        relatedTerms: ["Janaki (daughter of Janaka)", "Vaidehi (from Videha)"]
    },
    "ravana": {
        term: "Ravana",
        meaning: "One who makes others cry / One whose roar is terrifying",
        breakdown: "रावण (rāvaṇa) from √ru (to roar, to cry)",
        significance: "Named for the terror his roar caused to the three worlds",
        relatedTerms: ["Dashagriva (ten-headed)", "Paulastya (descendant of Pulastya)"]
    },
    "hanuman": {
        term: "Hanuman",
        meaning: "One with a (broken) jaw",
        breakdown: "हनु (hanu = jaw) + मान (mān = having)",
        significance: "Named because Indra's thunderbolt broke his jaw when he tried to eat the sun as a child",
        relatedTerms: ["Maruti (son of Marut/Wind)", "Anjaneya (son of Anjana)"]
    },
    "ramayana": {
        term: "Ramayana",
        meaning: "The journey/story of Rama",
        breakdown: "राम (Rama) + अयन (ayana = journey, path, going)",
        significance: "The epic narrates Rama's journey from prince to exile to victorious king",
        relatedTerms: ["Adi Kavya (first poem)", "Chaturvimshati Sahasri (24,000 verses)"]
    },
    "ikshvaku": {
        term: "Ikshvaku",
        meaning: "Descendant of Sugarcane / Sweet like sugarcane",
        breakdown: "इक्षु (ikṣu = sugarcane) + वाकु (vāku = origin)",
        significance: "Founder of the Solar Dynasty (Suryavansha) to which Rama belongs",
        relatedTerms: ["Suryavansha (Solar Dynasty)", "Raghuvansha (Raghu's lineage)"]
    },
    "lakshmana": {
        term: "Lakshmana",
        meaning: "One with auspicious marks / The fortunate one",
        breakdown: "लक्ष्मण (lakṣmaṇa) from लक्ष्म (lakṣma = mark, sign)",
        significance: "Named for the auspicious marks on his body at birth",
        relatedTerms: ["Sumitranandana (son of Sumitra)", "Ramanuja (younger brother of Rama)"]
    },
    "bharata": {
        term: "Bharata",
        meaning: "One who supports/nourishes / The sustainer",
        breakdown: "भरत (bharata) from √bhṛ (to bear, to support)",
        significance: "Named for his role as one who would sustain and support the kingdom",
        relatedTerms: ["Kaikeyinandana (son of Kaikeyi)"]
    },
    "sugriva": {
        term: "Sugriva",
        meaning: "One with a beautiful neck",
        breakdown: "सु (su = good, beautiful) + ग्रीवा (grīvā = neck)",
        significance: "Named for his distinctive beautiful neck",
        relatedTerms: ["Kishkindha (his kingdom)", "Vali (brother)"]
    },
    "vali": {
        term: "Vali",
        meaning: "Strength / The powerful one",
        breakdown: "वाली (vālī) related to बल (bala = strength)",
        significance: "Named for his immense strength, particularly the boon that gave him half his opponent's power",
        relatedTerms: ["Kishkindha", "Indra's son"]
    }
};

/**
 * Check if a question is an etymology question
 */
export function isEtymologyQuestion(question: string): boolean {
    const etymologyPatterns = [
        /what does ['"]?(\w+)['"]? mean/i,
        /meaning of ['"]?(\w+)['"]?/i,
        /etymology of ['"]?(\w+)['"]?/i,
        /what is the meaning of ['"]?(\w+)['"]?/i,
        /why is (\w+) called/i,
        /where does the name ['"]?(\w+)['"]? come from/i,
        /['"]?(\w+)['"]? name meaning/i,
    ];

    return etymologyPatterns.some(pattern => pattern.test(question));
}

/**
 * Extract the term being asked about
 */
export function extractEtymologyTerm(question: string): string | null {
    const patterns = [
        /what does ['"]?(\w+)['"]? mean/i,
        /meaning of ['"]?(\w+)['"]?/i,
        /etymology of ['"]?(\w+)['"]?/i,
        /what is the meaning of ['"]?(\w+)['"]?/i,
        /why is (\w+) called/i,
        /where does the name ['"]?(\w+)['"]? come from/i,
        /['"]?(\w+)['"]? name meaning/i,
    ];

    for (const pattern of patterns) {
        const match = question.match(pattern);
        if (match && match[1]) {
            return match[1].toLowerCase();
        }
    }

    return null;
}

/**
 * Get etymology answer for a term
 */
export function getEtymologyAnswer(term: string): EtymologyAnswer | null {
    const normalizedTerm = term.toLowerCase().trim();
    return SANSKRIT_ETYMOLOGY[normalizedTerm] || null;
}

/**
 * Build a T1 response for an etymology question
 */
export function buildEtymologyT1Response(answer: EtymologyAnswer): string {
    const relatedNote = answer.relatedTerms
        ? ` Related terms include: ${answer.relatedTerms.join(', ')}.`
        : '';

    return JSON.stringify({
        templateType: "T1",
        answer: `The name "${answer.term}" means "${answer.meaning}". In Sanskrit, it breaks down as: ${answer.breakdown}. ${answer.significance || ''}${relatedNote}`,
        textualBasis: {
            kanda: "Etymology - Structural Knowledge",
            sarga: [],
            shloka: [],
            citations: []
        },
        explanation: `This is a Sanskrit etymology derived from traditional sources. ${answer.significance || ''} The name carries deep significance in the epic.`
    }, null, 2);
}
