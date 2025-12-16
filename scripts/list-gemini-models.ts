
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('GEMINI_API_KEY not found');
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        // There isn't a direct listModels on the client instance in some versions, 
        // but let's try assuming the error message wasn't lying about calling "ListModels".
        // Actually, the node SDK might expose it differently.
        // Let's try to access the model manager if available, or just try a known working model like 'gemini-pro' again but carefully.
        // Wait, the error said "Call ListModels". In the REST API that's GET /v1beta/models.
        // In the SDK:
        // const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        // It doesn't seem to have listModels on the main class in the docs I recall.
        // I'll try to use raw fetch for list models.

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        console.log('Available Models:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error listing models:', error);
    }
}

listModels();
