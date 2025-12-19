"""
Complete Citation Verifier for Tattva Evaluation System
Integrates citation extraction and Pinecone verification.

Full pipeline:
1. Extract citations from answer text
2. Normalize Kanda names
3. Verify each citation exists in Pinecone
4. Return PASS/FAIL with details
"""

import json
from dataclasses import dataclass, asdict
from typing import List, Dict, Any, Optional
from enum import Enum

from .citation_extractor import extract_citations, Citation, normalize_kanda
from .pinecone_verifier import verify_citation_exists, verify_citations_batch


class VerificationStatus(Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    SKIP = "SKIP"
    WARNING = "WARNING"
    ERROR = "ERROR"


class AnswerTemplate(Enum):
    T1 = "T1"  # Textual - requires citations
    T2 = "T2"  # Interpretive - should have citations
    T3 = "T3"  # Refusal - citations not expected


@dataclass
class CitationDetail:
    """Details about a single citation verification."""
    citation_text: str
    shloka_id: str
    exists: bool
    text_preview: Optional[str] = None
    error: Optional[str] = None


@dataclass
class VerificationReport:
    """Complete verification report for an answer."""
    result: VerificationStatus
    total_citations: int
    verified_citations: int
    phantom_citations: List[str]
    details: List[CitationDetail]
    note: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to JSON-serializable dict."""
        return {
            "result": self.result.value,
            "total_citations": self.total_citations,
            "verified_citations": self.verified_citations,
            "phantom_citations": self.phantom_citations,
            "details": [asdict(d) for d in self.details],
            "note": self.note
        }
    
    def to_json(self, indent: int = 2) -> str:
        """Convert to JSON string."""
        return json.dumps(self.to_dict(), indent=indent)


def verify_answer_citations(
    answer_text: str,
    template: Optional[AnswerTemplate] = None,
    use_pinecone: bool = True
) -> VerificationReport:
    """
    Verify all citations in an answer text.
    
    Args:
        answer_text: The full answer text containing citations
        template: Optional answer template (T1/T2/T3) for edge case handling
        use_pinecone: Whether to verify against Pinecone (set False for offline testing)
    
    Returns:
        VerificationReport with PASS/FAIL result and citation details.
    """
    # Step 1: Extract citations
    citations = extract_citations(answer_text)
    
    # Edge case: No citations found
    if not citations:
        # Handle based on template type
        if template == AnswerTemplate.T3:
            return VerificationReport(
                result=VerificationStatus.SKIP,
                total_citations=0,
                verified_citations=0,
                phantom_citations=[],
                details=[],
                note="T3 refusal template - no citations expected"
            )
        elif template == AnswerTemplate.T1:
            return VerificationReport(
                result=VerificationStatus.FAIL,
                total_citations=0,
                verified_citations=0,
                phantom_citations=[],
                details=[],
                note="T1 textual template requires citations but none found"
            )
        elif template == AnswerTemplate.T2:
            return VerificationReport(
                result=VerificationStatus.WARNING,
                total_citations=0,
                verified_citations=0,
                phantom_citations=[],
                details=[],
                note="T2 interpretive template should have citations but none found"
            )
        else:
            # No template specified
            return VerificationReport(
                result=VerificationStatus.PASS,
                total_citations=0,
                verified_citations=0,
                phantom_citations=[],
                details=[],
                note="No citations found in answer"
            )
    
    # Step 2: Verify each citation
    details = []
    phantom_citations = []
    verified_count = 0
    
    if use_pinecone:
        # Batch verify for efficiency
        citation_tuples = [(c.kanda, c.sarga, c.shloka) for c in citations]
        results = verify_citations_batch(citation_tuples)
        
        for citation in citations:
            result = results.get(citation.shloka_id)
            if result:
                exists = result.exists
                text_preview = result.text_preview
                error = result.error
            else:
                # Fallback to individual verification
                result = verify_citation_exists(citation.kanda, citation.sarga, citation.shloka)
                exists = result.exists
                text_preview = result.text_preview
                error = result.error
            
            detail = CitationDetail(
                citation_text=citation.original_text,
                shloka_id=citation.shloka_id,
                exists=exists,
                text_preview=text_preview,
                error=error
            )
            details.append(detail)
            
            if exists:
                verified_count += 1
            else:
                phantom_citations.append(citation.original_text)
    else:
        # Offline mode - mark all as unverified for testing
        for citation in citations:
            detail = CitationDetail(
                citation_text=citation.original_text,
                shloka_id=citation.shloka_id,
                exists=False,
                error="Offline mode - Pinecone verification skipped"
            )
            details.append(detail)
            phantom_citations.append(citation.original_text)
    
    # Step 3: Determine result
    if phantom_citations:
        result = VerificationStatus.FAIL
    else:
        result = VerificationStatus.PASS
    
    return VerificationReport(
        result=result,
        total_citations=len(citations),
        verified_citations=verified_count,
        phantom_citations=phantom_citations,
        details=details
    )


def verify_trace(
    trace: Dict[str, Any],
    use_pinecone: bool = True
) -> VerificationReport:
    """
    Verify citations in a trace from traces.jsonl.
    
    Args:
        trace: A trace dict containing generation_result.answer
        use_pinecone: Whether to verify against Pinecone
    
    Returns:
        VerificationReport forewise
    """
    # Extract answer from trace
    generation = trace.get("generation_result", {})
    answer = generation.get("answer", "")
    
    if not answer:
        return VerificationReport(
            result=VerificationStatus.ERROR,
            total_citations=0,
            verified_citations=0,
            phantom_citations=[],
            details=[],
            note="No answer found in trace"
        )
    
    # Determine template from trace
    template_str = generation.get("template_used", "")
    template = None
    if template_str == "T1":
        template = AnswerTemplate.T1
    elif template_str == "T2":
        template = AnswerTemplate.T2
    elif template_str == "T3":
        template = AnswerTemplate.T3
    
    return verify_answer_citations(answer, template, use_pinecone)


# --- Testing / Demo ---
if __name__ == "__main__":
    print("Citation Verifier Test (offline mode):")
    print("=" * 50)
    
    test_answers = [
        ("T1", "Valmiki composed the epic as described in Bala Kanda 3.7-8. "
               "The monkey king's hostility is detailed in Kishkindha Kanda 18.60."),
        ("T1", "This answer has no citations."),
        ("T3", "I cannot draw images. This is outside the scope of text-based responses."),
        ("T2", "The dilemma is explored in Aranya Kanda 36.24 where Maricha reveals facts."),
    ]
    
    for template_str, answer in test_answers:
        template = AnswerTemplate[template_str]
        print(f"\n--- Template {template_str} ---")
        print(f"Answer: {answer[:60]}...")
        
        report = verify_answer_citations(answer, template, use_pinecone=False)
        print(f"Result: {report.result.value}")
        print(f"Total: {report.total_citations}, Verified: {report.verified_citations}")
        if report.phantom_citations:
            print(f"Phantom: {report.phantom_citations}")
        if report.note:
            print(f"Note: {report.note}")
