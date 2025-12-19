"""
Pinecone Verifier for Tattva Evaluation System
Verifies that cited shlokas exist in the Pinecone database.

Uses metadata filtering (not vector similarity) to check citation existence.
"""

import os
from dataclasses import dataclass
from typing import Optional, Dict, Any, List
from pinecone import Pinecone

# Pinecone configuration
PINECONE_INDEX_NAME = os.environ.get("PINECONE_INDEX_NAME", "tattva-shlokas")
EMBEDDING_DIMENSION = 1536  # text-embedding-3-small

# Singleton Pinecone client
_pinecone_client: Optional[Pinecone] = None
_pinecone_index = None


@dataclass
class VerificationResult:
    """Result of verifying a single citation."""
    exists: bool
    shloka_id: str
    kanda: str
    sarga: int
    shloka: int
    text_preview: Optional[str] = None  # First 100 chars of shloka text
    error: Optional[str] = None


def get_pinecone_index():
    """Get or create the Pinecone index connection."""
    global _pinecone_client, _pinecone_index
    
    if _pinecone_index is not None:
        return _pinecone_index
    
    api_key = os.environ.get("PINECONE_API_KEY")
    if not api_key:
        raise ValueError("PINECONE_API_KEY environment variable is not set")
    
    _pinecone_client = Pinecone(api_key=api_key)
    _pinecone_index = _pinecone_client.Index(PINECONE_INDEX_NAME)
    
    return _pinecone_index


def verify_citation_exists(
    kanda: str,
    sarga: int,
    shloka: int
) -> VerificationResult:
    """
    Verify that a citation exists in Pinecone.
    
    Uses metadata filtering with a dummy vector (not semantic search).
    
    Args:
        kanda: Canonical kanda name (e.g., "bala-kanda")
        sarga: Sarga number
        shloka: Shloka number
    
    Returns:
        VerificationResult with exists=True/False and metadata if found.
    """
    shloka_id = f"{kanda}-{sarga}-{shloka}"
    
    try:
        index = get_pinecone_index()
        
        # First try: direct fetch by ID (most efficient)
        # Pinecone IDs follow format: "bala-kanda-3-7"
        fetch_result = index.fetch(ids=[shloka_id])
        
        if fetch_result.vectors and shloka_id in fetch_result.vectors:
            vector_data = fetch_result.vectors[shloka_id]
            metadata = vector_data.metadata or {}
            
            # Get text preview
            text_preview = None
            if "shloka_text" in metadata:
                text = metadata["shloka_text"]
                text_preview = text[:100] + "..." if len(text) > 100 else text
            elif "explanation" in metadata:
                text = metadata["explanation"]
                text_preview = text[:100] + "..." if len(text) > 100 else text
            
            return VerificationResult(
                exists=True,
                shloka_id=shloka_id,
                kanda=kanda,
                sarga=sarga,
                shloka=shloka,
                text_preview=text_preview
            )
        
        # Second try: metadata filter query (in case ID format differs)
        # Use a dummy zero vector since we only care about metadata filtering
        dummy_vector = [0.0] * EMBEDDING_DIMENSION
        
        # Map canonical kanda to display format for metadata match
        kanda_display = kanda.replace("-", " ").title()  # "bala-kanda" → "Bala Kanda"
        
        query_result = index.query(
            vector=dummy_vector,
            top_k=1,
            include_metadata=True,
            filter={
                "kanda": {"$eq": kanda_display},
                "sarga": {"$eq": sarga},
                "shloka": {"$eq": shloka}
            }
        )
        
        if query_result.matches:
            match = query_result.matches[0]
            metadata = match.metadata or {}
            
            text_preview = None
            if "shloka_text" in metadata:
                text = metadata["shloka_text"]
                text_preview = text[:100] + "..." if len(text) > 100 else text
            
            return VerificationResult(
                exists=True,
                shloka_id=match.id,
                kanda=kanda,
                sarga=sarga,
                shloka=shloka,
                text_preview=text_preview
            )
        
        # Not found
        return VerificationResult(
            exists=False,
            shloka_id=shloka_id,
            kanda=kanda,
            sarga=sarga,
            shloka=shloka
        )
        
    except Exception as e:
        return VerificationResult(
            exists=False,
            shloka_id=shloka_id,
            kanda=kanda,
            sarga=sarga,
            shloka=shloka,
            error=str(e)
        )


def verify_citations_batch(
    citations: List[tuple]
) -> Dict[str, VerificationResult]:
    """
    Verify multiple citations in batch.
    
    Args:
        citations: List of (kanda, sarga, shloka) tuples
    
    Returns:
        Dict mapping shloka_id to VerificationResult
    """
    results = {}
    
    # Build list of IDs and try batch fetch first
    shloka_ids = [f"{k}-{s}-{sh}" for k, s, sh in citations]
    
    try:
        index = get_pinecone_index()
        fetch_result = index.fetch(ids=shloka_ids)
        
        for kanda, sarga, shloka in citations:
            shloka_id = f"{kanda}-{sarga}-{shloka}"
            
            if fetch_result.vectors and shloka_id in fetch_result.vectors:
                vector_data = fetch_result.vectors[shloka_id]
                metadata = vector_data.metadata or {}
                
                text_preview = None
                if "shloka_text" in metadata:
                    text = metadata["shloka_text"]
                    text_preview = text[:100] + "..." if len(text) > 100 else text
                
                results[shloka_id] = VerificationResult(
                    exists=True,
                    shloka_id=shloka_id,
                    kanda=kanda,
                    sarga=sarga,
                    shloka=shloka,
                    text_preview=text_preview
                )
            else:
                # Fall back to individual verification for this one
                results[shloka_id] = verify_citation_exists(kanda, sarga, shloka)
    
    except Exception as e:
        # If batch fails, fall back to individual verification
        for kanda, sarga, shloka in citations:
            result = verify_citation_exists(kanda, sarga, shloka)
            results[result.shloka_id] = result
    
    return results


# --- Testing / Demo ---
if __name__ == "__main__":
    import sys
    
    # Check if PINECONE_API_KEY is set
    if not os.environ.get("PINECONE_API_KEY"):
        print("ERROR: PINECONE_API_KEY environment variable not set.")
        print("Set it with: export PINECONE_API_KEY=your_key_here")
        sys.exit(1)
    
    print("Pinecone Citation Verifier Test:")
    print("=" * 50)
    
    # Test cases: known good and bad citations
    test_cases = [
        ("bala-kanda", 3, 7),     # Should exist
        ("bala-kanda", 3, 8),     # Should exist
        ("sundara-kanda", 22, 46), # Should exist
        ("bala-kanda", 999, 999),  # Should NOT exist (phantom)
        ("kishkindha-kanda", 18, 60),  # Should exist
    ]
    
    for kanda, sarga, shloka in test_cases:
        result = verify_citation_exists(kanda, sarga, shloka)
        status = "✓ EXISTS" if result.exists else "✗ PHANTOM"
        print(f"\n{status}: {result.shloka_id}")
        if result.text_preview:
            print(f"   Preview: {result.text_preview[:60]}...")
        if result.error:
            print(f"   Error: {result.error}")
