import { retrieveContext } from '@/lib/services/retrieval-service';
import { classifyQuestion } from '@/lib/services/classification-service';
import { RetrievalResult } from '@/lib/types/retrieval';

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { question } = await req.json();

    // 1. Classify
    console.log('\n📊 API Retrieve: Classification...');
    const classification = await classifyQuestion(question);

    // 2. Retrieve
    let retrieval: RetrievalResult = { shlokas: [], totalRetrieved: 0 };
    if (classification.shouldAnswer && classification.template !== 'T3') {
      console.log('\n📚 API Retrieve: Retrieval...');
      retrieval = await retrieveContext(question, classification.categoryId);
    }

    return Response.json({
      retrieval,
      classification // Useful for debugging or frontend hints
    });

  } catch (error) {
    console.error('Retrieve API Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
}
