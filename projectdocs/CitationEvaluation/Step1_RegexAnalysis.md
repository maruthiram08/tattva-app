# Citation Regex Analysis Report

## 1. Executive Summary
The current citation extraction system uses a regular expression that effectively captures standard formats like "Bala Kanda 1.1" and "Bala 1.1". However, it fails to capture hyphenated variations produced by some models (e.g., "Ayodhya-Kanda") and may miss citations with different separators. This report details the analysis of the current regex implementation in `evaluations/evaluators/citation_extractor.py` and recommends specific improvements to ensure 100% coverage of valid citations.

## 2. Current Citation Patterns

The existing regex pattern in `evaluations/evaluators/citation_extractor.py` is:

```python
pattern = r"""
    ((?:Bala|Ayodhya|Aranya|Kishkindha|Sundara|Yuddha|Uttara)
    \s*Kanda?)                    # Kanda name (with optional "Kanda" suffix)
    \s+                           # Whitespace
    (\d+)                         # Sarga number
    [.\s:]                        # Separator (., space, or :)
    (\d+)                         # Shloka number
    (?:\s*[-–—]\s*(\d+))?         # Optional: range end (e.g., "-8" for 3.7-8)
"""
```

**Breakdown:**
*   **Kanda**: Matches specific names (Bala, etc.). Allows optional "Kanda" suffix preceded by optional whitespace (`\s*`).
*   **Separator 1**: Requires at least one whitespace (`\s+`) between Kanda and Sarga.
*   **Sarga**: Captures digits.
*   **Separator 2**: Captures dot `.`, space, or colon `:`.
*   **Shloka**: Captures digits.
*   **Range**: Optional, handles hyphens and en/em dashes.

## 3. Example Format Analysis

We analyzed the golden dataset (`golden_responses_AFTER_FIX_2025_12_19_1850.json`) and identified the following formats:

| Format | Example | Matches Current Regex? | Status |
| :--- | :--- | :--- | :--- |
| **Standard** | `[Ayodhya Kanda 100.76]` | ✅ Yes | Fully Covered |
| **Implicit Kanda** | `Ayodhya 100.76` | ✅ Yes | Covered (`Kanda?` is optional) |
| **No Space** | `AyodhyaKanda 100.76` | ✅ Yes | Covered (`\s*` handles 0 spaces) |
| **Space Separator** | `Ayodhya Kanda 100 76` | ✅ Yes | Covered (`[.\s:]` handles space) |
| **Colon Separator** | `Ayodhya Kanda 100:76` | ✅ Yes | Covered (`[.\s:]` handles colon) |
| **Hyphenated Kanda** | `Ayodhya-Kanda 100.76` | ❌ **NO** | **Gap**: `\s*` does not match `-`. |
| **Claude Style** | `[Ayodhya-Kanda 100.76]` | ❌ **NO** | **Gap**: Hyphen causes failure. |

## 4. Coverage Gaps

1.  **Hyphenated Kanda Names**:
    *   **Evidence**: The dataset contains examples like `[Ayodhya-Kanda 100.76]`.
    *   **Reason**: The regex `\s*Kanda` expects only whitespace or nothing between the name and "Kanda". It does not allow for a hyphen.
    *   **Impact**: Critical. Valid citations from Claude-3 models are being missed.

2.  **Parenthesized/Bracketed Context**:
    *   While the regex finds citations *inside* brackets (because it searches the whole string), it doesn't strictly enforce or strip them as part of the match, which is generally fine, but the *extraction logic* relies on finding just the text. The current implementation is robust here as `re.findall` scans the string.

3.  **Kanda-Sarga Separators**:
    *   Uses `\s+` (at least one space). If a model outputs `Ayodhya Kanda, 1.1` (comma), it might fail. (Though this is rare).

## 5. Additional Format Variations

We should also anticipate and handle:
*   **Hyphen separator for Kanda**: `Bala-Kanda`, `Bala - Kanda`.
*   **Comma usage**: `Bala Kanda, 1.1`.
*   **Abbreviated Kanda**: `Bala. 1.1` (Period after name).

## 6. Recommendations

We recommend updating the regex to:
1.  Allow `[\s-]*` (whitespace OR hyphen) between the Kanda name and "Kanda".
2.  Allow optional punctuation (comma) after the Kanda part.

**Proposed Regex:**

```python
pattern = r"""
    ((?:Bala|Ayodhya|Aranya|Kishkindha|Sundara|Yuddha|Uttara)
    (?:[\s-]*Kanda)?)             # Optional "Kanda" with loose separator (space or hyphen)
    [\s,.]*                       # loose separator (space, comma, dot) before numbering
    (\d+)                         # Sarga
    [.\s:]                        # Separator
    (\d+)                         # Shloka
    (?:\s*[-–—]\s*(\d+))?         # Optional Range
"""
```

**Changes:**
- `\s*Kanda?` changed to `(?:[\s-]*Kanda)?`: Explicitly matches optional hyphen and "Kanda".
- `\s+` (after Kanda) changed to `[\s,.]*`: Allows comma or dot, or just space. But we must ensure we don't merge into Sarga. Ideally just `[\s,]+`.

**Refined Regex for Implementation:**
```python
pattern = r"""
    ((?:Bala|Ayodhya|Aranya|Kishkindha|Sundara|Yuddha|Uttara)  # Base name
    (?:[\s-]*Kanda)?)             # Optional suffix with space or hyphen
    [\s,]+                        # Separator (space or comma)
    (\d+)                         # Sarga
    [.\s:]                        # Separator
    (\d+)                         # Shloka
    (?:\s*[-–—]\s*(\d+))?         # Optional Range
"""
```

## 7. Test Cases

| Input | Expected Match |
| :--- | :--- |
| `Bala Kanda 1.1` | `(Bala Kanda, 1, 1)` |
| `Ayodhya-Kanda 2.2` | `(Ayodhya-Kanda, 2, 2)` |
| `Aranya 3.3` | `(Aranya, 3, 3)` |
| `Sundara-Kanda 5.5` | `(Sundara-Kanda, 5, 5)` |
| `Yuddha Kanda, 6.6` | `(Yuddha Kanda, 6, 6)` |

