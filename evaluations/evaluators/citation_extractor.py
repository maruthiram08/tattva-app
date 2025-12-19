"""
Citation Extractor for Tattva Evaluation System
Extracts citations from answer text using regex patterns.

Supported citation formats:
- "Bala Kanda 1.5"           → (Bala Kanda, 1, 5)
- "Kishkindha Kanda 18.60"   → (Kishkindha Kanda, 18, 60)
- "(Bala Kanda 3.7-8)"       → [(Bala Kanda, 3, 7), (Bala Kanda, 3, 8)]
- "[Sundara Kanda 22.46]"    → (Sundara Kanda, 22, 46)
"""

import re
from dataclasses import dataclass
from typing import List, Optional, Tuple

# Kanda normalization map - maps various forms to canonical ID format
KANDA_NORMALIZATION = {
    # Full names (lowercase)
    "bala kanda": "bala-kanda",
    "ayodhya kanda": "ayodhya-kanda",
    "aranya kanda": "aranya-kanda",
    "kishkindha kanda": "kishkindha-kanda",
    "sundara kanda": "sundara-kanda",
    "yuddha kanda": "yuddha-kanda",
    "uttara kanda": "uttara-kanda",
    # Short names (lowercase)
    "bala": "bala-kanda",
    "ayodhya": "ayodhya-kanda",
    "aranya": "aranya-kanda",
    "kishkindha": "kishkindha-kanda",
    "sundara": "sundara-kanda",
    "yuddha": "yuddha-kanda",
    "uttara": "uttara-kanda",
    # No space variants
    "balakanda": "bala-kanda",
    "ayodhyakanda": "ayodhya-kanda",
    "aranyakanda": "aranya-kanda",
    "kishkindhakanda": "kishkindha-kanda",
    "sundarakanda": "sundara-kanda",
    "yuddhakanda": "yuddha-kanda",
    "uttarakanda": "uttara-kanda",
    # Numeric forms (kanda_number from metadata)
    "1": "bala-kanda",
    "2": "ayodhya-kanda",
    "3": "aranya-kanda",
    "4": "kishkindha-kanda",
    "5": "sundara-kanda",
    "6": "yuddha-kanda",
    "7": "uttara-kanda",
}

# Reverse mapping: canonical ID to display name (for metadata lookup)
CANONICAL_TO_DISPLAY = {
    "bala-kanda": "Bala Kanda",
    "ayodhya-kanda": "Ayodhya Kanda",
    "aranya-kanda": "Aranya Kanda",
    "kishkindha-kanda": "Kishkindha Kanda",
    "sundara-kanda": "Sundara Kanda",
    "yuddha-kanda": "Yuddha Kanda",
    "uttara-kanda": "Uttara Kanda",
}


@dataclass
class Citation:
    """Represents a single citation extracted from text."""
    kanda: str        # Canonical form: "bala-kanda"
    sarga: int        # Sarga number
    shloka: int       # Shloka number
    original_text: str  # Original citation text from answer
    
    @property
    def shloka_id(self) -> str:
        """Generate the Pinecone vector ID format."""
        return f"{self.kanda}-{self.sarga}-{self.shloka}"
    
    def __repr__(self) -> str:
        return f"Citation({self.kanda}, {self.sarga}, {self.shloka})"


def normalize_kanda(kanda_text: str) -> Optional[str]:
    """
    Normalize a Kanda name to its canonical ID form.
    
    Args:
        kanda_text: Raw kanda name (e.g., "Bala Kanda", "SUNDARA", "5")
    
    Returns:
        Canonical form (e.g., "bala-kanda") or None if not recognized.
    """
    # Clean: lowercase, strip spaces
    cleaned = kanda_text.lower().strip()
    
    # Remove "kanda" suffix if present (for matching short forms)
    # e.g., "bala kanda" is already in map, but handle edge cases
    
    # Direct lookup
    if cleaned in KANDA_NORMALIZATION:
        return KANDA_NORMALIZATION[cleaned]
    
    # Try removing all spaces/hyphens for no-space variants
    no_space = cleaned.replace(" ", "").replace("-", "")
    if no_space in KANDA_NORMALIZATION:
        return KANDA_NORMALIZATION[no_space]
    
    return None


def extract_citations(answer_text: str) -> List[Citation]:
    """
    Extract all citations from an answer text.
    
    Handles multiple formats:
    - "Bala Kanda 1.5"
    - "(Bala Kanda 3.7-8)"  - range expansion
    - "[Sundara Kanda 22.46]"
    - "Kishkindha Kanda 18.60, Yuddha Kanda 127.15"
    
    Args:
        answer_text: The full answer text containing citations
    
    Returns:
        List of Citation objects, deduplicated by shloka_id
    """
    citations = []
    
    # Primary pattern: "Kanda Name Sarga.Shloka" or "Kanda Name Sarga.Shloka-Shloka2"
    # Captures: (Kanda Name) (Sarga) (Shloka) (optional: -Shloka2)
    pattern = r"""
        ((?:Bala|Ayodhya|Aranya|Kishkindha|Sundara|Yuddha|Uttara)
        \s*Kanda?)                    # Kanda name (with optional "Kanda" suffix)
        \s+                           # Whitespace
        (\d+)                         # Sarga number
        [.\s:]                        # Separator (., space, or :)
        (\d+)                         # Shloka number
        (?:\s*[-–—]\s*(\d+))?         # Optional: range end (e.g., "-8" for 3.7-8)
    """
    
    # Find all matches (case insensitive)
    matches = re.findall(pattern, answer_text, re.IGNORECASE | re.VERBOSE)
    
    for match in matches:
        kanda_raw, sarga_str, shloka_start_str, shloka_end_str = match
        
        kanda = normalize_kanda(kanda_raw)
        if not kanda:
            continue  # Skip unrecognized kanda names
        
        sarga = int(sarga_str)
        shloka_start = int(shloka_start_str)
        
        # Reconstruct original text for reference
        original = f"{kanda_raw} {sarga_str}.{shloka_start_str}"
        if shloka_end_str:
            original += f"-{shloka_end_str}"
        
        # Handle range expansion
        if shloka_end_str:
            shloka_end = int(shloka_end_str)
            # Expand range (e.g., 3.7-8 → 3.7, 3.8)
            for shloka in range(shloka_start, shloka_end + 1):
                citations.append(Citation(
                    kanda=kanda,
                    sarga=sarga,
                    shloka=shloka,
                    original_text=original
                ))
        else:
            citations.append(Citation(
                kanda=kanda,
                sarga=sarga,
                shloka=shloka_start,
                original_text=original
            ))
    
    # Deduplicate by shloka_id (keep first occurrence)
    seen = set()
    unique_citations = []
    for c in citations:
        if c.shloka_id not in seen:
            seen.add(c.shloka_id)
            unique_citations.append(c)
    
    return unique_citations


def format_citation(kanda: str, sarga: int, shloka: int) -> str:
    """Format a citation for display."""
    display_kanda = CANONICAL_TO_DISPLAY.get(kanda, kanda)
    return f"{display_kanda} {sarga}.{shloka}"


# --- Testing / Demo ---
if __name__ == "__main__":
    # Test cases
    test_texts = [
        "According to Bala Kanda 3.7, the epic begins with...",
        "This is described in (Bala Kanda 3.7-8) as well as Sundara Kanda 22.46.",
        "References: [Kishkindha Kanda 18.60] and Yuddha Kanda 127.11-15",
        "No citations in this text.",
        "Multiple: Bala Kanda 1.61, Bala Kanda 3.24, and Aranya Kanda 47.50"
    ]
    
    print("Citation Extraction Test:")
    print("=" * 50)
    for text in test_texts:
        print(f"\nInput: {text[:60]}...")
        citations = extract_citations(text)
        if citations:
            for c in citations:
                print(f"  → {c.shloka_id} (from '{c.original_text}')")
        else:
            print("  → No citations found")
