"""
Pinecone Verifier
Verifies if citations exist in the Pinecone vector database.
"""

import os
from typing import Dict, Any, List
from pinecone import Pinecone
from citation_utils import normalize_kanda, extract_citations, Citation

# Configuration
PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.environ.get("PINECONE_INDEX_NAME", "tattva-shlokas")

class CitationVerifier:
    def __init__(self):
        if not PINECONE_API_KEY:
            raise ValueError("PINECONE_API_KEY environment variable is not set")
        
        self.pc = Pinecone(api_key=PINECONE_API_KEY)
        self.index = self.pc.Index(PINECONE_INDEX_NAME)
        print(f"Connected to Pinecone index: {PINECONE_INDEX_NAME}")

    def verify_citation_exists(self, kanda: str, sarga: int, shloka: int) -> Dict[str, Any]:
        """
        Check if a specific citation tuple exists in Pinecone.
        query matches metadata: {kanda, sarga, shloka}
        """
        # Normalize kanda just in case, though extracting should have done it
        normalized_kanda = normalize_kanda(kanda)
        if not normalized_kanda:
             return {"exists": False, "shloka_id": None, "text_preview": None, "reason": "Invalid Kanda Name"}

        # Construct filter
        # Note: metadata fields in Pinecone must match exactly.
        # Based on citation_extractor.py: "kanda": "Bala Kanda" (Display Name) or "bala-kanda" (ID)?
        # Let's check retrieval-service.ts again. 
        # filter.kanda = userFilters.kanda
        # It seems the metadata 'kanda' field stores "Bala Kanda" (Display Name) based on CANONICAL_TO_DISPLAY reverse map.
        # But wait, citation_extractor line 53 has CANONICAL_TO_DISPLAY.
        # Let's verify what is stored in Pinecone.
        # If I look at retrieval-service.ts, it passes `userFilters.kanda` directly.
        # If I assume the metadata 'kanda_number' or 'kanda' (string) is used.
        # In `evaluations/evaluators/citation_extractor.py`, there is a mapping `CANONICAL_TO_DISPLAY`.
        # This suggests the database likely uses "Bala Kanda", "Ayodhya Kanda" etc. 
        # I will map canonical "bala-kanda" to "Bala Kanda" for the query.
        
        canonical_to_display = {
            "bala-kanda": "Bala Kanda",
            "ayodhya-kanda": "Ayodhya Kanda",
            "aranya-kanda": "Aranya Kanda",
            "kishkindha-kanda": "Kishkindha Kanda",
            "sundara-kanda": "Sundara Kanda",
            "yuddha-kanda": "Yuddha Kanda",
            "uttara-kanda": "Uttara Kanda",
        }
        
        display_kanda = canonical_to_display.get(normalized_kanda, normalized_kanda)

        metadata_filter = {
            "kanda": {"$eq": display_kanda},
            "sarga": {"$eq": sarga},
            "shloka": {"$eq": shloka}
        }

        try:
            # Query with dummy vector
            dummy_vector = [0.0] * 1536 # text-embedding-3-small dimension
            
            result = self.index.query(
                vector=dummy_vector,
                filter=metadata_filter,
                top_k=1,
                include_metadata=True
            )

            if result and result.matches:
                match = result.matches[0]
                text = match.metadata.get('shloka_text', '') or match.metadata.get('text', '')
                return {
                    "exists": True,
                    "shloka_id": match.id,
                    "text_preview": text[:100] + "..." if text else None
                }
            else:
                return {
                    "exists": False,
                    "shloka_id": None,
                    "text_preview": None
                }

        except Exception as e:
            print(f"Error querying Pinecone: {e}")
            return {"exists": False, "error": str(e)}

    def verify_answer(self, answer_text: str) -> Dict[str, Any]:
        """
        Full verification pipeline for an answer string.
        """
        citations = extract_citations(answer_text)
        
        results = {
            "result": "PASS", # Default
            "total_citations": len(citations),
            "verified_citations": 0,
            "phantom_citations": [],
            "details": []
        }
        
        if not citations:
            results["note"] = "No citations found in answer."
            # We don't fail here automatically; logic depends on T1/T2 context external to this function.
            return results

        phantom_found = False
        
        for cit in citations:
            check = self.verify_citation_exists(cit.kanda, cit.sarga, cit.shloka)
            
            detail = {
                "citation": cit.original_text,
                "parsed": f"{cit.kanda} {cit.sarga}.{cit.shloka}",
                "exists": check["exists"],
                "shloka_id": check.get("shloka_id")
            }
            results["details"].append(detail)
            
            if check["exists"]:
                results["verified_citations"] += 1
            else:
                phantom_found = True
                results["phantom_citations"].append(cit.original_text)
        
        if phantom_found:
            results["result"] = "FAIL"
            
        return results

if __name__ == "__main__":
    # Demo
    try:
        verifier = CitationVerifier()
        # Test a known existing shloka (e.g., Bala Kanda 1.1)
        print("Verifying Bala Kanda 1.1:", verifier.verify_citation_exists("bala-kanda", 1, 1))
        # Test a fake one
        print("Verifying Bala Kanda 1.999:", verifier.verify_citation_exists("bala-kanda", 1, 999))
    except Exception as e:
        print(f"Skipping demo due to initialization error: {e}")
