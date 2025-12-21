/**
 * Metadata Question Handler
 * For questions about structural metadata of the Ramayana (not requiring textual citations)
 */

export interface MetadataAnswer {
    answer: string;
    source: string;
    note?: string;
}

/**
 * Common metadata questions and their answers
 * These don't require retrieval from Pinecone
 */
export const METADATA_QUESTIONS: Record<string, MetadataAnswer> = {
    // Kanda structure questions
    "first kanda": {
        answer: "The first Kanda in Valmiki Ramayana is Bala-Kanda (Book of Youth/Childhood). It introduces Rama's birth, early life, and education under Sage Vishwamitra.",
        source: "This is structural metadata about the epic's organization, not a claim requiring verse citations.",
        note: "The seven Kandas in order are: Bala-Kanda, Ayodhya-Kanda, Aranya-Kanda, Kishkindha-Kanda, Sundara-Kanda, Yuddha-Kanda, and Uttara-Kanda."
    },
    "last kanda": {
        answer: "The last Kanda in Valmiki Ramayana is Uttara-Kanda (The Latter Book). It describes events after Rama's coronation, including the fate of the demons and Sita's exile.",
        source: "This is structural metadata about the epic's organization.",
        note: "Uttara-Kanda is sometimes considered a later addition by some scholars."
    },
    "how many kandas": {
        answer: "The Valmiki Ramayana has seven Kandas (books or sections).",
        source: "This is structural metadata about the epic's organization.",
        note: "The seven Kandas are: Bala, Ayodhya, Aranya, Kishkindha, Sundara, Yuddha, and Uttara."
    },
    "total shlokas": {
        answer: "The Valmiki Ramayana contains approximately 24,000 shlokas (verses), which is why it is also called 'Chaturvimshati Sahasri' (the poem of 24,000 verses).",
        source: "This is traditional metadata about the epic's composition.",
        note: "The exact count varies between different recensions (e.g., Critical Edition vs. Vulgate)."
    },
    "total sargas": {
        answer: "The Valmiki Ramayana contains approximately 500 sargas (chapters) across its seven Kandas.",
        source: "This is structural metadata about the epic's organization.",
        note: "The exact count varies: Bala (77), Ayodhya (119), Aranya (75), Kishkindha (67), Sundara (68), Yuddha (128), Uttara (111) - totaling approximately 645 in some versions."
    },
    "critical edition vulgate": {
        answer: "I use the Critical Edition of the Valmiki Ramayana, prepared by the Oriental Institute, Baroda, which represents a scholarly reconstruction of the oldest available text by removing later interpolations.",
        source: "This is metadata about the source text used for this chatbot.",
        note: "The Vulgate (or 'received text') includes many verses considered interpolations by modern scholars."
    },
    // Q55: Meta refusal reasoning
    "which source refusal": {
        answer: "Questions related to Meta Refusal Reasoning are answered based on the system's design principles and scope boundaries. This system is designed to answer questions grounded in Valmiki Ramayana shlokas. Questions outside this scope (speculation, non-textual claims, comparisons with other texts) trigger refusal responses with explanations.",
        source: "This is a meta-response about the system's behavior [Source: System Documentation].",
        note: "The system refuses questions that fall outside the Valmiki Ramayana text, require speculation beyond textual evidence, or ask for content the system cannot reliably provide."
    },
    "meta source": {
        answer: "This system uses the Valmiki Ramayana as its primary source, specifically referencing individual shlokas (verses) with citations in the format [Kanda-Name Sarga.Shloka]. The text database includes all seven Kandas: Bala, Ayodhya, Aranya, Kishkindha, Sundara, Yuddha, and Uttara.",
        source: "This is a meta-response about the system's configuration [Source: System Documentation].",
        note: "All answers are grounded in retrieved shlokas from this corpus."
    }
};

/**
 * Check if a question is a metadata question
 */
export function isMetadataQuestion(question: string): boolean {
    const normalizedQuestion = question.toLowerCase().trim();

    // Check for exact metadata patterns
    const metadataPatterns = [
        /what is the (first|last|second|third|fourth|fifth|sixth|seventh) kanda/i,
        /name of the first kanda/i,
        /how many (kandas|sargas|shlokas|verses|chapters|books)/i,
        /total (kandas|sargas|shlokas|verses)/i,
        /critical edition|vulgate/i,
        /what (edition|version|recension)/i,
        /how long is the ramayana/i,
        /structure of (the )?(valmiki )?ramayana/i,
        // Q55: Meta questions about the system itself
        /which source.*used|what source.*use/i,
        /how.*determine.*scope/i,
        /why.*refuse/i,
        /meta.*refusal|refusal.*reason/i,
    ];

    return metadataPatterns.some(pattern => pattern.test(normalizedQuestion));
}

/**
 * Get metadata answer for a question
 */
export function getMetadataAnswer(question: string): MetadataAnswer | null {
    const normalizedQuestion = question.toLowerCase().trim();

    // Map common question patterns to metadata keys
    if (/first kanda|name of the first/i.test(normalizedQuestion)) {
        return METADATA_QUESTIONS["first kanda"];
    }
    if (/last kanda/i.test(normalizedQuestion)) {
        return METADATA_QUESTIONS["last kanda"];
    }
    if (/how many kandas|total kandas|number of kandas/i.test(normalizedQuestion)) {
        return METADATA_QUESTIONS["how many kandas"];
    }
    if (/how many (shlokas|verses)|total (shlokas|verses)/i.test(normalizedQuestion)) {
        return METADATA_QUESTIONS["total shlokas"];
    }
    if (/how many (sargas|chapters)|total (sargas|chapters)/i.test(normalizedQuestion)) {
        return METADATA_QUESTIONS["total sargas"];
    }
    if (/critical edition|vulgate|what edition|what version/i.test(normalizedQuestion)) {
        return METADATA_QUESTIONS["critical edition vulgate"];
    }
    // Q55: Meta source/refusal questions
    if (/which source.*used|what source.*refusal|meta.*refusal/i.test(normalizedQuestion)) {
        return METADATA_QUESTIONS["which source refusal"];
    }
    if (/which source|what source/i.test(normalizedQuestion)) {
        return METADATA_QUESTIONS["meta source"];
    }

    return null;
}

/**
 * Build a T1 response for a metadata question
 */
export function buildMetadataT1Response(answer: MetadataAnswer): string {
    return JSON.stringify({
        templateType: "T1",
        answer: answer.answer,
        textualBasis: {
            kanda: "N/A - Structural Metadata",
            sarga: [],
            shloka: [],
            citations: []
        },
        explanation: `${answer.source}${answer.note ? ` ${answer.note}` : ''}`
    }, null, 2);
}
