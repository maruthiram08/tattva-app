
import * as fs from 'fs';
import * as path from 'path';

interface EnhancedShlokaData {
    kanda: string;
    sarga: number;
    shloka: number;
    characters: string[];
    events: string[];
    themes: string[];
    explanation: string;
}

const dataPath = path.join(__dirname, 'enhanced-shlokas.json');

if (!fs.existsSync(dataPath)) {
    console.error('❌ Enhanced dataset not found!');
    process.exit(1);
}

const rawData = fs.readFileSync(dataPath, 'utf-8');
const dataset: EnhancedShlokaData[] = JSON.parse(rawData);

console.log(`🔍 Verifying ${dataset.length.toLocaleString()} shlokas...\n`);

let missingEvents = 0;
let missingThemes = 0;
let missingCharacters = 0;
let zeroTags = 0;
let missingAllTags = 0; // Empty arrays for all 3 categories

dataset.forEach(s => {
    const hasEvents = s.events && s.events.length > 0;
    const hasThemes = s.themes && s.themes.length > 0;
    const hasChars = s.characters && s.characters.length > 0;

    if (!hasEvents) missingEvents++;
    if (!hasThemes) missingThemes++;
    if (!hasChars) missingCharacters++;

    if (!hasEvents && !hasThemes && !hasChars) {
        missingAllTags++;
        // Log first 5 empty ones for inspection
        if (missingAllTags <= 5) {
            console.log(`⚠️  Empty Tags: ${s.kanda} ${s.sarga}.${s.shloka} (Explanation len: ${s.explanation?.length || 0})`);
        }
    }
});

console.log('\n📊 Missing Tag Stats:');
console.log(`   Missing Events:     ${missingEvents.toLocaleString()} (${((missingEvents / dataset.length) * 100).toFixed(1)}%)`);
console.log(`   Missing Themes:     ${missingThemes.toLocaleString()} (${((missingThemes / dataset.length) * 100).toFixed(1)}%)`);
console.log(`   Missing Characters: ${missingCharacters.toLocaleString()} (${((missingCharacters / dataset.length) * 100).toFixed(1)}%)`);
console.log(`\n🚨 ZERO TAGS (All empty): ${missingAllTags.toLocaleString()} (${((missingAllTags / dataset.length) * 100).toFixed(1)}%)`);

if (missingAllTags === 0) {
    console.log('\n✅ AWESOME! Every shloka has at least one tag.');
} else {
    console.log('\nℹ️  Note: Some shlokas might genuinely lack extractable entities (e.g. simple descriptions).');
}
