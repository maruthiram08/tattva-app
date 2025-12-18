
import { getShlokas } from './lib/data/ramayana';

async function check() {
    const kanda = "Yuddha Kanda";
    const sarga = 22;
    const shlokaNum = 74;

    console.log(`Checking ${kanda} Sarga ${sarga}...`);
    const shlokas = await getShlokas(kanda, sarga);
    console.log(`Total shlokas in sarga: ${shlokas.length}`);

    const exists = shlokas.find(s => s.shloka === shlokaNum);
    if (exists) {
        console.log(`Shloka ${shlokaNum} EXISTS.`);
    } else {
        console.log(`Shloka ${shlokaNum} DOES NOT EXIST.`);
        // List adjacent ones
        const nearby = shlokas.map(s => s.shloka).filter(n => Math.abs(n - shlokaNum) < 5);
        console.log(`Nearby shlokas: ${nearby.join(', ')}`);
    }
}

check();
