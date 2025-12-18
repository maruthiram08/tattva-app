import fs from 'fs';
import path from 'path';

export interface Shloka {
    kanda: string;
    sarga: number;
    shloka: number;
    shloka_text: string;
    transliteration: string | null;
    translation: string | null;
    explanation: string | null;
    comments: string | null;
}

export interface KandaInfo {
    name: string;
    description: string;
    totalSargas: number;
}

const KANDA_DESCRIPTIONS: Record<string, string> = {
    "Bala Kanda": "The Book of Youth. Chronicles the birth of Lord Rama, his education under Sage Viswamitra, and his divine marriage to Sita.",
    "Ayodhya Kanda": "The Book of Ayodhya. Depicts the preparations for Rama's coronation, the tragic exile of the prince, and the grief of the kingdom.",
    "Aranya Kanda": "The Book of the Forest. Follows Rama, Sita, and Lakshmana in exile, culminating in the abduction of Sita by the demon king Ravana.",
    "Kishkindha Kanda": "The Book of Kishkindha. Rama forms an alliance with the Vanara king Sugriva and the devoted Hanuman to search for Sita.",
    "Sundara Kanda": "The Book of Beauty. Hanuman's heroic leap across the ocean to Lanka, his discovery of Sita, and the burning of the demon city.",
    "Yuddha Kanda": "The Book of War. The epic battle between Ramas army and Ravana's forces, the defeat of evil, and the triumphant return to Ayodhya.",
    "Uttara Kanda": "The Final Book. The later years of Rama's reign, the story of Lava and Kusha, and the final departure of the divine avatars.",
};

const DATA_PATH = path.join(process.cwd(), 'lib', 'data', 'source', 'Valmiki_Ramayan_Shlokas.json');

// Cache the data in memory to avoid repeated fs reads and parsing
let cachedData: Shloka[] | null = null;

function getData(): Shloka[] {
    if (cachedData) {
        return cachedData;
    }

    try {
        const fileContent = fs.readFileSync(DATA_PATH, 'utf-8');
        cachedData = JSON.parse(fileContent);
        return cachedData!;
    } catch (error) {
        console.error('Error reading Ramayana data:', error);
        return [];
    }
}

export async function getKandas(): Promise<KandaInfo[]> {
    const data = getData();
    const kandas = new Map<string, Set<number>>();

    data.forEach(item => {
        if (!kandas.has(item.kanda)) {
            kandas.set(item.kanda, new Set());
        }
        kandas.get(item.kanda)?.add(item.sarga);
    });

    // Maintain standard order if possible, otherwise it depends on first appearance
    // The dataset is usually ordered, Kanda wise.
    // Let's preserve the order of appearance.
    const uniqueKandaNames = Array.from(new Set(data.map(item => item.kanda)));

    return uniqueKandaNames.map(name => ({
        name,
        description: KANDA_DESCRIPTIONS[name] || "A part of the epic Ramayana.",
        totalSargas: kandas.get(name)?.size || 0
    }));
}

export interface SargaInfo {
    sargaNum: number;
    title: string | null;
    summary: string | null;
    shlokaCount: number;
}

import sargaTitlesData from './sarga_titles.json';

interface SargaTitleEntry {
    kanda: string;
    sarga: number;
    title: string;
}

const sargaTitles = sargaTitlesData as SargaTitleEntry[];

export async function getSargas(kandaName: string): Promise<SargaInfo[]> {
    const data = getData();
    const kandaNameDecoded = decodeURIComponent(kandaName);

    // Group by sarga to calculate counts
    const sargaCounts = new Map<number, number>();

    data.filter(item => item.kanda === kandaNameDecoded).forEach(item => {
        const current = sargaCounts.get(item.sarga) || 0;
        sargaCounts.set(item.sarga, current + 1);
    });

    return Array.from(sargaCounts.keys())
        .sort((a, b) => a - b)
        .map(sargaNum => {
            // Find title from JSON
            const titleEntry = sargaTitles.find(t => t.kanda === kandaNameDecoded && t.sarga === sargaNum);
            // Default to "Sarga X" if something is missing in JSON, but strictly we expect JSON to cover it.
            const title = titleEntry ? titleEntry.title : `Sarga ${sargaNum}`;

            return {
                sargaNum,
                title,
                summary: null,
                shlokaCount: sargaCounts.get(sargaNum) || 0
            };
        });
}

export async function getShlokas(kandaName: string, sargaNum: number): Promise<Shloka[]> {
    const data = getData();
    const kandaNameDecoded = decodeURIComponent(kandaName);

    return data
        .filter(item => item.kanda === kandaNameDecoded && item.sarga === sargaNum)
        .sort((a, b) => a.shloka - b.shloka);
}

const SUMMARIES_PATH = path.join(process.cwd(), 'lib', 'data', 'sarga_summaries.json');

export interface SargaSummary {
    kanda: string;
    sarga: number;
    summary: string;
    generatedAt: string;
}

export async function getSargaSummary(kandaName: string, sargaNum: number): Promise<string | null> {
    try {
        if (!fs.existsSync(SUMMARIES_PATH)) return null;
        const content = fs.readFileSync(SUMMARIES_PATH, 'utf-8');
        const summaries = JSON.parse(content) as SargaSummary[];
        const match = summaries.find(s => s.kanda === decodeURIComponent(kandaName) && s.sarga === sargaNum);
        return match ? match.summary : null;
    } catch (e) {
        console.error('Error reading summaries', e);
        return null;
    }
}
