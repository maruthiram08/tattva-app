import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

console.log("Environment Keys loaded:");
Object.keys(process.env).forEach(key => {
    if (key.includes('POSTGRES') || key.includes('DB') || key.includes('URL')) {
        const val = process.env[key] || '';
        console.log(`${key}: ${val.length > 5 ? val.substring(0, 5) + '...' : 'EMPTY'}`);
    }
});
