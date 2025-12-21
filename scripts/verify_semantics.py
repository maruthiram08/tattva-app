import json
import re
import argparse
import os
from openai import OpenAI
from typing import List, Dict, Any

# Initialize OpenAI Client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def load_responses(filepath: str) -> List[Dict]:
    with open(filepath, 'r') as f:
        return json.load(f)

def extract_claims(text: str) -> List[Dict]:
    """
    Splits text into sentences and associates citations.
    Returns: [{'claim': 'Hanuman burned Lanka', 'citations': ['Sundara Kanda 54.30']}]
    """
    # Simple semantic splitter: Split by period followed by space
    sentences = re.split(r'(?<=[.!?])\s+', text)
    claims = []
    
    citation_pattern = r'\[([A-Za-z\-\s]+\d+[\.,]\d+)\]' # e.g. [Sundara Kanda 54.30]
    
    for sent in sentences:
        citations = re.findall(citation_pattern, sent)
        if citations:
            # Clean claim text: Remove citations from the string for the LLM
            clean_claim = re.sub(r'\[.*?\]', '', sent).strip()
            claims.append({
                'claim': clean_claim,
                'citations': citations,
                'full_sentence': sent
            })
    return claims

def get_shloka_text(citation: str, retrieval_results: Dict) -> str:
    """
    Finds english translation for a given citation in the retrieval context.
    Matches loosely: "Sundara Kanda 54.30" vs "id": "sundara-kanda-54-30"
    """
    # Normalize citation to ID format: "sundara-kanda-54-30"
    # Remove "Kanda" if present 2x? No, usually "Sundara Kanda".
    # Lowercase, replace whitespace with hyphen.
    
    # 1. Parse citation string
    parts = citation.replace("Kanda", "").strip().split()
    # parts: ['Sundara', '54.30']
    
    if len(parts) >= 2:
        kanda_name = parts[0].lower()
        nums = parts[-1].split('.')
        if len(nums) == 2:
             sarga = nums[0]
             shloka = nums[1]
             
             target_ids = [
                 f"{kanda_name}-kanda-{sarga}-{shloka}",
                 f"{kanda_name}-{sarga}-{shloka}"
             ]
             
             shlokas = retrieval_results.get('shlokas', [])
             for s in shlokas:
                 s_id = s.get('id', '')
                 if any(tid in s_id for tid in target_ids):
                     # Found! Return translation
                     meta = s.get('metadata', {})
                     return meta.get('translation', '') or meta.get('shloka_text', '')
    
    return None

def verify_claim(claim: str, shloka_text: str) -> Dict:
    """Calls LLM to check entailment."""
    prompt = f"""
    Premise (Source Text): "{shloka_text}"
    Hypothesis (Claim): "{claim}"
    
    Does the Premise explicitly support the Hypothesis?
    If yes, output YES.
    If the Hypothesis contradicts the Premise, output CONTRADICTION.
    If the Premise is unrelated or does not contain the info, output UNSUPPORTED.
    
    Provide a short reasoning.
    Format: VERDICT | Reasoning
    """
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0
    )
    content = response.choices[0].message.content
    parts = content.split('|')
    verdict = parts[0].strip()
    reason = parts[1].strip() if len(parts) > 1 else content
    
    return {'verdict': verdict, 'reason': reason}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Path to golden responses JSON")
    parser.add_argument("--limit", type=int, default=5, help="Limit number of questions to verify")
    args = parser.parse_args()
    
    data = load_responses(args.input)
    
    print(f"Verifying first {args.limit} questions from {args.input}...")
    
    for item in data[:args.limit]:
        print(f"\nQ[{item.get('index')}]: {item.get('user_query')[:50]}...")
        
        # Access OpenAI Trace/Result from Batch format
        openai_trace = item.get('openai_trace', {})
        openai_result = item.get('openai', {})
        
        retrieval = openai_trace.get('retrieval_results', {})
        answer = openai_result.get('answer', '')
        
        if not answer:
            print("  No answer found.")
            continue
            
        claims = extract_claims(answer)
        if not claims:
            print("  No citations found in answer.")
            continue
            
        for c in claims:
            print(f"  Claim: {c['claim'][:60]}...")
            for cit in c['citations']:
                text = get_shloka_text(cit, retrieval)
                if text:
                    print(f"    Citation: {cit} (Found Text)")
                    # Verify
                    result = verify_claim(c['claim'], text)
                    if "YES" in result['verdict']:
                         print(f"      ✅ SUPPORTED")
                    else:
                         print(f"      ❌ {result['verdict']}: {result['reason'][:100]}...")
                else:
                    print(f"    Citation: {cit} (Text Not Found in Retrieval Context)")

if __name__ == "__main__":
    main()
