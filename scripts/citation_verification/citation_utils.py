"""
Citation Utils
Contains regex patterns and normalization logic for Tattva Citation Verification.
"""

import re
from dataclasses import dataclass
from typing import List, Optional

# Kanda normalization map
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
    # Hyphenated variants (explicitly added based on analysis)
    "bala-kanda": "bala-kanda",
    "ayodhya-kanda": "ayodhya-kanda",
    "aranya-kanda": "aranya-kanda",
    "kishkindha-kanda": "kishkindha-kanda",
    "sundara-kanda": "sundara-kanda",
    "yuddha-kanda": "yuddha-kanda",
    "uttara-kanda": "uttara-kanda",
    # Numeric forms
    "1": "bala-kanda",
    "2": "ayodhya-kanda",
    "3": "aranya-kanda",
    "4": "kishkindha-kanda",
    "5": "sundara-kanda",
    "6": "yuddha-kanda",
    "7": "uttara-kanda",
}

@dataclass
class Citation:
    kanda: str        # Canonical form: "bala-kanda"
    sarga: int
    shloka: int
    original_text: str
    
    @property
    def shloka_id(self) -> str:
        """Generate the Pinecone vector ID format."""
        return f"{self.kanda}-{self.sarga}-{self.shloka}"
    
    def __repr__(self) -> str:
        return f"Citation({self.kanda}, {self.sarga}, {self.shloka})"

def normalize_kanda(kanda_text: str) -> Optional[str]:
    """
    Normalize a Kanda name to its canonical ID form.
    Handles space, hyphens, and casing.
    """
    # Clean: lowercase, strip spaces
    cleaned = kanda_text.lower().strip()
    
    # Direct lookup
    if cleaned in KANDA_NORMALIZATION:
        return KANDA_NORMALIZATION[cleaned]
    
    # Try normalizing internal separators (spaces/hyphens -> single space)
    # e.g., "ayodhya-kanda" -> "ayodhya kanda"
    normalized_separator = re.sub(r'[\s-]+', ' ', cleaned)
    if normalized_separator in KANDA_NORMALIZATION:
        return KANDA_NORMALIZATION[normalized_separator]
        
    # Try removing all spaces/hyphens
    no_space = re.sub(r'[\s-]+', '', cleaned)
    if no_space in KANDA_NORMALIZATION:
        return KANDA_NORMALIZATION[no_space]
    
    return None

def extract_citations(answer_text: str) -> List[Citation]:
    """
    Extract all citations from an answer text using robust regex.
    """
    citations = []
    
    # Improved Regex found in Step 1 Analysis
    pattern = r"""
        ((?:Bala|Ayodhya|Aranya|Kishkindha|Sundara|Yuddha|Uttara)  # Base name
        (?:[\s-]*Kanda)?)             # Optional suffix with space or hyphen
        [\s,]+                        # Separator (space or comma)
        (\d+)                         # Sarga
        [.\s:]                        # Separator
        (\d+)                         # Shloka
        (?:\s*[-–—]\s*(\d+))?         # Optional Range
    """
    
    matches = re.findall(pattern, answer_text, re.IGNORECASE | re.VERBOSE)
    
    for match in matches:
        kanda_raw, sarga_str, shloka_start_str, shloka_end_str = match
        
        kanda = normalize_kanda(kanda_raw)
        if not kanda:
            continue
        
        sarga = int(sarga_str)
        shloka_start = int(shloka_start_str)
        
        original = f"{kanda_raw} {sarga_str}.{shloka_start_str}"
        if shloka_end_str:
            original += f"-{shloka_end_str}"
        
        if shloka_end_str:
            shloka_end = int(shloka_end_str)
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
            
    # Deduplicate
    seen = set()
    unique_citations = []
    for c in citations:
        if c.shloka_id not in seen:
            seen.add(c.shloka_id)
            unique_citations.append(c)
            
    return unique_citations

if __name__ == "__main__":
    # Quick Test
    texts = [
        "Ayodhya-Kanda 100.76", 
        "[Ayodhya Kanda 100.76]", 
        "Bala 1.1",
        "Ayodhya-Kanda 11.24"
    ]
    for t in texts:
        print(f"Testing '{t}': {extract_citations(t)}")
